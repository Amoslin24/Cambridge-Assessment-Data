import { getPartRawMax, type CambridgePartKey, type ReadingPartKey } from '@/lib/cambridgeEngine';
import type { KetExerciseSet, KetMcqExerciseSet } from '@/lib/ketExerciseTypes';
import type { KetMcqItem } from '@/lib/ketPrep';
import {
  countLocalKetExercises,
  getLocalKetExerciseSet,
  listLocalKetExercises,
} from '@/lib/ketPrepLocalStore';
import type { KetExerciseRow, KetExerciseSummary, KetItemRow } from '@/lib/ketPracticeTypes';
import { KET_READING_R_P1_PART_KEY, KET_R_P1_REQUIRED_ITEM_COUNT } from '@/lib/ketPracticeTypes';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabaseServer';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseOptions(raw: KetItemRow['options']): string[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
      return parsed;
    }
  } catch {
    /* fall through */
  }
  return [];
}

function mapItemsToMcq(items: KetItemRow[]): KetMcqItem[] {
  return items
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .map((row) => ({
      id: row.id,
      question: '',
      stem: row.stem,
      options: parseOptions(row.options),
      correctAnswer: row.correct_answer,
      explanationZh: row.explanation_zh ?? '暂无解析。',
    }));
}

function mapExerciseRow(row: KetExerciseRow): KetExerciseSummary {
  return {
    id: row.id,
    titleZh: row.title_zh,
    sourceLabel: row.source_label,
    pdfRef: row.pdf_ref,
    itemCount: row.item_count,
    sortOrder: row.sort_order,
  };
}

async function countPublishedFromSupabase(partKey: string): Promise<number> {
  const client = createSupabaseServerClient();
  if (!client) {
    return 0;
  }
  try {
    const { count, error } = await client
      .from('ket_exercises')
      .select('id', { count: 'exact', head: true })
      .eq('level', 'KET')
      .eq('part_key', partKey)
      .eq('is_published', true);
    if (error) {
      console.error('[ketPrepRepository] countPublishedFromSupabase', error.message);
      return 0;
    }
    return count ?? 0;
  } catch (err) {
    console.error('[ketPrepRepository] countPublishedFromSupabase', err);
    return 0;
  }
}

async function listPublishedFromSupabase(partKey: string): Promise<KetExerciseSummary[]> {
  const client = createSupabaseServerClient();
  if (!client) {
    return [];
  }
  try {
    const { data, error } = await client
      .from('ket_exercises')
      .select('id, level, part_key, title_zh, source_label, pdf_ref, item_count, is_published, sort_order')
      .eq('level', 'KET')
      .eq('part_key', partKey)
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('title_zh', { ascending: true });
    if (error) {
      console.error('[ketPrepRepository] listPublishedFromSupabase', error.message);
      return [];
    }
    return (data as KetExerciseRow[]).map(mapExerciseRow);
  } catch (err) {
    console.error('[ketPrepRepository] listPublishedFromSupabase', err);
    return [];
  }
}

async function getExerciseSetFromSupabase(exerciseId: string): Promise<KetMcqExerciseSet | null> {
  const client = createSupabaseServerClient();
  if (!client) {
    return null;
  }
  try {
    const { data: exercise, error: exerciseError } = await client
      .from('ket_exercises')
      .select('id, level, part_key, title_zh, source_label, item_count, is_published')
      .eq('id', exerciseId)
      .eq('is_published', true)
      .maybeSingle();
    if (exerciseError || !exercise) {
      if (exerciseError) {
        console.error('[ketPrepRepository] getExerciseSetFromSupabase', exerciseError.message);
      }
      return null;
    }

    const { data: items, error: itemsError } = await client
      .from('ket_items')
      .select('id, exercise_id, order_index, stem, options, correct_answer, explanation_zh')
      .eq('exercise_id', exerciseId)
      .order('order_index', { ascending: true });
    if (itemsError || !items?.length) {
      if (itemsError) {
        console.error('[ketPrepRepository] getExerciseSetFromSupabase items', itemsError.message);
      }
      return null;
    }

    const partKey = exercise.part_key as CambridgePartKey;
    const mappedItems = mapItemsToMcq(items as KetItemRow[]);
    const expectedCount =
      partKey === KET_READING_R_P1_PART_KEY
        ? KET_R_P1_REQUIRED_ITEM_COUNT
        : getPartRawMax('KET', partKey);

    return {
      taskType: 'mcq',
      partKey,
      titleZh: exercise.title_zh,
      introZh: buildIntroZh(exercise.source_label, mappedItems.length, expectedCount, 'cloud'),
      items: mappedItems,
    };
  } catch (err) {
    console.error('[ketPrepRepository] getExerciseSetFromSupabase', err);
    return null;
  }
}

function buildIntroZh(
  sourceLabel: string | null,
  actual: number,
  expected: number,
  storage: 'cloud' | 'local',
): string {
  const source = sourceLabel ? `来源：${sourceLabel}。` : '';
  const storageNote = storage === 'local' ? '（本地 JSON 题库）' : '';
  if (actual === expected) {
    return `${source}本套共 ${actual} 题，格式对齐 A2 Key 阅读 Part 1（每题三选一）${storageNote}。`;
  }
  return `${source}本套共 ${actual} 题（官方该 Part 通常为 ${expected} 题，录入时请核对 PDF）${storageNote}。`;
}

export async function countPublishedKetExercises(partKey: ReadingPartKey): Promise<number> {
  const remote = await countPublishedFromSupabase(partKey);
  if (remote > 0) {
    return remote;
  }
  return countLocalKetExercises(partKey);
}

export async function listPublishedKetExercises(partKey: ReadingPartKey): Promise<KetExerciseSummary[]> {
  const remote = await listPublishedFromSupabase(partKey);
  if (remote.length > 0) {
    return remote;
  }
  return listLocalKetExercises(partKey);
}

export async function getKetExerciseSet(
  exerciseId: string,
  partKey?: ReadingPartKey,
): Promise<KetExerciseSet | null> {
  if (UUID_RE.test(exerciseId)) {
    const remote = await getExerciseSetFromSupabase(exerciseId);
    if (remote) {
      return remote;
    }
  }
  return getLocalKetExerciseSet(exerciseId, partKey);
}

export function getSupabasePracticeStatus(): {
  configured: boolean;
  usesLocalFallback: boolean;
} {
  return {
    configured: isSupabaseConfigured(),
    usesLocalFallback: true,
  };
}
