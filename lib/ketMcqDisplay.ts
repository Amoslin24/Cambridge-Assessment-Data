import type { KetMcqItem } from '@/lib/ketPrep';
import type { KetReadingPrompt } from '@/lib/ketPromptTypes';
import { isKetReadingPrompt } from '@/lib/ketPromptTypes';

export interface KetMcqDisplay {
  prompt: KetReadingPrompt | null;
  question: string;
  /** 无结构化 prompt 时的整段题干 */
  legacyStem: string | null;
}

export function resolveKetMcqDisplay(item: KetMcqItem): KetMcqDisplay {
  if (item.prompt && isKetReadingPrompt(item.prompt)) {
    return {
      prompt: item.prompt,
      question: item.question,
      legacyStem: null,
    };
  }
  if (item.stem) {
    return {
      prompt: null,
      question: item.question,
      legacyStem: item.stem,
    };
  }
  return {
    prompt: { variant: 'plain', text: item.question },
    question: item.question,
    legacyStem: null,
  };
}
