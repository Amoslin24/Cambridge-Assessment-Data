'use client';

import type { JSX } from 'react';
import type { PendingAppendImport } from '@/lib/importHomeTypes';
import type { ReplacedRecordPreview } from '@/lib/importPageUtils';

export interface ImportAppendConflictPanelProps {
  pending: PendingAppendImport;
  conflictPreviews: ReplacedRecordPreview[];
  conflictNameKeyword: string;
  onConflictNameKeywordChange: (value: string) => void;
  showAllConflictRows: boolean;
  onShowAllConflictRowsChange: (checked: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ImportAppendConflictPanel(props: ImportAppendConflictPanelProps): JSX.Element {
  const {
    pending,
    conflictPreviews,
    conflictNameKeyword,
    onConflictNameKeywordChange,
    showAllConflictRows,
    onShowAllConflictRowsChange,
    onConfirm,
    onCancel,
  } = props;

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
      <h3 className="text-sm font-bold text-amber-900">检测到将覆盖的记录</h3>
      <p className="mt-1 text-xs text-amber-800">
        本次追加将覆盖 {pending.outcome.replacedCount} 条历史记录。请确认是否继续写入。
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={conflictNameKeyword}
          onChange={(event) => onConflictNameKeywordChange(event.target.value)}
          placeholder="按姓名筛选冲突记录"
          className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs text-slate-700"
        />
        <label className="flex items-center gap-2 text-xs text-amber-900">
          <input
            type="checkbox"
            checked={showAllConflictRows}
            onChange={(event) => onShowAllConflictRowsChange(event.target.checked)}
          />
          显示全部冲突记录
        </label>
      </div>
      <div className="mt-3 overflow-x-auto rounded-lg border border-amber-200 bg-white">
        <table className="min-w-full text-xs">
          <thead className="bg-amber-100/60 text-amber-900">
            <tr>
              <th className="text-left px-3 py-2 font-semibold">姓名</th>
              <th className="text-left px-3 py-2 font-semibold">级别</th>
              <th className="text-left px-3 py-2 font-semibold">考试日期</th>
              <th className="text-left px-3 py-2 font-semibold">原记录总分</th>
              <th className="text-left px-3 py-2 font-semibold">新记录总分</th>
            </tr>
          </thead>
          <tbody>
            {(showAllConflictRows ? conflictPreviews : conflictPreviews.slice(0, 10)).map((item) => (
              <tr key={item.key} className="border-t border-amber-100">
                <td className="px-3 py-2 text-slate-800">{item.incoming.name}</td>
                <td className="px-3 py-2 text-slate-700">{item.incoming.level}</td>
                <td className="px-3 py-2 text-slate-700">{item.incoming.examDate || '-'}</td>
                <td className="px-3 py-2 text-slate-700">{item.previous.rawTotal}</td>
                <td className="px-3 py-2 text-slate-700">{item.incoming.rawTotal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {conflictPreviews.length > 10 && !showAllConflictRows && (
        <p className="mt-2 text-xs text-amber-900">
          当前仅展示前 10 条冲突记录，请勾选“显示全部冲突记录”查看完整列表。
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-amber-600 bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700"
        >
          确认覆盖并追加
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:border-slate-500"
        >
          取消本次导入
        </button>
      </div>
    </div>
  );
}
