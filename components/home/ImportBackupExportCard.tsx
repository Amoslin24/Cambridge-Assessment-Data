'use client';

import type { ChangeEvent, JSX } from 'react';

export interface ImportBackupExportCardProps {
  locale: 'zh' | 'en';
  recordsCount: number;
  issuesCount: number;
  auditLogCount: number;
  onDownloadParsedRecords: () => void;
  onDownloadIssues: () => void;
  onClearLocalData: () => void;
  onDownloadFullBackup: () => void;
  onRestoreFromBackup: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function ImportBackupExportCard(props: ImportBackupExportCardProps): JSX.Element {
  const {
    locale,
    recordsCount,
    issuesCount,
    auditLogCount,
    onDownloadParsedRecords,
    onDownloadIssues,
    onClearLocalData,
    onDownloadFullBackup,
    onRestoreFromBackup,
  } = props;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {locale === 'zh' ? '结果导出' : 'Result export'}
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onDownloadParsedRecords}
          disabled={recordsCount === 0}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold hover:border-purple-700 hover:text-purple-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {locale === 'zh' ? '导出当前解析结果' : 'Export parsed results'}
        </button>
        <button
          type="button"
          onClick={onDownloadIssues}
          disabled={issuesCount === 0}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold hover:border-amber-700 hover:text-amber-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {locale === 'zh' ? '导出异常行' : 'Export issue rows'}
        </button>
        <button
          type="button"
          onClick={onClearLocalData}
          disabled={recordsCount === 0 && issuesCount === 0}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold hover:border-rose-700 hover:text-rose-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {locale === 'zh' ? '清空本地数据' : 'Clear local data'}
        </button>
        <button
          type="button"
          onClick={onDownloadFullBackup}
          disabled={recordsCount === 0 && issuesCount === 0 && auditLogCount === 0}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold hover:border-indigo-700 hover:text-indigo-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {locale === 'zh' ? '导出本地完整备份（JSON）' : 'Export full local backup (JSON)'}
        </button>
        <label className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold hover:border-indigo-700 hover:text-indigo-700 transition-colors cursor-pointer">
          {locale === 'zh' ? '从备份恢复本地状态' : 'Restore local state from backup'}
          <input
            type="file"
            accept=".json,application/json"
            onChange={onRestoreFromBackup}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}
