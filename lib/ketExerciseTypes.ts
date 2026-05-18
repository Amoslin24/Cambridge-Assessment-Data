import type { ReadingPartKey } from '@/lib/cambridgeEngine';
import type { KetMatchingExerciseSet } from '@/lib/ketMatchingTypes';
import type { KetDemoExerciseSet } from '@/lib/ketPrep';

export type KetMcqExerciseSet = KetDemoExerciseSet & { taskType?: 'mcq' };

export type KetExerciseSet = KetMcqExerciseSet | KetMatchingExerciseSet;

export function isKetMcqExerciseSet(exercise: KetExerciseSet): exercise is KetMcqExerciseSet {
  return !('profiles' in exercise);
}

export function getKetPartDataSlug(partKey: ReadingPartKey): string {
  return partKey.replace('_', '-').toLowerCase();
}
