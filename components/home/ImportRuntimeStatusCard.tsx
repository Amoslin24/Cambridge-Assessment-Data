'use client';

import type { JSX } from 'react';

export interface ImportRuntimeStatusCardProps {
  locale: 'zh' | 'en';
  fileName: string;
  recordsCount: number;
  issuesCount: number;
  filteredIssuesCount: number;
  hasActiveIssueFilter: boolean;
}

export function ImportRuntimeStatusCard(props: ImportRuntimeStatusCardProps): JSX.Element {
  const { locale, fileName, recordsCount, issuesCount, filteredIssuesCount, hasActiveIssueFilter } = props;

  const checks = [
    {
      label: locale === 'zh' ? '已导入数据' : 'Data imported',
      ok: recordsCount > 0,
      hint:
        recordsCount > 0
          ? locale === 'zh'
            ? `当前记录 ${recordsCount} 条`
            : `${recordsCount} records loaded`
          : locale === 'zh'
            ? '请先上传 CSV/XLSX 文件'
            : 'Upload CSV/XLSX first',
    },
    {
      label: locale === 'zh' ? '解析异常可追踪' : 'Issues traceable',
      ok: issuesCount >= 0,
      hint:
        issuesCount > 0
          ? locale === 'zh'
            ? `异常 ${issuesCount} 条，可筛选/导出`
            : `${issuesCount} issues, filter/export available`
          : locale === 'zh'
            ? '当前无异常'
            : 'No issues currently',
    },
    {
      label: locale === 'zh' ? '导出可用' : 'Export ready',
      ok: recordsCount > 0 || issuesCount > 0,
      hint:
        recordsCount > 0 || issuesCount > 0
          ? locale === 'zh'
            ? '可导出解析结果或异常 CSV'
            : 'Parsed/issue CSV export available'
          : locale === 'zh'
            ? '导入后可启用导出'
            : 'Export enabled after import',
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            {locale === 'zh' ? '运行状态与快速自检' : 'Runtime status & quick self-check'}
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            {locale === 'zh'
              ? '推荐固定端口启动：npm run dev:local（127.0.0.1:3207）'
              : 'Recommended fixed-port startup: npm run dev:local (127.0.0.1:3207)'}
          </p>
        </div>
        <div className="text-xs text-slate-600">
          {locale === 'zh' ? '当前文件：' : 'Current file: '}
          <span className="font-medium text-slate-800">{fileName || (locale === 'zh' ? '未导入' : 'None')}</span>
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {checks.map((item) => (
          <div key={item.label} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <div className="flex items-center gap-2 text-sm">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${
                  item.ok ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span className="font-semibold text-slate-900">{item.label}</span>
            </div>
            <p className="mt-1 text-xs text-slate-600">{item.hint}</p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-600">
        {hasActiveIssueFilter
          ? locale === 'zh'
            ? `当前异常筛选命中 ${filteredIssuesCount}/${issuesCount} 条。`
            : `Issue filter matched ${filteredIssuesCount}/${issuesCount}.`
          : locale === 'zh'
            ? '当前未启用异常筛选。'
            : 'No issue filter is currently active.'}
      </p>
    </div>
  );
}
