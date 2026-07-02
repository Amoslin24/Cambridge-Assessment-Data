'use client';

import { useState, type ChangeEvent, type JSX } from 'react';

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
  const [confirmingClear, setConfirmingClear] = useState<boolean>(false);

  function handleConfirmedClear(): void {
    onClearLocalData();
    setConfirmingClear(false);
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-bold text-slate-900">{locale === 'zh' ? '备份与恢复' : 'Backup and restore'}</h3>
        <p className="mt-1 text-xs text-slate-500">
          {locale === 'zh' ? '备份包含成绩、异常和导入审计，请妥善保管学生数据。' : 'Backups include scores, issues, and audit history. Store student data securely.'}
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onDownloadFullBackup}
            disabled={recordsCount === 0 && issuesCount === 0 && auditLogCount === 0}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-indigo-600 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {locale === 'zh' ? '导出完整备份（JSON）' : 'Export full backup (JSON)'}
          </button>
          <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-indigo-600 hover:text-indigo-700 focus-within:ring-2 focus-within:ring-indigo-500">
            {locale === 'zh' ? '从备份恢复' : 'Restore from backup'}
            <input type="file" accept=".json,application/json" onChange={onRestoreFromBackup} className="sr-only" />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-bold text-slate-900">{locale === 'zh' ? '结果导出' : 'Result exports'}</h3>
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onDownloadParsedRecords}
          disabled={recordsCount === 0}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-purple-700 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {locale === 'zh' ? '导出当前解析结果' : 'Export parsed results'}
        </button>
        <button
          type="button"
          onClick={onDownloadIssues}
          disabled={issuesCount === 0}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-amber-700 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {locale === 'zh' ? '导出异常行' : 'Export issue rows'}
        </button>
      </div>
      </section>

      <section className="rounded-xl border border-rose-200 bg-rose-50 p-4">
        <h3 className="text-sm font-bold text-rose-950">{locale === 'zh' ? '危险操作' : 'Danger zone'}</h3>
        {!confirmingClear ? (
          <button
            type="button"
            onClick={() => setConfirmingClear(true)}
            disabled={recordsCount === 0 && issuesCount === 0}
            className="mt-3 inline-flex items-center justify-center rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-sm font-semibold text-rose-800 hover:border-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {locale === 'zh' ? '清空本地成绩数据' : 'Clear local score data'}
          </button>
        ) : (
          <div className="mt-3 rounded-xl border border-rose-300 bg-white p-3">
            <p className="text-sm font-semibold text-rose-900">
              {locale === 'zh' ? '此操作会清空成绩、异常和审计记录，且无法撤销。' : 'This removes scores, issues, and audit history and cannot be undone.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={handleConfirmedClear} className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-bold text-white hover:bg-rose-800">
                {locale === 'zh' ? '确认清空' : 'Confirm clear'}
              </button>
              <button type="button" onClick={() => setConfirmingClear(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700">
                {locale === 'zh' ? '取消' : 'Cancel'}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
