'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { KetReadingPromptView } from '@/components/ket/prompts/KetReadingPrompt';
import type { KetDemoExerciseSet, KetMcqItem } from '@/lib/ketPrep';
import { resolveKetMcqDisplay } from '@/lib/ketMcqDisplay';
import type { KetReadingPrompt } from '@/lib/ketPromptTypes';

interface KetMcqSessionProps {
  exercise: KetDemoExerciseSet;
  backHref: string;
}

const OPTION_LABELS = ['A', 'B', 'C'] as const;

function optionButtonClass(
  option: string,
  item: KetMcqItem,
  selected: string | null,
  revealed: boolean,
): string {
  const base = 'flex w-full gap-3 rounded-xl border-2 p-4 text-left text-base transition-colors';
  if (!revealed) {
    return `${base} border-slate-300 bg-white text-slate-900 hover:border-blue-700 hover:bg-blue-50`;
  }
  if (option === item.correctAnswer) {
    return `${base} border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20`;
  }
  if (option === selected) {
    return `${base} border-red-500 bg-red-50 text-red-800`;
  }
  return `${base} border-slate-200 bg-slate-50 text-slate-400 opacity-70`;
}

function FooterLinks({ backHref }: { backHref: string }): JSX.Element {
  return (
    <div className="mt-6 flex flex-wrap justify-center gap-3">
      <Link
        href={backHref}
        className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-700 hover:text-blue-700"
      >
        返回套卷列表
      </Link>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
      >
        再练一遍
      </button>
    </div>
  );
}

export function KetMcqSession({ exercise, backHref }: KetMcqSessionProps): JSX.Element {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const item = exercise.items[index];
  const total = exercise.items.length;
  const display = item ? resolveKetMcqDisplay(item) : null;

  const progressLabel = useMemo(() => {
    if (finished) {
      return '已完成';
    }
    return `第 ${index + 1} / ${total} 题`;
  }, [finished, index, total]);

  const handleSelect = (option: string): void => {
    if (revealed || !item) {
      return;
    }
    setSelected(option);
    setRevealed(true);
    if (option === item.correctAnswer) {
      setCorrectCount((count) => count + 1);
    }
  };

  const handleNext = (): void => {
    if (index + 1 >= total) {
      setFinished(true);
      return;
    }
    setIndex((current) => current + 1);
    setSelected(null);
    setRevealed(false);
  };

  if (finished) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
        <h2 className="text-2xl font-bold text-slate-900">本次练习完成</h2>
        <p className="mt-3 text-slate-600">
          共 {total} 题，答对 {correctCount} 题（正确率 {Math.round((correctCount / total) * 100)}%）。
        </p>
        <FooterLinks backHref={backHref} />
      </div>
    );
  }

  if (!item || !display) {
    return <p className="py-10 text-center text-slate-600">暂无题目数据。</p>;
  }

  const progressWidth = `${((index + (revealed ? 1 : 0)) / total) * 100}%`;
  const promptToShow: KetReadingPrompt =
    display.prompt ??
    (display.legacyStem
      ? { variant: 'plain', text: display.legacyStem }
      : { variant: 'plain', text: display.question });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-blue-700">{progressLabel}</span>
        <div className="h-2 max-w-xs flex-1 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: progressWidth }} />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="grid gap-0 lg:grid-cols-2">
          <div className="border-b border-slate-200 lg:border-b-0 lg:border-r">
            <KetReadingPromptView prompt={promptToShow} />
          </div>
          <div className="flex flex-col justify-center p-6 md:p-8">
            {display.question ? (
              <p className="mb-5 text-lg font-semibold leading-snug text-slate-900">{display.question}</p>
            ) : null}
            <div className="grid gap-3">
              {item.options.map((option, optionIndex) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={optionButtonClass(option, item, selected, revealed)}
                >
                  <span className="shrink-0 font-bold text-slate-500">
                    {OPTION_LABELS[optionIndex] ?? String(optionIndex + 1)}.
                  </span>
                  <span>{option}</span>
                </button>
              ))}
            </div>
            {revealed ? (
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className={`font-bold ${selected === item.correctAnswer ? 'text-emerald-700' : 'text-red-700'}`}>
                  {selected === item.correctAnswer ? '回答正确' : '回答有误'}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  <span className="font-semibold text-slate-900">解析：</span>
                  {item.explanationZh}
                </p>
                <button
                  type="button"
                  onClick={handleNext}
                  className="mt-4 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
                >
                  {index + 1 >= total ? '查看结果' : '下一题'}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
