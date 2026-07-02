'use client';

import type { JSX } from 'react';

export interface ImportFiltersCardProps {
  locale: 'zh' | 'en';
  savedAtText: string;
  levelOptions: string[];
  selectedLevel: string;
  onLevelChange: (value: string) => void;
  classOptions: string[];
  selectedClass: string;
  onClassChange: (value: string) => void;
  examDateOptions: string[];
  selectedExamDate: string;
  onExamDateChange: (value: string) => void;
  nameKeyword: string;
  onNameKeywordChange: (value: string) => void;
  showOnlyIssues: boolean;
  onShowOnlyIssuesChange: (checked: boolean) => void;
  onResetFilters: () => void;
  filteredSummaryText: string;
}

export function ImportFiltersCard(props: ImportFiltersCardProps): JSX.Element {
  const {
    locale,
    savedAtText,
    levelOptions,
    selectedLevel,
    onLevelChange,
    classOptions,
    selectedClass,
    onClassChange,
    examDateOptions,
    selectedExamDate,
    onExamDateChange,
    nameKeyword,
    onNameKeywordChange,
    showOnlyIssues,
    onShowOnlyIssuesChange,
    onResetFilters,
    filteredSummaryText,
  } = props;

  return (
    <>
      {savedAtText && <p className="text-xs text-slate-500">{savedAtText}</p>}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {locale === 'zh' ? '数据筛选' : 'Filters'}
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="text-xs font-semibold text-slate-600">
            <span className="mb-1 block">{locale === 'zh' ? '考试级别' : 'Exam level'}</span>
            <select value={selectedLevel} onChange={(event) => onLevelChange(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
              <option value="ALL">{locale === 'zh' ? '全部级别' : 'All levels'}</option>
              {levelOptions.map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            <span className="mb-1 block">{locale === 'zh' ? '班级' : 'Class'}</span>
            <select value={selectedClass} onChange={(event) => onClassChange(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
              <option value="ALL">{locale === 'zh' ? '全部班级' : 'All classes'}</option>
              {classOptions.map((className) => <option key={className} value={className}>{className}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            <span className="mb-1 block">{locale === 'zh' ? '考试日期' : 'Exam date'}</span>
            <select value={selectedExamDate} onChange={(event) => onExamDateChange(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
              <option value="ALL">{locale === 'zh' ? '全部日期' : 'All dates'}</option>
              {examDateOptions.map((examDate) => <option key={examDate} value={examDate}>{examDate}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            <span className="mb-1 block">{locale === 'zh' ? '学生姓名' : 'Student name'}</span>
            <input value={nameKeyword} onChange={(event) => onNameKeywordChange(event.target.value)} placeholder={locale === 'zh' ? '输入姓名关键词' : 'Enter a name'} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700" />
          </label>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={showOnlyIssues}
                onChange={(event) => onShowOnlyIssuesChange(event.target.checked)}
              />
              {locale === 'zh' ? '仅看异常行' : 'Issues only'}
            </label>
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              {locale === 'zh' ? '重置' : 'Reset'}
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">{filteredSummaryText}</p>
      </div>
    </>
  );
}
