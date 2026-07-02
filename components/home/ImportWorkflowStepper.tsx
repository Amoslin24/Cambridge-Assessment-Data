'use client';

import type { JSX } from 'react';
import type { ImportStep } from '@/lib/importHomeTypes';

interface StepItem {
  key: ImportStep;
  zh: string;
  en: string;
}

const STEPS: StepItem[] = [
  { key: 'prepare', zh: '准备模板', en: 'Prepare' },
  { key: 'upload', zh: '上传文件', en: 'Upload' },
  { key: 'review', zh: '检查确认', en: 'Review' },
  { key: 'result', zh: '查看结果', en: 'Results' },
];

export interface ImportWorkflowStepperProps {
  locale: 'zh' | 'en';
  activeStep: ImportStep;
  pendingReady: boolean;
  resultReady: boolean;
  onStepChange: (step: ImportStep) => void;
}

export function ImportWorkflowStepper(props: ImportWorkflowStepperProps): JSX.Element {
  const { locale, activeStep, pendingReady, resultReady, onStepChange } = props;
  const activeIndex = STEPS.findIndex((item) => item.key === activeStep);

  function isEnabled(step: ImportStep): boolean {
    if (step === 'review') {
      return pendingReady;
    }
    if (step === 'result') {
      return resultReady;
    }
    return true;
  }

  return (
    <nav aria-label={locale === 'zh' ? '导入步骤' : 'Import steps'} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STEPS.map((item, index) => {
          const active = item.key === activeStep;
          const completed = index < activeIndex || (item.key === 'result' && resultReady && activeStep !== 'result');
          const enabled = isEnabled(item.key);
          return (
            <li key={item.key}>
              <button
                type="button"
                disabled={!enabled}
                onClick={() => onStepChange(item.key)}
                aria-current={active ? 'step' : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40 ${active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${active ? 'bg-white text-slate-900' : completed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {completed ? '✓' : index + 1}
                </span>
                <span className="text-sm font-bold">{locale === 'zh' ? item.zh : item.en}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
