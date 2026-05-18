import type { ReadingPartKey } from '@/lib/cambridgeEngine';
import type { KetDemoExerciseSet, KetMcqItem } from '@/lib/ketPrep';
import type { KetReadingPrompt } from '@/lib/ketPromptTypes';

/** Supabase `ket_exercises` 行（已发布套卷列表） */
export interface KetExerciseRow {
  id: string;
  level: string;
  part_key: string;
  title_zh: string;
  source_label: string | null;
  pdf_ref: string | null;
  item_count: number;
  is_published: boolean;
  sort_order: number;
}

/** Supabase `ket_items` 行 */
export interface KetItemRow {
  id: string;
  exercise_id: string;
  order_index: number;
  stem: string;
  options: string[] | string;
  correct_answer: string;
  explanation_zh: string | null;
}

export type KetExerciseTaskType = 'mcq' | 'matching';

export interface KetExerciseSummary {
  id: string;
  titleZh: string;
  sourceLabel: string | null;
  pdfRef: string | null;
  itemCount: number;
  sortOrder: number;
  taskType?: KetExerciseTaskType;
}

/** 从 PDF 录入后、执行导入脚本前的 JSON 文件格式（见 data/ket/r-p1/*.json） */
export interface KetExerciseImportFile {
  title_zh: string;
  source_label?: string;
  pdf_ref?: string;
  sort_order?: number;
  is_published?: boolean;
  items: Array<{
    order_index: number;
    /** 视觉题干（推荐） */
    prompt?: KetReadingPrompt;
    /** 提问句 */
    question?: string;
    /** 旧版：整段文字题干 */
    stem?: string;
    options: string[];
    correct_answer: string;
    explanation_zh?: string;
  }>;
}

export const KET_READING_R_P1_PART_KEY: ReadingPartKey = 'R_P1';

export const KET_R_P1_REQUIRED_ITEM_COUNT = 6;

export type { KetDemoExerciseSet, KetMcqItem };
