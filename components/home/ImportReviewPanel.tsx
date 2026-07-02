'use client';

import type { JSX } from 'react';
import type { PendingImportPreview } from '@/lib/importHomeTypes';
import type { ReplacedRecordPreview } from '@/lib/importPageUtils';

export interface ImportReviewPanelProps {
  locale: 'zh' | 'en';
  pending: PendingImportPreview;
  conflictPreviews: ReplacedRecordPreview[];
  conflictNameKeyword: string;
  onConflictNameKeywordChange: (value: string) => void;
  showAllConflictRows: boolean;
  onShowAllConflictRowsChange: (checked: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ImportReviewPanel(props: ImportReviewPanelProps): JSX.Element {
  const {
    locale,
    pending,
    conflictPreviews,
    conflictNameKeyword,
    onConflictNameKeywordChange,
    showAllConflictRows,
    onShowAllConflictRowsChange,
    onConfirm,
    onCancel,
  } = props;
  const zh = locale === 'zh';
  const visibleConflicts = showAllConflictRows ? conflictPreviews : conflictPreviews.slice(0, 10);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-lg font-black text-amber-700">3</div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">{zh ? '检查并确认' : 'Review and confirm'}</h2>
          <p className="mt-1 text-sm text-slate-600">{pending.targetFileName}</p>
        </div>
        <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${pending.mode === 'replace' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'}`}>
          {pending.mode === 'replace' ? (zh ? '覆盖导入' : 'Replace') : (zh ? '追加导入' : 'Append')}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label={zh ? '文件有效记录' : 'Valid file records'} value={pending.incomingRecords.length} tone="slate" />
        <Metric label={zh ? '解析异常' : 'Parse issues'} value={pending.incomingIssues.length} tone={pending.incomingIssues.length > 0 ? 'amber' : 'emerald'} />
        <Metric label={zh ? '本次新增' : 'Added'} value={pending.addedCount} tone="emerald" />
        <Metric label={zh ? '将被覆盖' : 'Replaced'} value={pending.replacedCount} tone={pending.replacedCount > 0 ? 'rose' : 'slate'} />
      </div>

      <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">
        {pending.mode === 'replace'
          ? zh
            ? `确认后，浏览器中现有 ${pending.existingRecordsCount} 条记录将被本文件的 ${pending.nextRecords.length} 条记录替换。`
            : `After confirmation, ${pending.existingRecordsCount} existing records will be replaced by ${pending.nextRecords.length} records from this file.`
          : zh
            ? `确认后，数据总量将变为 ${pending.nextRecords.length} 条；现有数据在确认前不会改变。`
            : `After confirmation, the dataset will contain ${pending.nextRecords.length} records. Existing data remains unchanged until then.`}
      </div>

      {pending.replacedPreviews.length > 0 && (
        <section className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4" aria-labelledby="conflict-title">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 id="conflict-title" className="font-bold text-amber-950">{zh ? '重复记录核对' : 'Duplicate record review'}</h3>
              <p className="mt-1 text-xs text-amber-800">
                {zh ? `检测到 ${pending.replacedPreviews.length} 条记录会覆盖历史成绩。` : `${pending.replacedPreviews.length} records will replace previous scores.`}
              </p>
            </div>
            <label className="text-xs font-semibold text-amber-950">
              <span className="mb-1 block">{zh ? '按姓名筛选' : 'Filter by name'}</span>
              <input
                value={conflictNameKeyword}
                onChange={(event) => onConflictNameKeywordChange(event.target.value)}
                className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs text-slate-800"
              />
            </label>
          </div>
          <div className="mt-3 overflow-x-auto rounded-lg border border-amber-200 bg-white">
            <table className="min-w-full text-xs">
              <thead className="bg-amber-100/70 text-amber-950">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left font-semibold">{zh ? '姓名' : 'Name'}</th>
                  <th scope="col" className="px-3 py-2 text-left font-semibold">{zh ? '级别' : 'Level'}</th>
                  <th scope="col" className="px-3 py-2 text-left font-semibold">{zh ? '考试日期' : 'Exam date'}</th>
                  <th scope="col" className="px-3 py-2 text-left font-semibold">{zh ? '原总分' : 'Previous'}</th>
                  <th scope="col" className="px-3 py-2 text-left font-semibold">{zh ? '新总分' : 'Incoming'}</th>
                </tr>
              </thead>
              <tbody>
                {visibleConflicts.map((item) => (
                  <tr key={item.key} className="border-t border-amber-100">
                    <td className="px-3 py-2 font-medium text-slate-900">{item.incoming.name}</td>
                    <td className="px-3 py-2 text-slate-700">{item.incoming.level}</td>
                    <td className="px-3 py-2 text-slate-700">{item.incoming.examDate || '-'}</td>
                    <td className="px-3 py-2 text-slate-700">{item.previous.rawTotal}</td>
                    <td className="px-3 py-2 font-semibold text-slate-900">{item.incoming.rawTotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {conflictPreviews.length > 10 && (
            <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-amber-950">
              <input type="checkbox" checked={showAllConflictRows} onChange={(event) => onShowAllConflictRowsChange(event.target.checked)} />
              {zh ? `显示全部 ${conflictPreviews.length} 条冲突记录` : `Show all ${conflictPreviews.length} conflicts`}
            </label>
          )}
        </section>
      )}

      <section className="mt-5" aria-labelledby="sample-title">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 id="sample-title" className="font-bold text-slate-900">{zh ? '文件样本' : 'File sample'}</h3>
            <p className="mt-1 text-xs text-slate-500">{zh ? '按文件顺序展示前 8 条有效记录。' : 'Showing the first 8 valid records in file order.'}</p>
          </div>
        </div>
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th scope="col" className="px-4 py-2.5 text-left font-semibold">{zh ? '姓名' : 'Name'}</th>
                <th scope="col" className="px-4 py-2.5 text-left font-semibold">{zh ? '班级' : 'Class'}</th>
                <th scope="col" className="px-4 py-2.5 text-left font-semibold">{zh ? '级别' : 'Level'}</th>
                <th scope="col" className="px-4 py-2.5 text-left font-semibold">{zh ? '原始总分' : 'Raw total'}</th>
              </tr>
            </thead>
            <tbody>
              {pending.incomingRecords.slice(0, 8).map((record) => (
                <tr key={record.id} className="border-t border-slate-100">
                  <td className="px-4 py-2.5 font-medium text-slate-900">{record.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{record.className || '-'}</td>
                  <td className="px-4 py-2.5 text-slate-600">{record.level}</td>
                  <td className="px-4 py-2.5 text-slate-600">{record.rawTotal} / {record.maxTotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400">
          {zh ? '取消并返回上传' : 'Cancel and return'}
        </button>
        <button type="button" onClick={onConfirm} className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          {pending.mode === 'replace' ? (zh ? '确认覆盖并保存' : 'Confirm replace and save') : (zh ? '确认追加并保存' : 'Confirm append and save')}
        </button>
      </div>
    </div>
  );
}

function Metric(props: { label: string; value: number; tone: 'slate' | 'emerald' | 'amber' | 'rose' }): JSX.Element {
  const tones = {
    slate: 'border-slate-200 bg-slate-50 text-slate-900',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    rose: 'border-rose-200 bg-rose-50 text-rose-900',
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[props.tone]}`}>
      <p className="text-xs font-semibold opacity-70">{props.label}</p>
      <p className="mt-1 text-2xl font-black">{props.value}</p>
    </div>
  );
}
