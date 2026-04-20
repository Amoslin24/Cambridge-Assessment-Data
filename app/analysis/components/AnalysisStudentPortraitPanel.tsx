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
  selectedStudent: string;
  studentProfile: AnalysisStudentProfileData | null;
  portraitExporting: boolean;
  studentPortraitExportRef: RefObject<HTMLDivElement | null>;
  onPrint: () => void;
  onExportPng: () => void;
}

export function AnalysisStudentPortraitPanel(props: AnalysisStudentPortraitPanelProps): JSX.Element {
  const {
    selectedStudent,
    studentProfile,
    portraitExporting,
    studentPortraitExportRef,
    onPrint,
    onExportPng,
  } = props;

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">学生画像卡（最近一次考试）</h2>
          <p className="mt-1 text-sm text-slate-600">
            仅在选择具体学生后展示。用于快速定位总水平、技能结构与薄弱小题。导出：PNG
            为整卡截图；打印为 PDF 请在打印对话框中选择「存储为 PDF」。
          </p>
        </div>
        {studentProfile ? (
          <div className="no-print flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={onPrint}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-slate-500"
            >
              打印为 PDF
            </button>
            <button
              type="button"
              disabled={portraitExporting}
              onClick={() => {
                void onExportPng();
              }}
              className="rounded-lg border border-blue-700 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-900 hover:bg-blue-100 disabled:opacity-60"
            >
              {portraitExporting ? '正在导出…' : '导出 PNG'}
            </button>
          </div>
        ) : null}
      </div>

      {selectedStudent === 'ALL' ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          请先在筛选区选择“某一位学生”，系统将自动生成该学生的最近一次考试画像。
        </div>
      ) : !studentProfile ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          当前筛选条件下未找到该学生的可用记录，请调整筛选条件后重试。
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
              级别：{studentProfile.record.level}
              {studentProfile.record.className ? `｜班级：${studentProfile.record.className}` : ''}
              {studentProfile.record.setName ? `｜组别：${studentProfile.record.setName}` : ''}
            </div>
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs text-slate-500">最近一次考试日期</div>
              <div className="text-base font-bold text-slate-900">
                {studentProfile.record.examDate || '未知'}
              </div>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-xs text-slate-500">换算总分</div>
                <div className="text-base font-bold text-slate-900">
                  {formatConvertedTotal(studentProfile.record)}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-xs text-slate-500">原始总分</div>
                <div className="text-base font-bold text-slate-900">
                  {studentProfile.record.rawTotal} / {studentProfile.record.maxTotal}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-2">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="text-sm font-semibold text-slate-900">分技能结构</div>
              <div className="text-xs text-slate-500">
                {studentProfile.record.convertedResult.mode === 'YLE_SHIELDS'
                  ? 'YLE：R&W 与 Listening'
                  : 'MSE：Reading、Writing、Listening'}
              </div>
            </div>

            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-semibold text-slate-900">技能雷达图</div>
                <div className="mt-2 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    {studentProfile.record.convertedResult.mode === 'YLE_SHIELDS' ? (
                      <BarChart data={studentProfile.radarData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} />
                        <YAxis type="category" dataKey="skill" width={80} />
                        <Tooltip />
                        <Legend />
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
                      <RadarChart data={studentProfile.radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="skill" />
                        <PolarRadiusAxis domain={[80, 190]} tickCount={6} />
                        <Tooltip />
                        <Radar
                          name="换算结果"
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
                <div className="text-xs font-semibold text-slate-900">技能与小题概览</div>
                <div className="mt-2 grid gap-3">
                  {studentProfile.details.map((detail) => (
                    <div key={`profile-skill-${detail.skill}`}>
                      <div className="text-xs font-semibold text-slate-900">{detail.skill}</div>
                      <div className="mt-1 text-sm text-slate-700">
                        换算：{formatConvertedSkillValue(studentProfile.record, detail)}
                      </div>
                      <div className="mt-1 text-sm text-slate-700">原始：{detail.rawTotal}</div>
                      <div className="mt-1 text-xs text-slate-600 break-words">
                        小题：{detail.partDetails || '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-xs font-semibold text-slate-900">薄弱技能（按换算分）</div>
                <div className="mt-1 text-sm text-slate-700">
                  {studentProfile.weakSkills.length === 0
                    ? '—'
                    : studentProfile.weakSkills.map((item) => `${item.skill}：${item.converted}`).join('；')}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  口径：YLE 盾数 ≤2 判薄弱；KET/PET/FCE 分技能正确率 {'<'}60% 判薄弱。
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-xs font-semibold text-slate-900">薄弱小题（题段正确率）</div>
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
                  口径：按各题段满分折算，正确率 {'<'}60% 判为薄弱小题；与 MSE 分技能阈值对齐。
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-semibold text-slate-900">需关注技能（区间提示）</div>
                <div className="mt-1 text-sm text-slate-700">
                  {studentProfile.attentionSkills.length === 0
                    ? '—'
                    : studentProfile.attentionSkills.map((item) => `${item.skill}：${item.converted}`).join('；')}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  口径：YLE 盾数=3；KET/PET/FCE 分技能正确率 60–70%。
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-semibold text-slate-900">需关注小题（题段正确率）</div>
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
                  口径：按各题段满分折算，正确率处于 60%–70% 区间。
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div className="text-sm font-semibold text-slate-900">进步指标（首次 vs 最近一次）</div>
                <div className="text-xs text-slate-500">
                  口径：{studentProfile.record.convertedResult.mode === 'YLE_SHIELDS' ? 'YLE（盾）' : 'MSE（Scale）'}
                </div>
              </div>
              {!studentProfile.progress ? (
                <div className="mt-2 text-sm text-slate-700">
                  当前可用于计算进步指标的记录不足（至少需要 1 条同口径记录）。
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
                      <div className="text-xs text-slate-500">样本次数</div>
                      <div className="text-base font-bold text-slate-900">{studentProfile.progress.recordCount}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-xs text-slate-500">首次日期</div>
                      <div className="text-base font-bold text-slate-900">{studentProfile.progress.firstDate}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-xs text-slate-500">最近日期</div>
                      <div className="text-base font-bold text-slate-900">{studentProfile.progress.latestDate}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-xs text-slate-500">总提升</div>
                      <div className="text-base font-bold text-slate-900">
                        {studentProfile.progress.deltaConverted >= 0 ? '+' : ''}
                        {studentProfile.progress.deltaConverted.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="text-xs text-slate-500">首次换算总分</div>
                      <div className="text-base font-bold text-slate-900">
                        {studentProfile.progress.firstConverted.toFixed(1)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="text-xs text-slate-500">最近换算总分</div>
                      <div className="text-base font-bold text-slate-900">
                        {studentProfile.progress.latestConverted.toFixed(1)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="text-xs text-slate-500">稳定性（标准差）</div>
                      <div className="text-base font-bold text-slate-900">
                        {studentProfile.progress.stdDevConverted.toFixed(2)}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">数值越低，表示总分波动越小。</div>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-slate-700">
                    平均每次提升：{studentProfile.progress.averageDeltaPerExam >= 0 ? '+' : ''}
                    {studentProfile.progress.averageDeltaPerExam.toFixed(2)}
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">针对性提升建议</div>
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
