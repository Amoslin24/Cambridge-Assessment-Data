'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type JSX } from 'react';
import type { AnalysisStudentProfileData } from '@/app/analysis/analysisTypes';
import { AnalysisClassOverviewPanels } from '@/app/analysis/components/AnalysisClassOverviewPanels';
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
import { getPartRawMax, type CambridgeExamRecord, type CambridgePartKey, type ParseIssue } from '@/lib/cambridgeEngine';
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

interface PersistedDashboardState {
  fileName: string;
  records: CambridgeExamRecord[];
  issues: ParseIssue[];
  savedAt: string;
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

  const filteredRecords = useMemo((): CambridgeExamRecord[] => {
    return records.filter((record) => {
      if (selectedStudent !== 'ALL' && record.name !== selectedStudent) {
        return false;
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
  }, [records, selectedStudent, selectedLevel, selectedClass, selectedSet, dateFrom, dateTo]);

  const trendData = useMemo(() => {
    return [...filteredRecords]
      .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime())
      .map((record) => ({
        examDate: record.examDate || tr('未知日期', 'Unknown date'),
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
    return buildConvertedTotalDistribution(distributionSourceRecords);
  }, [distributionSourceRecords]);

  const distributionByLevel = useMemo(() => buildDistributionsPerLevel(filteredRecords), [filteredRecords]);

  const classPartMeansByContext = useMemo(() => {
    if (selectedLevel === 'ALL') {
      return distributionByLevel.map((row) => ({
        level: row.level,
        studentCount: row.latestPerStudent.length,
        blocks: buildClassPartMeanBlocks(row.latestPerStudent),
      }));
    }
    return [
      {
        level: selectedLevel,
        studentCount: distributionSourceRecords.length,
        blocks: buildClassPartMeanBlocks(distributionSourceRecords),
      },
    ];
  }, [selectedLevel, distributionSourceRecords, distributionByLevel]);

  const classMacro = useMemo(() => buildClassMacroAnalytics(filteredRecords), [filteredRecords]);

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

    const readingRaw = sumScores(latestRecord.reading, latestRecord.readingEnabledParts);
    const writingRaw = sumScores(latestRecord.writing, latestRecord.writingEnabledParts);
    const listeningRaw = sumScores(latestRecord.listening, latestRecord.listeningEnabledParts);
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
    );
    return {
      record: latestRecord,
      details,
      weakSkills,
      attentionSkills,
      partThresholds,
      progress: buildProgressMetrics(filteredRecords),
      radarData,
      suggestion,
    };
  }, [latestRecord, filteredRecords]);

  function sanitizePortraitFileSegment(raw: string): string {
    return raw.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'export';
  }

  function handlePrintStudentPortrait(): void {
    if (!studentPortraitExportRef.current) {
      return;
    }
    window.print();
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
    return tr(`数据更新时间：${date.toLocaleString('zh-CN')}`, `Updated at: ${date.toLocaleString('en-US')}`);
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
                    classMacro={classMacro}
                    selectedLevel={selectedLevel}
                    distributionByLevel={distributionByLevel}
                    distributionSourceRecords={distributionSourceRecords}
                    convertedTotalDistribution={convertedTotalDistribution}
                    classPartMeansByContext={classPartMeansByContext}
                  />

                  <AnalysisStudentPortraitPanel
                    selectedStudent={selectedStudent}
                    studentProfile={studentProfile}
                    portraitExporting={portraitExporting}
                    studentPortraitExportRef={studentPortraitExportRef}
                    onPrint={handlePrintStudentPortrait}
                    onExportPng={handleExportStudentPortraitPng}
                  />

                  <AnalysisPersonalComparePanels
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
