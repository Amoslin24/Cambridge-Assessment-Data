'use client';

import type { JSX } from 'react';
import type { ParseIssue } from '@/lib/cambridgeEngine';

export interface ImportIssuesSectionProps {
  locale: 'zh' | 'en';
  issues: ParseIssue[];
  filteredIssues: ParseIssue[];
  activeIssueFilterLabel: string;
  showOnlyIssues: boolean;
  onCopyIssues: () => void;
  onExportFilteredIssues: () => void;
}

export function ImportIssuesSection(props: ImportIssuesSectionProps): JSX.Element {
  const {
    locale,
    issues,
    filteredIssues,
    activeIssueFilterLabel,
    showOnlyIssues,
    onCopyIssues,
    onExportFilteredIssues,
  } = props;

  return (
    <>
      {issues.length > 0 && (
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-amber-900">
              {locale === 'zh' ? '解析异常' : 'Parse issues'}
            </h2>
            <button
              type="button"
              onClick={onCopyIssues}
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-amber-400 bg-white text-amber-800 text-xs font-semibold hover:border-amber-600"
            >
              {locale === 'zh' ? '复制全部异常' : 'Copy all issues'}
            </button>
            <button
              type="button"
              onClick={onExportFilteredIssues}
              disabled={filteredIssues.length === 0}
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-amber-400 bg-white text-amber-800 text-xs font-semibold hover:border-amber-600 disabled:opacity-60"
            >
              {locale === 'zh' ? '导出当前筛选异常 CSV' : 'Export filtered issues CSV'}
            </button>
          </div>
          {activeIssueFilterLabel !== (locale === 'zh' ? '全部异常' : 'All issues') && (
            <p className="mt-2 text-xs text-amber-800">
              {locale === 'zh' ? '当前筛选' : 'Current filter'}：{activeIssueFilterLabel}（{filteredIssues.length}/
              {issues.length}）
            </p>
          )}
          <ul className="mt-3 text-sm text-amber-800 space-y-2">
            {filteredIssues.slice(0, 10).map((issue) => (
              <li key={`${issue.rowNumber}-${issue.message}`}>
                {locale === 'zh' ? `第 ${issue.rowNumber} 行：` : `Row ${issue.rowNumber}: `}
                {issue.message}
              </li>
            ))}
          </ul>
          {filteredIssues.length === 0 && (
            <p className="mt-3 text-sm text-amber-800">
              {locale === 'zh' ? '当前筛选项下暂无异常。' : 'No issues under current filter.'}
            </p>
          )}
        </div>
      )}

      {showOnlyIssues && issues.length === 0 && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-600">
          {locale === 'zh'
            ? '当前没有解析异常行，已无可展示的异常数据。'
            : 'No parse issues currently.'}
        </div>
      )}
    </>
  );
}
