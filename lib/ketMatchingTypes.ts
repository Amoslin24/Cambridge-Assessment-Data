import type { ReadingPartKey } from '@/lib/cambridgeEngine';

export const KET_READING_R_P2_PART_KEY: ReadingPartKey = 'R_P2';

/** 官方 Part 2 为 7 道匹配题（Q7–Q13） */
export const KET_R_P2_REQUIRED_QUESTION_COUNT = 7;

export interface KetMatchingPerson {
  id: string;
  name: string;
  /** 考卷列选项字母：A / B / C */
  columnLetter: string;
  paragraph: string;
  /** 头像占位（可选，如 /ket/avatars/frank.png） */
  imageSrc?: string;
  /** 无图片时用首字母 */
  initials?: string;
}

export interface KetMatchingQuestion {
  id: string;
  /** 试卷题号，如 7 */
  examNumber: number;
  question: string;
  correctPersonId: string;
  explanationZh: string;
}

export interface KetMatchingExerciseSet {
  taskType: 'matching';
  partKey: typeof KET_READING_R_P2_PART_KEY;
  titleZh: string;
  introZh: string;
  topicTitle: string;
  topicSubtitle: string;
  profiles: KetMatchingPerson[];
  questions: KetMatchingQuestion[];
}

export function isKetMatchingExerciseSet(
  exercise: { taskType?: string; profiles?: unknown },
): exercise is KetMatchingExerciseSet {
  return exercise.taskType === 'matching' && Array.isArray(exercise.profiles);
}
