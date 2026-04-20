'use client';

import type { JSX } from 'react';
import type { IssueFilterKey } from '@/lib/importIssueUtils';

interface IssueMetricItem {
  key: IssueFilterKey;
  label: string;
  count: number;
}

export interface ImportIssueSummaryCardProps {
  locale: 'zh' | 'en';
  overLimitReadingCount: number;
  overLimitListeningCount: number;
  overLimitWritingCount: number;
  nonNumericCount: number;
  negativeCount: number;
  affectedRowCount: number;
  issueDeltaText: string;
  activeFilter: IssueFilterKey;
  onSelectFilter: (filter: IssueFilterKey) => void;
}

export function ImportIssueSummaryCard(props: ImportIssueSummaryCardProps): JSX.Element {
  const {
    locale,
    overLimitReadingCount,
    overLimitListeningCount,
    overLimitWritingCount,
    nonNumericCount,
    negativeCount,
    affectedRowCount,
    issueDeltaText,
    activeFilter,
    onSelectFilter,
  } = props;

  const metrics: IssueMetricItem[] = [
    { key: 'OVER_LIMIT_R', label: locale === 'zh' ? '阅读超上限' : 'Reading over limit', count: overLimitReadingCount },
    { key: 'OVER_LIMIT_L', label: locale === 'zh' ? '听力超上限' : 'Listening over limit', count: overLimitListeningCount },
    { key: 'OVER_LIMIT_W', label: locale === 'zh' ? '写作超上限' : 'Writing over limit', count: overLimitWritingCount },
    { key: 'NON_NUMERIC', label: locale === 'zh' ? '非数字分值' : 'Non-numeric', count: nonNumericCount },
    { key: 'NEGATIVE', label: locale === 'zh' ? '负数分值' : 'Negative values', count: negativeCount },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold text-slate-900">
          {locale === 'zh' ? '导入异常摘要' : 'Import issue summary'}
        </h2>
        <div className="text-right">
          <div className="text-xs text-slate-600">
            {locale === 'zh' ? '受影响行数' : 'Affected rows'}：{affectedRowCount}
          </div>
          <div className="text-xs text-slate-600">
            {locale === 'zh' ? '较上次导入' : 'Since last import'}：{issueDeltaText}
          </div>
        </div>
      </div>
      <p className="mt-1 text-xs text-slate-600">
        {locale === 'zh'
          ? '点击下方指标可联动筛选“解析异常”列表。'
          : 'Click a metric below to filter the issue list.'}
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <button
          type="button"
          onClick={() => onSelectFilter('ALL')}
          className={`rounded-lg border px-3 py-2 text-left text-sm ${
            activeFilter === 'ALL'
              ? 'border-blue-600 bg-blue-50 text-blue-900'
              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
          }`}
        >
          {locale === 'zh' ? '全部异常' : 'All issues'}
        </button>
        {metrics.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelectFilter(item.key)}
            className={`rounded-lg border px-3 py-2 text-left text-sm ${
              activeFilter === item.key
                ? 'border-blue-600 bg-blue-50 text-blue-900'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
            }`}
          >
            {item.label}：{item.count}
          </button>
        ))}
      </div>
    </div>
  );
}
