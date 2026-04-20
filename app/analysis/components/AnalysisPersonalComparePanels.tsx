'use client';

import type { JSX } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CambridgeExamRecord } from '@/lib/cambridgeEngine';
import type { SkillDetail } from '@/lib/examSkillBreakdown';
import type { TrendPoint, SkillBarPoint } from '@/lib/analysisPageUtils';
import { isYLELevel } from '@/lib/analysisPageUtils';

export interface PartComparisonSection {
  skill: string;
  data: Array<Record<string, string | number | Record<string, number>>>;
}

export interface AnalysisPersonalComparePanelsProps {
  locale: 'zh' | 'en';
  trendData: TrendPoint[];
  latestRecord: CambridgeExamRecord | null;
  latestSkillBars: SkillBarPoint[];
  latestSkillDetails: SkillDetail[];
  dateOptions: string[];
  selectedCompareDates: string[];
  onSelectAllDates: () => void;
  onClearDateSelection: () => void;
  onToggleCompareDate: (examDate: string) => void;
  compareBarData: Array<Record<string, string | number>>;
  compareRecordByDate: Array<{ examDate: string; record: CambridgeExamRecord }>;
  isMSEComparison: boolean;
  isYLEComparison: boolean;
  partComparisonSections: PartComparisonSection[];
  compareDateColors: string[];
}

export function AnalysisPersonalComparePanels(props: AnalysisPersonalComparePanelsProps): JSX.Element {
  const {
    locale,
    trendData,
    latestRecord,
    latestSkillBars,
    latestSkillDetails,
    dateOptions,
    selectedCompareDates,
    onSelectAllDates,
    onClearDateSelection,
    onToggleCompareDate,
    compareBarData,
    compareRecordByDate,
    isMSEComparison,
    isYLEComparison,
    partComparisonSections,
    compareDateColors,
  } = props;

  function tr(zhText: string, enText: string): string {
    return locale === 'zh' ? zhText : enText;
  }

  return (
    <>
      <div className="mt-8 rounded-2xl border border-slate-200 p-5">
        <h2 className="text-lg font-bold text-slate-900">
          {tr('个人多次考试趋势', 'Personal Multi-Exam Trend')}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {tr(
            '折线展示换算结果与原始总分变化，便于跟踪学习进展。',
            'Line chart shows changes in converted results and raw totals to track learning progress.',
          )}
        </p>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="examDate" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="converted" name={tr('换算结果', 'Converted result')} stroke="#2563eb" strokeWidth={2} />
              <Line type="monotone" dataKey="rawTotal" name={tr('原始总分', 'Raw total')} stroke="#16a34a" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 p-5">
        <h2 className="text-lg font-bold text-slate-900">
          {tr('最近一次分技能对比', 'Latest Skill Comparison')}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {latestRecord && isYLELevel(latestRecord.level)
            ? tr(
                'YLE 显示 Reading & Writing 与 Listening 两个维度。',
                'YLE shows two dimensions: Reading & Writing and Listening.',
              )
            : tr(
                'MSE 显示 Reading、Writing、Listening 三个维度。',
                'MSE shows three dimensions: Reading, Writing, and Listening.',
              )}
        </p>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={latestSkillBars}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="skill" />
              <YAxis
                domain={latestRecord?.convertedResult.mode === 'YLE_SHIELDS' ? [0, 5] : ['auto', 'auto']}
                ticks={
                  latestRecord?.convertedResult.mode === 'YLE_SHIELDS' ? [0, 1, 2, 3, 4, 5] : undefined
                }
                label={
                  latestRecord?.convertedResult.mode === 'YLE_SHIELDS'
                    ? { value: tr('盾数（1-5）', 'Shields (1-5)'), angle: -90, position: 'insideLeft' }
                    : undefined
                }
              />
              <Tooltip />
              <Legend />
              {latestRecord?.convertedResult.mode !== 'YLE_SHIELDS' && (
                <Bar dataKey="raw" name={tr('原始正确数', 'Raw correct count')} fill="#0ea5e9" />
              )}
              <Bar
                dataKey="converted"
                name={
                  latestRecord?.convertedResult.mode === 'YLE_SHIELDS'
                    ? tr('换算结果（盾）', 'Converted result (shields)')
                    : tr('换算结果', 'Converted result')
                }
                fill="#8b5cf6"
              />
              {latestRecord?.convertedResult.mode === 'YLE_SHIELDS' && (
                <>
                  <ReferenceLine
                    y={3}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{ value: tr('标杆 3盾', 'Benchmark 3 shields'), position: 'insideTopRight', fill: '#92400e' }}
                  />
                  <ReferenceLine
                    y={5}
                    stroke="#16a34a"
                    strokeDasharray="4 4"
                    label={{ value: tr('标杆 5盾', 'Benchmark 5 shields'), position: 'insideTopRight', fill: '#14532d' }}
                  />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {latestRecord && (
        <div className="mt-8 rounded-2xl border border-slate-200 p-5">
          <h2 className="text-lg font-bold text-slate-900">
            {tr('最近一次分技能详表', 'Latest Skill Detail Table')}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {tr('考试日期：', 'Exam date: ')}
            {latestRecord.examDate || tr('未知', 'Unknown')}
            {tr('。展示每个分技能的换算分与小题原始正确数。', '. Shows converted score and part-level raw counts for each skill.')}
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold">{tr('技能', 'Skill')}</th>
                  <th className="text-left px-4 py-2.5 font-semibold">{tr('换算分/盾', 'Converted')}</th>
                  <th className="text-left px-4 py-2.5 font-semibold">{tr('原始正确总数', 'Total raw correct')}</th>
                  <th className="text-left px-4 py-2.5 font-semibold">{tr('小题原始正确数', 'Part raw correct')}</th>
                </tr>
              </thead>
              <tbody>
                {latestSkillDetails.map((detail) => (
                  <tr key={`latest-${detail.skill}`} className="border-t border-slate-100">
                    <td className="px-4 py-2.5 text-slate-800">{detail.skill}</td>
                    <td className="px-4 py-2.5 text-slate-700">{detail.converted}</td>
                    <td className="px-4 py-2.5 text-slate-700">{detail.rawTotal}</td>
                    <td className="px-4 py-2.5 text-slate-700">{detail.partDetails}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-slate-200 p-5">
        <h2 className="text-lg font-bold text-slate-900">
          {tr('不同考试日期分技能对比', 'Skill Comparison Across Exam Dates')}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {tr(
            '可自由多选任意考试日期（支持全选），对比分技能换算分与各小题原始正确数。',
            'Select multiple exam dates (including select-all) to compare converted skill scores and part-level raw counts.',
          )}
        </p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onSelectAllDates}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 hover:border-blue-700 hover:text-blue-700"
            >
              {tr('全选日期', 'Select all dates')}
            </button>
            <button
              type="button"
              onClick={onClearDateSelection}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 hover:border-rose-700 hover:text-rose-700"
            >
              {tr('清空选择', 'Clear selection')}
            </button>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {dateOptions.map((examDate) => (
              <label
                key={`chk-${examDate}`}
                className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={selectedCompareDates.includes(examDate)}
                  onChange={() => onToggleCompareDate(examDate)}
                />
                {examDate}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={compareBarData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="skill" />
              <YAxis
                domain={isMSEComparison ? [80, 190] : isYLEComparison ? [0, 5] : ['auto', 'auto']}
                ticks={
                  isMSEComparison
                    ? [80, 100, 120, 130, 140, 150, 160, 170, 180, 190]
                    : isYLEComparison
                      ? [0, 1, 2, 3, 4, 5]
                      : undefined
                }
                label={
                  isYLEComparison ? { value: tr('盾数（1-5）', 'Shields (1-5)'), angle: -90, position: 'insideLeft' } : undefined
                }
              />
              <Tooltip />
              <Legend />
              {compareRecordByDate.map(({ examDate }, index) => (
                <Bar
                  key={`skill-bar-${examDate}`}
                  dataKey={examDate}
                  name={examDate}
                  fill={compareDateColors[index % compareDateColors.length]}
                />
              ))}
              {isMSEComparison && (
                <>
                  <ReferenceLine
                    y={120}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{ value: tr('KET基准 120', 'KET benchmark 120'), position: 'insideTopRight', fill: '#92400e' }}
                  />
                  <ReferenceLine
                    y={150}
                    stroke="#dc2626"
                    strokeDasharray="4 4"
                    label={{ value: tr('PET基准 150', 'PET benchmark 150'), position: 'insideBottomRight', fill: '#7f1d1d' }}
                  />
                </>
              )}
              {isYLEComparison && (
                <>
                  <ReferenceLine
                    y={3}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{ value: tr('标杆 3盾', 'Benchmark 3 shields'), position: 'insideTopRight', fill: '#92400e' }}
                  />
                  <ReferenceLine
                    y={5}
                    stroke="#16a34a"
                    strokeDasharray="4 4"
                    label={{ value: tr('标杆 5盾', 'Benchmark 5 shields'), position: 'insideTopRight', fill: '#14532d' }}
                  />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {partComparisonSections.map((section) => (
          <div key={`part-section-${section.skill}`} className="mt-6 rounded-xl border border-slate-200 p-4">
            <h3 className="text-base font-bold text-slate-900">
              {section.skill} {tr('小题明细对比', 'Part Detail Comparison')}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              {tr(
                '横轴按题段编号 R_P1、R_P2… 排列；纵轴为题段正确率，即（该次考试该题段的原始正确数÷该题段满分×100%）。各题段按对应级别题型的满分动态折算，各柱仍按所选考试日期对比。',
                'The x-axis is ordered by part IDs (R_P1, R_P2, ...); the y-axis is part accuracy = raw correct / part max * 100%. Part max is dynamically determined by level and bars compare selected exam dates.',
              )}
            </p>
            <div className="mt-3 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={section.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="part" />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 20, 40, 60, 80, 100]}
                    allowDecimals={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="4 4" />
                  <ReferenceLine y={70} stroke="#94a3b8" strokeDasharray="3 3" />
                  <Tooltip
                    formatter={(value, name, item) => {
                      const dateKey = String(name);
                      const pct = typeof value === 'number' ? value : Number(value ?? 0);
                      const rawMap = (item as { payload?: { rawByDate?: Record<string, number> } }).payload?.rawByDate;
                      const partMaxMap = (item as { payload?: { partMaxByDate?: Record<string, number> } }).payload
                        ?.partMaxByDate;
                      const raw = rawMap?.[dateKey];
                      const partMax = partMaxMap?.[dateKey];
                      const rawText = raw !== undefined && partMax !== undefined ? `${raw}/${partMax}` : '—';
                      return [
                        tr(`${pct}%（原始 ${rawText}）`, `${pct}% (raw ${rawText})`),
                        dateKey,
                      ];
                    }}
                    labelFormatter={(label) => tr(`题段：${String(label)}`, `Part: ${String(label)}`)}
                  />
                  <Legend />
                  {compareRecordByDate.map(({ examDate }, index) => (
                    <Bar
                      key={`part-bar-${section.skill}-${examDate}`}
                      dataKey={examDate}
                      name={examDate}
                      fill={compareDateColors[index % compareDateColors.length]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
