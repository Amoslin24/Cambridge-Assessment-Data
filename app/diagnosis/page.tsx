'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type JSX } from 'react';
import {
  CartesianGrid,
  Bar,
  BarChart,
  Line,
  LineChart,
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CambridgeExamRecord, ParseIssue } from '@/lib/cambridgeEngine';
import { buildImprovementTaskCard } from '@/lib/analysisPageUtils';
import {
  buildSkillDetails,
  mapPartToTypePart,
  partitionPartsByThreshold,
  pickAttentionSkillsByThreshold,
  pickMinPartsPerSkill,
  pickPartForSuggestion,
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

interface TrendPoint {
  examDate: string;
  converted: number;
}

interface RadarPoint {
  skill: string;
  converted: number;
}

function extractConverted(record: CambridgeExamRecord): number {
  return record.convertedResult.value;
}

function buildRadarData(record: CambridgeExamRecord): RadarPoint[] {
  if (record.convertedResult.mode === 'YLE_SHIELDS') {
    return [
      { skill: 'R&W', converted: record.convertedResult.readingWritingShield },
      { skill: 'Listening', converted: record.convertedResult.listeningShield },
    ];
  }
  return [
    { skill: 'Reading', converted: record.convertedResult.readingScale },
    { skill: 'Writing', converted: record.convertedResult.writingScale },
    { skill: 'Listening', converted: record.convertedResult.listeningScale },
  ];
}

function buildTrend(records: CambridgeExamRecord[], student: string, level: string): TrendPoint[] {
  return records
    .filter((record) => record.name === student && (level === 'ALL' || record.level === level))
    .slice()
    .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime())
    .map((record) => ({
      examDate: record.examDate || '未知日期',
      converted: extractConverted(record),
    }));
}

function formatConvertedLabel(record: CambridgeExamRecord): string {
  const value = extractConverted(record);
  if (record.convertedResult.mode === 'YLE_SHIELDS') {
    return `${value} 盾（总10）`;
  }
  return `${value} 分（Scale）`;
}

function formatConvertedSkillValueForDiagnosis(record: CambridgeExamRecord, skill: RadarPoint['skill'], converted: number): string {
  if (record.convertedResult.mode === 'YLE_SHIELDS') {
    return `${converted} 盾`;
  }
  if (converted === 0) {
    return '0 分（未达到量表最低阈值）';
  }
  return `${converted} 分`;
}

export default function DiagnosisPage(): JSX.Element {
  const [locale, setLocale] = useState<'zh' | 'en'>('zh');
  const [records, setRecords] = useState<CambridgeExamRecord[]>([]);
  const [savedAt, setSavedAt] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedExamDate, setSelectedExamDate] = useState<string>('LATEST');

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
      // ignore
    }
  }, []);

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

  const studentOptions = useMemo((): string[] => {
    return Array.from(new Set(records.map((record) => record.name))).sort();
  }, [records]);

  const levelOptions = useMemo((): string[] => {
    return Array.from(new Set(records.map((record) => record.level))).sort();
  }, [records]);

  const examDateOptions = useMemo((): string[] => {
    if (selectedStudent === 'ALL') {
      return [];
    }
    return Array.from(
      new Set(
        records
          .filter((record) => record.name === selectedStudent)
          .map((record) => record.examDate)
          .filter((value) => value.length > 0),
      ),
    ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [records, selectedStudent]);

  const latestRecordForStudent = useMemo((): CambridgeExamRecord | null => {
    if (selectedStudent === 'ALL') {
      return null;
    }
    const list = records.filter((record) => record.name === selectedStudent);
    if (list.length === 0) {
      return null;
    }
    return list
      .slice()
      .sort((a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime())[0];
  }, [records, selectedStudent]);

  const focusRecord = useMemo((): CambridgeExamRecord | null => {
    if (selectedStudent === 'ALL') {
      return null;
    }
    const list = records.filter((record) => record.name === selectedStudent);
    if (list.length === 0) {
      return null;
    }
    if (selectedExamDate === 'LATEST' || !selectedExamDate) {
      return list
        .slice()
        .sort((a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime())[0];
    }
    return (
      list.find((record) => record.examDate === selectedExamDate) ??
      list
        .slice()
        .sort((a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime())[0]
    );
  }, [records, selectedStudent, selectedExamDate]);

  const trendData = useMemo((): TrendPoint[] => {
    if (!focusRecord) {
      return [];
    }
    const level = selectedLevel === 'ALL' ? focusRecord.level : selectedLevel;
    return buildTrend(records, focusRecord.name, level);
  }, [records, focusRecord, selectedLevel]);

  const radarData = useMemo((): RadarPoint[] => {
    if (!focusRecord) {
      return [];
    }
    return buildRadarData(focusRecord);
  }, [focusRecord]);

  const diagnosisText = useMemo((): string => {
    if (!focusRecord) {
      return '';
    }
    const details = buildSkillDetails(focusRecord);
    const partitioned = partitionPartsByThreshold(focusRecord, details);
    const minParts = pickMinPartsPerSkill(details);
    const weakSkills = pickWeakSkillsByThreshold(focusRecord, details);
    const attentionSkills = pickAttentionSkillsByThreshold(focusRecord, details);

    const defaultSkill = focusRecord.convertedResult.mode === 'YLE_SHIELDS' ? 'R&W' : 'Reading';
    let targetSkill: string;
    let cardStrength: 'WEAK' | 'ATTENTION';
    if (weakSkills.length > 0) {
      targetSkill = weakSkills[0]?.skill ?? defaultSkill;
      cardStrength = 'WEAK';
    } else if (attentionSkills.length > 0) {
      targetSkill = attentionSkills[0]?.skill ?? defaultSkill;
      cardStrength = 'ATTENTION';
    } else {
      const sorted = [...radarData].sort((a, b) => a.converted - b.converted);
      targetSkill = sorted[0]?.skill ?? defaultSkill;
      cardStrength = 'ATTENTION';
    }

    const part = pickPartForSuggestion(targetSkill, partitioned, minParts);
    const typePart = part ? mapPartToTypePart(focusRecord, targetSkill, part) : null;
    return buildImprovementTaskCard(focusRecord, targetSkill, typePart, cardStrength, SKILL_LIBRARY_MAP, locale);
  }, [focusRecord, radarData, locale]);

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-6">
      <section className="max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {tr('学生诊断报告', 'Student Diagnostic Report')}
              </h1>
              <p className="mt-2 text-slate-600">
                {tr(
                  '聚焦单个学生的分技能表现与成长轨迹，用于家长沟通与阶段性反馈。',
                  "Focus on one student's skill performance and growth trend for staged feedback.",
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
                href="/analysis"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:border-blue-700 hover:text-blue-700 transition-colors"
              >
                {tr('返回分析面板', 'Back to analysis')}
              </Link>
            </div>
          </div>

          {records.length === 0 && (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
              {tr(
                '当前没有可诊断数据。请先在导入页上传并解析 Excel/CSV 文件。',
                'No data available for diagnosis. Please upload and parse an Excel/CSV file first.',
              )}
            </div>
          )}

          {records.length > 0 && (
            <>
              <div className="mt-8 grid gap-3 md:grid-cols-3">
                <select
                  value={selectedStudent}
                  onChange={(event) => {
                    setSelectedStudent(event.target.value);
                    setSelectedExamDate('LATEST');
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <option value="ALL">{tr('选择学生', 'Select student')}</option>
                  {studentOptions.map((student) => (
                    <option key={student} value={student}>
                      {student}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedLevel}
                  onChange={(event) => setSelectedLevel(event.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <option value="ALL">{tr('全部级别', 'All levels')}</option>
                  {levelOptions.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedExamDate}
                  onChange={(event) => setSelectedExamDate(event.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                  disabled={selectedStudent === 'ALL'}
                >
                  <option value="LATEST">{tr('最近一次考试', 'Latest exam')}</option>
                  {examDateOptions.map((date) => (
                    <option key={date} value={date}>
                      {date}
                    </option>
                  ))}
                </select>
              </div>

              {selectedStudent === 'ALL' && (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-600">
                  {tr(
                    '请先在上方选择一位学生，将自动生成对应的诊断报告。',
                    'Please select a student above to generate the report.',
                  )}
                </div>
              )}

              {selectedStudent !== 'ALL' && !focusRecord && (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-600">
                  {tr(
                    '当前筛选条件下未找到该学生的记录，请检查导入数据或更改级别筛选。',
                    'No record found under current filters. Please verify data or change level filter.',
                  )}
                </div>
              )}

              {focusRecord && (
                <>
                  <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                          {tr('当前学生', 'Current student')}
                        </p>
                        <p className="text-lg font-bold text-slate-900">{focusRecord.name}</p>
                        <p className="text-xs text-slate-500">
                          {tr('级别', 'Level')}：{focusRecord.level}
                          {focusRecord.className
                            ? `｜${tr('班级', 'Class')}:${focusRecord.className}`
                            : ''}
                          {focusRecord.setName
                            ? `｜${tr('组别', 'Set')}:${focusRecord.setName}`
                            : ''}
                        </p>
                        <p className="text-xs text-slate-500">
                          {tr('考试日期', 'Exam date')}：{focusRecord.examDate || tr('未知', 'Unknown')}｜
                          {tr('换算总分', 'Converted total')}：
                          <span className="font-semibold text-slate-900">
                            {formatConvertedLabel(focusRecord)}
                          </span>
                        </p>
                      </div>
                      <div className="w-full md:w-1/2 h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          {focusRecord.convertedResult.mode === 'YLE_SHIELDS' ? (
                            <BarChart data={radarData} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} />
                              <YAxis type="category" dataKey="skill" width={90} />
                              <Tooltip />
                              <Bar dataKey="converted" name="盾数（1-5）" fill="#2563eb" />
                              <ReferenceLine
                                x={3}
                                stroke="#f59e0b"
                                strokeDasharray="4 4"
                                label={{ value: '标杆 3盾', position: 'insideTopRight', fill: '#92400e' }}
                              />
                              <ReferenceLine
                                x={5}
                                stroke="#16a34a"
                                strokeDasharray="4 4"
                                label={{ value: '标杆 5盾', position: 'insideTopRight', fill: '#14532d' }}
                              />
                            </BarChart>
                          ) : (
                            <RadarChart data={radarData}>
                              <PolarGrid />
                              <PolarAngleAxis dataKey="skill" />
                              <PolarRadiusAxis domain={[80, 190]} tickCount={6} />
                              <Tooltip />
                              <Radar
                                name="换算结果"
                                dataKey="converted"
                                stroke="#2563eb"
                                fill="#2563eb"
                                fillOpacity={0.25}
                              />
                            </RadarChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
                    <h2 className="text-lg font-bold text-slate-900">
                      {tr('核心短板诊断与建议', 'Core weakness diagnosis & recommendations')}
                    </h2>
                    <p className="mt-2 text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                      {diagnosisText || tr('当前无法生成诊断建议，请先选择学生并确保技能库可用。', 'Unable to generate recommendations. Please select a student and ensure skill library is available.')}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {tr(
                        '说明：建议内容优先来自“技能库”Excel 的 Advice 字段，并自动补齐训练频次、时长与验收目标。',
                        'Note: Recommendations prioritize Advice from skill library and auto-complete frequency, duration, and targets.',
                      )}
                    </p>
                  </div>

                  <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
                    <h2 className="text-lg font-bold text-slate-900">
                      {tr('学习成长曲线（Cambridge Scale）', 'Learning growth curve (Cambridge Scale)')}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {tr(
                        '以换算总分为纵轴，展示该学生在当前级别下多次考试的整体水平变化。',
                        'Uses converted total score to show the student\'s overall trend across exams in current level.',
                      )}
                    </p>
                    {trendData.length === 0 ? (
                      <p className="mt-3 text-sm text-slate-600">
                        {tr(
                          '当前筛选条件下仅有一次考试记录，暂无法绘制成长曲线。',
                          'Only one exam record under current filters, growth curve is unavailable.',
                        )}
                      </p>
                    ) : (
                      <div className="mt-4 h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="examDate" />
                            <YAxis />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="converted"
                              name={tr('换算总分', 'Converted total')}
                              stroke="#2563eb"
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

