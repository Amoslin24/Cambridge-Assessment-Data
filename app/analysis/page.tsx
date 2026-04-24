'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type JSX } from 'react';
import type { AnalysisStudentProfileData } from '@/app/analysis/analysisTypes';
import { AnalysisClassOverviewPanels } from '@/app/analysis/components/AnalysisClassOverviewPanels';
import {
  AnalysisEarlyWarningPanel,
  type WarningRiskType,
  type WarningStudentItem,
} from '@/app/analysis/components/AnalysisEarlyWarningPanel';
import { AnalysisFiltersPanel } from '@/app/analysis/components/AnalysisFiltersPanel';
import { AnalysisPersonalComparePanels } from '@/app/analysis/components/AnalysisPersonalComparePanels';
import { AnalysisStudentPortraitPanel } from '@/app/analysis/components/AnalysisStudentPortraitPanel';
import { buildClassMacroAnalytics } from '@/lib/classMacroAnalytics';
import { buildClassPartMeanBlocks, buildDistributionsPerLevel } from '@/lib/classCohortPartMeans';
import {
  buildConvertedTotalDistribution,
  extractConvertedTotal,
  pickLatestRecordPerStudent,
} from '@/lib/convertedTotalDistribution';
import {
  FCE_READING_SECTION_PARTS,
  FCE_USE_OF_ENGLISH_PARTS,
  getPartRawMax,
  type CambridgeExamRecord,
  type CambridgePartKey,
  type ParseIssue,
} from '@/lib/cambridgeEngine';
import {
  buildImprovementSuggestion,
  buildProgressMetrics,
  buildSkillRadarData,
  formatDateForInput,
  getCurrentSemesterRange,
  minusDays,
  sumScores,
} from '@/lib/analysisPageUtils';
import {
  buildSkillDetails,
  partitionPartsByThreshold,
  pickAttentionSkillsByThreshold,
  pickMinPartsPerSkill,
  pickWeakSkillsByThreshold,
} from '@/lib/examSkillBreakdown';
import { SKILL_LIBRARY_MAP } from '@/lib/skillLibrary.generated';

const LOCAL_STORAGE_KEY = 'cambridge-dashboard:parsed-state:v1';
const UI_LOCALE_STORAGE_KEY = 'cambridge-dashboard:ui-locale:v1';
const WARNING_FILTERS_STORAGE_KEY = 'cambridge-dashboard:analysis-warning-filters:v1';

interface PersistedDashboardState {
  fileName: string;
  records: CambridgeExamRecord[];
  issues: ParseIssue[];
  savedAt: string;
}

interface PersistedWarningFilters {
  selectedRiskTypes?: WarningRiskType[];
  selectedPriorities?: Array<'P0' | 'P1' | 'P2'>;
  warningKeyword?: string;
  exportVisibleOnly?: boolean;
  warningVisibleLimit?: number;
  exportBySet?: boolean;
}

type WarningRow = WarningStudentItem & { riskType: WarningRiskType };

function buildWarningRows(sourceRecords: CambridgeExamRecord[], locale: 'zh' | 'en'): WarningRow[] {
  const grouped = new Map<string, CambridgeExamRecord[]>();
  sourceRecords.forEach((record) => {
    const list = grouped.get(record.name) ?? [];
    list.push(record);
    grouped.set(record.name, list);
  });

  const rows: WarningRow[] = [];
  grouped.forEach((studentRecords, studentName) => {
    const sorted = [...studentRecords].sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());
    if (sorted.length === 0) {
      return;
    }
    const latest = sorted[sorted.length - 1] as CambridgeExamRecord;
    const latestTotal = extractConvertedTotal(latest);
    const details = buildSkillDetails(latest);
    const weakSkills = pickWeakSkillsByThreshold(latest, details);
    const attentionSkills = pickAttentionSkillsByThreshold(latest, details);

    if (weakSkills.length > 0) {
      const keySkill = weakSkills[0]?.skill ?? (latest.convertedResult.mode === 'YLE_SHIELDS' ? 'R&W' : 'Reading');
      rows.push({
        riskType: 'HIGH_RISK',
        name: studentName,
        className: latest.className,
        setName: latest.setName,
        level: latest.level,
        examDate: latest.examDate,
        convertedTotal: latestTotal,
        keySkill,
        note:
          locale === 'zh'
            ? `技能阈值低于 60%，优先干预 ${keySkill}。`
            : `Skill accuracy under 60%, prioritize ${keySkill}.`,
        priority: 'P0',
      });
    } else if (attentionSkills.length > 0) {
      const keySkill = attentionSkills[0]?.skill ?? (latest.convertedResult.mode === 'YLE_SHIELDS' ? 'R&W' : 'Reading');
      rows.push({
        riskType: 'ATTENTION',
        name: studentName,
        className: latest.className,
        setName: latest.setName,
        level: latest.level,
        examDate: latest.examDate,
        convertedTotal: latestTotal,
        keySkill,
        note:
          locale === 'zh'
            ? `技能阈值处于 60%-70%，建议持续跟踪 ${keySkill}。`
            : `Skill accuracy in 60%-70%, keep tracking ${keySkill}.`,
        priority: 'P2',
      });
    }

    if (sorted.length >= 3) {
      const latestThree = sorted.slice(-3);
      const converted = latestThree.map((item) => extractConvertedTotal(item));
      let declineTransitions = 0;
      for (let i = 1; i < converted.length; i += 1) {
        if (converted[i] < converted[i - 1]) {
          declineTransitions += 1;
        }
      }
      if (declineTransitions >= 2) {
        rows.push({
          riskType: 'DECLINE',
          name: studentName,
          className: latest.className,
          setName: latest.setName,
          level: latest.level,
          examDate: latest.examDate,
          convertedTotal: latestTotal,
          keySkill:
            weakSkills[0]?.skill ??
            attentionSkills[0]?.skill ??
            (latest.convertedResult.mode === 'YLE_SHIELDS' ? 'R&W' : 'Reading'),
          note:
            locale === 'zh'
              ? `最近 3 次换算总分 ${converted.join(' -> ')}，存在连续下滑。`
              : `Recent 3 converted totals ${converted.join(' -> ')}, consecutive decline detected.`,
          priority: 'P1',
        });
      }
    }
  });

  const unique = new Map<string, WarningRow>();
  rows.forEach((row) => {
    const key = [row.name, row.className, row.setName, row.level, row.examDate, row.riskType].join('|');
    unique.set(key, row);
  });
  const priorityRank: Record<WarningStudentItem['priority'], number> = { P0: 0, P1: 1, P2: 2 };
  return Array.from(unique.values()).sort((a, b) => {
    if (priorityRank[a.priority] !== priorityRank[b.priority]) {
      return priorityRank[a.priority] - priorityRank[b.priority];
    }
    return a.name.localeCompare(b.name, 'zh-Hans-CN');
  });
}

/** 小题对比表：含各日期正确率（%）及 rawByDate 原始分映射。 */
type PartComparisonRow = Record<string, string | number | Record<string, number>>;

export default function AnalysisPage(): JSX.Element {
  const [locale, setLocale] = useState<'zh' | 'en'>('zh');
  const [records, setRecords] = useState<CambridgeExamRecord[]>([]);
  const [savedAt, setSavedAt] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedSet, setSelectedSet] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedCompareDates, setSelectedCompareDates] = useState<string[]>([]);
  const [showOnlyComparableSkills, setShowOnlyComparableSkills] = useState<boolean>(false);
  const [selectedWarningRiskTypes, setSelectedWarningRiskTypes] = useState<WarningRiskType[]>([
    'DECLINE',
    'ATTENTION',
    'HIGH_RISK',
  ]);
  const [exportVisibleOnly, setExportVisibleOnly] = useState<boolean>(false);
  const [warningVisibleLimit, setWarningVisibleLimit] = useState<number>(8);
  const [exportBySet, setExportBySet] = useState<boolean>(false);
  const [selectedWarningPriorities, setSelectedWarningPriorities] = useState<Array<'P0' | 'P1' | 'P2'>>([
    'P0',
    'P1',
    'P2',
  ]);
  const [warningKeyword, setWarningKeyword] = useState<string>('');
  const [lastExportSummary, setLastExportSummary] = useState<string>('');
  const studentPortraitExportRef = useRef<HTMLDivElement | null>(null);
  const [portraitExporting, setPortraitExporting] = useState<boolean>(false);

  function tr(zhText: string, enText: string): string {
    return locale === 'zh' ? zhText : enText;
  }

  useEffect((): void => {
    try {
      const rawLocale = window.localStorage.getItem(UI_LOCALE_STORAGE_KEY);
      if (rawLocale === 'zh' || rawLocale === 'en') {
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
        return;
      }
      const parsed = JSON.parse(raw) as PersistedDashboardState;
      if (!parsed || !Array.isArray(parsed.records)) {
        return;
      }
      setRecords(parsed.records);
      setSavedAt(parsed.savedAt || '');
    } catch {
      // 本地缓存不可用时保持空状态即可。
    }
  }, []);

  useEffect((): void => {
    try {
      const raw = window.localStorage.getItem(WARNING_FILTERS_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as PersistedWarningFilters;
      const riskTypes = (parsed.selectedRiskTypes ?? []).filter(
        (item): item is WarningRiskType => item === 'DECLINE' || item === 'ATTENTION' || item === 'HIGH_RISK',
      );
      const priorities = (parsed.selectedPriorities ?? []).filter(
        (item): item is 'P0' | 'P1' | 'P2' => item === 'P0' || item === 'P1' || item === 'P2',
      );
      if (riskTypes.length > 0) {
        setSelectedWarningRiskTypes(riskTypes);
      }
      if (priorities.length > 0) {
        setSelectedWarningPriorities(priorities);
      }
      if (typeof parsed.warningKeyword === 'string') {
        setWarningKeyword(parsed.warningKeyword);
      }
      if (typeof parsed.exportVisibleOnly === 'boolean') {
        setExportVisibleOnly(parsed.exportVisibleOnly);
      }
      if (typeof parsed.exportBySet === 'boolean') {
        setExportBySet(parsed.exportBySet);
      }
      if (typeof parsed.warningVisibleLimit === 'number' && Number.isFinite(parsed.warningVisibleLimit)) {
        setWarningVisibleLimit(Math.min(50, Math.max(1, Math.floor(parsed.warningVisibleLimit))));
      }
    } catch {
      // ignore local warning filters restore errors
    }
  }, []);

  useEffect((): void => {
    const payload: PersistedWarningFilters = {
      selectedRiskTypes: selectedWarningRiskTypes,
      selectedPriorities: selectedWarningPriorities,
      warningKeyword,
      exportVisibleOnly,
      warningVisibleLimit,
      exportBySet,
    };
    try {
      window.localStorage.setItem(WARNING_FILTERS_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore local warning filters persist errors
    }
  }, [
    selectedWarningRiskTypes,
    selectedWarningPriorities,
    warningKeyword,
    exportVisibleOnly,
    warningVisibleLimit,
    exportBySet,
  ]);

  const studentOptions = useMemo((): string[] => {
    return Array.from(new Set(records.map((record) => record.name))).sort();
  }, [records]);

  const levelOptions = useMemo((): string[] => {
    return Array.from(new Set(records.map((record) => record.level))).sort();
  }, [records]);

  const classOptions = useMemo((): string[] => {
    return Array.from(
      new Set(records.map((record) => record.className).filter((value) => value.length > 0)),
    ).sort();
  }, [records]);

  const setOptions = useMemo((): string[] => {
    return Array.from(
      new Set(records.map((record) => record.setName).filter((value) => value.length > 0)),
    ).sort();
  }, [records]);

  const hasExactStudentSelection = useMemo((): boolean => {
    return selectedStudent !== 'ALL' && studentOptions.includes(selectedStudent);
  }, [selectedStudent, studentOptions]);

  const filteredRecords = useMemo((): CambridgeExamRecord[] => {
    return records.filter((record) => {
      if (selectedStudent !== 'ALL') {
        if (hasExactStudentSelection) {
          if (record.name !== selectedStudent) {
            return false;
          }
        } else {
          const keyword = selectedStudent.trim().toLowerCase();
          if (keyword.length > 0 && !record.name.toLowerCase().includes(keyword)) {
            return false;
          }
        }
      }
      if (selectedLevel !== 'ALL' && record.level !== selectedLevel) {
        return false;
      }
      if (selectedClass !== 'ALL' && record.className !== selectedClass) {
        return false;
      }
      if (selectedSet !== 'ALL' && record.setName !== selectedSet) {
        return false;
      }
      if (dateFrom && record.examDate && record.examDate < dateFrom) {
        return false;
      }
      if (dateTo && record.examDate && record.examDate > dateTo) {
        return false;
      }
      return true;
    });
  }, [records, selectedStudent, selectedLevel, selectedClass, selectedSet, dateFrom, dateTo, hasExactStudentSelection]);

  const trendData = useMemo(() => {
    return [...filteredRecords]
      .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime())
      .map((record) => ({
        examDate: record.examDate || (locale === 'zh' ? '未知日期' : 'Unknown date'),
        converted: extractConvertedTotal(record),
        rawTotal: record.rawTotal,
        maxTotal: record.maxTotal,
      }));
  }, [filteredRecords, locale]);

  const latestRecord = useMemo((): CambridgeExamRecord | null => {
    if (filteredRecords.length === 0) {
      return null;
    }
    return [...filteredRecords].sort(
      (a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime(),
    )[0];
  }, [filteredRecords]);

  const distributionSourceRecords = useMemo((): CambridgeExamRecord[] => {
    return pickLatestRecordPerStudent(filteredRecords);
  }, [filteredRecords]);

  const convertedTotalDistribution = useMemo(() => {
    return buildConvertedTotalDistribution(distributionSourceRecords, locale);
  }, [distributionSourceRecords, locale]);

  const distributionByLevel = useMemo(() => buildDistributionsPerLevel(filteredRecords, locale), [filteredRecords, locale]);

  const classPartMeansByContext = useMemo(() => {
    if (selectedLevel === 'ALL') {
      return distributionByLevel.map((row) => ({
        level: row.level,
        studentCount: row.latestPerStudent.length,
        blocks: buildClassPartMeanBlocks(row.latestPerStudent, locale),
      }));
    }
    return [
      {
        level: selectedLevel,
        studentCount: distributionSourceRecords.length,
        blocks: buildClassPartMeanBlocks(distributionSourceRecords, locale),
      },
    ];
  }, [selectedLevel, distributionSourceRecords, distributionByLevel, locale]);

  const classMacro = useMemo(() => buildClassMacroAnalytics(filteredRecords, locale), [filteredRecords, locale]);

  const warningRows = useMemo((): WarningRow[] => buildWarningRows(filteredRecords, locale), [filteredRecords, locale]);

  const warningGroups = useMemo(
    (): {
      declinedStudents: WarningStudentItem[];
      attentionStudents: WarningStudentItem[];
      highRiskStudents: WarningStudentItem[];
    } => ({
      declinedStudents: warningRows.filter((row) => row.riskType === 'DECLINE'),
      attentionStudents: warningRows.filter((row) => row.riskType === 'ATTENTION'),
      highRiskStudents: warningRows.filter((row) => row.riskType === 'HIGH_RISK'),
    }),
    [warningRows],
  );

  const warningCsvRows = useMemo(
    (): Array<WarningStudentItem & { riskType: WarningRiskType }> => {
      return warningRows;
    },
    [warningRows],
  );

  const weeklyTrend = useMemo(() => {
    const dated = filteredRecords
      .map((record) => ({
        record,
        ts: new Date(record.examDate).getTime(),
      }))
      .filter((item) => Number.isFinite(item.ts));
    if (dated.length === 0) {
      return {
        current: { p0: 0, p1: 0, p2: 0 },
        previous: { p0: 0, p1: 0, p2: 0 },
        delta: { p0: 0, p1: 0, p2: 0 },
      };
    }
    const latestTs = Math.max(...dated.map((item) => item.ts));
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const currentStart = latestTs - weekMs;
    const previousStart = currentStart - weekMs;
    const currentRows = buildWarningRows(
      dated.filter((item) => item.ts > currentStart && item.ts <= latestTs).map((item) => item.record),
      locale,
    );
    const previousRows = buildWarningRows(
      dated.filter((item) => item.ts > previousStart && item.ts <= currentStart).map((item) => item.record),
      locale,
    );
    const countByPriority = (rows: WarningRow[]) => {
      const p0 = new Set(rows.filter((row) => row.priority === 'P0').map((row) => row.name)).size;
      const p1 = new Set(rows.filter((row) => row.priority === 'P1').map((row) => row.name)).size;
      const p2 = new Set(rows.filter((row) => row.priority === 'P2').map((row) => row.name)).size;
      return { p0, p1, p2 };
    };
    const current = countByPriority(currentRows);
    const previous = countByPriority(previousRows);
    return {
      current,
      previous,
      delta: {
        p0: current.p0 - previous.p0,
        p1: current.p1 - previous.p1,
        p2: current.p2 - previous.p2,
      },
    };
  }, [filteredRecords, locale]);

  const filteredWarningCsvRows = useMemo(
    () =>
      warningCsvRows.filter(
        (row) =>
          selectedWarningRiskTypes.includes(row.riskType) &&
          selectedWarningPriorities.includes(row.priority) &&
          (() => {
            const keyword = warningKeyword.trim().toLowerCase();
            if (!keyword) {
              return true;
            }
            return (
              row.name.toLowerCase().includes(keyword) ||
              row.className.toLowerCase().includes(keyword) ||
              row.setName.toLowerCase().includes(keyword)
            );
          })(),
      ),
    [warningCsvRows, selectedWarningRiskTypes, selectedWarningPriorities, warningKeyword],
  );

  const exportWarningCsvRows = useMemo(() => {
    if (!exportVisibleOnly) {
      return filteredWarningCsvRows;
    }
    const limit = Math.max(1, warningVisibleLimit);
    return filteredWarningCsvRows.slice(0, limit);
  }, [filteredWarningCsvRows, exportVisibleOnly, warningVisibleLimit]);

  const exportPreviewText = useMemo((): string => {
    const count = exportWarningCsvRows.length;
    if (exportBySet) {
      const setCount = new Set(
        exportWarningCsvRows.map((row) => row.setName.trim() || (locale === 'zh' ? '未分组' : 'UNSET')),
      ).size;
      return locale === 'zh'
        ? `预计导出 ${count} 人，按 SET 拆分 ${setCount} 个文件。`
        : `Estimated export: ${count} students, split into ${setCount} Set files.`;
    }
    return locale === 'zh'
      ? `预计导出 ${count} 人，单文件导出。`
      : `Estimated export: ${count} students, single file.`;
  }, [exportWarningCsvRows, exportBySet, locale]);

  const latestSkillBars = useMemo(() => {
    if (!latestRecord) {
      return [];
    }

    if (latestRecord.convertedResult.mode === 'YLE_SHIELDS') {
      const rwRaw = sumScores(latestRecord.reading, latestRecord.readingEnabledParts);
      const lRaw = sumScores(latestRecord.listening, latestRecord.listeningEnabledParts);
      return [
        {
          skill: 'R&W',
          raw: rwRaw,
          converted: latestRecord.convertedResult.readingWritingShield,
        },
        {
          skill: 'Listening',
          raw: lRaw,
          converted: latestRecord.convertedResult.listeningShield,
        },
      ];
    }

    const writingRaw = sumScores(latestRecord.writing, latestRecord.writingEnabledParts);
    const listeningRaw = sumScores(latestRecord.listening, latestRecord.listeningEnabledParts);
    if (latestRecord.level === 'FCE' && latestRecord.convertedResult.useOfEnglishScale !== undefined) {
      const readingSectionRaw = sumScores(latestRecord.reading, [...FCE_READING_SECTION_PARTS]);
      const uoeRaw = sumScores(latestRecord.reading, [...FCE_USE_OF_ENGLISH_PARTS]);
      return [
        {
          skill: 'Reading',
          raw: readingSectionRaw,
          converted: latestRecord.convertedResult.readingScale,
        },
        {
          skill: 'Use of English',
          raw: uoeRaw,
          converted: latestRecord.convertedResult.useOfEnglishScale,
        },
        {
          skill: 'Writing',
          raw: writingRaw,
          converted: latestRecord.convertedResult.writingScale,
        },
        {
          skill: 'Listening',
          raw: listeningRaw,
          converted: latestRecord.convertedResult.listeningScale,
        },
      ];
    }
    const readingRaw = sumScores(latestRecord.reading, latestRecord.readingEnabledParts);
    return [
      {
        skill: 'Reading',
        raw: readingRaw,
        converted: latestRecord.convertedResult.readingScale,
      },
      {
        skill: 'Writing',
        raw: writingRaw,
        converted: latestRecord.convertedResult.writingScale,
      },
      {
        skill: 'Listening',
        raw: listeningRaw,
        converted: latestRecord.convertedResult.listeningScale,
      },
    ];
  }, [latestRecord]);

  const latestSkillDetails = useMemo(() => {
    if (!latestRecord) {
      return [];
    }
    return buildSkillDetails(latestRecord);
  }, [latestRecord]);

  const studentProfile = useMemo((): AnalysisStudentProfileData | null => {
    if (!latestRecord) {
      return null;
    }
    const details = buildSkillDetails(latestRecord);
    const weakSkills = pickWeakSkillsByThreshold(latestRecord, details);
    const attentionSkills = pickAttentionSkillsByThreshold(latestRecord, details);
    const partThresholds = partitionPartsByThreshold(latestRecord, details);
    const minPartsFallback = pickMinPartsPerSkill(details);
    const radarData = buildSkillRadarData(latestRecord, details);
    const suggestion = buildImprovementSuggestion(
      latestRecord,
      weakSkills,
      attentionSkills,
      partThresholds,
      minPartsFallback,
      SKILL_LIBRARY_MAP,
      locale,
    );
    return {
      record: latestRecord,
      details,
      weakSkills,
      attentionSkills,
      partThresholds,
      progress: buildProgressMetrics(filteredRecords, locale),
      radarData,
      suggestion,
    };
  }, [latestRecord, filteredRecords, locale]);

  function sanitizePortraitFileSegment(raw: string): string {
    return raw.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'export';
  }

  function handlePrintStudentPortrait(): void {
    if (!studentPortraitExportRef.current) {
      return;
    }
    window.print();
  }

  function escapeCsvCell(value: string | number): string {
    const text = String(value);
    if (text.includes(',') || text.includes('"') || text.includes('\n') || text.includes('\r')) {
      return `"${text.replaceAll('"', '""')}"`;
    }
    return text;
  }

  function handleExportInterventionCsv(): void {
    if (exportWarningCsvRows.length === 0) {
      return;
    }
    const header =
      locale === 'zh'
        ? ['风险类型', '优先级', '姓名', '班级', '组别', '级别', '最近考试日期', '换算总分', '关键技能', '干预说明']
        : ['RiskType', 'Priority', 'Name', 'Class', 'Set', 'Level', 'LatestExamDate', 'ConvertedTotal', 'KeySkill', 'InterventionNote'];
    const riskTypeLabel = (riskType: WarningRiskType): string => {
      if (locale === 'zh') {
        if (riskType === 'DECLINE') return '连续下滑';
        if (riskType === 'ATTENTION') return '临界（60%-70%）';
        return '高风险（<60%）';
      }
      if (riskType === 'DECLINE') return 'Consecutive decline';
      if (riskType === 'ATTENTION') return 'Attention (60%-70%)';
      return 'High risk (<60%)';
    };
    const toCsv = (rows: typeof exportWarningCsvRows): string => {
      const lines = [
        header,
        ...rows.map((row) => [
          riskTypeLabel(row.riskType),
          row.priority,
          row.name,
          row.className,
          row.setName,
          row.level,
          row.examDate,
          row.convertedTotal,
          row.keySkill,
          row.note,
        ]),
      ].map((cells) => cells.map((cell) => escapeCsvCell(cell)).join(','));
      return `${lines.join('\n')}\n`;
    };

    const triggerDownload = (fileName: string, csv: string): void => {
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.setAttribute('download', fileName);
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    };

    if (exportBySet) {
      const grouped = new Map<string, typeof exportWarningCsvRows>();
      exportWarningCsvRows.forEach((row) => {
        const setKey = row.setName.trim() || (locale === 'zh' ? '未分组' : 'UNSET');
        const list = grouped.get(setKey) ?? [];
        list.push(row);
        grouped.set(setKey, list);
      });
      grouped.forEach((rows, setKey) => {
        const safeSet = setKey.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'SET';
        const fileName =
          locale === 'zh'
            ? `教师执行版_干预名单_SET-${safeSet}.csv`
            : `teacher-execution_intervention-list_set-${safeSet}.csv`;
        triggerDownload(fileName, toCsv(rows));
      });
      const selectedRiskLabelsZh = selectedWarningRiskTypes
        .map((item) => {
          if (item === 'DECLINE') return '连续下滑';
          if (item === 'ATTENTION') return '临界';
          return '高风险';
        })
        .join(' / ');
      const selectedRiskLabelsEn = selectedWarningRiskTypes
        .map((item) => {
          if (item === 'DECLINE') return 'Decline';
          if (item === 'ATTENTION') return 'Attention';
          return 'HighRisk';
        })
        .join(' / ');
      const setCount = grouped.size;
      setLastExportSummary(
        locale === 'zh'
          ? `教师执行版导出完成：共 ${exportWarningCsvRows.length} 人，按 SET 拆分 ${setCount} 个文件；风险类型[${selectedRiskLabelsZh || '无'}]，优先级[${selectedWarningPriorities.join(' / ') || '无'}]${exportVisibleOnly ? `，仅前 ${warningVisibleLimit} 人` : ''}。`
          : `Teacher execution export complete: ${exportWarningCsvRows.length} students, split into ${setCount} Set files; risk types [${selectedRiskLabelsEn || 'none'}], priorities [${selectedWarningPriorities.join(' / ') || 'none'}]${exportVisibleOnly ? `, top ${warningVisibleLimit} only` : ''}.`,
      );
      return;
    }

    triggerDownload(
      locale === 'zh' ? '教师执行版_干预名单.csv' : 'teacher-execution_intervention-list.csv',
      toCsv(exportWarningCsvRows),
    );
    const selectedRiskLabelsZh = selectedWarningRiskTypes
      .map((item) => {
        if (item === 'DECLINE') return '连续下滑';
        if (item === 'ATTENTION') return '临界';
        return '高风险';
      })
      .join(' / ');
    const selectedRiskLabelsEn = selectedWarningRiskTypes
      .map((item) => {
        if (item === 'DECLINE') return 'Decline';
        if (item === 'ATTENTION') return 'Attention';
        return 'HighRisk';
      })
      .join(' / ');
    setLastExportSummary(
      locale === 'zh'
        ? `教师执行版导出完成：共 ${exportWarningCsvRows.length} 人，单文件导出；风险类型[${selectedRiskLabelsZh || '无'}]，优先级[${selectedWarningPriorities.join(' / ') || '无'}]${exportVisibleOnly ? `，仅前 ${warningVisibleLimit} 人` : ''}。`
        : `Teacher execution export complete: ${exportWarningCsvRows.length} students, single-file export; risk types [${selectedRiskLabelsEn || 'none'}], priorities [${selectedWarningPriorities.join(' / ') || 'none'}]${exportVisibleOnly ? `, top ${warningVisibleLimit} only` : ''}.`,
    );
  }

  function toggleWarningRiskType(riskType: WarningRiskType): void {
    setSelectedWarningRiskTypes((prev) => {
      if (prev.includes(riskType)) {
        return prev.filter((item) => item !== riskType);
      }
      return [...prev, riskType];
    });
  }

  function selectAllWarningRiskTypes(): void {
    setSelectedWarningRiskTypes(['DECLINE', 'ATTENTION', 'HIGH_RISK']);
  }

  function toggleWarningPriority(priority: 'P0' | 'P1' | 'P2'): void {
    setSelectedWarningPriorities((prev) => {
      if (prev.includes(priority)) {
        return prev.filter((item) => item !== priority);
      }
      return [...prev, priority];
    });
  }

  function selectAllWarningPriorities(): void {
    setSelectedWarningPriorities(['P0', 'P1', 'P2']);
  }

  function resetWarningFilters(): void {
    setSelectedWarningRiskTypes(['DECLINE', 'ATTENTION', 'HIGH_RISK']);
    setSelectedWarningPriorities(['P0', 'P1', 'P2']);
    setWarningKeyword('');
    setExportVisibleOnly(false);
    setWarningVisibleLimit(8);
    setExportBySet(false);
  }

  async function handleExportStudentPortraitPng(): Promise<void> {
    const root = studentPortraitExportRef.current;
    if (!root || portraitExporting || !studentProfile) {
      return;
    }
    const name = sanitizePortraitFileSegment(studentProfile.record.name);
    const date = sanitizePortraitFileSegment(studentProfile.record.examDate || 'unknown');
    setPortraitExporting(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(root, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollY: -window.scrollY,
        onClone(clonedDoc): void {
          clonedDoc.querySelectorAll('.portrait-caliber-note').forEach((node) => {
            node.parentElement?.removeChild(node);
          });
        },
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `学生画像卡_${name}_${date}.png`;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      window.alert('导出 PNG 失败，请尝试使用「打印为 PDF」，在打印对话框中选择「存储为 PDF」。');
    } finally {
      setPortraitExporting(false);
    }
  }

  const dateOptions = useMemo((): string[] => {
    return Array.from(
      new Set(
        filteredRecords
          .map((record) => record.examDate)
          .filter((value) => value.length > 0),
      ),
    ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [filteredRecords]);

  useEffect((): void => {
    if (dateOptions.length === 0) {
      setSelectedCompareDates([]);
      return;
    }
    setSelectedCompareDates((prev) => {
      if (prev.length === 0) {
        return [...dateOptions];
      }
      const valid = prev.filter((date) => dateOptions.includes(date));
      return valid.length > 0 ? valid : [...dateOptions];
    });
  }, [dateOptions]);

  const compareRecordByDate = useMemo((): Array<{ examDate: string; record: CambridgeExamRecord }> => {
    const orderedDates = [...selectedCompareDates].sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    );
    return orderedDates
      .map((examDate) => {
        const record = filteredRecords.find((item) => item.examDate === examDate);
        return record ? { examDate, record } : null;
      })
      .filter((item): item is { examDate: string; record: CambridgeExamRecord } => item !== null);
  }, [selectedCompareDates, filteredRecords]);

  const compareDetailMapByDate = useMemo(() => {
    const map = new Map<string, ReturnType<typeof buildSkillDetails>>();
    compareRecordByDate.forEach(({ examDate, record }) => {
      map.set(examDate, buildSkillDetails(record));
    });
    return map;
  }, [compareRecordByDate]);

  const compareBarData = useMemo((): Array<Record<string, string | number>> => {
    const skillSet = new Set<string>();
    compareDetailMapByDate.forEach((details) => {
      details.forEach((detail) => skillSet.add(detail.skill));
    });

    const rows = Array.from(skillSet).map((skill) => {
      const row: Record<string, string | number> = { skill };
      compareRecordByDate.forEach(({ examDate }) => {
        const details = compareDetailMapByDate.get(examDate) ?? [];
        row[examDate] = details.find((item) => item.skill === skill)?.converted ?? 0;
      });
      return row;
    });
    if (!showOnlyComparableSkills) {
      return rows;
    }
    return rows.filter((row) =>
      compareRecordByDate.some(({ examDate }) => Number(row[examDate] ?? 0) > 0),
    );
  }, [compareDetailMapByDate, compareRecordByDate, showOnlyComparableSkills]);

  const partComparisonSections = useMemo(() => {
    const skillSet = new Set<string>();
    compareDetailMapByDate.forEach((details) => {
      details.forEach((detail) => skillSet.add(detail.skill));
    });

    const sections = Array.from(skillSet).map((skill) => {
      const partSet = new Set<string>();
      compareRecordByDate.forEach(({ examDate }) => {
        const details = compareDetailMapByDate.get(examDate) ?? [];
        const target = details.find((item) => item.skill === skill);
        target?.partEntries.forEach((entry) => partSet.add(entry.part));
      });

      const sortedParts = Array.from(partSet).sort((a, b) => {
        const numA = Number(a.replace(/^\D+_P/, ''));
        const numB = Number(b.replace(/^\D+_P/, ''));
        if (Number.isNaN(numA) || Number.isNaN(numB)) {
          return a.localeCompare(b);
        }
        return numA - numB;
      });

      const data: PartComparisonRow[] = sortedParts.map((part) => {
        const row: PartComparisonRow = {
          part,
          rawByDate: {},
          partMaxByDate: {},
        };
        compareRecordByDate.forEach(({ examDate, record }) => {
          const details = compareDetailMapByDate.get(examDate) ?? [];
          const target = details.find((item) => item.skill === skill);
          const raw = target?.partEntries.find((entry) => entry.part === part)?.value ?? 0;
          const partMax = getPartRawMax(record.level, part as CambridgePartKey);
          (row.rawByDate as Record<string, number>)[examDate] = raw;
          (row.partMaxByDate as Record<string, number>)[examDate] = partMax;
          row[examDate] = partMax > 0 ? Math.round((raw / partMax) * 1000) / 10 : 0;
        });
        return row;
      });

      return { skill, data };
    });
    if (!showOnlyComparableSkills) {
      return sections;
    }
    return sections.filter((section) =>
      section.data.some((row) =>
        compareRecordByDate.some(({ examDate }) => Number(row[examDate] ?? 0) > 0),
      ),
    );
  }, [compareDetailMapByDate, compareRecordByDate, showOnlyComparableSkills]);

  const isMSEComparison = useMemo((): boolean => {
    if (compareRecordByDate.length === 0) {
      return false;
    }
    return compareRecordByDate.every(({ record }) => record.convertedResult.mode === 'MSE_SCALE');
  }, [compareRecordByDate]);

  const isYLEComparison = useMemo((): boolean => {
    if (compareRecordByDate.length === 0) {
      return false;
    }
    return compareRecordByDate.every(({ record }) => record.convertedResult.mode === 'YLE_SHIELDS');
  }, [compareRecordByDate]);

  const savedAtText = useMemo((): string => {
    if (!savedAt) {
      return '';
    }
    const date = new Date(savedAt);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return locale === 'zh'
      ? `数据更新时间：${date.toLocaleString('zh-CN')}`
      : `Updated at: ${date.toLocaleString('en-US')}`;
  }, [savedAt, locale]);

  const compareDateColors = ['#2563eb', '#f97316', '#16a34a', '#8b5cf6', '#ef4444', '#0ea5e9'];

  function toggleCompareDate(examDate: string): void {
    setSelectedCompareDates((prev) => {
      if (prev.includes(examDate)) {
        return prev.filter((item) => item !== examDate);
      }
      return [...prev, examDate];
    });
  }

  function applyRecentDaysRange(days: number): void {
    const today = new Date();
    const fromDate = minusDays(today, days);
    setDateFrom(formatDateForInput(fromDate));
    setDateTo(formatDateForInput(today));
  }

  function applyCurrentSemesterRange(): void {
    const { from, to } = getCurrentSemesterRange(new Date());
    setDateFrom(from);
    setDateTo(to);
  }

  function applyLatestExamWeekRange(): void {
    if (filteredRecords.length === 0) {
      clearDateRange();
      return;
    }
    const latestDate = [...filteredRecords]
      .map((record) => record.examDate)
      .filter((value) => value.length > 0)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
    if (!latestDate) {
      clearDateRange();
      return;
    }
    const endDate = new Date(latestDate);
    if (Number.isNaN(endDate.getTime())) {
      clearDateRange();
      return;
    }
    const startDate = minusDays(endDate, 6);
    setDateFrom(formatDateForInput(startDate));
    setDateTo(formatDateForInput(endDate));
  }

  function clearDateRange(): void {
    setDateFrom('');
    setDateTo('');
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-6">
      <section className="max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {tr('Cambridge 数据分析面板', 'Cambridge Analytics Dashboard')}
              </h1>
              <p className="mt-2 text-slate-600">
                {tr(
                  '面向学生维度的趋势分析与分技能对比（基于本地已导入数据）。',
                  'Student-level trend analysis and skill comparison (based on local imported data).',
                )}
              </p>
              {savedAtText && <p className="mt-1 text-xs text-slate-500">{savedAtText}</p>}
            </div>
            <div className="flex flex-col items-start gap-2">
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
              <Link
                href="/"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:border-blue-700 hover:text-blue-700 transition-colors"
              >
                {tr('返回导入页', 'Back to import')}
              </Link>
            </div>
          </div>

          {records.length === 0 && (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
              {tr(
                '当前没有可分析数据。请先在导入页上传并解析 Excel/CSV 文件。',
                'No data available for analysis. Please upload and parse an Excel/CSV file on the import page.',
              )}
            </div>
          )}

          {records.length > 0 && (
            <>
              <AnalysisFiltersPanel
                locale={locale}
                studentOptions={studentOptions}
                selectedStudent={selectedStudent}
                onStudentChange={setSelectedStudent}
                levelOptions={levelOptions}
                selectedLevel={selectedLevel}
                onLevelChange={setSelectedLevel}
                classOptions={classOptions}
                selectedClass={selectedClass}
                onClassChange={setSelectedClass}
                setOptions={setOptions}
                selectedSet={selectedSet}
                onSetChange={setSelectedSet}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
                onApplyRecentDays={applyRecentDaysRange}
                onApplyLatestExamWeek={applyLatestExamWeekRange}
                onApplyCurrentSemester={applyCurrentSemesterRange}
                onClearDateRange={clearDateRange}
                showOnlyComparableSkills={showOnlyComparableSkills}
                onShowOnlyComparableSkillsChange={setShowOnlyComparableSkills}
              />

              {filteredRecords.length === 0 && (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
                  {tr(
                    '当前筛选条件下无记录，请调整筛选条件后重试。',
                    'No records matched current filters. Please adjust and retry.',
                  )}
                </div>
              )}

              {filteredRecords.length > 0 && (
                <>
                  <AnalysisClassOverviewPanels
                    locale={locale}
                    classMacro={classMacro}
                    selectedLevel={selectedLevel}
                    distributionByLevel={distributionByLevel}
                    distributionSourceRecords={distributionSourceRecords}
                    convertedTotalDistribution={convertedTotalDistribution}
                    classPartMeansByContext={classPartMeansByContext}
                  />

                  <AnalysisEarlyWarningPanel
                    locale={locale}
                    declinedStudents={warningGroups.declinedStudents}
                    attentionStudents={warningGroups.attentionStudents}
                    highRiskStudents={warningGroups.highRiskStudents}
                    onExportInterventionCsv={handleExportInterventionCsv}
                    exportDisabled={exportWarningCsvRows.length === 0}
                    selectedRiskTypes={selectedWarningRiskTypes}
                    onToggleRiskType={toggleWarningRiskType}
                    onSelectAllRiskTypes={selectAllWarningRiskTypes}
                    exportVisibleOnly={exportVisibleOnly}
                    onExportVisibleOnlyChange={setExportVisibleOnly}
                    visibleLimit={warningVisibleLimit}
                    onVisibleLimitChange={setWarningVisibleLimit}
                    exportBySet={exportBySet}
                    onExportBySetChange={setExportBySet}
                    selectedPriorities={selectedWarningPriorities}
                    onTogglePriority={toggleWarningPriority}
                    onSelectAllPriorities={selectAllWarningPriorities}
                    exportPreviewText={exportPreviewText}
                    warningKeyword={warningKeyword}
                    onWarningKeywordChange={setWarningKeyword}
                    onResetWarningFilters={resetWarningFilters}
                    weeklyTrend={weeklyTrend}
                  />
                  {lastExportSummary && (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                      {lastExportSummary}
                    </div>
                  )}

                  <AnalysisStudentPortraitPanel
                    locale={locale}
                    selectedStudent={hasExactStudentSelection ? selectedStudent : 'ALL'}
                    studentProfile={studentProfile}
                    portraitExporting={portraitExporting}
                    studentPortraitExportRef={studentPortraitExportRef}
                    onPrint={handlePrintStudentPortrait}
                    onExportPng={handleExportStudentPortraitPng}
                  />

                  <AnalysisPersonalComparePanels
                    locale={locale}
                    trendData={trendData}
                    latestRecord={latestRecord}
                    latestSkillBars={latestSkillBars}
                    latestSkillDetails={latestSkillDetails}
                    dateOptions={dateOptions}
                    selectedCompareDates={selectedCompareDates}
                    onSelectAllDates={() => setSelectedCompareDates([...dateOptions])}
                    onClearDateSelection={() => setSelectedCompareDates([])}
                    onToggleCompareDate={toggleCompareDate}
                    compareBarData={compareBarData}
                    compareRecordByDate={compareRecordByDate}
                    isMSEComparison={isMSEComparison}
                    isYLEComparison={isYLEComparison}
                    partComparisonSections={partComparisonSections}
                    compareDateColors={compareDateColors}
                  />
                </>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
