'use client';

import { useEffect, useMemo, useState, type ChangeEvent, type JSX } from 'react';
import Link from 'next/link';
import {
  parseCambridgeSpreadsheet,
  type CambridgeExamRecord,
  type ParseIssue,
} from '@/lib/cambridgeEngine';
import {
  buildAuditCsvContent,
  buildIssuesCsvContent,
  buildRecordsCsvContent,
  createEmptyTemplateCsvContent,
  mergeRecordsByKey,
  type ImportAuditEntry,
  type ImportMode,
  type ReplacedRecordPreview,
  type TemplateLanguage,
} from '@/lib/importPageUtils';
import {
  buildIssueSummary,
  getIssueFilterLabel,
  matchesIssueFilter,
  type IssueFilterKey,
} from '@/lib/importIssueUtils';
import type {
  ImportStats,
  ImportStep,
  PendingImportPreview,
  PersistedDashboardState,
} from '@/lib/importHomeTypes';
import { ImportAuditCard } from '@/components/home/ImportAuditCard';
import { ImportBackupExportCard } from '@/components/home/ImportBackupExportCard';
import { ImportFiltersCard } from '@/components/home/ImportFiltersCard';
import { ImportIssueSummaryCard } from '@/components/home/ImportIssueSummaryCard';
import { ImportIssuesSection } from '@/components/home/ImportIssuesSection';
import { ImportRecordsPreview } from '@/components/home/ImportRecordsPreview';
import { ImportResultSummary } from '@/components/home/ImportResultSummary';
import { ImportReviewPanel } from '@/components/home/ImportReviewPanel';
import { ImportTemplateCard } from '@/components/home/ImportTemplateCard';
import { ImportUploadSection } from '@/components/home/ImportUploadSection';
import { ImportWorkflowStepper } from '@/components/home/ImportWorkflowStepper';

const LOCAL_STORAGE_KEY = 'cambridge-dashboard:parsed-state:v1';
const UI_LOCALE_STORAGE_KEY = 'cambridge-dashboard:ui-locale:v1';

export default function Home(): JSX.Element {
  const [locale, setLocale] = useState<'zh' | 'en'>('zh');
  const [records, setRecords] = useState<CambridgeExamRecord[]>([]);
  const [issues, setIssues] = useState<ParseIssue[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const [savedAt, setSavedAt] = useState<string>('');
  const [storageReady, setStorageReady] = useState<boolean>(false);
  const [auditLog, setAuditLog] = useState<ImportAuditEntry[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedExamDate, setSelectedExamDate] = useState<string>('ALL');
  const [nameKeyword, setNameKeyword] = useState<string>('');
  const [showOnlyIssues, setShowOnlyIssues] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<ImportMode>('replace');
  const [lastImportMessage, setLastImportMessage] = useState<string>('');
  const [activeStep, setActiveStep] = useState<ImportStep>('prepare');
  const [pendingImport, setPendingImport] = useState<PendingImportPreview | null>(null);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [showAllConflictRows, setShowAllConflictRows] = useState<boolean>(false);
  const [conflictNameKeyword, setConflictNameKeyword] = useState<string>('');
  const [activeIssueFilter, setActiveIssueFilter] = useState<IssueFilterKey>('ALL');
  const [issueDelta, setIssueDelta] = useState<number | null>(null);
  const [storageError, setStorageError] = useState<string>('');

  function tr(zhText: string, enText: string): string {
    return locale === 'zh' ? zhText : enText;
  }

  const summaryText = useMemo((): string => {
    if (!fileName) {
      return locale === 'zh' ? '尚未导入文件。' : 'No file imported yet.';
    }
    return locale === 'zh'
      ? `已解析文件：${fileName}，有效记录 ${records.length} 条，异常 ${issues.length} 条。`
      : `Parsed file: ${fileName}. Valid records: ${records.length}, issues: ${issues.length}.`;
  }, [fileName, records.length, issues.length, locale]);

  const savedAtText = useMemo((): string => {
    if (!savedAt) {
      return '';
    }
    const date = new Date(savedAt);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return locale === 'zh' ? `本地保存时间：${date.toLocaleString('zh-CN')}` : `Saved at: ${date.toLocaleString('en-US')}`;
  }, [savedAt, locale]);

  const levelOptions = useMemo((): string[] => {
    return Array.from(new Set(records.map((record) => record.level))).sort();
  }, [records]);

  const classOptions = useMemo((): string[] => {
    return Array.from(
      new Set(records.map((record) => record.className).filter((value) => value.length > 0)),
    ).sort();
  }, [records]);

  const classCount = useMemo(
    (): number => new Set(records.map((record) => record.className).filter((value) => value.length > 0)).size,
    [records],
  );

  const examDateOptions = useMemo((): string[] => {
    return Array.from(
      new Set(records.map((record) => record.examDate).filter((value) => value.length > 0)),
    ).sort();
  }, [records]);

  const filteredRecords = useMemo((): CambridgeExamRecord[] => {
    return records.filter((record) => {
      if (selectedLevel !== 'ALL' && record.level !== selectedLevel) {
        return false;
      }
      if (selectedClass !== 'ALL' && record.className !== selectedClass) {
        return false;
      }
      if (selectedExamDate !== 'ALL' && record.examDate !== selectedExamDate) {
        return false;
      }
      if (nameKeyword.trim()) {
        const keyword = nameKeyword.trim().toLowerCase();
        if (!record.name.toLowerCase().includes(keyword)) {
          return false;
        }
      }
      return true;
    });
  }, [records, selectedLevel, selectedClass, selectedExamDate, nameKeyword]);

  const levelCountText = useMemo((): string => {
    if (filteredRecords.length === 0) {
      return '';
    }
    const counter = new Map<string, number>();
    filteredRecords.forEach((record) => {
      counter.set(record.level, (counter.get(record.level) ?? 0) + 1);
    });
    return [...counter.entries()]
      .map(([level, count]) => `${level} ${count}人`)
      .join(' / ');
  }, [filteredRecords]);

  const filteredSummaryText = useMemo((): string => {
    return locale === 'zh'
      ? `筛选后 ${filteredRecords.length} 条 / 总计 ${records.length} 条。`
      : `Filtered ${filteredRecords.length} / total ${records.length}.`;
  }, [filteredRecords.length, records.length, locale]);

  function computeIssueDeltaMessage(previousIssueCount: number, nextIssueCount: number): string {
    const delta = nextIssueCount - previousIssueCount;
    setIssueDelta(delta);
    if (delta < 0) {
      return tr(`较上次导入已减少 ${Math.abs(delta)} 条异常。`, `Reduced ${Math.abs(delta)} issues since last import.`);
    }
    if (delta > 0) {
      return tr(`较上次导入新增 ${delta} 条异常。`, `Added ${delta} issues since last import.`);
    }
    return tr('较上次导入异常数量无变化。', 'No issue count change since last import.');
  }

  function formatTimestampForFileName(date: Date): string {
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
  }

  function getIssueFilterLabelEn(filter: IssueFilterKey): string {
    if (filter === 'OVER_LIMIT_R') {
      return 'Reading over limit';
    }
    if (filter === 'OVER_LIMIT_L') {
      return 'Listening over limit';
    }
    if (filter === 'OVER_LIMIT_W') {
      return 'Writing over limit';
    }
    if (filter === 'NON_NUMERIC') {
      return 'Non-numeric';
    }
    if (filter === 'NEGATIVE') {
      return 'Negative values';
    }
    if (filter === 'MISSING_FIELD') {
      return 'Missing fields';
    }
    if (filter === 'DUPLICATE_RECORD') {
      return 'Duplicate records';
    }
    return 'All issues';
  }

  const issueSummary = useMemo(() => buildIssueSummary(issues), [issues]);

  const filteredIssues = useMemo((): ParseIssue[] => {
    if (activeIssueFilter === 'ALL') {
      return issues;
    }
    return issues.filter((issue) => matchesIssueFilter(issue, activeIssueFilter));
  }, [issues, activeIssueFilter]);

  const activeIssueFilterLabel = useMemo(
    (): string => (locale === 'zh' ? getIssueFilterLabel(activeIssueFilter) : getIssueFilterLabelEn(activeIssueFilter)),
    [activeIssueFilter, locale],
  );

  const issueDeltaText = useMemo((): string => {
    if (issueDelta === null) {
      return locale === 'zh' ? '暂无对比' : 'No comparison';
    }
    if (issueDelta < 0) {
      return locale === 'zh' ? `减少 ${Math.abs(issueDelta)} 条` : `-${Math.abs(issueDelta)}`;
    }
    if (issueDelta > 0) {
      return locale === 'zh' ? `新增 ${issueDelta} 条` : `+${issueDelta}`;
    }
    return locale === 'zh' ? '无变化' : 'No change';
  }, [issueDelta, locale]);

  useEffect((): void => {
    try {
      const rawLocale = window.localStorage.getItem(UI_LOCALE_STORAGE_KEY);
      if (rawLocale === 'en' || rawLocale === 'zh') {
        setLocale(rawLocale);
      }
    } catch {
      // ignore locale restore errors
    }
  }, []);

  useEffect((): void => {
    try {
      window.localStorage.setItem(UI_LOCALE_STORAGE_KEY, locale);
    } catch {
      // ignore locale persist errors
    }
  }, [locale]);

  useEffect((): void => {
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) {
        setStorageReady(true);
        return;
      }
      const parsed = JSON.parse(raw) as PersistedDashboardState;
      if (!parsed || !Array.isArray(parsed.records) || !Array.isArray(parsed.issues)) {
        setStorageReady(true);
        return;
      }
      setFileName(parsed.fileName || '本地恢复数据');
      setRecords(parsed.records);
      setIssues(parsed.issues);
      setSavedAt(parsed.savedAt || '');
      setAuditLog(Array.isArray(parsed.auditLog) ? parsed.auditLog : []);
      setIssueDelta(null);
      if (parsed.records.length > 0 || parsed.issues.length > 0) {
        setActiveStep('result');
      }
    } catch {
      // 本地数据损坏时忽略恢复，避免阻塞页面使用。
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect((): void => {
    if (!storageReady) {
      return;
    }

    try {
      if (!fileName && records.length === 0 && issues.length === 0 && auditLog.length === 0) {
        window.localStorage.removeItem(LOCAL_STORAGE_KEY);
        setSavedAt('');
        setStorageError('');
        return;
      }

      const now = new Date().toISOString();
      const payload: PersistedDashboardState = {
        fileName,
        records,
        issues,
        savedAt: now,
        auditLog,
      };
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
      setSavedAt(now);
      setStorageError('');
    } catch {
      setStorageError(
        locale === 'zh'
          ? '浏览器本地存储空间不足，最新更改可能未保存。请立即在“数据管理”中导出完整备份。'
          : 'Browser storage is full and the latest changes may not be saved. Export a full backup from Data management now.',
      );
    }
  }, [fileName, records, issues, auditLog, storageReady, locale]);

  function appendAuditEntry(entry: Omit<ImportAuditEntry, 'id'>): void {
    const id = `${entry.importedAt}-${Math.random().toString(16).slice(2)}`;
    setAuditLog((prev) => [{ ...entry, id }, ...prev].slice(0, 50));
  }

  async function handleFileSelected(targetFile: File): Promise<void> {
    setLoading(true);
    setLastImportMessage('');

    try {
      const result = await parseCambridgeSpreadsheet(targetFile);
      if (importMode === 'replace') {
        setPendingImport({
          mode: 'replace',
          targetFileName: targetFile.name,
          incomingRecords: result.records,
          incomingIssues: result.issues,
          nextRecords: result.records,
          nextIssues: result.issues,
          addedCount: result.records.length,
          replacedCount: records.length,
          existingRecordsCount: records.length,
          replacedPreviews: [],
        });
      } else {
        const mergeOutcome = mergeRecordsByKey(records, result.records);
        const mergedIssues = [...issues, ...result.issues];
        setPendingImport({
          mode: 'append',
          targetFileName: targetFile.name,
          incomingRecords: result.records,
          incomingIssues: result.issues,
          nextRecords: mergeOutcome.merged,
          nextIssues: mergedIssues,
          addedCount: mergeOutcome.addedCount,
          replacedCount: mergeOutcome.replacedCount,
          existingRecordsCount: records.length,
          replacedPreviews: mergeOutcome.replacedPreviews,
        });
      }
      setShowAllConflictRows(false);
      setConflictNameKeyword('');
      setActiveStep('review');
    } catch (error: unknown) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : tr('文件解析失败，请检查文件格式或内容是否完整。', 'Failed to parse file. Please check format and content.');
      setPendingImport(null);
      setActiveStep('upload');
      setLastImportMessage(
        tr(`解析失败：${message}。现有成绩没有改变。`, `Parsing failed: ${message}. Existing scores were not changed.`),
      );
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadEmptyTemplate(language: TemplateLanguage): void {
    const csvContent = createEmptyTemplateCsvContent(language);
    const outputName =
      language === 'en'
        ? 'cambridge-import-template-generated-en.csv'
        : 'cambridge-import-template-generated-zh.csv';
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.setAttribute('download', outputName);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  function handleDownloadParsedRecords(): void {
    if (records.length === 0) {
      return;
    }
    const csvContent = buildRecordsCsvContent(records);
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.setAttribute('download', 'cambridge-parsed-records.csv');
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  function handleDownloadIssues(): void {
    if (issues.length === 0) {
      return;
    }
    const csvContent = buildIssuesCsvContent(issues);
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.setAttribute('download', 'cambridge-parse-issues.csv');
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  function handleDownloadFilteredIssues(): void {
    if (filteredIssues.length === 0) {
      return;
    }
    const csvContent = buildIssuesCsvContent(filteredIssues);
    const label = locale === 'zh' ? getIssueFilterLabel(activeIssueFilter) : getIssueFilterLabelEn(activeIssueFilter);
    const safeLabel = label.replace(/\s+/g, '_');
    const timestamp = formatTimestampForFileName(new Date());
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.setAttribute('download', `cambridge-parse-issues-${safeLabel}-${timestamp}.csv`);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setLastImportMessage(
      tr(`已导出当前筛选异常（${filteredIssues.length} 条）。`, `Exported filtered issues (${filteredIssues.length}).`),
    );
  }

  function handleClearLocalData(): void {
    setFileName('');
    setRecords([]);
    setIssues([]);
    setSavedAt('');
    setPendingImport(null);
    setLastImportMessage('');
    setImportStats(null);
    setAuditLog([]);
    setActiveIssueFilter('ALL');
    setIssueDelta(null);
    setActiveStep('prepare');
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    setLastImportMessage(tr('已清空本地数据。', 'Local data cleared.'));
  }

  function handleResetFilters(): void {
    setSelectedLevel('ALL');
    setSelectedClass('ALL');
    setSelectedExamDate('ALL');
    setNameKeyword('');
    setShowOnlyIssues(false);
  }

  function handleConfirmPendingImport(): void {
    if (!pendingImport) {
      return;
    }
    const nextFileName = pendingImport.mode === 'append' && fileName
      ? `${fileName} + ${pendingImport.targetFileName}`
      : pendingImport.targetFileName;
    setFileName(nextFileName);
    setRecords(pendingImport.nextRecords);
    setIssues(pendingImport.nextIssues);
    setActiveIssueFilter('ALL');
    const deltaMessage = computeIssueDeltaMessage(issues.length, pendingImport.nextIssues.length);
    setLastImportMessage(
      tr(
        `导入完成：新增 ${pendingImport.addedCount} 条，覆盖 ${pendingImport.replacedCount} 条，当前总计 ${pendingImport.nextRecords.length} 条。${deltaMessage}`,
        `Import completed: +${pendingImport.addedCount}, replaced ${pendingImport.replacedCount}, total ${pendingImport.nextRecords.length}. ${deltaMessage}`,
      ),
    );
    setImportStats({
      mode: pendingImport.mode,
      addedCount: pendingImport.addedCount,
      replacedCount: pendingImport.replacedCount,
      issueCount: pendingImport.nextIssues.length,
      totalAfterImport: pendingImport.nextRecords.length,
    });
    appendAuditEntry({
      importedAt: new Date().toISOString(),
      fileName: pendingImport.targetFileName,
      mode: pendingImport.mode,
      addedCount: pendingImport.addedCount,
      replacedCount: pendingImport.replacedCount,
      issueCount: pendingImport.nextIssues.length,
      totalAfterImport: pendingImport.nextRecords.length,
    });
    setPendingImport(null);
    setShowAllConflictRows(false);
    setConflictNameKeyword('');
    setActiveStep('result');
  }

  function handleCancelPendingImport(): void {
    setPendingImport(null);
    setLastImportMessage(tr('已取消本次导入，现有成绩没有改变。', 'Import cancelled. Existing scores were not changed.'));
    setShowAllConflictRows(false);
    setConflictNameKeyword('');
    setActiveStep('upload');
  }

  function handleDownloadAuditLog(): void {
    if (auditLog.length === 0) {
      return;
    }
    const csvContent = buildAuditCsvContent(auditLog);
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.setAttribute('download', 'cambridge-import-audit-log.csv');
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  function handleClearAuditLog(): void {
    setAuditLog([]);
    setLastImportMessage(tr('已清空导入审计记录。', 'Import audit log cleared.'));
  }

  function handleDownloadFullBackup(): void {
    const payload: PersistedDashboardState = {
      fileName,
      records,
      issues,
      savedAt: savedAt || new Date().toISOString(),
      auditLog,
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.setAttribute('download', 'cambridge-dashboard-backup.json');
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setLastImportMessage(tr('已导出本地完整状态备份 JSON。', 'Local full backup JSON exported.'));
  }

  async function handleRestoreFromBackup(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const targetFile = event.target.files?.[0];
    if (!targetFile) {
      return;
    }
    try {
      const text = await targetFile.text();
      const parsed = JSON.parse(text) as PersistedDashboardState;
      if (!parsed || !Array.isArray(parsed.records) || !Array.isArray(parsed.issues)) {
        setLastImportMessage(
          tr('恢复失败：备份文件结构不符合预期。', 'Restore failed: backup file structure is invalid.'),
        );
        return;
      }
      setFileName(parsed.fileName || '');
      setRecords(parsed.records);
      setIssues(parsed.issues);
      setSavedAt(parsed.savedAt || '');
      setAuditLog(Array.isArray(parsed.auditLog) ? parsed.auditLog : []);
      setPendingImport(null);
      setImportStats(null);
      setActiveIssueFilter('ALL');
      setIssueDelta(null);
      setActiveStep(parsed.records.length > 0 || parsed.issues.length > 0 ? 'result' : 'prepare');
      setLastImportMessage(
        tr(
          `已从备份文件恢复本地状态（记录 ${parsed.records.length} 条，异常 ${parsed.issues.length} 条）。`,
          `Restored from backup: ${parsed.records.length} records, ${parsed.issues.length} issues.`,
        ),
      );
    } catch {
      setLastImportMessage(
        tr('恢复失败：无法读取或解析备份 JSON 文件。', 'Restore failed: unable to read or parse backup JSON.'),
      );
    } finally {
      event.target.value = '';
    }
  }

  async function handleCopyIssues(): Promise<void> {
    if (issues.length === 0) {
      return;
    }
    const issueText = issues
      .map((issue) => `第 ${issue.rowNumber} 行：${issue.message}`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(issueText);
      setLastImportMessage(tr(`已复制 ${issues.length} 条异常信息。`, `Copied ${issues.length} issue items.`));
    } catch {
      setLastImportMessage(tr('复制失败：请检查浏览器剪贴板权限。', 'Copy failed: check clipboard permission.'));
    }
  }

  const conflictPreviews = useMemo((): ReplacedRecordPreview[] => {
    if (!pendingImport) {
      return [];
    }
    const keyword = conflictNameKeyword.trim().toLowerCase();
    const base = pendingImport.replacedPreviews;
    if (!keyword) {
      return base;
    }
    return base.filter((item) => item.incoming.name.toLowerCase().includes(keyword));
  }, [pendingImport, conflictNameKeyword]);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto grid max-w-[1480px] gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
        <aside className="hidden lg:block">
          <div className="sticky top-6 rounded-3xl bg-slate-950 p-5 text-white shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-lg font-black">C</div>
              <div>
                <p className="font-black">Cambridge</p>
                <p className="text-xs text-slate-400">{tr('教师工作台', 'Teacher workspace')}</p>
              </div>
            </div>
            <nav aria-label={tr('工作台导航', 'Workspace navigation')} className="mt-5 space-y-2">
              <span aria-current="page" className="flex items-center gap-3 rounded-xl bg-white px-3 py-3 text-sm font-bold text-slate-950">
                <span aria-hidden="true">↑</span>{tr('成绩导入', 'Score import')}
              </span>
              <Link href="/analysis" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                <span aria-hidden="true">▥</span>{tr('数据分析', 'Data analysis')}
              </Link>
              <Link href="/ket" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                <span aria-hidden="true">A</span>{tr('KET 练习', 'KET practice')}
              </Link>
            </nav>
            <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-4 text-xs leading-5 text-slate-400">
              {tr('成绩默认仅保存在当前浏览器。请定期从数据管理中导出备份。', 'Scores stay in this browser by default. Export backups regularly from Data management.')}
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Cambridge Dashboard</p>
                <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                  {tr('成绩数据导入', 'Score data import')}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  {tr('按步骤准备、检查并保存成绩；确认前不会修改浏览器中的现有数据。', 'Prepare, review, and save scores step by step. Existing browser data is unchanged until you confirm.')}
                </p>
              </div>
              <div className="inline-flex w-fit rounded-xl border border-slate-300 bg-slate-50 p-1 text-sm">
                <button type="button" aria-pressed={locale === 'zh'} onClick={() => setLocale('zh')} className={`rounded-lg px-3 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 ${locale === 'zh' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>中文</button>
                <button type="button" aria-pressed={locale === 'en'} onClick={() => setLocale('en')} className={`rounded-lg px-3 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 ${locale === 'en' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>English</button>
              </div>
            </div>
            <nav aria-label={tr('移动端工作台导航', 'Mobile workspace navigation')} className="mt-5 flex gap-2 overflow-x-auto border-t border-slate-100 pt-4 lg:hidden">
              <span aria-current="page" className="whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white">{tr('成绩导入', 'Import')}</span>
              <Link href="/analysis" className="whitespace-nowrap rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">{tr('数据分析', 'Analysis')}</Link>
              <Link href="/ket" className="whitespace-nowrap rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">{tr('KET 练习', 'KET practice')}</Link>
            </nav>
          </header>

          <div className="mt-5">
            <ImportWorkflowStepper
              locale={locale}
              activeStep={activeStep}
              pendingReady={pendingImport !== null}
              resultReady={records.length > 0 || issues.length > 0}
              onStepChange={setActiveStep}
            />
          </div>

          {storageError && (
            <div role="alert" className="mt-5 rounded-2xl border border-rose-300 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-900">
              {storageError}
            </div>
          )}
          {lastImportMessage && activeStep === 'prepare' && (
            <div role="status" className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-semibold text-blue-900">
              {lastImportMessage}
            </div>
          )}

          <div className="mt-5">
            {activeStep === 'prepare' && (
              <ImportTemplateCard locale={locale} onDownloadEmptyTemplate={handleDownloadEmptyTemplate} onContinue={() => setActiveStep('upload')} />
            )}

            {activeStep === 'upload' && (
              <ImportUploadSection
                locale={locale}
                summaryText={summaryText}
                onFileSelected={handleFileSelected}
                importMode={importMode}
                onImportModeChange={setImportMode}
                lastImportMessage={lastImportMessage}
                loading={loading}
                onBack={() => setActiveStep('prepare')}
              />
            )}

            {activeStep === 'review' && pendingImport && (
              <ImportReviewPanel
                locale={locale}
                pending={pendingImport}
                conflictPreviews={conflictPreviews}
                conflictNameKeyword={conflictNameKeyword}
                onConflictNameKeywordChange={setConflictNameKeyword}
                showAllConflictRows={showAllConflictRows}
                onShowAllConflictRowsChange={setShowAllConflictRows}
                onConfirm={handleConfirmPendingImport}
                onCancel={handleCancelPendingImport}
              />
            )}

            {activeStep === 'result' && (records.length > 0 || issues.length > 0) && (
              <div className="space-y-5">
                <ImportResultSummary
                  locale={locale}
                  recordsCount={records.length}
                  classCount={classCount}
                  issuesCount={issues.length}
                  fileName={fileName}
                  savedAtText={savedAtText}
                  importStats={importStats}
                  onImportAnother={() => setActiveStep('upload')}
                />

                {lastImportMessage && (
                  <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{lastImportMessage}</p>
                )}

                {records.length > 0 && (
                  <ImportFiltersCard
                    locale={locale}
                    savedAtText=""
                    levelOptions={levelOptions}
                    selectedLevel={selectedLevel}
                    onLevelChange={setSelectedLevel}
                    classOptions={classOptions}
                    selectedClass={selectedClass}
                    onClassChange={setSelectedClass}
                    examDateOptions={examDateOptions}
                    selectedExamDate={selectedExamDate}
                    onExamDateChange={setSelectedExamDate}
                    nameKeyword={nameKeyword}
                    onNameKeywordChange={setNameKeyword}
                    showOnlyIssues={showOnlyIssues}
                    onShowOnlyIssuesChange={setShowOnlyIssues}
                    onResetFilters={handleResetFilters}
                    filteredSummaryText={filteredSummaryText}
                  />
                )}

                {issues.length > 0 && (
                  <ImportIssueSummaryCard
                    locale={locale}
                    overLimitReadingCount={issueSummary.overLimitReadingCount}
                    overLimitListeningCount={issueSummary.overLimitListeningCount}
                    overLimitWritingCount={issueSummary.overLimitWritingCount}
                    nonNumericCount={issueSummary.nonNumericCount}
                    negativeCount={issueSummary.negativeCount}
                    missingFieldCount={issueSummary.missingFieldCount}
                    duplicateRecordCount={issueSummary.duplicateRecordCount}
                    affectedRowCount={issueSummary.affectedRowCount}
                    issueDeltaText={issueDeltaText}
                    activeFilter={activeIssueFilter}
                    onSelectFilter={setActiveIssueFilter}
                  />
                )}
                <ImportIssuesSection
                  locale={locale}
                  issues={issues}
                  filteredIssues={filteredIssues}
                  activeIssueFilterLabel={activeIssueFilterLabel}
                  showOnlyIssues={showOnlyIssues}
                  onCopyIssues={handleCopyIssues}
                  onExportFilteredIssues={handleDownloadFilteredIssues}
                />
                <ImportRecordsPreview locale={locale} showOnlyIssues={showOnlyIssues} filteredRecords={filteredRecords} recordsCount={records.length} levelCountText={levelCountText} />
              </div>
            )}
          </div>

          <details className="group mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <span>
                <span className="block">{tr('数据管理', 'Data management')}</span>
                <span className="mt-1 block text-xs font-normal text-slate-500">{tr('备份、恢复、导出和审计记录', 'Backup, restore, exports, and audit history')}</span>
              </span>
              <span aria-hidden="true" className="text-xl text-slate-400 transition-transform group-open:rotate-45">＋</span>
            </summary>
            <div className="space-y-4 border-t border-slate-200 bg-slate-50 p-4 md:p-5">
              <ImportBackupExportCard
                locale={locale}
                recordsCount={records.length}
                issuesCount={issues.length}
                auditLogCount={auditLog.length}
                onDownloadParsedRecords={handleDownloadParsedRecords}
                onDownloadIssues={handleDownloadIssues}
                onClearLocalData={handleClearLocalData}
                onDownloadFullBackup={handleDownloadFullBackup}
                onRestoreFromBackup={handleRestoreFromBackup}
              />
              <ImportAuditCard locale={locale} auditLog={auditLog} onDownloadAuditLog={handleDownloadAuditLog} onClearAuditLog={handleClearAuditLog} />
            </div>
          </details>
        </section>
      </div>
    </main>
  );
}
