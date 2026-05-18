use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { KetMatchingProfilesPanel } from '@/components/ket/KetMatchingProfilesPanel';
import type { KetMatchingExerciseSet } from '@/lib/ketMatchingTypes';

interface KetMatchingSessionProps {
  exercise: KetMatchingExerciseSet;
  backHref: string;
}

function optionClass(selected: boolean, isCorrect: boolean, isWrong: boolean, locked: boolean): string {
  const base = 'flex flex-col items-center justify-center rounded-lg border-2 px-2 py-3 text-center transition-colors min-h-[72px]';
  if (!locked) {
    return base + ' border-slate-300 bg-white hover:border-blue-700 hover:bg-blue-50 cursor-pointer';
  }
  if (isCorrect) {
    return base + ' border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20';
  }
  if (isWrong) {
    return base + ' border-red-500 bg-red-50 text-red-800';
  }
  return base + ' border-slate-200 bg-slate-50 text-slate-400 opacity-60';
}

export function KetMatchingSession({ exercise, backHref }: KetMatchingSessionProps): JSX.Element {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [finished, setFinished] = useState(false);

  const question = exercise.questions[index];
  const total = exercise.questions.length;

  const correctCount = useMemo(() => {
    return exercise.questions.filter((q) => answers[q.id] === q.correctPersonId).length;
  }, [answers, exercise.questions]);

  const progressLabel = finished ? '已完成' : `第 ${index + 1} / ${total} 题 · 试卷 Q${question?.examNumber ?? ''}`;

  if (finished) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
        <h2 className="text-2xl font-bold text-slate-900">本次练习完成</h2>
        <p className="mt-3 text-slate-600">
          共 {total} 题，答对 {correctCount} 题（正确率 {Math.round((correctCount / total) * 100)}%）。
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={backHref} className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-700">
            返回套卷列表
          </Link>
          <button type="button" onClick={() => window.location.reload()} className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">
            再练一遍
          </button>
        </div>
      </div>
    );
  }

  if (!question) {
    return <p className="py-10 text-center text-slate-600">暂无题目。</p>;
  }

  const locked = Boolean(revealed[question.id]);
  const selectedId = answers[question.id];

  const handlePick = (personId: string): void => {
    if (locked) return;
    setAnswers((prev) => ({ ...prev, [question.id]: personId }));
    setRevealed((prev) => ({ ...prev, [question.id]: true }));
  };

  const handleNext = (): void => {
    if (index + 1 >= total) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
  };

  const progressWidth = `${((index + (locked ? 1 : 0)) / total) * 100}%`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-blue-700">{progressLabel}</span>
        <div className="h-2 max-w-xs flex-1 overflow-hidden rounded-full bg-slate-200">
          <Bar className="h-full bg-blue-600 transition-all duration-300" style={{ width: progressWidth }} />
        </div>
      </div>

      <KetMatchingProfilesPanel
        topicTitle={exercise.topicTitle}
        topicSubtitle={exercise.topicSubtitle}
        profiles={exercise.profiles}
      />

      
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5">
        <p className="mb-4 text-base font-bold text-slate-900">
          <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-sm text-white">
            {question.examNumber}
          </span>
          {question.question}
        </p>
        
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {exercise.profiles.map((person) => {
            const isSelected = selectedId === person.id;
            const isCorrect = locked && person.id === question.correctPersonId;
            const isWrong = locked && isSelected && person.id !== question.correctPersonId;
            return (
              <button
                key={person.id}
                type="button"
                onClick={() => handlePick(person.id)}
                className={optionClass(isSelected, isCorrect, isWrong, locked)}
              >
                <span className="text-lg font-black text-slate-700">{person.columnLetter}</span>
                <span className="mt-1 text-sm font-semibold">{person.name}</span>
              </button>
            );
          })}
        </div>
        {locked ? (
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
            <p className={`font-bold ${selectedId === question.correctPersonId ? 'text-emerald-700' : 'text-red-700'}`}>
              {selectedId === question.correctPersonId ? '回答正确' : '回答有误'}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">解析：</span>
              {question.explanationZh}
            </p>
            <button
              type="button"
              onClick={handleNext}
              className="mt-4 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
            >
              {index + 1 >= total ? '查看结果' : '下一题'}
            </button>
          </div>
        ) : null}

      </div>

    </div>
  );
}
