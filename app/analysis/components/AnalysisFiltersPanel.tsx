'use client';

import type { JSX } from 'react';

export interface AnalysisFiltersPanelProps {
  locale: 'zh' | 'en';
  studentOptions: string[];
  selectedStudent: string;
  onStudentChange: (value: string) => void;
  levelOptions: string[];
  selectedLevel: string;
  onLevelChange: (value: string) => void;
  classOptions: string[];
  selectedClass: string;
  onClassChange: (value: string) => void;
  setOptions: string[];
  selectedSet: string;
  onSetChange: (value: string) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onApplyRecentDays: (days: number) => void;
  onApplyLatestExamWeek: () => void;
  onApplyCurrentSemester: () => void;
  onClearDateRange: () => void;
  showOnlyComparableSkills: boolean;
  onShowOnlyComparableSkillsChange: (checked: boolean) => void;
}

export function AnalysisFiltersPanel(props: AnalysisFiltersPanelProps): JSX.Element {
  const {
    locale,
    studentOptions,
    selectedStudent,
    onStudentChange,
    levelOptions,
    selectedLevel,
    onLevelChange,
    classOptions,
    selectedClass,
    onClassChange,
    setOptions,
    selectedSet,
    onSetChange,
    dateFrom,
    dateTo,
    onDateFromChange,
    onDateToChange,
    onApplyRecentDays,
    onApplyLatestExamWeek,
    onApplyCurrentSemester,
    onClearDateRange,
    showOnlyComparableSkills,
    onShowOnlyComparableSkillsChange,
  } = props;

  return (
    <>
      <div className="mt-8 grid gap-3 md:grid-cols-2">
        <select
          value={selectedStudent}
          onChange={(event) => onStudentChange(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="ALL">{locale === 'zh' ? '全部学生' : 'All students'}</option>
          {studentOptions.map((student) => (
            <option key={student} value={student}>
              {student}
            </option>
          ))}
        </select>
        <select
          value={selectedLevel}
          onChange={(event) => onLevelChange(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="ALL">{locale === 'zh' ? '全部级别' : 'All levels'}</option>
          {levelOptions.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <select
          value={selectedClass}
          onChange={(event) => onClassChange(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="ALL">{locale === 'zh' ? '全部班级' : 'All classes'}</option>
          {classOptions.map((className) => (
            <option key={className} value={className}>
              {className}
            </option>
          ))}
        </select>
        <select
          value={selectedSet}
          onChange={(event) => onSetChange(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="ALL">{locale === 'zh' ? '全部组别' : 'All sets'}</option>
          {setOptions.map((setName) => (
            <option key={setName} value={setName}>
              {setName}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(event) => onDateFromChange(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(event) => onDateToChange(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onApplyRecentDays(30)}
          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 hover:border-blue-700 hover:text-blue-700"
        >
          {locale === 'zh' ? '最近30天' : 'Last 30 days'}
        </button>
        <button
          type="button"
          onClick={() => onApplyRecentDays(90)}
          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 hover:border-blue-700 hover:text-blue-700"
        >
          {locale === 'zh' ? '最近90天' : 'Last 90 days'}
        </button>
        <button
          type="button"
          onClick={onApplyLatestExamWeek}
          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 hover:border-blue-700 hover:text-blue-700"
        >
          {locale === 'zh' ? '最近一次考试周' : 'Latest exam week'}
        </button>
        <button
          type="button"
          onClick={onApplyCurrentSemester}
          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 hover:border-emerald-700 hover:text-emerald-700"
        >
          {locale === 'zh' ? '本学期' : 'Current semester'}
        </button>
        <button
          type="button"
          onClick={onClearDateRange}
          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 hover:border-rose-700 hover:text-rose-700"
        >
          {locale === 'zh' ? '清除范围' : 'Clear range'}
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <input
          type="checkbox"
          checked={showOnlyComparableSkills}
          onChange={(event) => onShowOnlyComparableSkillsChange(event.target.checked)}
        />
        <span className="text-sm text-slate-700">
          {locale === 'zh'
            ? '仅显示有对比数据的技能与小题'
            : 'Show only skills/parts with comparable data'}
        </span>
      </div>
    </>
  );
}
