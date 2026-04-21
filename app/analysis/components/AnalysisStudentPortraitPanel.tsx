'use client';

import type { RefObject } from 'react';
import type { JSX } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AnalysisStudentProfileData } from '@/app/analysis/analysisTypes';
import {
  formatConvertedSkillValue,
  formatConvertedTotal,
} from '@/lib/analysisPageUtils';

export interface AnalysisStudentPortraitPanelProps {
  locale: 'zh' | 'en';
  selectedStudent: string;
  studentProfile: AnalysisStudentProfileData | null;
  portraitExporting: boolean;
  studentPortraitExportRef: RefObject<HTMLDivElement | null>;
  onPrint: () => void;
  onExportPng: () => void;
}

export function AnalysisStudentPortraitPanel(props: AnalysisStudentPortraitPanelProps): JSX.Element {
  const {
    locale,
    selectedStudent,
    studentProfile,
    portraitExporting,
    studentPortraitExportRef,
    onPrint,
    onExportPng,
  } = props;

  function tr(zhText: string, enText: string): string {
    return locale === 'zh' ? zhText : enText;
  }

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {tr('学生画像卡（最近一次考试）', 'Student Portrait Card (Latest Exam)')}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {tr(
              '仅在选择具体学生后展示。用于快速定位总水平、技能结构与薄弱小题。导出：PNG 为整卡截图；打印为 PDF 请在打印对话框中选择「存储为 PDF」。',
              'Shown only after selecting a specific student. It helps quickly locate overall level, skill structure, and weak parts. Export: PNG captures the whole card; for PDF, choose "Save as PDF" in the print dialog.',
            )}
          </p>
        </div>
        {studentProfile ? (
          <div className="no-print flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={onPrint}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-slate-500"
            >
              {tr('打印为 PDF', 'Print as PDF')}
            </button>
            <button
              type="button"
              disabled={portraitExporting}
              onClick={() => {
                void onExportPng();
              }}
              className="rounded-lg border border-blue-700 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-900 hover:bg-blue-100 disabled:opacity-60"
            >
              {portraitExporting ? tr('正在导出…', 'Exporting...') : tr('导出 PNG', 'Export PNG')}
            </button>
          </div>
        ) : null}
      </div>

      {selectedStudent === 'ALL' ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          {tr(
            '请先在筛选区选择“某一位学生”，系统将自动生成该学生的最近一次考试画像。',
            'Please select a specific student in filters first. The system will generate the latest exam portrait automatically.',
          )}
        </div>
      ) : !studentProfile ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          {tr(
            '当前筛选条件下未找到该学生的可用记录，请调整筛选条件后重试。',
            'No available records found for this student under current filters. Please adjust filters and retry.',
          )}
        </div>
      ) : (
        <div
          id="student-portrait-export-root"
          ref={studentPortraitExportRef}
          className="mt-4 grid gap-4 bg-white lg:grid-cols-3 print:bg-white"
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">{studentProfile.record.name}</div>
            <div className="mt-1 text-xs text-slate-500">
              {tr('级别：', 'Level: ')}
              {studentProfile.record.level}
              {studentProfile.record.className
                ? `${tr('｜班级：', ' | Class: ')}${studentProfile.record.className}`
                : ''}
              {studentProfile.record.setName ? `${tr('｜组别：', ' | Set: ')}${studentProfile.record.setName}` : ''}
            </div>
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs text-slate-500">{tr('最近一次考试日期', 'Latest exam date')}</div>
              <div className="text-base font-bold text-slate-900">
                {studentProfile.record.examDate || tr('未知', 'Unknown')}
              </div>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-xs text-slate-500">{tr('换算总分', 'Converted total')}</div>
                <div className="text-base font-bold text-slate-900">
                  {formatConvertedTotal(studentProfile.record, locale)}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-xs text-slate-500">{tr('原始总分', 'Raw total')}</div>
                <div className="text-base font-bold text-slate-900">
                  {studentProfile.record.rawTotal} / {studentProfile.record.maxTotal}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-2">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="text-sm font-semibold text-slate-900">{tr('分技能结构', 'Skill Structure')}</div>
              <div className="text-xs text-slate-500">
                {studentProfile.record.convertedResult.mode === 'YLE_SHIELDS'
                  ? tr('YLE：R&W 与 Listening', 'YLE: R&W and Listening')
                  : studentProfile.record.level === 'FCE' &&
                      studentProfile.record.convertedResult.mode === 'MSE_SCALE' &&
                      studentProfile.record.convertedResult.useOfEnglishScale !== undefined
                    ? tr(
                        'FCE：Reading、Use of English、Writing、Listening',
                        'FCE: Reading, Use of English, Writing, Listening',
                      )
                    : tr('MSE：Reading、Writing、Listening', 'MSE: Reading, Writing, Listening')}
              </div>
            </div>

            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-semibold text-slate-900">{tr('技能雷达图', 'Skill Radar')}</div>
                <div className="mt-2 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    {studentProfile.record.convertedResult.mode === 'YLE_SHIELDS' ? (
                      <BarChart data={studentProfile.radarData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} />
                        <YAxis type="category" dataKey="skill" width={80} />
                        <Tooltip
                          formatter={(value) => [value, tr('盾数（1-5）', 'Shields (1-5)')]}
                          labelFormatter={(label) => tr(`技能：${String(label)}`, `Skill: ${String(label)}`)}
                        />
                        <Legend />
                        <Bar dataKey="converted" name={tr('盾数（1-5）', 'Shields (1-5)')} fill="#2563eb" />
                        <ReferenceLine
                          x={3}
                          stroke="#f59e0b"
                          strokeDasharray="4 4"
                          label={{ value: tr('标杆 3盾', 'Benchmark 3 shields'), position: 'insideTopRight', fill: '#92400e' }}
                        />
                        <ReferenceLine
                          x={5}
                          stroke="#16a34a"
                          strokeDasharray="4 4"
                          label={{ value: tr('标杆 5盾', 'Benchmark 5 shields'), position: 'insideTopRight', fill: '#14532d' }}
                        />
                      </BarChart>
                    ) : (
                      <RadarChart data={studentProfile.radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="skill" />
                        <PolarRadiusAxis domain={[80, 190]} tickCount={6} />
                        <Tooltip
                          formatter={(value) => [value, tr('换算结果', 'Converted result')]}
                          labelFormatter={(label) => tr(`技能：${String(label)}`, `Skill: ${String(label)}`)}
                        />
                        <Radar
                          name={tr('换算结果', 'Converted result')}
                          dataKey="converted"
                          stroke="#2563eb"
                          fill="#2563eb"
                          fillOpacity={0.3}
                        />
                      </RadarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-semibold text-slate-900">{tr('技能与小题概览', 'Skill & Part Overview')}</div>
                <div className="mt-2 grid gap-3">
                  {studentProfile.details.map((detail) => (
                    <div key={`profile-skill-${detail.skill}`}>
                      <div className="text-xs font-semibold text-slate-900">{detail.skill}</div>
                      <div className="mt-1 text-sm text-slate-700">
                        {tr('换算：', 'Converted: ')}
                        {formatConvertedSkillValue(studentProfile.record, detail, locale)}
                      </div>
                      <div className="mt-1 text-sm text-slate-700">
                        {tr('原始：', 'Raw: ')}
                        {detail.rawTotal}
                      </div>
                      <div className="mt-1 text-xs text-slate-600 break-words">
                        {tr('小题：', 'Parts: ')}
                        {detail.partDetails || '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-xs font-semibold text-slate-900">{tr('薄弱技能（按换算分）', 'Weak Skills (by converted score)')}</div>
                <div className="mt-1 text-sm text-slate-700">
                  {studentProfile.weakSkills.length === 0
                    ? '—'
                    : studentProfile.weakSkills.map((item) => `${item.skill}：${item.converted}`).join('；')}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {tr(
                    '口径：YLE 盾数 ≤2 判薄弱；KET/PET/FCE 分技能正确率 <60% 判薄弱。',
                    'Rule: YLE shields <= 2 are weak; for KET/PET/FCE, skill accuracy <60% is weak.',
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-xs font-semibold text-slate-900">{tr('薄弱小题（题段正确率）', 'Weak Parts (part accuracy)')}</div>
                <div className="mt-1 text-sm text-slate-700">
                  {studentProfile.partThresholds.weakBySkill.length === 0
                    ? '—'
                    : studentProfile.partThresholds.weakBySkill
                        .map((group) =>
                          `${group.skill}：${group.parts
                            .map((entry) => `${entry.part}（${entry.value}）`)
                            .join('、')}`,
                        )
                        .join('；')}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {tr(
                    '口径：按各题段满分折算，正确率 <60% 判为薄弱小题；与 MSE 分技能阈值对齐。',
                    'Rule: convert by each part max; parts with accuracy <60% are weak, aligned with MSE skill threshold logic.',
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-semibold text-slate-900">{tr('需关注技能（区间提示）', 'Attention Skills (range alert)')}</div>
                <div className="mt-1 text-sm text-slate-700">
                  {studentProfile.attentionSkills.length === 0
                    ? '—'
                    : studentProfile.attentionSkills.map((item) => `${item.skill}：${item.converted}`).join('；')}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {tr(
                    '口径：YLE 盾数=3；KET/PET/FCE 分技能正确率 60–70%。',
                    'Rule: YLE shields = 3; for KET/PET/FCE, skill accuracy in 60-70%.',
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-semibold text-slate-900">{tr('需关注小题（题段正确率）', 'Attention Parts (part accuracy)')}</div>
                <div className="mt-1 text-sm text-slate-700">
                  {studentProfile.partThresholds.attentionBySkill.length === 0
                    ? '—'
                    : studentProfile.partThresholds.attentionBySkill
                        .map((group) =>
                          `${group.skill}：${group.parts
                            .map((entry) => `${entry.part}（${entry.value}）`)
                            .join('、')}`,
                        )
                        .join('；')}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {tr(
                    '口径：按各题段满分折算，正确率处于 60%–70% 区间。',
                    'Rule: based on each part max, attention range is 60%-70% accuracy.',
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div className="text-sm font-semibold text-slate-900">
                  {tr('进步指标（首次 vs 最近一次）', 'Progress Metrics (First vs Latest)')}
                </div>
                <div className="text-xs text-slate-500">
                  {tr('口径：', 'Scale: ')}
                  {studentProfile.record.convertedResult.mode === 'YLE_SHIELDS' ? tr('YLE（盾）', 'YLE (shields)') : 'MSE (Scale)'}
                </div>
              </div>
              {!studentProfile.progress ? (
                <div className="mt-2 text-sm text-slate-700">
                  {tr(
                    '当前可用于计算进步指标的记录不足（至少需要 1 条同口径记录）。',
                    'Insufficient records to compute progress metrics (at least 1 record under the same scale is required).',
                  )}
                </div>
              ) : (
                <>
                  {studentProfile.progress.note && (
                    <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                      {studentProfile.progress.note}
                    </div>
                  )}
                  <div className="mt-3 grid gap-3 md:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-xs text-slate-500">{tr('样本次数', 'Record count')}</div>
                      <div className="text-base font-bold text-slate-900">{studentProfile.progress.recordCount}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-xs text-slate-500">{tr('首次日期', 'First date')}</div>
                      <div className="text-base font-bold text-slate-900">{studentProfile.progress.firstDate}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-xs text-slate-500">{tr('最近日期', 'Latest date')}</div>
                      <div className="text-base font-bold text-slate-900">{studentProfile.progress.latestDate}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-xs text-slate-500">{tr('总提升', 'Total delta')}</div>
                      <div className="text-base font-bold text-slate-900">
                        {studentProfile.progress.deltaConverted >= 0 ? '+' : ''}
                        {studentProfile.progress.deltaConverted.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="text-xs text-slate-500">{tr('首次换算总分', 'First converted total')}</div>
                      <div className="text-base font-bold text-slate-900">
                        {studentProfile.progress.firstConverted.toFixed(1)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="text-xs text-slate-500">{tr('最近换算总分', 'Latest converted total')}</div>
                      <div className="text-base font-bold text-slate-900">
                        {studentProfile.progress.latestConverted.toFixed(1)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="text-xs text-slate-500">{tr('稳定性（标准差）', 'Stability (std dev)')}</div>
                      <div className="text-base font-bold text-slate-900">
                        {studentProfile.progress.stdDevConverted.toFixed(2)}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {tr('数值越低，表示总分波动越小。', 'Lower value indicates smaller total-score fluctuation.')}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-slate-700">
                    {tr('平均每次提升：', 'Average delta per exam: ')}
                    {studentProfile.progress.averageDeltaPerExam >= 0 ? '+' : ''}
                    {studentProfile.progress.averageDeltaPerExam.toFixed(2)}
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">{tr('针对性提升建议', 'Targeted Improvement Suggestion')}</div>
              <p className="mt-2 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {studentProfile.suggestion}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
