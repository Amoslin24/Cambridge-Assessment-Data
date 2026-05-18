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
import type { ImportStats, PendingAppendImport, PersistedDashboardState } from '@/lib/importHomeTypes';
import { ImportAppendConflictPanel } from '@/components/home/ImportAppendConflictPanel';
import { ImportAuditCard } from '@/components/home/ImportAuditCard';
import { ImportBackupExportCard } from '@/components/home/ImportBackupExportCard';
import { ImportFiltersCard } from '@/components/home/ImportFiltersCard';
import { ImportIssueSummaryCard } from '@/components/home/ImportIssueSummaryCard';
import { ImportIssuesSection } from '@/components/home/ImportIssuesSection';
import { ImportLoadingBanner } from '@/components/home/ImportLoadingBanner';
import { ImportRecordsPreview } from '@/components/home/ImportRecordsPreview';
import { ImportRuntimeStatusCard } from '@/components/home/ImportRuntimeStatusCard';
import { ImportTemplateCard } from '@/components/home/ImportTemplateCard';
import { ImportTemplateLinks } from '@/components/home/ImportTemplateLinks';
import { ImportUploadSection } from '@/components/home/ImportUploadSection';

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
  const [pendingAppendImport, setPendingAppendImport] = useState<PendingAppendImport | null>(null);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [showAllConflictRows, setShowAllConflictRows] = useState<boolean>(false);
  const [conflictNameKeyword, setConflictNameKeyword] = useState<string>('');
  const [activeIssueFilter, setActiveIssueFilter] = useState<IssueFilterKey>('ALL');
  const [issueDelta, setIssueDelta] = useState<number | null>(null);

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

    if (!fileName && records.length === 0 && issues.length === 0 && auditLog.length === 0) {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
      setSavedAt('');
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
  }, [fileName, records, issues, auditLog, storageReady]);

  function appendAuditEntry(entry: Omit<ImportAuditEntry, 'id'>): void {
    const id = `${entry.importedAt}-${Math.random().toString(16).slice(2)}`;
    setAuditLog((prev) => [{ ...entry, id }, ...prev].slice(0, 50));
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const targetFile = event.target.files?.[0];
    if (!targetFile) {
      return;
    }

    setLoading(true);
    setLastImportMessage('');

    try {
      const result = await parseCambridgeSpreadsheet(targetFile);
      const previousIssueCount = issues.length;
      if (importMode === 'replace') {
        setFileName(targetFile.name);
        setRecords(result.records);
        setIssues(result.issues);
        setActiveIssueFilter('ALL');
        const deltaMessage = computeIssueDeltaMessage(previousIssueCount, result.issues.length);
        setLastImportMessage(
          tr(
            `覆盖导入完成：有效记录 ${result.records.length} 条，异常 ${result.issues.length} 条。${deltaMessage}`,
            `Replace import completed: ${result.records.length} valid records, ${result.issues.length} issues. ${deltaMessage}`,
          ),
        );
        setImportStats({
          mode: 'replace',
          addedCount: result.records.length,
          replacedCount: 0,
          issueCount: result.issues.length,
          totalAfterImport: result.records.length,
        });
        appendAuditEntry({
          importedAt: new Date().toISOString(),
          fileName: targetFile.name,
          mode: 'replace',
          addedCount: result.records.length,
          replacedCount: 0,
          issueCount: result.issues.length,
          totalAfterImport: result.records.length,
        });
      } else {
        const mergeOutcome = mergeRecordsByKey(records, result.records);
        const mergedIssues = [...issues, ...result.issues];

        if (mergeOutcome.replacedCount > 0) {
          setShowAllConflictRows(false);
          setConflictNameKeyword('');
          setPendingAppendImport({
            targetFileName: targetFile.name,
            mergedRecords: mergeOutcome.merged,
            mergedIssues,
            outcome: mergeOutcome,
          });
          setLastImportMessage(
            tr(
              `检测到 ${mergeOutcome.replacedCount} 条记录将被覆盖，请先确认后再写入。`,
              `${mergeOutcome.replacedCount} records will be replaced. Please confirm before applying.`,
            ),
          );
        } else {
          setFileName(fileName ? `${fileName} + ${targetFile.name}` : targetFile.name);
          setRecords(mergeOutcome.merged);
          setIssues(mergedIssues);
          setActiveIssueFilter('ALL');
          const deltaMessage = computeIssueDeltaMessage(previousIssueCount, mergedIssues.length);
          setLastImportMessage(
            tr(
              `追加导入完成：新增 ${mergeOutcome.addedCount} 条，覆盖 ${mergeOutcome.replacedCount} 条，当前总计 ${mergeOutcome.merged.length} 条。${deltaMessage}`,
              `Append import completed: +${mergeOutcome.addedCount}, replaced ${mergeOutcome.replacedCount}, total ${mergeOutcome.merged.length}. ${deltaMessage}`,
            ),
          );
          setImportStats({
            mode: 'append',
            addedCount: mergeOutcome.addedCount,
            replacedCount: mergeOutcome.replacedCount,
            issueCount: mergedIssues.length,
            totalAfterImport: mergeOutcome.merged.length,
          });
          appendAuditEntry({
            importedAt: new Date().toISOString(),
            fileName: targetFile.name,
            mode: 'append',
            addedCount: mergeOutcome.addedCount,
            replacedCount: mergeOutcome.replacedCount,
            issueCount: mergedIssues.length,
            totalAfterImport: mergeOutcome.merged.length,
          });
        }
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : tr('文件解析失败，请检查文件格式或内容是否完整。', 'Failed to parse file. Please check format and content.');
      const importFailedIssue = { rowNumber: 0, message };
      if (importMode === 'replace') {
        setIssues([importFailedIssue]);
      } else {
        setIssues([...issues, importFailedIssue]);
      }
      setActiveIssueFilter('ALL');
      setIssueDelta(null);
      setLastImportMessage(
        tr('导入失败：导入前检查未通过或文件解析失败。', 'Import failed: precheck failed or file parsing error.'),
      );
    } finally {
      setLoading(false);
      event.target.value = '';
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
    setPendingAppendImport(null);
    setLastImportMessage('');
    setImportStats(null);
    setAuditLog([]);
    setActiveIssueFilter('ALL');
    setIssueDelta(null);
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

  function handleConfirmPendingAppendImport(): void {
    if (!pendingAppendImport) {
      return;
    }
    setFileName(fileName ? `${fileName} + ${pendingAppendImport.targetFileName}` : pendingAppendImport.targetFileName);
    setRecords(pendingAppendImport.mergedRecords);
    setIssues(pendingAppendImport.mergedIssues);
    setActiveIssueFilter('ALL');
    const deltaMessage = computeIssueDeltaMessage(issues.length, pendingAppendImport.mergedIssues.length);
    setLastImportMessage(
      tr(
        `追加导入完成：新增 ${pendingAppendImport.outcome.addedCount} 条，覆盖 ${pendingAppendImport.outcome.replacedCount} 条，当前总计 ${pendingAppendImport.outcome.merged.length} 条。${deltaMessage}`,
        `Append import completed: +${pendingAppendImport.outcome.addedCount}, replaced ${pendingAppendImport.outcome.replacedCount}, total ${pendingAppendImport.outcome.merged.length}. ${deltaMessage}`,
      ),
    );
    setImportStats({
      mode: 'append',
      addedCount: pendingAppendImport.outcome.addedCount,
      replacedCount: pendingAppendImport.outcome.replacedCount,
      issueCount: pendingAppendImport.mergedIssues.length,
      totalAfterImport: pendingAppendImport.outcome.merged.length,
    });
    appendAuditEntry({
      importedAt: new Date().toISOString(),
      fileName: pendingAppendImport.targetFileName,
      mode: 'append',
      addedCount: pendingAppendImport.outcome.addedCount,
      replacedCount: pendingAppendImport.outcome.replacedCount,
      issueCount: pendingAppendImport.mergedIssues.length,
      totalAfterImport: pendingAppendImport.outcome.merged.length,
    });
    setPendingAppendImport(null);
    setShowAllConflictRows(false);
    setConflictNameKeyword('');
  }

  function handleCancelPendingAppendImport(): void {
    setPendingAppendImport(null);
    setLastImportMessage(tr('已取消本次追加导入。', 'Append import cancelled.'));
    setShowAllConflictRows(false);
    setConflictNameKeyword('');
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
      setPendingAppendImport(null);
      setImportStats(null);
      setActiveIssueFilter('ALL');
      setIssueDelta(null);
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
    if (!pendingAppendImport) {
      return [];
    }
    const keyword = conflictNameKeyword.trim().toLowerCase();
    const base = pendingAppendImport.outcome.replacedPreviews;
    if (!keyword) {
      return base;
    }
    return base.filter((item) => item.incoming.name.toLowerCase().includes(keyword));
  }, [pendingAppendImport, conflictNameKeyword]);

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-6">
      <section className="max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-10">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {tr('Cambridge 成绩数据导入中心', 'Cambridge Score Import Center')}
            </h1>
            <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1 text-sm">
              <button
                type="button"
                onClick={() => setLocale('zh')}
                className={`rounded-md px-3 py-1 ${locale === 'zh' ? 'bg-slate-900 text-white' : 'text-slate-700'}`}
              >
                中文
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`rounded-md px-3 py-1 ${locale === 'en' ? 'bg-slate-900 text-white' : 'text-slate-700'}`}
              >
                English
              </button>
            </div>
          </div>
          <p className="mt-3 text-slate-600 leading-relaxed">
            {tr(
              '支持 CSV / Excel（.xlsx / .xls）文件上传，系统将自动执行级别识别、原子分项解析与换算结果生成。',
              'Supports CSV/Excel (.xlsx/.xls) upload with automatic level detection, atomic part parsing, and score conversion.',
            )}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/analysis"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:border-blue-700 hover:text-blue-700 transition-colors"
            >
              {tr('进入数据分析页', 'Go to analysis')}
            </Link>
            <Link
              href="/ket"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 hover:border-blue-700 hover:bg-blue-100 transition-colors"
            >
              {tr('KET 备考练习', 'KET exam practice')}
            </Link>
          </div>

          <div className="mt-8 space-y-4">
            <ImportRuntimeStatusCard
              locale={locale}
              fileName={fileName}
              recordsCount={records.length}
              issuesCount={issues.length}
              filteredIssuesCount={filteredIssues.length}
              hasActiveIssueFilter={activeIssueFilter !== 'ALL'}
            />
            <ImportUploadSection
              locale={locale}
              summaryText={summaryText}
              onFileChange={handleFileChange}
              importMode={importMode}
              onImportModeChange={setImportMode}
              lastImportMessage={lastImportMessage}
              importStats={importStats}
            />
            {pendingAppendImport && (
              <ImportAppendConflictPanel
                pending={pendingAppendImport}
                conflictPreviews={conflictPreviews}
                conflictNameKeyword={conflictNameKeyword}
                onConflictNameKeywordChange={setConflictNameKeyword}
                showAllConflictRows={showAllConflictRows}
                onShowAllConflictRowsChange={setShowAllConflictRows}
                onConfirm={handleConfirmPendingAppendImport}
                onCancel={handleCancelPendingAppendImport}
              />
            )}
            <ImportFiltersCard
              locale={locale}
              savedAtText={savedAtText}
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
            <ImportTemplateCard locale={locale} onDownloadEmptyTemplate={handleDownloadEmptyTemplate} />
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
            <ImportAuditCard
              locale={locale}
              auditLog={auditLog}
              onDownloadAuditLog={handleDownloadAuditLog}
              onClearAuditLog={handleClearAuditLog}
            />
          </div>
          <ImportTemplateLinks locale={locale} />
          <ImportLoadingBanner loading={loading} locale={locale} />
          {issues.length > 0 && (
            <div className="mt-8">
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
            </div>
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
          <ImportRecordsPreview
            locale={locale}
            showOnlyIssues={showOnlyIssues}
            filteredRecords={filteredRecords}
            recordsCount={records.length}
            levelCountText={levelCountText}
          />
        </div>
      </section>
    </main>
  );
}