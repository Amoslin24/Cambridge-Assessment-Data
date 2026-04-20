import { getPartRawMax, type CambridgeExamRecord, type CambridgePartKey } from '@/lib/cambridgeEngine';
import {
  buildConvertedTotalDistribution,
  pickLatestRecordPerStudent,
  type ConvertedTotalDistribution,
} from '@/lib/convertedTotalDistribution';

const LEVEL_ORDER: CambridgeExamRecord['level'][] = [
  'Starters',
  'Movers',
  'Flyers',
  'KET',
  'PET',
  'FCE',
];

function sortLevels(levels: string[]): string[] {
  return [...levels].sort((a, b) => {
    const ia = LEVEL_ORDER.indexOf(a as CambridgeExamRecord['level']);
    const ib = LEVEL_ORDER.indexOf(b as CambridgeExamRecord['level']);
    const sa = ia === -1 ? 999 : ia;
    const sb = ib === -1 ? 999 : ib;
    return sa - sb;
  });
}

export interface DistributionByLevelRow {
  level: string;
  latestPerStudent: CambridgeExamRecord[];
  distribution: ConvertedTotalDistribution;
}

/** 在「全部级别」时按考试级别拆分：各级别内每位学生取最近一次考试，再分别做总分分布。 */
export function buildDistributionsPerLevel(filteredRecords: CambridgeExamRecord[]): DistributionByLevelRow[] {
  const levels = sortLevels(Array.from(new Set(filteredRecords.map((r) => r.level))));
  return levels
    .map((level) => {
      const subset = filteredRecords.filter((r) => r.level === level);
      const latestPerStudent = pickLatestRecordPerStudent(subset);
      return {
        level,
        latestPerStudent,
        distribution: buildConvertedTotalDistribution(latestPerStudent),
      };
    })
    .filter((row) => row.latestPerStudent.length > 0);
}

export interface PartMeanRow {
  part: string;
  meanRaw: number;
  partMax: number;
  meanPercent: number;
}

export interface ClassPartMeanBlock {
  skillKey: string;
  title: string;
  data: PartMeanRow[];
}

function meanPartScores(
  records: CambridgeExamRecord[],
  readPart: (record: CambridgeExamRecord, part: string) => number,
  readPartMax: (record: CambridgeExamRecord, part: string) => number,
  parts: readonly string[],
): PartMeanRow[] {
  if (records.length === 0 || parts.length === 0) {
    return [];
  }
  const n = records.length;
  return parts.map((part) => {
    const sum = records.reduce((acc, record) => acc + readPart(record, part), 0);
    const meanRaw = Math.round((sum / n) * 100) / 100;
    const partMax = readPartMax(records[0]!, part);
    const meanPercent = partMax > 0 ? Math.round((meanRaw / partMax) * 1000) / 10 : 0;
    return { part, meanRaw, partMax, meanPercent };
  });
}

/** 基于「最近一次」样本，计算班级在各题段上的原始分均值（按题段满分动态折算）。 */
export function buildClassPartMeanBlocks(latestPerStudent: CambridgeExamRecord[]): ClassPartMeanBlock[] {
  if (latestPerStudent.length === 0) {
    return [];
  }
  const ref = latestPerStudent[0]!;

  if (ref.convertedResult.mode === 'YLE_SHIELDS') {
    const readingParts = ref.readingEnabledParts;
    const listeningParts = ref.listeningEnabledParts;
    return [
      {
        skillKey: 'R&W',
        title: '阅读与写作（Reading 题段）',
        data: meanPartScores(
          latestPerStudent,
          (record, part) => Number(record.reading[part as keyof typeof record.reading] ?? 0),
          (record, part) => getPartRawMax(record.level, part as CambridgePartKey),
          readingParts,
        ),
      },
      {
        skillKey: 'Listening',
        title: '听力题段',
        data: meanPartScores(
          latestPerStudent,
          (record, part) => Number(record.listening[part as keyof typeof record.listening] ?? 0),
          (record, part) => getPartRawMax(record.level, part as CambridgePartKey),
          listeningParts,
        ),
      },
    ].filter((block) => block.data.length > 0);
  }

  const readingParts = ref.readingEnabledParts;
  const writingParts = ref.writingEnabledParts;
  const listeningParts = ref.listeningEnabledParts;

  return [
    {
      skillKey: 'Reading',
      title: '阅读题段',
      data: meanPartScores(
        latestPerStudent,
        (record, part) => Number(record.reading[part as keyof typeof record.reading] ?? 0),
        (record, part) => getPartRawMax(record.level, part as CambridgePartKey),
        readingParts,
      ),
    },
    {
      skillKey: 'Writing',
      title: '写作题段',
      data: meanPartScores(
        latestPerStudent,
        (record, part) => Number(record.writing[part as keyof typeof record.writing] ?? 0),
        (record, part) => getPartRawMax(record.level, part as CambridgePartKey),
        writingParts,
      ),
    },
    {
      skillKey: 'Listening',
      title: '听力题段',
      data: meanPartScores(
        latestPerStudent,
        (record, part) => Number(record.listening[part as keyof typeof record.listening] ?? 0),
        (record, part) => getPartRawMax(record.level, part as CambridgePartKey),
        listeningParts,
      ),
    },
  ].filter((block) => block.data.length > 0);
}
