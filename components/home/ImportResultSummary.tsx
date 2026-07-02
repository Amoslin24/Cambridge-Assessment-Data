'use client';

import Link from 'next/link';
import type { JSX } from 'react';
import type { ImportStats } from '@/lib/importHomeTypes';

export interface ImportResultSummaryProps {
  locale: 'zh' | 'en';
  recordsCount: number;
  classCount: number;
  issuesCount: number;
  fileName: string;
  savedAtText: string;
  importStats: ImportStats | null;
  onImportAnother: () => void;
}

export function ImportResultSummary(props: ImportResultSummaryProps): JSX.Element {
  const { locale, recordsCount, classCount, issuesCount, fileName, savedAtText, importStats, onImportAnother } = props;
  const zh = locale === 'zh';

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6" aria-labelledby="result-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-lg font-black text-emerald-700">✓</div>
          <h2 id="result-heading" className="mt-4 text-xl font-black text-slate-900">{zh ? '成绩数据已就绪' : 'Score data is ready'}</h2>
          <p className="mt-1 text-sm text-slate-600">{fileName || (zh ? '本地成绩数据' : 'Local score data')}</p>
          {savedAtText && <p className="mt-1 text-xs text-slate-500">{savedAtText}</p>}
        </div>
        <Link
          href="/analysis"
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {zh ? '进入数据分析 →' : 'Open data analysis →'}
        </Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ResultMetric label={zh ? '学生记录' : 'Student records'} value={recordsCount} tone="blue" />
        <ResultMetric label={zh ? '涉及班级' : 'Classes'} value={classCount} tone="violet" />
        <ResultMetric label={zh ? '异常数量' : 'Issues'} value={issuesCount} tone={issuesCount > 0 ? 'amber' : 'emerald'} />
        <ResultMetric
          label={importStats ? (zh ? '本次新增 / 覆盖' : 'Added / replaced') : (zh ? '数据状态' : 'Data status')}
          value={importStats ? `${importStats.addedCount} / ${importStats.replacedCount}` : (zh ? '已恢复' : 'Restored')}
          tone="slate"
        />
      </div>

      <div className="mt-5 flex justify-end">
        <button type="button" onClick={onImportAnother} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400">
          {zh ? '导入另一份文件' : 'Import another file'}
        </button>
      </div>
    </section>
  );
}

function ResultMetric(props: { label: string; value: number | string; tone: 'blue' | 'violet' | 'amber' | 'emerald' | 'slate' }): JSX.Element {
  const tones = {
    blue: 'border-blue-200 bg-blue-50 text-blue-950',
    violet: 'border-violet-200 bg-violet-50 text-violet-950',
    amber: 'border-amber-200 bg-amber-50 text-amber-950',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    slate: 'border-slate-200 bg-slate-50 text-slate-950',
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[props.tone]}`}>
      <p className="text-xs font-semibold opacity-70">{props.label}</p>
      <p className="mt-1 text-2xl font-black">{props.value}</p>
    </div>
  );
}
