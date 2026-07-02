'use client';

import { useState, type JSX } from 'react';
import type { ImportAuditEntry } from '@/lib/importPageUtils';

export interface ImportAuditCardProps {
  locale: 'zh' | 'en';
  auditLog: ImportAuditEntry[];
  onDownloadAuditLog: () => void;
  onClearAuditLog: () => void;
}

export function ImportAuditCard(props: ImportAuditCardProps): JSX.Element {
  const { locale, auditLog, onDownloadAuditLog, onClearAuditLog } = props;
  const [confirmingClear, setConfirmingClear] = useState<boolean>(false);

  function handleConfirmedClear(): void {
    onClearAuditLog();
    setConfirmingClear(false);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {locale === 'zh' ? '导入审计' : 'Import audit'}
      </p>
      <p className="mt-2 text-xs text-slate-600">
        {locale === 'zh'
          ? '系统将记录每次导入的时间、文件名、模式与结果统计，用于后续复盘与异常追溯。'
          : 'Each import is logged with timestamp, filename, mode, and stats for traceability.'}
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onDownloadAuditLog}
          disabled={auditLog.length === 0}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold hover:border-blue-700 hover:text-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {locale === 'zh' ? '导出导入审计（CSV）' : 'Export audit CSV'}
        </button>
        {!confirmingClear && (
          <button
            type="button"
            onClick={() => setConfirmingClear(true)}
            disabled={auditLog.length === 0}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold hover:border-rose-700 hover:text-rose-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {locale === 'zh' ? '清空审计记录' : 'Clear audit log'}
          </button>
        )}
      </div>
      {confirmingClear && (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
          <p className="text-xs font-semibold text-rose-900">
            {locale === 'zh' ? '确认删除全部导入审计？成绩数据不会被删除。' : 'Delete all import audit entries? Score data will not be removed.'}
          </p>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={handleConfirmedClear} className="rounded-lg bg-rose-700 px-3 py-2 text-xs font-bold text-white">
              {locale === 'zh' ? '确认删除' : 'Confirm delete'}
            </button>
            <button type="button" onClick={() => setConfirmingClear(false)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700">
              {locale === 'zh' ? '取消' : 'Cancel'}
            </button>
          </div>
        </div>
      )}
      <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="text-left px-3 py-2 font-semibold">{locale === 'zh' ? '导入时间' : 'Imported at'}</th>
              <th className="text-left px-3 py-2 font-semibold">{locale === 'zh' ? '文件名' : 'File name'}</th>
              <th className="text-left px-3 py-2 font-semibold">{locale === 'zh' ? '模式' : 'Mode'}</th>
              <th className="text-left px-3 py-2 font-semibold">{locale === 'zh' ? '新增' : 'Added'}</th>
              <th className="text-left px-3 py-2 font-semibold">{locale === 'zh' ? '覆盖' : 'Replaced'}</th>
              <th className="text-left px-3 py-2 font-semibold">{locale === 'zh' ? '异常' : 'Issues'}</th>
              <th className="text-left px-3 py-2 font-semibold">
                {locale === 'zh' ? '导入后总量' : 'Total after import'}
              </th>
            </tr>
          </thead>
          <tbody>
            {auditLog.slice(0, 10).map((entry) => (
              <tr key={entry.id} className="border-t border-slate-100">
                <td className="px-3 py-2 text-slate-700">
                  {new Date(entry.importedAt).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')}
                </td>
                <td className="px-3 py-2 text-slate-800">{entry.fileName}</td>
                <td className="px-3 py-2 text-slate-700">
                  {entry.mode === 'replace'
                    ? locale === 'zh'
                      ? '覆盖导入'
                      : 'Replace'
                    : locale === 'zh'
                      ? '追加导入'
                      : 'Append'}
                </td>
                <td className="px-3 py-2 text-emerald-700 font-semibold">{entry.addedCount}</td>
                <td className="px-3 py-2 text-amber-700 font-semibold">{entry.replacedCount}</td>
                <td className="px-3 py-2 text-rose-700 font-semibold">{entry.issueCount}</td>
                <td className="px-3 py-2 text-slate-800 font-semibold">{entry.totalAfterImport}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {auditLog.length > 10 && (
        <p className="mt-2 text-xs text-slate-500">
          {locale === 'zh'
            ? '当前仅展示最近 10 次导入记录，可导出 CSV 查看完整列表。'
            : 'Showing latest 10 imports only. Export CSV for full history.'}
        </p>
      )}
    </div>
  );
}
