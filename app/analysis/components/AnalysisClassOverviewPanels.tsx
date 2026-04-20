'use client';

import type { JSX } from 'react';
import {
  CartesianGrid,
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts';
import type { CambridgeExamRecord } from '@/lib/cambridgeEngine';
import type { ClassMacroAnalytics } from '@/lib/classMacroAnalytics';
import type { ClassPartMeanBlock, DistributionByLevelRow } from '@/lib/classCohortPartMeans';
import type { ConvertedTotalDistribution } from '@/lib/convertedTotalDistribution';

export interface ClassPartMeansSectionRow {
  level: string;
  studentCount: number;
  blocks: ClassPartMeanBlock[];
}

export interface AnalysisClassOverviewPanelsProps {
  classMacro: ClassMacroAnalytics;
  selectedLevel: string;
  distributionByLevel: DistributionByLevelRow[];
  distributionSourceRecords: CambridgeExamRecord[];
  convertedTotalDistribution: ConvertedTotalDistribution;
  classPartMeansByContext: ClassPartMeansSectionRow[];
}

export function AnalysisClassOverviewPanels(props: AnalysisClassOverviewPanelsProps): JSX.Element {
  const {
    classMacro,
    selectedLevel,
    distributionByLevel,
    distributionSourceRecords,
    convertedTotalDistribution,
    classPartMeansByContext,
  } = props;

  return (
    <>
      <div className="mt-8 rounded-2xl border border-slate-200 p-5">
        <h2 className="text-lg font-bold text-slate-900">班级宏观分析（分层与进步汇总）</h2>
        <p className="mt-1 text-sm text-slate-600">
          基于当前筛选项（班级、组别、级别、日期范围等）聚合全班样本：左侧为能力分层，右侧为在筛选范围内具备纵向对比条件学生的换算分差分布。
        </p>

        {classMacro.mode === 'EMPTY' && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            当前无可聚合记录。
          </div>
        )}

        {classMacro.mode === 'MIXED' && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {classMacro.notes[0]}
          </div>
        )}

        {(classMacro.mode === 'YLE' || classMacro.mode === 'MSE') && (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs text-slate-500">学生人数（去重）</div>
                <div className="text-xl font-bold text-slate-900">{classMacro.studentCount}</div>
                <div className="mt-1 text-xs text-slate-500">考试记录条数：{classMacro.examRecordCount}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs text-slate-500">最近一次换算总分 · 均值</div>
                <div className="text-xl font-bold text-slate-900">
                  {classMacro.latestTotalMean !== null
                    ? classMacro.mode === 'YLE'
                      ? `${classMacro.latestTotalMean} 盾`
                      : `${classMacro.latestTotalMean} 分`
                    : '—'}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs text-slate-500">最近一次换算总分 · 中位数</div>
                <div className="text-xl font-bold text-slate-900">
                  {classMacro.latestTotalMedian !== null
                    ? classMacro.mode === 'YLE'
                      ? `${classMacro.latestTotalMedian} 盾`
                      : `${classMacro.latestTotalMedian} 分`
                    : '—'}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs text-slate-500">纵向可比学生数</div>
                <div className="text-xl font-bold text-slate-900">
                  {classMacro.progress?.eligibleStudents ?? 0}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  单次考试仅一条：{classMacro.progress?.singleExamStudents ?? 0} 人
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <div className="text-sm font-semibold text-slate-900">能力分层（最近一次）</div>
                <p className="mt-1 text-xs text-slate-500">
                  YLE 按总盾段划分；MSE 按量表总分与常见达标线分段，便于教研对齐干预优先级。
                </p>
                <div className="mt-3 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={classMacro.stratification} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="tier" width={168} tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(value, _name, item) => {
                          const count = typeof value === 'number' ? value : Number(value ?? 0);
                          const pct = (item as { payload?: { percent?: number } }).payload?.percent;
                          return [`${count} 人（占 ${pct ?? '—'}%）`, '人数'];
                        }}
                      />
                      <Legend />
                      <Bar dataKey="count" name="学生人数" fill="#0d9488" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">进步分差分布（筛选范围内）</div>
                <p className="mt-1 text-xs text-slate-500">
                  {classMacro.mode === 'YLE'
                    ? '横轴为总盾分差（末次减首次，整数）；仅统计同一 YLE 口径下至少两条记录的学生。'
                    : '横轴为量表总分分差（末次减首次）；仅统计同一 MSE 口径下至少两条记录的学生。'}
                </p>
                {classMacro.progress && classMacro.progress.eligibleStudents > 0 ? (
                  <div className="mt-3 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={classMacro.progress.deltaHistogram}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="学生人数" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    当前筛选下，尚无学生在同一换算口径内具备至少两次考试记录，暂不绘制分差分布。
                  </div>
                )}
              </div>
            </div>

            {classMacro.progress && classMacro.progress.eligibleStudents > 0 && (
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <div className="text-xs text-emerald-800">提升人数</div>
                  <div className="text-lg font-bold text-emerald-900">{classMacro.progress.improvedCount}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs text-slate-600">持平人数</div>
                  <div className="text-lg font-bold text-slate-900">{classMacro.progress.stableCount}</div>
                </div>
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                  <div className="text-xs text-rose-800">下滑人数</div>
                  <div className="text-lg font-bold text-rose-900">{classMacro.progress.declinedCount}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-xs text-slate-500">平均分差</div>
                  <div className="text-lg font-bold text-slate-900">
                    {classMacro.progress.meanDelta !== null
                      ? `${classMacro.progress.meanDelta >= 0 ? '+' : ''}${classMacro.progress.meanDelta}${
                          classMacro.mode === 'YLE' ? ' 盾' : ' 分'
                        }`
                      : '—'}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-xs text-slate-500">中位分差</div>
                  <div className="text-lg font-bold text-slate-900">
                    {classMacro.progress.medianDelta !== null
                      ? `${classMacro.progress.medianDelta >= 0 ? '+' : ''}${classMacro.progress.medianDelta}${
                          classMacro.mode === 'YLE' ? ' 盾' : ' 分'
                        }`
                      : '—'}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 space-y-1 text-xs text-slate-500">
              {classMacro.notes.map((line, idx) => (
                <p key={`class-macro-note-${idx}`}>{line}</p>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 p-5">
        <h2 className="text-lg font-bold text-slate-900">班级/级别分布图（换算总分）</h2>
        <p className="mt-1 text-sm text-slate-600">
          按考试级别统计：在各级别内对每位学生取其「该级别下最近一次考试」的换算总分并做分布；选择单一级别时与顶部「级别」筛选一致。
        </p>

        {selectedLevel === 'ALL' ? (
          <>
            <p className="mt-2 text-xs text-slate-500">
              当前为「全部级别」，下列按级别分列展示（各级别人数相互独立）。
            </p>
            {distributionByLevel.length === 0 ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                当前筛选下无可用样本。
              </div>
            ) : (
              <div className="mt-4 grid gap-6 lg:grid-cols-2">
                {distributionByLevel.map((row) => (
                  <div key={row.level} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-sm font-semibold text-slate-900">级别：{row.level}</div>
                    <div className="mt-1 text-xs text-slate-600">
                      样本 {row.latestPerStudent.length} 人。{row.distribution.note}
                    </div>
                    {row.distribution.mode === 'MIXED' || row.distribution.mode === 'EMPTY' ? (
                      <div className="mt-3 text-sm text-slate-700">{row.distribution.note}</div>
                    ) : (
                      <div className="mt-3 h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={row.distribution.data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="bucket" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" name="学生人数" fill="#2563eb" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mt-2 text-xs text-slate-500">
              当前级别：{selectedLevel}；统计样本 {distributionSourceRecords.length} 人。
              {convertedTotalDistribution.note}
            </div>
            {convertedTotalDistribution.mode === 'MIXED' || convertedTotalDistribution.mode === 'EMPTY' ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                {convertedTotalDistribution.note}
              </div>
            ) : (
              <div className="mt-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={convertedTotalDistribution.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bucket" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="学生人数" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 p-5">
        <h2 className="text-lg font-bold text-slate-900">班级题段均分（最近一次）</h2>
        <p className="mt-1 text-sm text-slate-600">
          在当前筛选与级别口径下，对每位学生取该级别「最近一次」试卷，将各题段原始分在全班求平均并按该题段满分折算为正确率（%）。
          柱形越低表示该题段班级层面相对越薄弱，橙色虚线对应 60% 正确率基准。
        </p>
        {classPartMeansByContext.every((section) => section.blocks.length === 0) ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            当前条件下暂无题段聚合数据（例如该级别下无学生记录）。
          </div>
        ) : (
          classPartMeansByContext.map((section, idx) => (
            <div
              key={section.level}
              className={idx === 0 ? 'mt-4' : 'mt-8 border-t border-slate-200 pt-6'}
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-sm font-semibold text-slate-900">级别：{section.level}</span>
                <span className="text-xs text-slate-500">
                  （{section.studentCount} 人，每人取该级别最近一次考试）
                </span>
              </div>
              <div className="mt-3 grid gap-6 lg:grid-cols-2">
                {section.blocks.map((block) => (
                  <div
                    key={`${section.level}-${block.skillKey}`}
                    className="rounded-xl border border-slate-200 bg-white p-3"
                  >
                    <div className="text-xs font-semibold text-slate-900">{block.title}</div>
                    <div className="mt-2 h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={block.data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="part" tick={{ fontSize: 10 }} interval={0} angle={-22} textAnchor="end" height={52} />
                          <YAxis domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} allowDecimals={false} />
                          <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="4 4" />
                          <Tooltip
                            formatter={(value, _name, item) => {
                              const raw = (item as { payload?: { meanRaw?: number } }).payload?.meanRaw;
                              const partMax = (item as { payload?: { partMax?: number } }).payload?.partMax;
                              const pct = (item as { payload?: { meanPercent?: number } }).payload?.meanPercent;
                              return [`${pct ?? value}%（班均原始 ${raw ?? '—'}/${partMax ?? '—'}）`, '班均正确率'];
                            }}
                          />
                          <Legend />
                          <Bar dataKey="meanPercent" name="班均正确率（%）" fill="#0369a1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">橙色虚线：60% 正确率基准。</p>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
