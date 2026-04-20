import { extractConvertedTotal, pickLatestRecordPerStudent } from '@/lib/convertedTotalDistribution';
import type { CambridgeExamRecord } from '@/lib/cambridgeEngine';
import type { UiLocale } from '@/lib/convertedTotalDistribution';

export type ClassMacroMode = 'YLE' | 'MSE' | 'MIXED' | 'EMPTY';

export interface StratificationRow {
  tier: string;
  count: number;
  percent: number;
}

export interface DeltaHistogramBin {
  bucket: string;
  count: number;
}

export interface ClassProgressAggregate {
  eligibleStudents: number;
  singleExamStudents: number;
  meanDelta: number | null;
  medianDelta: number | null;
  improvedCount: number;
  declinedCount: number;
  stableCount: number;
  deltaHistogram: DeltaHistogramBin[];
}

export interface ClassMacroAnalytics {
  mode: ClassMacroMode;
  studentCount: number;
  examRecordCount: number;
  latestTotalMean: number | null;
  latestTotalMedian: number | null;
  stratification: StratificationRow[];
  progress: ClassProgressAggregate | null;
  notes: string[];
}

function tr(locale: UiLocale, zhText: string, enText: string): string {
  return locale === 'zh' ? zhText : enText;
}

function getYleTierOrder(locale: UiLocale): string[] {
  return [
    tr(locale, '待加强（总盾 0–5）', 'Needs support (total shields 0-5)'),
    tr(locale, '巩固段（总盾 6–7）', 'Consolidating (total shields 6-7)'),
    tr(locale, '稳定良好（总盾 8–9）', 'Stable good (total shields 8-9)'),
    tr(locale, '高水平（总盾 10）', 'High performance (total shields 10)'),
  ];
}

function getMseTierOrder(locale: UiLocale): string[] {
  return [
    tr(locale, '待加强（量表分值＜120）', 'Needs support (scale < 120)'),
    tr(locale, '达标发展（120–139）', 'Developing (120-139)'),
    tr(locale, '中等（140–149）', 'Intermediate (140-149)'),
    tr(locale, '良好（150–159）', 'Good (150-159)'),
    tr(locale, '优秀（≥160）', 'Excellent (>=160)'),
  ];
}

function yleTierLabel(total: number, locale: UiLocale): string {
  const YLE_TIER_ORDER = getYleTierOrder(locale);
  const v = Math.round(total);
  if (v <= 5) {
    return YLE_TIER_ORDER[0]!;
  }
  if (v <= 7) {
    return YLE_TIER_ORDER[1]!;
  }
  if (v <= 9) {
    return YLE_TIER_ORDER[2]!;
  }
  return YLE_TIER_ORDER[3]!;
}

function mseTierLabel(score: number, locale: UiLocale): string {
  const MSE_TIER_ORDER = getMseTierOrder(locale);
  if (score < 120) {
    return MSE_TIER_ORDER[0]!;
  }
  if (score < 140) {
    return MSE_TIER_ORDER[1]!;
  }
  if (score < 150) {
    return MSE_TIER_ORDER[2]!;
  }
  if (score < 160) {
    return MSE_TIER_ORDER[3]!;
  }
  return MSE_TIER_ORDER[4]!;
}

function median(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid]!;
  }
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function buildStratificationRows(latestRecords: CambridgeExamRecord[], mode: 'YLE' | 'MSE', locale: UiLocale): StratificationRow[] {
  const order = mode === 'YLE' ? getYleTierOrder(locale) : getMseTierOrder(locale);
  const counts = new Map<string, number>();
  order.forEach((tier) => counts.set(tier, 0));
  latestRecords.forEach((record) => {
    const v = extractConvertedTotal(record);
    const label = mode === 'YLE' ? yleTierLabel(v, locale) : mseTierLabel(v, locale);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  const total = latestRecords.length;
  return order.map((tier) => {
    const count = counts.get(tier) ?? 0;
    return {
      tier,
      count,
      percent: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    };
  });
}

function buildDeltaHistogram(deltas: number[], mode: 'YLE' | 'MSE'): DeltaHistogramBin[] {
  if (deltas.length === 0) {
    return [];
  }
  if (mode === 'YLE') {
    const bins = new Map<number, number>();
    for (let i = -5; i <= 5; i += 1) {
      bins.set(i, 0);
    }
    deltas.forEach((d) => {
      const k = Math.max(-5, Math.min(5, Math.round(d)));
      bins.set(k, (bins.get(k) ?? 0) + 1);
    });
    return Array.from(bins.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([k, count]) => ({
        bucket: k === 0 ? '0' : k > 0 ? `+${k}` : `${k}`,
        count,
      }));
  }
  const labels = ['≤-20', '(-20,-10]', '(-10,0]', '(0,10]', '(10,20]', '(20,30]', '>30'];
  const counts = [0, 0, 0, 0, 0, 0, 0];
  deltas.forEach((d) => {
    if (d <= -20) {
      counts[0] += 1;
    } else if (d <= -10) {
      counts[1] += 1;
    } else if (d <= 0) {
      counts[2] += 1;
    } else if (d <= 10) {
      counts[3] += 1;
    } else if (d <= 20) {
      counts[4] += 1;
    } else if (d <= 30) {
      counts[5] += 1;
    } else {
      counts[6] += 1;
    }
  });
  return labels.map((bucket, i) => ({ bucket, count: counts[i]! }));
}

export function buildClassMacroAnalytics(
  allFiltered: CambridgeExamRecord[],
  locale: UiLocale = 'zh',
): ClassMacroAnalytics {
  const notes: string[] = [
    tr(
      locale,
      '进步口径：在当前筛选时间范围内，每位学生以「最近一次考试」的换算口径为准，取该口径下时间最早与最晚各一条记录计算分差；仅 1 条记录者计入「单次考试」人数。',
      'Progress rule: within current date filters, each student is evaluated by the conversion mode of the latest exam, using earliest and latest records under that same mode for delta; students with only one record are counted as single-exam students.',
    ),
  ];

  if (allFiltered.length === 0) {
    return {
      mode: 'EMPTY',
      studentCount: 0,
      examRecordCount: 0,
      latestTotalMean: null,
      latestTotalMedian: null,
      stratification: [],
      progress: null,
      notes,
    };
  }

  const latestPerStudent = pickLatestRecordPerStudent(allFiltered);
  const hasYLE = latestPerStudent.some((r) => r.convertedResult.mode === 'YLE_SHIELDS');
  const hasMSE = latestPerStudent.some((r) => r.convertedResult.mode === 'MSE_SCALE');

  if (hasYLE && hasMSE) {
    return {
      mode: 'MIXED',
      studentCount: latestPerStudent.length,
      examRecordCount: allFiltered.length,
      latestTotalMean: null,
      latestTotalMedian: null,
      stratification: [],
      progress: null,
      notes: [
        tr(
          locale,
          '当前样本中，学生最近一次考试同时存在 YLE 与 MSE 两种口径。请按「级别」筛选后再查看班级分层与进步汇总。',
          'Latest exams in current samples include both YLE and MSE scales. Please filter by level before reviewing class stratification and progress.',
        ),
        ...notes,
      ],
    };
  }

  const mode: 'YLE' | 'MSE' = hasYLE ? 'YLE' : 'MSE';
  const latestTotals = latestPerStudent.map((r) => extractConvertedTotal(r));
  const mean = latestTotals.reduce((a, b) => a + b, 0) / latestTotals.length;
  const med = median(latestTotals);
  const stratification = buildStratificationRows(latestPerStudent, mode, locale);

  const names = Array.from(new Set(allFiltered.map((r) => r.name)));
  const deltas: number[] = [];
  let singleExamStudents = 0;
  let improvedCount = 0;
  let declinedCount = 0;
  let stableCount = 0;

  names.forEach((name) => {
    const list = allFiltered
      .filter((r) => r.name === name)
      .sort(
        (a, b) =>
          new Date(a.examDate || '1970-01-01').getTime() - new Date(b.examDate || '1970-01-01').getTime(),
      );
    if (list.length === 0) {
      return;
    }
    const latestRec = list[list.length - 1]!;
    const targetMode = latestRec.convertedResult.mode;
    const series = list.filter((r) => r.convertedResult.mode === targetMode);
    if (series.length < 2) {
      singleExamStudents += 1;
      return;
    }
    const firstV = extractConvertedTotal(series[0]!);
    const lastV = extractConvertedTotal(series[series.length - 1]!);
    const delta = lastV - firstV;
    deltas.push(delta);
    if (delta > 0) {
      improvedCount += 1;
    } else if (delta < 0) {
      declinedCount += 1;
    } else {
      stableCount += 1;
    }
  });

  const eligibleStudents = deltas.length;
  const meanDelta =
    eligibleStudents > 0 ? Math.round((deltas.reduce((a, b) => a + b, 0) / eligibleStudents) * 10) / 10 : null;
  const medianRaw = median(deltas);
  const medianDelta = medianRaw !== null ? Math.round(medianRaw * 10) / 10 : null;

  return {
    mode,
    studentCount: latestPerStudent.length,
    examRecordCount: allFiltered.length,
    latestTotalMean: Math.round(mean * 10) / 10,
    latestTotalMedian: med !== null ? Math.round(med * 10) / 10 : null,
    stratification,
    progress: {
      eligibleStudents,
      singleExamStudents,
      meanDelta,
      medianDelta,
      improvedCount,
      declinedCount,
      stableCount,
      deltaHistogram: buildDeltaHistogram(deltas, mode),
    },
    notes,
  };
}
