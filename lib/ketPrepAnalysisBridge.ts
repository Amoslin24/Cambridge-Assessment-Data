import type { CambridgePartKey } from '@/lib/cambridgeEngine';
import { partKeyToSlug } from '@/lib/ketPrep';

/** 分析面板 → KET 练习推荐（预留接入 exam records / 题段正确率） */
export interface KetPracticeRecommendation {
  partKey: CambridgePartKey;
  practicePath: string;
  reasonZh: string;
  accuracyRate: number;
}

const DEFAULT_WEAK_THRESHOLD = 0.6;

/**
 * 根据题段正确率生成 KET 练习推荐列表。
 * 后续可由 `/analysis` 在筛选 KET 学生后调用，并跳转至 `practicePath`。
 */
export function buildKetRecommendationsFromPartAccuracy(
  partAccuracies: Array<{ partKey: CambridgePartKey; accuracyRate: number }>,
  weakThreshold = DEFAULT_WEAK_THRESHOLD,
): KetPracticeRecommendation[] {
  return partAccuracies
    .filter((item) => item.accuracyRate < weakThreshold)
    .sort((a, b) => a.accuracyRate - b.accuracyRate)
    .map((item) => ({
      partKey: item.partKey,
      practicePath: `/ket/practice/${partKeyToSlug(item.partKey)}`,
      reasonZh: `该题段正确率约 ${Math.round(item.accuracyRate * 100)}%，低于 ${Math.round(weakThreshold * 100)}% 预警线，建议完成同类强化练习。`,
      accuracyRate: item.accuracyRate,
    }));
}
