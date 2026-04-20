'use client';

import type { JSX } from 'react';
import type { TemplateLanguage } from '@/lib/importPageUtils';

export interface ImportTemplateCardProps {
  locale: 'zh' | 'en';
  onDownloadEmptyTemplate: (language: TemplateLanguage) => void;
}

export function ImportTemplateCard(props: ImportTemplateCardProps): JSX.Element {
  const { locale, onDownloadEmptyTemplate } = props;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {locale === 'zh' ? '模板导出' : 'Template export'}
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onDownloadEmptyTemplate('zh')}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold hover:border-emerald-700 hover:text-emerald-700 transition-colors"
        >
          {locale === 'zh' ? '一键导出中文空模板' : 'Export empty Chinese template'}
        </button>
        <button
          type="button"
          onClick={() => onDownloadEmptyTemplate('en')}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold hover:border-emerald-700 hover:text-emerald-700 transition-colors"
        >
          {locale === 'zh' ? '一键导出英文空模板' : 'Export empty English template'}
        </button>
      </div>
    </div>
  );
}
