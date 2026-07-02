'use client';

import { useState, type JSX } from 'react';
import type { CambridgeExamRecord } from '@/lib/cambridgeEngine';
import {
  getSkillRawScores,
  isYLELevel,
  renderConvertedResult,
  renderSkillConvertedBreakdown,
} from '@/lib/importPageUtils';

export interface ImportRecordsPreviewProps {
  locale: 'zh' | 'en';
  showOnlyIssues: boolean;
  filteredRecords: CambridgeExamRecord[];
  recordsCount: number;
  levelCountText: string;
}

export function ImportRecordsPreview(props: ImportRecordsPreviewProps): JSX.Element {
  const { locale, showOnlyIssues, filteredRecords, recordsCount, levelCountText } = props;
  const [visibleLimit, setVisibleLimit] = useState<number>(20);

  return (
    <>
      {!showOnlyIssues && filteredRecords.length > 0 && (
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="text-lg font-bold text-emerald-900">
            {locale === 'zh' ? '换算核对面板' : 'Conversion verification panel'}
          </h2>
          <p className="mt-2 text-sm text-emerald-800">
            {locale === 'zh'
              ? `当前批次分布：${levelCountText}。以下为筛选结果按当前顺序的前 8 条样本，请对照原始换算表核对。`
              : `Current batch distribution: ${levelCountText}. The first 8 filtered records are shown for verification against official conversion tables.`}
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-emerald-100 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-emerald-100/60 text-emerald-900">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold">{locale === 'zh' ? '姓名' : 'Name'}</th>
                  <th className="text-left px-4 py-2.5 font-semibold">{locale === 'zh' ? '级别' : 'Level'}</th>
                  <th className="text-left px-4 py-2.5 font-semibold">
                    {locale === 'zh' ? '技能原始正确数' : 'Skill raw scores'}
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold">
                    {locale === 'zh' ? '分技能换算' : 'Converted by skill'}
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold">
                    {locale === 'zh' ? '最终结果' : 'Final result'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.slice(0, 8).map((record) => {
                  const { readingRaw, writingRaw, listeningRaw } = getSkillRawScores(record);
                  const yLevel = isYLELevel(record.level);
                  return (
                    <tr key={`verify-${record.id}`} className="border-t border-emerald-100">
                      <td className="px-4 py-2.5 text-slate-800">{record.name}</td>
                      <td className="px-4 py-2.5 text-slate-600">{record.level}</td>
                      <td className="px-4 py-2.5 text-slate-700">
                        {yLevel
                          ? `R&W: ${readingRaw} / L: ${listeningRaw}`
                          : `R: ${readingRaw} / W: ${writingRaw} / L: ${listeningRaw}`}
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">{renderSkillConvertedBreakdown(record)}</td>
                      <td className="px-4 py-2.5 text-slate-900 font-semibold">
                        {renderConvertedResult(record)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!showOnlyIssues && filteredRecords.length > 0 && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
            <h2 className="font-bold text-slate-900">{locale === 'zh' ? '成绩记录' : 'Score records'}</h2>
            <p className="text-xs text-slate-500">
              {locale === 'zh'
                ? `当前显示 ${Math.min(visibleLimit, filteredRecords.length)} / ${filteredRecords.length} 条`
                : `Showing ${Math.min(visibleLimit, filteredRecords.length)} of ${filteredRecords.length}`}
            </p>
          </div>
          <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                  <th className="text-left px-4 py-3 font-semibold">{locale === 'zh' ? '姓名' : 'Name'}</th>
                  <th className="text-left px-4 py-3 font-semibold">{locale === 'zh' ? '班级' : 'Class'}</th>
                  <th className="text-left px-4 py-3 font-semibold">{locale === 'zh' ? '组别' : 'Set'}</th>
                  <th className="text-left px-4 py-3 font-semibold">{locale === 'zh' ? '级别' : 'Level'}</th>
                  <th className="text-left px-4 py-3 font-semibold">{locale === 'zh' ? 'R/RW原始' : 'R/RW raw'}</th>
                  <th className="text-left px-4 py-3 font-semibold">
                    {locale === 'zh' ? 'W原始（仅MSE）' : 'W raw (MSE only)'}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold">{locale === 'zh' ? 'L原始' : 'L raw'}</th>
                  <th className="text-left px-4 py-3 font-semibold">{locale === 'zh' ? '原始总分' : 'Raw total'}</th>
                  <th className="text-left px-4 py-3 font-semibold">{locale === 'zh' ? '正确率' : 'Accuracy'}</th>
                  <th className="text-left px-4 py-3 font-semibold">
                    {locale === 'zh' ? '分技能换算' : 'Converted by skill'}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold">{locale === 'zh' ? '换算结果' : 'Converted result'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.slice(0, visibleLimit).map((record) => {
                const { readingRaw, writingRaw, listeningRaw } = getSkillRawScores(record);
                const yLevel = isYLELevel(record.level);
                return (
                  <tr key={record.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-800">{record.name}</td>
                    <td className="px-4 py-3 text-slate-600">{record.className || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{record.setName || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{record.level}</td>
                    <td className="px-4 py-3 text-slate-600">{readingRaw}</td>
                    <td className="px-4 py-3 text-slate-600">{yLevel ? '-' : writingRaw}</td>
                    <td className="px-4 py-3 text-slate-600">{listeningRaw}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {record.rawTotal} / {record.maxTotal}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{(record.accuracyRate * 100).toFixed(1)}%</td>
                    <td className="px-4 py-3 text-slate-700">{renderSkillConvertedBreakdown(record)}</td>
                    <td className="px-4 py-3 text-slate-900 font-semibold">{renderConvertedResult(record)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          {visibleLimit < filteredRecords.length && (
            <div className="border-t border-slate-200 p-3 text-center">
              <button
                type="button"
                onClick={() => setVisibleLimit((current) => Math.min(current + 20, filteredRecords.length))}
                className="rounded-lg px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {locale === 'zh' ? '再显示 20 条' : 'Show 20 more'}
              </button>
            </div>
          )}
        </div>
      )}

      {!showOnlyIssues && recordsCount > 0 && filteredRecords.length === 0 && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-600">
          {locale === 'zh'
            ? '当前筛选条件下没有匹配记录，请调整筛选后重试。'
            : 'No matched records under current filters. Please adjust filters and retry.'}
        </div>
      )}
    </>
  );
}
