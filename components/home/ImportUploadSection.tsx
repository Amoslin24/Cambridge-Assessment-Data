'use client';

import type { ChangeEvent, JSX } from 'react';
import type { ImportMode } from '@/lib/importPageUtils';
import type { ImportStats } from '@/lib/importHomeTypes';

export interface ImportUploadSectionProps {
  locale: 'zh' | 'en';
  summaryText: string;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  importMode: ImportMode;
  onImportModeChange: (mode: ImportMode) => void;
  lastImportMessage: string;
  importStats: ImportStats | null;
}

export function ImportUploadSection(props: ImportUploadSectionProps): JSX.Element {
  const { locale, summaryText, onFileChange, importMode, onImportModeChange, lastImportMessage, importStats } = props;

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold hover:border-blue-700 hover:text-blue-700 transition-colors cursor-pointer">
          {locale === 'zh' ? '选择文件' : 'Choose file'}
          <input type="file" accept=".csv,.xlsx,.xls" onChange={onFileChange} className="hidden" />
        </label>
        <span className="text-sm text-slate-500">{summaryText}</span>
      </div>
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <span className="text-sm font-semibold text-slate-700">
          {locale === 'zh' ? '导入模式' : 'Import mode'}
        </span>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="radio"
            name="importMode"
            checked={importMode === 'replace'}
            onChange={() => onImportModeChange('replace')}
          />
          {locale === 'zh' ? '覆盖导入' : 'Replace existing'}
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="radio"
            name="importMode"
            checked={importMode === 'append'}
            onChange={() => onImportModeChange('append')}
          />
          {locale === 'zh' ? '追加导入（自动去重）' : 'Append (auto-dedupe)'}
        </label>
      </div>
      {lastImportMessage && <p className="text-xs text-slate-600">{lastImportMessage}</p>}
      {importStats && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-500">{locale === 'zh' ? '导入模式' : 'Mode'}</p>
            <p className="text-sm font-semibold text-slate-800">
              {importStats.mode === 'replace'
                ? locale === 'zh'
                  ? '覆盖导入'
                  : 'Replace'
                : locale === 'zh'
                  ? '追加导入'
                  : 'Append'}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-500">{locale === 'zh' ? '新增记录' : 'Added'}</p>
            <p className="text-sm font-semibold text-emerald-700">{importStats.addedCount}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-500">{locale === 'zh' ? '覆盖记录' : 'Replaced'}</p>
            <p className="text-sm font-semibold text-amber-700">{importStats.replacedCount}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-500">{locale === 'zh' ? '总记录 / 异常' : 'Total / Issues'}</p>
            <p className="text-sm font-semibold text-slate-800">
              {importStats.totalAfterImport} / {importStats.issueCount}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
