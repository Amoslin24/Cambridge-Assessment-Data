'use client';

import type { JSX } from 'react';
import type { TemplateLanguage } from '@/lib/importPageUtils';

export interface ImportTemplateCardProps {
  locale: 'zh' | 'en';
  onDownloadEmptyTemplate: (language: TemplateLanguage) => void;
  onContinue: () => void;
}

export function ImportTemplateCard(props: ImportTemplateCardProps): JSX.Element {
  const { locale, onDownloadEmptyTemplate, onContinue } = props;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-lg font-black text-blue-700">
        1
      </div>
      <h2 className="mt-4 text-xl font-black text-slate-900">
        {locale === 'zh' ? '准备成绩模板' : 'Prepare your score template'}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        {locale === 'zh'
          ? '第一次使用建议先下载中文模板。已有符合字段要求的 CSV 或 Excel 文件，可以直接进入下一步。'
          : 'For your first import, start with the Chinese template. If your CSV or Excel file already matches the required fields, continue to upload.'}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => onDownloadEmptyTemplate('zh')}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {locale === 'zh' ? '下载中文模板' : 'Download Chinese template'}
        </button>
        <a
          href="/templates/cambridge-import-sample.csv"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-blue-500 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {locale === 'zh' ? '下载示例数据' : 'Download sample data'}
        </a>
        <a
          href="/templates/cambridge-import-guide.md"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-blue-500 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {locale === 'zh' ? '查看字段说明' : 'View field guide'}
        </a>
      </div>

      <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          {locale === 'zh' ? '更多模板与测试文件' : 'More templates and test files'}
        </summary>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3 text-sm">
          <button type="button" onClick={() => onDownloadEmptyTemplate('en')} className="font-medium text-blue-700 underline underline-offset-2">
            {locale === 'zh' ? '英文空模板' : 'Empty English template'}
          </button>
          <a href="/templates/cambridge-import-template.csv" className="font-medium text-blue-700 underline underline-offset-2">
            {locale === 'zh' ? '标准模板' : 'Standard template'}
          </a>
          <a href="/templates/cambridge-import-sample-anomalies.csv" className="font-medium text-blue-700 underline underline-offset-2">
            {locale === 'zh' ? '异常样例' : 'Anomaly sample'}
          </a>
        </div>
      </details>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          {locale === 'zh' ? '我已准备好，下一步' : 'I am ready, continue'}
        </button>
      </div>
    </div>
  );
}
