import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import type { KetExerciseSet, KetMcqExerciseSet } from '@/lib/ketExerciseTypes';
import { getKetPartDataSlug, isKetMcqExerciseSet } from '@/lib/ketExerciseTypes';
import type { KetMatchingExerciseSet, KetMatchingPerson, KetMatchingQuestion } from '@/lib/ketMatchingTypes';
import { KET_R_P2_REQUIRED_QUESTION_COUNT } from '@/lib/ketMatchingTypes';
import type { KetMcqItem } from '@/lib/ketPrep';
import type { KetExerciseSummary } from '@/lib/ketPracticeTypes';
import { isKetReadingPrompt } from '@/lib/ketPromptTypes';
import { KET_READING_R_P1_PART_KEY, KET_R_P1_REQUIRED_ITEM_COUNT } from '@/lib/ketPracticeTypes';
import type { ReadingPartKey } from '@/lib/cambridgeEngine';

interface KetMcqImportFile {
  part_key?: string;
  task_type?: 'mcq';
  title_zh: string;
  source_label?: string;
  pdf_ref?: string;
  sort_order?: number;
  is_published?: boolean;
  items: Array<{
    order_index: number;
    prompt?: unknown;
    question?: string;
    stem?: string;
    options: string[];
    correct_answer: string;
    explanation_zh?: string;
  }>;
}

interface KetMatchingImportFile {
  part_key: 'R_P2';
  task_type: 'matching';
  title_zh: string;
  source_label?: string;
  pdf_ref?: string;
  sort_order?: number;
  is_published?: boolean;
  topic_title: string;
  topic_subtitle: string;
  people: Array<{
    id: string;
    name: string;
    column_letter: string;
    paragraph: string;
    initials?: string;
    image_src?: string;
  }>;
  questions: Array<{
    exam_number: number;
    question: string;
    correct_person_id: string;
    explanation_zh?: string;
  }>;
}

function getLocalDataDir(partKey: string): string {
  const slug = partKey.includes('_') ? getKetPartDataSlug(partKey as ReadingPartKey) : partKey;
  return path.join(process.cwd(), 'data', 'ket', slug);
}

function importMcqSummary(fileName: string, payload: KetMcqImportFile): KetExerciseSummary | null {
  if (payload.is_published === false) {
    return null;
  }
  return {
    id: fileName.replace(/\.json$/i, ''),
    titleZh: payload.title_zh,
    sourceLabel: payload.source_label ?? null,
    pdfRef: payload.pdf_ref ?? null,
    itemCount: payload.items.length,
    sortOrder: payload.sort_order ?? 0,
    taskType: 'mcq',
  };
}

function importMatchingSummary(fileName: string, payload: KetMatchingImportFile): KetExerciseSummary | null {
  if (payload.is_published === false) {
    return null;
  }
  return {
    id: fileName.replace(/\.json$/i, ''),
    titleZh: payload.title_zh,
    sourceLabel: payload.source_label ?? null,
    pdfRef: payload.pdf_ref ?? null,
    itemCount: payload.questions.length,
    sortOrder: payload.sort_order ?? 0,
    taskType: 'matching',
  };
}

function importMcqSet(fileName: string, payload: KetMcqImportFile): KetMcqExerciseSet | null {
  if (payload.is_published === false) {
    return null;
  }
  const items: KetMcqItem[] = payload.items
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .map((item) => ({
      id: `${fileName}-q${item.order_index}`,
      prompt: item.prompt && isKetReadingPrompt(item.prompt) ? item.prompt : undefined,
      question: item.question ?? '',
      stem: item.stem,
      options: item.options,
      correctAnswer: item.correct_answer,
      explanationZh: item.explanation_zh ?? '暂无解析。',
    }));

  const source = payload.source_label ? `来源：${payload.source_label}。` : '';
  const expected = KET_R_P1_REQUIRED_ITEM_COUNT;

  return {
    taskType: 'mcq',
    partKey: KET_READING_R_P1_PART_KEY,
    titleZh: payload.title_zh,
    introZh:
      items.length === expected
        ? `${source}本套共 ${items.length} 题（本地 JSON 题库）。`
        : `${source}本套共 ${items.length} 题（官方 R_P1 通常为 ${expected} 题，请核对 PDF）。`,
    items,
  };
}

function importMatchingSet(fileName: string, payload: KetMatchingImportFile): KetMatchingExerciseSet | null {
  if (payload.is_published === false) {
    return null;
  }

  const profiles: KetMatchingPerson[] = payload.people.map((person) => ({
    id: person.id,
    name: person.name,
    columnLetter: person.column_letter,
    paragraph: person.paragraph,
    initials: person.initials ?? person.name.charAt(0).toUpperCase(),
    imageSrc: person.image_src,
  }));

  const questions: KetMatchingQuestion[] = payload.questions
    .slice()
    .sort((a, b) => a.exam_number - b.exam_number)
    .map((q) => ({
      id: `${fileName}-q${q.exam_number}`,
      examNumber: q.exam_number,
      question: q.question,
      correctPersonId: q.correct_person_id,
      explanationZh: q.explanation_zh ?? '暂无解析。',
    }));

  const source = payload.source_label ? `来源：${payload.source_label}。` : '';
  const expected = KET_R_P2_REQUIRED_QUESTION_COUNT;

  return {
    taskType: 'matching',
    partKey: 'R_P2',
    titleZh: payload.title_zh,
    introZh:
      questions.length === expected
        ? `${source}本套共 ${questions.length} 道匹配题（Q7–Q13，本地 JSON 题库）。`
        : `${source}本套共 ${questions.length} 道题（官方 R_P2 通常为 ${expected} 题，请核对 PDF）。`,
    topicTitle: payload.topic_title,
    topicSubtitle: payload.topic_subtitle,
    profiles,
    questions,
  };
}

function parseImportFile(
  fileName: string,
  raw: string,
): { summary: KetExerciseSummary; exercise: KetExerciseSet } | null {
  const parsed = JSON.parse(raw) as KetMcqImportFile | KetMatchingImportFile;
  if (parsed.task_type === 'matching' || parsed.part_key === 'R_P2') {
    const payload = parsed as KetMatchingImportFile;
    const summary = importMatchingSummary(fileName, payload);
    const exercise = importMatchingSet(fileName, payload);
    if (!summary || !exercise) {
      return null;
    }
    return { summary, exercise };
  }
  const payload = parsed as KetMcqImportFile;
  const summary = importMcqSummary(fileName, payload);
  const exercise = importMcqSet(fileName, payload);
  if (!summary || !exercise) {
    return null;
  }
  return { summary, exercise };
}

async function readLocalImportFiles(partKey: ReadingPartKey): Promise<
  Array<{ fileName: string; summary: KetExerciseSummary; exercise: KetExerciseSet }>
> {
  const dir = getLocalDataDir(partKey);
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return [];
  }

  const results: Array<{ fileName: string; summary: KetExerciseSummary; exercise: KetExerciseSet }> = [];
  for (const name of names) {
    if (!name.endsWith('.json') || name.startsWith('_')) {
      continue;
    }
    try {
      const raw = await readFile(path.join(dir, name), 'utf8');
      const parsed = parseImportFile(name, raw);
      if (parsed && parsed.exercise.partKey === partKey) {
        results.push({ fileName: name, ...parsed });
      }
    } catch {
      /* skip invalid */
    }
  }
  return results;
}

export async function listLocalKetExercises(partKey: ReadingPartKey): Promise<KetExerciseSummary[]> {
  const files = await readLocalImportFiles(partKey);
  return files
    .map((f) => f.summary)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.titleZh.localeCompare(b.titleZh, 'zh'));
}

export async function countLocalKetExercises(partKey: ReadingPartKey): Promise<number> {
  return (await listLocalKetExercises(partKey)).length;
}

export async function getLocalKetExerciseSet(exerciseId: string, partKey?: ReadingPartKey): Promise<KetExerciseSet | null> {
  const bases = partKey
    ? [getLocalDataDir(partKey)]
    : [getLocalDataDir(KET_READING_R_P1_PART_KEY), getLocalDataDir('R_P2')];

  const fileName = exerciseId.endsWith('.json') ? exerciseId : `${exerciseId}.json`;

  for (const dir of bases) {
    try {
      const raw = await readFile(path.join(dir, fileName), 'utf8');
      const parsed = parseImportFile(fileName, raw);
      if (parsed) {
        return parsed.exercise;
      }
    } catch {
      /* try next dir */
    }
  }
  return null;
}
