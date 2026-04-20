import type { CambridgeExamRecord } from '@/lib/cambridgeEngine';

export type UiLocale = 'zh' | 'en';

export interface DistributionBarPoint {
  bucket: string;
  count: number;
}

export type ConvertedDistributionMode = 'YLE' | 'MSE' | 'MIXED' | 'EMPTY';

export interface ConvertedTotalDistribution {
  mode: ConvertedDistributionMode;
  data: DistributionBarPoint[];
  note: string;
}

export function extractConvertedTotal(record: CambridgeExamRecord): number {
  return record.convertedResult.value;
}

export function pickLatestRecordPerStudent(records: CambridgeExamRecord[]): CambridgeExamRecord[] {
  const latestByStudent = new Map<string, CambridgeExamRecord>();
  records.forEach((record) => {
    const key = record.name;
    const current = latestByStudent.get(key);
    if (!current) {
      latestByStudent.set(key, record);
      return;
    }
    const currentTime = new Date(current.examDate || '1970-01-01').getTime();
    const nextTime = new Date(record.examDate || '1970-01-01').getTime();
    if (Number.isNaN(nextTime)) {
      return;
    }
    if (Number.isNaN(currentTime) || nextTime >= currentTime) {
      latestByStudent.set(key, record);
    }
  });
  return Array.from(latestByStudent.values());
}

function tr(locale: UiLocale, zhText: string, enText: string): string {
  return locale === 'zh' ? zhText : enText;
}

export function buildConvertedTotalDistribution(
  records: CambridgeExamRecord[],
  locale: UiLocale = 'zh',
): ConvertedTotalDistribution {
  if (records.length === 0) {
    return { mode: 'EMPTY', data: [], note: tr(locale, '当前无可用于分布统计的数据。', 'No data available for distribution statistics.') };
  }

  const hasYLE = records.some((record) => record.convertedResult.mode === 'YLE_SHIELDS');
  const hasMSE = records.some((record) => record.convertedResult.mode === 'MSE_SCALE');
  if (hasYLE && hasMSE) {
    return {
      mode: 'MIXED',
      data: [],
      note: tr(
        locale,
        '当前筛选结果同时包含 YLE 与 MSE 记录。为避免口径混淆，请进一步筛选“级别”。',
        'Current filtered result includes both YLE and MSE records. Please filter by level to avoid scale ambiguity.',
      ),
    };
  }

  if (hasYLE) {
    const buckets: DistributionBarPoint[] = Array.from({ length: 11 }, (_, value) => ({
      bucket: String(value),
      count: 0,
    }));
    records.forEach((record) => {
      const value = Math.round(extractConvertedTotal(record));
      if (Number.isNaN(value)) {
        return;
      }
      if (value < 0 || value > 10) {
        return;
      }
      buckets[value].count += 1;
    });
    return {
      mode: 'YLE',
      data: buckets,
      note: tr(locale, '分箱为总盾牌数（0–10）。', 'Buckets represent total shields (0-10).'),
    };
  }

  const min = 80;
  const max = 190;
  const step = 5;
  const buckets: DistributionBarPoint[] = [];
  for (let start = min; start <= max; start += step) {
    const end = Math.min(start + step - 1, max);
    buckets.push({ bucket: `${start}-${end}`, count: 0 });
  }

  records.forEach((record) => {
    const rawValue = extractConvertedTotal(record);
    if (Number.isNaN(rawValue)) {
      return;
    }
    const value = Math.round(rawValue);
    if (value < min || value > max) {
      return;
    }
    const index = Math.floor((value - min) / step);
    if (index < 0 || index >= buckets.length) {
      return;
    }
    buckets[index].count += 1;
  });

  return {
    mode: 'MSE',
    data: buckets,
    note: tr(
      locale,
      '分箱为 Cambridge English Scale 总分（每 5 分一档，80–190）。',
      'Buckets represent Cambridge English Scale totals (5-point bins, 80-190).',
    ),
  };
}
