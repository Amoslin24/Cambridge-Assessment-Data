'use client';

import type { JSX } from 'react';

export interface WarningStudentItem {
  name: string;
  className: string;
  setName: string;
  level: string;
  examDate: string;
  convertedTotal: number;
  keySkill: string;
  note: string;
  priority: 'P0' | 'P1' | 'P2';
}

export type WarningRiskType = 'DECLINE' | 'ATTENTION' | 'HIGH_RISK';

export interface AnalysisEarlyWarningPanelProps {
  locale: 'zh' | 'en';
  declinedStudents: WarningStudentItem[];
  attentionStudents: WarningStudentItem[];
  highRiskStudents: WarningStudentItem[];
  onExportInterventionCsv: () => void;
  exportDisabled: boolean;
  selectedRiskTypes: WarningRiskType[];
  onToggleRiskType: (riskType: WarningRiskType) => void;
  onSelectAllRiskTypes: () => void;
  exportVisibleOnly: boolean;
  onExportVisibleOnlyChange: (checked: boolean) => void;
  visibleLimit: number;
  onVisibleLimitChange: (value: number) => void;
  exportBySet: boolean;
  onExportBySetChange: (checked: boolean) => void;
  selectedPriorities: Array<'P0' | 'P1' | 'P2'>;
  onTogglePriority: (priority: 'P0' | 'P1' | 'P2') => void;
  onSelectAllPriorities: () => void;
  exportPreviewText: string;
  warningKeyword: string;
  onWarningKeywordChange: (value: string) => void;
  onResetWarningFilters: () => void;
  weeklyTrend: {
    current: { p0: number; p1: number; p2: number };
    previous: { p0: number; p1: number; p2: number };
    delta: { p0: number; p1: number; p2: number };
  };
}

function WarningList(props: { locale: 'zh' | 'en'; items: WarningStudentItem[]; emptyText: string }): JSX.Element {
  const { locale, items, emptyText } = props;
  if (items.length === 0) {
    return <div className="mt-2 text-sm text-slate-500">{emptyText}</div>;
  }
  return (
    <ul className="mt-2 space-y-2 text-sm text-slate-700">
      {items.slice(0, 8).map((item) => (
        <li key={`${item.name}-${item.level}-${item.examDate}-${item.keySkill}`} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <div className="font-semibold text-slate-900">
            {item.name}
            {item.className ? ` · ${item.className}` : ''}
            {item.setName ? ` · ${item.setName}` : ''}
          </div>
          <div className="mt-0.5 text-xs text-slate-500">
            {locale === 'zh' ? '级别' : 'Level'}: {item.level} · {locale === 'zh' ? '最近考试' : 'Latest exam'}: {item.examDate || '—'}
          </div>
          <div className="mt-0.5 text-xs text-slate-600">
            {locale === 'zh' ? '换算总分' : 'Converted total'}: {item.convertedTotal} ·
            {locale === 'zh' ? ' 关键技能' : ' Key skill'}: {item.keySkill}
          </div>
          <div className="mt-0.5 text-xs font-semibold text-slate-700">
            {locale === 'zh' ? '干预优先级' : 'Intervention priority'}: {item.priority}
          </div>
          <div className="mt-0.5 text-xs text-slate-600">{item.note}</div>
        </li>
      ))}
      {items.length > 8 && (
        <li className="text-xs text-slate-500">
          {locale === 'zh' ? `仅展示前 8 人，剩余 ${items.length - 8} 人请继续收窄筛选条件。` : `Showing first 8 students. ${items.length - 8} more under current filters.`}
        </li>
      )}
    </ul>
  );
}

export function AnalysisEarlyWarningPanel(props: AnalysisEarlyWarningPanelProps): JSX.Element {
  const {
    locale,
    declinedStudents,
    attentionStudents,
    highRiskStudents,
    onExportInterventionCsv,
    exportDisabled,
    selectedRiskTypes,
    onToggleRiskType,
    onSelectAllRiskTypes,
    exportVisibleOnly,
    onExportVisibleOnlyChange,
    visibleLimit,
    onVisibleLimitChange,
    exportBySet,
    onExportBySetChange,
    selectedPriorities,
    onTogglePriority,
    onSelectAllPriorities,
    exportPreviewText,
    warningKeyword,
    onWarningKeywordChange,
    onResetWarningFilters,
    weeklyTrend,
  } = props;

  function tr(zhText: string, enText: string): string {
    return locale === 'zh' ? zhText : enText;
  }

  return (
    <div id="early-warning" className="mt-8 rounded-2xl border border-slate-200 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-slate-900">{tr('班级预警中心（雏形）', 'Class Early Warning Center (MVP)')}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onResetWarningFilters}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-500"
          >
            {tr('恢复默认筛选', 'Reset warning filters')}
          </button>
          <button
            type="button"
            onClick={onSelectAllPriorities}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-500"
          >
            {tr('全选优先级', 'Select all priorities')}
          </button>
          <button
            type="button"
            onClick={onSelectAllRiskTypes}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-500"
          >
            {tr('全选导出类型', 'Select all risk types')}
          </button>
          <button
            type="button"
            onClick={onExportInterventionCsv}
            disabled={exportDisabled}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-700 hover:text-blue-700 disabled:opacity-60"
          >
            {tr('导出教师执行版 CSV', 'Export teacher execution CSV')}
          </button>
        </div>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        {tr(
          '按当前筛选范围自动识别三类学生：最近 3 次连续下滑、临界区间（60%-70%）与高风险（<60%）。用于快速生成本周干预名单。',
          'Automatically identifies three groups under current filters: recent 3-exam decline, attention band (60%-70%), and high risk (<60%).',
        )}
      </p>
      <p className="mt-1 text-xs text-slate-500">{exportPreviewText}</p>
      <div className="mt-2">
        <input
          value={warningKeyword}
          onChange={(event) => onWarningKeywordChange(event.target.value)}
          placeholder={tr('按姓名/班级/组别关键词筛选预警名单', 'Filter warning list by name/class/set keyword')}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
        <label className="inline-flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={selectedRiskTypes.includes('DECLINE')}
            onChange={() => onToggleRiskType('DECLINE')}
          />
          {tr('连续下滑', 'Consecutive decline')}
        </label>
        <label className="inline-flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={selectedRiskTypes.includes('ATTENTION')}
            onChange={() => onToggleRiskType('ATTENTION')}
          />
          {tr('临界（60%-70%）', 'Attention (60%-70%)')}
        </label>
        <label className="inline-flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={selectedRiskTypes.includes('HIGH_RISK')}
            onChange={() => onToggleRiskType('HIGH_RISK')}
          />
          {tr('高风险（<60%）', 'High risk (<60%)')}
        </label>
        <label className="inline-flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={exportVisibleOnly}
            onChange={(event) => onExportVisibleOnlyChange(event.target.checked)}
          />
          {tr('仅导出当前可见前 N 人', 'Export visible top N only')}
        </label>
        <label className="inline-flex items-center gap-1.5">
          {tr('N =', 'N =')}
          <input
            type="number"
            min={1}
            max={50}
            value={visibleLimit}
            onChange={(event) => {
              const next = Number(event.target.value);
              onVisibleLimitChange(Number.isFinite(next) && next > 0 ? next : 8);
            }}
            className="w-16 rounded border border-slate-300 bg-white px-1.5 py-0.5"
          />
        </label>
        <label className="inline-flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={exportBySet}
            onChange={(event) => onExportBySetChange(event.target.checked)}
          />
          {tr('按 SET 分文件导出', 'Export separate files by Set')}
        </label>
        <label className="inline-flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={selectedPriorities.includes('P0')}
            onChange={() => onTogglePriority('P0')}
          />
          P0
        </label>
        <label className="inline-flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={selectedPriorities.includes('P1')}
            onChange={() => onTogglePriority('P1')}
          />
          P1
        </label>
        <label className="inline-flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={selectedPriorities.includes('P2')}
            onChange={() => onTogglePriority('P2')}
          />
          P2
        </label>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {([
          ['P0', weeklyTrend.current.p0, weeklyTrend.previous.p0, weeklyTrend.delta.p0],
          ['P1', weeklyTrend.current.p1, weeklyTrend.previous.p1, weeklyTrend.delta.p1],
          ['P2', weeklyTrend.current.p2, weeklyTrend.previous.p2, weeklyTrend.delta.p2],
        ] as const).map(([label, current, previous, delta]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
            <div className="font-semibold text-slate-900">
              {label} · {tr('本周', 'This week')}: {current}
            </div>
            <div className="mt-0.5 text-slate-600">
              {tr('上周', 'Last week')}: {previous}
            </div>
            <div className={`mt-0.5 font-semibold ${delta > 0 ? 'text-rose-700' : delta < 0 ? 'text-emerald-700' : 'text-slate-600'}`}>
              {tr('环比', 'WoW')}: {delta > 0 ? '+' : ''}
              {delta}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="text-sm font-semibold text-rose-900">
            {tr('连续下滑', 'Consecutive decline')} ({declinedStudents.length})
          </div>
          <WarningList
            locale={locale}
            items={declinedStudents}
            emptyText={tr('当前筛选下暂无符合“最近3次中至少2次下降”的学生。', 'No students matched recent-3 decline criteria.')}
          />
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-sm font-semibold text-amber-900">
            {tr('临界学生（60%-70%）', 'Attention (60%-70%)')} ({attentionStudents.length})
          </div>
          <WarningList
            locale={locale}
            items={attentionStudents}
            emptyText={tr('当前筛选下暂无临界学生。', 'No attention-band students under current filters.')}
          />
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="text-sm font-semibold text-red-900">
            {tr('高风险学生（<60%）', 'High risk (<60%)')} ({highRiskStudents.length})
          </div>
          <WarningList
            locale={locale}
            items={highRiskStudents}
            emptyText={tr('当前筛选下暂无高风险学生。', 'No high-risk students under current filters.')}
          />
        </div>
      </div>
    </div>
  );
}
