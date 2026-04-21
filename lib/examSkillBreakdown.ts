import {
  FCE_READING_SECTION_PARTS,
  FCE_USE_OF_ENGLISH_PARTS,
  getPartRawMax,
  type CambridgeExamRecord,
  type CambridgePartKey,
} from '@/lib/cambridgeEngine';

export interface SkillDetail {
  skill: string;
  converted: number;
  rawTotal: number;
  partDetails: string;
  partEntries: Array<{ part: string; value: number }>;
}

export type SkillStrength = 'WEAK' | 'ATTENTION' | 'OK';
export type PartStrength = 'WEAK' | 'ATTENTION' | 'OK';

function sumScores<T extends string>(scores: Record<T, number>, enabled: T[]): number {
  return enabled.reduce((total, key) => total + scores[key], 0);
}

function formatPartDetails<T extends string>(scores: Record<T, number>, enabled: T[]): string {
  return enabled.map((key) => `${key}: ${scores[key]}`).join(' / ');
}

function buildPartEntries<T extends string>(
  scores: Record<T, number>,
  enabled: T[],
): Array<{ part: string; value: number }> {
  return enabled.map((key) => ({ part: String(key), value: scores[key] }));
}

export function buildSkillDetails(record: CambridgeExamRecord): SkillDetail[] {
  if (record.convertedResult.mode === 'YLE_SHIELDS') {
    const rwRaw = sumScores(record.reading, record.readingEnabledParts);
    const lRaw = sumScores(record.listening, record.listeningEnabledParts);
    return [
      {
        skill: 'R&W',
        converted: record.convertedResult.readingWritingShield,
        rawTotal: rwRaw,
        partDetails: formatPartDetails(record.reading, record.readingEnabledParts),
        partEntries: buildPartEntries(record.reading, record.readingEnabledParts),
      },
      {
        skill: 'Listening',
        converted: record.convertedResult.listeningShield,
        rawTotal: lRaw,
        partDetails: formatPartDetails(record.listening, record.listeningEnabledParts),
        partEntries: buildPartEntries(record.listening, record.listeningEnabledParts),
      },
    ];
  }

  const writingRaw = sumScores(record.writing, record.writingEnabledParts);
  const listeningRaw = sumScores(record.listening, record.listeningEnabledParts);

  if (record.level === 'FCE') {
    const uoeScale = record.convertedResult.useOfEnglishScale;
    if (uoeScale === undefined) {
      const readingRawAll = sumScores(record.reading, record.readingEnabledParts);
      return [
        {
          skill: 'Reading',
          converted: record.convertedResult.readingScale,
          rawTotal: readingRawAll,
          partDetails: formatPartDetails(record.reading, record.readingEnabledParts),
          partEntries: buildPartEntries(record.reading, record.readingEnabledParts),
        },
        {
          skill: 'Writing',
          converted: record.convertedResult.writingScale,
          rawTotal: writingRaw,
          partDetails: formatPartDetails(record.writing, record.writingEnabledParts),
          partEntries: buildPartEntries(record.writing, record.writingEnabledParts),
        },
        {
          skill: 'Listening',
          converted: record.convertedResult.listeningScale,
          rawTotal: listeningRaw,
          partDetails: formatPartDetails(record.listening, record.listeningEnabledParts),
          partEntries: buildPartEntries(record.listening, record.listeningEnabledParts),
        },
      ];
    }
    const readingSectionParts = [...FCE_READING_SECTION_PARTS];
    const uoeParts = [...FCE_USE_OF_ENGLISH_PARTS];
    const readingSectionRaw = sumScores(record.reading, readingSectionParts);
    const uoeRaw = sumScores(record.reading, uoeParts);
    return [
      {
        skill: 'Reading',
        converted: record.convertedResult.readingScale,
        rawTotal: readingSectionRaw,
        partDetails: formatPartDetails(record.reading, readingSectionParts),
        partEntries: buildPartEntries(record.reading, readingSectionParts),
      },
      {
        skill: 'Use of English',
        converted: uoeScale,
        rawTotal: uoeRaw,
        partDetails: formatPartDetails(record.reading, uoeParts),
        partEntries: buildPartEntries(record.reading, uoeParts),
      },
      {
        skill: 'Writing',
        converted: record.convertedResult.writingScale,
        rawTotal: writingRaw,
        partDetails: formatPartDetails(record.writing, record.writingEnabledParts),
        partEntries: buildPartEntries(record.writing, record.writingEnabledParts),
      },
      {
        skill: 'Listening',
        converted: record.convertedResult.listeningScale,
        rawTotal: listeningRaw,
        partDetails: formatPartDetails(record.listening, record.listeningEnabledParts),
        partEntries: buildPartEntries(record.listening, record.listeningEnabledParts),
      },
    ];
  }

  const readingRaw = sumScores(record.reading, record.readingEnabledParts);
  return [
    {
      skill: 'Reading',
      converted: record.convertedResult.readingScale,
      rawTotal: readingRaw,
      partDetails: formatPartDetails(record.reading, record.readingEnabledParts),
      partEntries: buildPartEntries(record.reading, record.readingEnabledParts),
    },
    {
      skill: 'Writing',
      converted: record.convertedResult.writingScale,
      rawTotal: writingRaw,
      partDetails: formatPartDetails(record.writing, record.writingEnabledParts),
      partEntries: buildPartEntries(record.writing, record.writingEnabledParts),
    },
    {
      skill: 'Listening',
      converted: record.convertedResult.listeningScale,
      rawTotal: listeningRaw,
      partDetails: formatPartDetails(record.listening, record.listeningEnabledParts),
      partEntries: buildPartEntries(record.listening, record.listeningEnabledParts),
    },
  ];
}

export function getSkillMaxTotal(record: CambridgeExamRecord, skill: SkillDetail['skill']): number {
  const sumPartMax = (parts: CambridgePartKey[]): number =>
    parts.reduce((total, partKey) => total + getPartRawMax(record.level, partKey), 0);

  if (record.convertedResult.mode === 'YLE_SHIELDS') {
    if (skill === 'R&W') {
      return sumPartMax(record.readingEnabledParts);
    }
    return sumPartMax(record.listeningEnabledParts);
  }
  if (record.level === 'FCE') {
    if (skill === 'Reading') {
      return sumPartMax([...FCE_READING_SECTION_PARTS]);
    }
    if (skill === 'Use of English') {
      return sumPartMax([...FCE_USE_OF_ENGLISH_PARTS]);
    }
  }
  if (skill === 'Reading') {
    return sumPartMax(record.readingEnabledParts);
  }
  if (skill === 'Writing') {
    return sumPartMax(record.writingEnabledParts);
  }
  return sumPartMax(record.listeningEnabledParts);
}

export function classifySkillStrength(record: CambridgeExamRecord, detail: SkillDetail): SkillStrength {
  if (record.convertedResult.mode === 'YLE_SHIELDS') {
    if (detail.converted <= 2) {
      return 'WEAK';
    }
    if (detail.converted === 3) {
      return 'ATTENTION';
    }
    return 'OK';
  }

  const maxTotal = getSkillMaxTotal(record, detail.skill);
  const accuracy = maxTotal > 0 ? detail.rawTotal / maxTotal : 0;
  if (accuracy < 0.6) {
    return 'WEAK';
  }
  if (accuracy < 0.7) {
    return 'ATTENTION';
  }
  return 'OK';
}

export function pickWeakSkillsByThreshold(
  record: CambridgeExamRecord,
  details: SkillDetail[],
): Array<{ skill: string; converted: number; rawTotal: number; maxTotal: number; strength: SkillStrength }> {
  return details
    .map((detail) => {
      const maxTotal = getSkillMaxTotal(record, detail.skill);
      const strength = classifySkillStrength(record, detail);
      return { skill: detail.skill, converted: detail.converted, rawTotal: detail.rawTotal, maxTotal, strength };
    })
    .filter((item) => item.strength === 'WEAK');
}

export function pickAttentionSkillsByThreshold(
  record: CambridgeExamRecord,
  details: SkillDetail[],
): Array<{ skill: string; converted: number; rawTotal: number; maxTotal: number; strength: SkillStrength }> {
  return details
    .map((detail) => {
      const maxTotal = getSkillMaxTotal(record, detail.skill);
      const strength = classifySkillStrength(record, detail);
      return { skill: detail.skill, converted: detail.converted, rawTotal: detail.rawTotal, maxTotal, strength };
    })
    .filter((item) => item.strength === 'ATTENTION');
}

/**
 * 小题层面对齐选项3：以题段原始满分 `getPartRawMax(level, partKey)`（各级别官方 Part 满分）计算正确率，阈值与 MSE 分技能一致。
 */
export function classifyPartStrength(record: CambridgeExamRecord, partKey: string, rawValue: number): PartStrength {
  const partMax = getPartRawMax(record.level, partKey as CambridgePartKey);
  const accuracy = partMax > 0 ? rawValue / partMax : 0;
  if (accuracy < 0.6) {
    return 'WEAK';
  }
  if (accuracy < 0.7) {
    return 'ATTENTION';
  }
  return 'OK';
}

export type PartThresholdPartition = {
  weakBySkill: Array<{ skill: string; parts: Array<{ part: string; value: number }> }>;
  attentionBySkill: Array<{ skill: string; parts: Array<{ part: string; value: number }> }>;
};

export function partitionPartsByThreshold(
  record: CambridgeExamRecord,
  details: SkillDetail[],
): PartThresholdPartition {
  const weakMap = new Map<string, Array<{ part: string; value: number }>>();
  const attMap = new Map<string, Array<{ part: string; value: number }>>();
  for (const detail of details) {
    for (const entry of detail.partEntries) {
      const st = classifyPartStrength(record, entry.part, entry.value);
      if (st === 'WEAK') {
        const list = weakMap.get(detail.skill) ?? [];
        list.push({ part: entry.part, value: entry.value });
        weakMap.set(detail.skill, list);
      } else if (st === 'ATTENTION') {
        const list = attMap.get(detail.skill) ?? [];
        list.push({ part: entry.part, value: entry.value });
        attMap.set(detail.skill, list);
      }
    }
  }
  const toArr = (map: Map<string, Array<{ part: string; value: number }>>) =>
    Array.from(map.entries()).map(([skill, parts]) => ({ skill, parts }));
  return { weakBySkill: toArr(weakMap), attentionBySkill: toArr(attMap) };
}

export function pickPartForSuggestion(
  targetSkill: string,
  partitioned: PartThresholdPartition,
  minParts: ReturnType<typeof pickMinPartsPerSkill>,
): string | null {
  const weakGroup = partitioned.weakBySkill.find((item) => item.skill === targetSkill);
  const weakPart = weakGroup?.parts[0]?.part;
  if (weakPart) {
    return weakPart;
  }
  const attGroup = partitioned.attentionBySkill.find((item) => item.skill === targetSkill);
  const attPart = attGroup?.parts[0]?.part;
  if (attPart) {
    return attPart;
  }
  return minParts.find((item) => item.skill === targetSkill)?.parts[0] ?? null;
}

/** 每技能内取最小正确数题段（用于技能库匹配兜底）。 */
export function pickMinPartsPerSkill(details: SkillDetail[]): Array<{ skill: string; value: number; parts: string[] }> {
  return details
    .map((detail) => {
      const entries = detail.partEntries;
      if (entries.length === 0) {
        return null;
      }
      const minValue = Math.min(...entries.map((entry) => entry.value));
      const parts = entries.filter((entry) => entry.value === minValue).map((entry) => entry.part);
      return { skill: detail.skill, value: minValue, parts };
    })
    .filter(
      (item): item is { skill: string; value: number; parts: string[] } =>
        item !== null && item.parts.length > 0,
    );
}

export function getPartNumber(partKey: string): number | null {
  const hit = partKey.match(/_P(\d+)$/);
  if (!hit) {
    return null;
  }
  const num = Number(hit[1]);
  return Number.isFinite(num) ? num : null;
}

export function mapPartToTypePart(
  record: CambridgeExamRecord,
  skill: SkillDetail['skill'] | 'R&W' | 'Listening' | 'Reading' | 'Writing' | 'Use of English',
  partKey: string,
): string | null {
  const n = getPartNumber(partKey);
  if (!n) {
    return null;
  }
  if (record.convertedResult.mode === 'YLE_SHIELDS') {
    if (skill === 'R&W') {
      return `RW-Pt${n}`;
    }
    return `L-Pt${n}`;
  }
  if (skill === 'Reading' || skill === 'Use of English') {
    return `R-Pt${n}`;
  }
  if (skill === 'Writing') {
    return `W-Pt${n}`;
  }
  return `L-Pt${n}`;
}
