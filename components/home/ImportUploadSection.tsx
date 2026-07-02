'use client';

import { useState, type ChangeEvent, type DragEvent, type JSX } from 'react';
import type { ImportMode } from '@/lib/importPageUtils';

export interface ImportUploadSectionProps {
  locale: 'zh' | 'en';
  summaryText: string;
  onFileSelected: (file: File) => void;
  importMode: ImportMode;
  onImportModeChange: (mode: ImportMode) => void;
  lastImportMessage: string;
  loading: boolean;
  onBack: () => void;
}

export function ImportUploadSection(props: ImportUploadSectionProps): JSX.Element {
  const { locale, summaryText, onFileSelected, importMode, onImportModeChange, lastImportMessage, loading, onBack } = props;
  const [dragActive, setDragActive] = useState<boolean>(false);

  function handleInputChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
    event.target.value = '';
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>): void {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onFileSelected(file);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-lg font-black text-violet-700">
        2
      </div>
      <h2 className="mt-4 text-xl font-black text-slate-900">
        {locale === 'zh' ? '上传成绩文件' : 'Upload score file'}
      </h2>
      <p className="mt-2 text-sm text-slate-600">{summaryText}</p>

      <fieldset className="mt-5">
        <legend className="text-sm font-bold text-slate-800">{locale === 'zh' ? '选择导入方式' : 'Choose import mode'}</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <label className={`cursor-pointer rounded-xl border p-4 transition-colors ${importMode === 'replace' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-400'}`}>
            <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <input
                type="radio"
                name="importMode"
                checked={importMode === 'replace'}
                onChange={() => onImportModeChange('replace')}
              />
              {locale === 'zh' ? '覆盖当前数据' : 'Replace current data'}
            </span>
            <span className="mt-1 block pl-6 text-xs leading-5 text-slate-600">
              {locale === 'zh' ? '确认后用新文件替换浏览器中现有的成绩。' : 'After confirmation, replace all scores stored in this browser.'}
            </span>
          </label>
          <label className={`cursor-pointer rounded-xl border p-4 transition-colors ${importMode === 'append' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-400'}`}>
            <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <input
                type="radio"
                name="importMode"
                checked={importMode === 'append'}
                onChange={() => onImportModeChange('append')}
              />
              {locale === 'zh' ? '追加并自动去重' : 'Append and deduplicate'}
            </span>
            <span className="mt-1 block pl-6 text-xs leading-5 text-slate-600">
              {locale === 'zh' ? '保留现有数据；发生重复时会在确认前列出。' : 'Keep existing scores and show duplicates before confirmation.'}
            </span>
          </label>
        </div>
      </fieldset>

      <label
        onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`mt-5 flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 ${dragActive ? 'border-blue-600 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:border-blue-500 hover:bg-blue-50/50'}`}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-sm" aria-hidden="true">↑</span>
        <span className="mt-3 text-base font-bold text-slate-900">
          {loading
            ? locale === 'zh' ? '正在解析文件…' : 'Parsing file…'
            : locale === 'zh' ? '拖入文件，或点击选择' : 'Drop a file here, or click to browse'}
        </span>
        <span className="mt-1 text-xs text-slate-500">CSV · XLSX · XLS</span>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleInputChange}
          disabled={loading}
          className="sr-only"
          aria-label={locale === 'zh' ? '选择成绩文件' : 'Choose score file'}
        />
      </label>

      {lastImportMessage && (
        <p role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {lastImportMessage}
        </p>
      )}

      <div className="mt-6 flex justify-between">
        <button type="button" onClick={onBack} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400">
          {locale === 'zh' ? '返回模板' : 'Back to templates'}
        </button>
        <span className="self-center text-xs text-slate-500">
          {locale === 'zh' ? '上传后先预览，不会立即写入' : 'Uploads are previewed before being saved'}
        </span>
      </div>
    </div>
  );
}
