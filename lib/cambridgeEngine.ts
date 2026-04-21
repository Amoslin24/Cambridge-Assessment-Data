import * as XLSX from 'xlsx';

export type CambridgeLevel =
  | 'Starters'
  | 'Movers'
  | 'Flyers'
  | 'KET'
  | 'PET'
  | 'FCE';

export type ReadingPartKey =
  | 'R_P1'
  | 'R_P2'
  | 'R_P3'
  | 'R_P4'
  | 'R_P5'
  | 'R_P6'
  | 'R_P7';
export type ListeningPartKey = 'L_P1' | 'L_P2' | 'L_P3' | 'L_P4' | 'L_P5';
export type WritingPartKey = 'W_P1' | 'W_P2';
export type CambridgePartKey = ReadingPartKey | ListeningPartKey | WritingPartKey;

type MSELevel = Extract<CambridgeLevel, 'KET' | 'PET' | 'FCE'>;

export interface ConvertedShields {
  mode: 'YLE_SHIELDS';
  value: number;
  readingWritingShield: number;
  listeningShield: number;
}

export interface ConvertedScaleScore {
  mode: 'MSE_SCALE';
  value: number;
  readingScale: number;
  /** FCE：Reading and Use of English 试卷中 Part 2–4（语用）单独量表分；KET/PET 为 `undefined`。 */
  useOfEnglishScale?: number;
  writingScale: number;
  listeningScale: number;
}

export type ConvertedResult = ConvertedShields | ConvertedScaleScore;

export interface CambridgeExamRecord {
  id: string;
  nameZh?: string;
  nameEn?: string;
  name: string;
  className: string;
  setName: string;
  classSet: string;
  level: CambridgeLevel;
  examDate: string;
  reading: Record<ReadingPartKey, number>;
  listening: Record<ListeningPartKey, number>;
  writing: Record<WritingPartKey, number>;
  readingEnabledParts: ReadingPartKey[];
  listeningEnabledParts: ListeningPartKey[];
  writingEnabledParts: WritingPartKey[];
  rawTotal: number;
  maxTotal: number;
  accuracyRate: number;
  convertedResult: ConvertedResult;
}

export interface ParseIssue {
  rowNumber: number;
  message: string;
}

export interface ParseCambridgeResult {
  records: CambridgeExamRecord[];
  issues: ParseIssue[];
}

interface PreflightIssue {
  rowNumber: number;
  message: string;
}

const PREFLIGHT_ISSUE_LIMIT = 30;

const ALL_READING_PARTS: ReadingPartKey[] = [
  'R_P1',
  'R_P2',
  'R_P3',
  'R_P4',
  'R_P5',
  'R_P6',
  'R_P7',
];
const ALL_LISTENING_PARTS: ListeningPartKey[] = ['L_P1', 'L_P2', 'L_P3', 'L_P4', 'L_P5'];
const ALL_WRITING_PARTS: WritingPartKey[] = ['W_P1', 'W_P2'];

const READING_PART_COUNT_BY_LEVEL: Record<CambridgeLevel, number> = {
  Starters: 5,
  Movers: 6,
  Flyers: 7,
  KET: 5,
  PET: 6,
  FCE: 7,
};
const WRITING_PART_COUNT_BY_LEVEL: Record<CambridgeLevel, number> = {
  Starters: 0,
  Movers: 0,
  Flyers: 0,
  KET: 2,
  PET: 2,
  FCE: 2,
};

/** 各级别听力启用题段数量（与 Cambridge YLE / A2 Key / B1 Preliminary / B2 First 官方试卷一致）。 */
const LISTENING_PART_COUNT_BY_LEVEL: Record<CambridgeLevel, number> = {
  Starters: 4,
  Movers: 5,
  Flyers: 5,
  KET: 5,
  PET: 4,
  FCE: 4,
};

/**
 * 历史兼容名：此前 R/L 各 Part 一律按 5 封顶。
 * 现由各级别 `getPartRawMax` 官方题量/满分驱动；请勿在新逻辑中当作通用上限使用。
 */
export const SCORE_LIMIT_PER_PART = 5;

const MSE_WRITING_PART_MAX_BY_LEVEL: Record<
  Extract<CambridgeLevel, 'KET' | 'PET' | 'FCE'>,
  Record<WritingPartKey, number>
> = {
  KET: { W_P1: 15, W_P2: 15 },
  PET: { W_P1: 20, W_P2: 20 },
  FCE: { W_P1: 20, W_P2: 20 },
};

/**
 * 阅读/读写各 Part 官方满分（每格填「该 Part 答对题数/得分」原始分）。
 * 来源：Cambridge English 公开考纲（YLE 2018+；A2 Key / B1 Preliminary / B2 First 2020/2015 纸笔题型题量与分值）。
 */
const READING_PART_MAX_BY_LEVEL: Record<CambridgeLevel, Partial<Record<ReadingPartKey, number>>> = {
  Starters: { R_P1: 5, R_P2: 5, R_P3: 5, R_P4: 5, R_P5: 5 },
  /** A1 Movers R&W：各 Part 官方总分（Part 6 为产出型写作共 10 分，非 5）。合计 39 分。 */
  Movers: { R_P1: 5, R_P2: 6, R_P3: 6, R_P4: 5, R_P5: 7, R_P6: 10 },
  Flyers: { R_P1: 10, R_P2: 5, R_P3: 6, R_P4: 10, R_P5: 7, R_P6: 5, R_P7: 5 },
  KET: { R_P1: 6, R_P2: 7, R_P3: 5, R_P4: 6, R_P5: 6 },
  PET: { R_P1: 5, R_P2: 5, R_P3: 5, R_P4: 5, R_P5: 6, R_P6: 6 },
  FCE: { R_P1: 8, R_P2: 8, R_P3: 8, R_P4: 12, R_P5: 12, R_P6: 12, R_P7: 10 },
};

/** 听力各 Part 官方满分（每格填该 Part 答对题数；与公开样卷题量一致）。 */
const LISTENING_PART_MAX_BY_LEVEL: Record<CambridgeLevel, Partial<Record<ListeningPartKey, number>>> = {
  Starters: { L_P1: 5, L_P2: 5, L_P3: 5, L_P4: 5 },
  Movers: { L_P1: 5, L_P2: 5, L_P3: 5, L_P4: 5, L_P5: 5 },
  Flyers: { L_P1: 5, L_P2: 5, L_P3: 5, L_P4: 5, L_P5: 5 },
  KET: { L_P1: 5, L_P2: 5, L_P3: 5, L_P4: 5, L_P5: 5 },
  PET: { L_P1: 7, L_P2: 6, L_P3: 6, L_P4: 6 },
  FCE: { L_P1: 8, L_P2: 10, L_P3: 5, L_P4: 7 },
};

function isMSELevel(level: CambridgeLevel): level is Extract<CambridgeLevel, 'KET' | 'PET' | 'FCE'> {
  return level === 'KET' || level === 'PET' || level === 'FCE';
}

/** FCE：Reading 与 Use of English 在试卷中的 Part 划分（与成绩单分项一致）。 */
export const FCE_READING_SECTION_PARTS: readonly ReadingPartKey[] = ['R_P1', 'R_P5', 'R_P6', 'R_P7'];
export const FCE_USE_OF_ENGLISH_PARTS: readonly ReadingPartKey[] = ['R_P2', 'R_P3', 'R_P4'];

export function getListeningEnabledParts(level: CambridgeLevel): ListeningPartKey[] {
  const count = LISTENING_PART_COUNT_BY_LEVEL[level];
  return ALL_LISTENING_PARTS.slice(0, count);
}

export function getPartRawMax(level: CambridgeLevel, partKey: CambridgePartKey): number {
  if (partKey.startsWith('W_')) {
    if (!isMSELevel(level)) {
      return 0;
    }
    return MSE_WRITING_PART_MAX_BY_LEVEL[level][partKey as WritingPartKey] ?? 0;
  }
  if (partKey.startsWith('L_')) {
    return LISTENING_PART_MAX_BY_LEVEL[level][partKey as ListeningPartKey] ?? 0;
  }
  if (partKey.startsWith('R_')) {
    return READING_PART_MAX_BY_LEVEL[level][partKey as ReadingPartKey] ?? 0;
  }
  return 0;
}

function getPartAliases(partPrefix: 'R' | 'L' | 'W', partNumber: number): string[] {
  return [
    `${partPrefix}P${partNumber}`,
    `${partPrefix}_P${partNumber}`,
    `${partPrefix}-P${partNumber}`,
    `${partPrefix}Pt${partNumber}`,
    `${partPrefix}_Pt${partNumber}`,
    `${partPrefix}-Pt${partNumber}`,
    `${partPrefix}Part${partNumber}`,
    `${partPrefix} Part ${partNumber}`,
  ];
}

const YLE_MOVERS_RW_SHIELD_TABLE: Array<{ minRaw: number; shield: number }> = [
  { minRaw: 33, shield: 5 },
  { minRaw: 29, shield: 4 },
  { minRaw: 24, shield: 3 },
  { minRaw: 18, shield: 2 },
  { minRaw: 0, shield: 1 },
];
const YLE_STARTERS_RW_SHIELD_TABLE: Array<{ minRaw: number; shield: number }> = [
  { minRaw: 21, shield: 5 },
  { minRaw: 19, shield: 4 },
  { minRaw: 16, shield: 3 },
  { minRaw: 13, shield: 2 },
  { minRaw: 0, shield: 1 },
];
const YLE_STARTERS_LISTENING_SHIELD_TABLE: Array<{ minRaw: number; shield: number }> = [
  { minRaw: 18, shield: 5 },
  { minRaw: 16, shield: 4 },
  { minRaw: 13, shield: 3 },
  { minRaw: 11, shield: 2 },
  { minRaw: 0, shield: 1 },
];
const YLE_MOVERS_LISTENING_SHIELD_TABLE: Array<{ minRaw: number; shield: number }> = [
  { minRaw: 21, shield: 5 },
  { minRaw: 18, shield: 4 },
  { minRaw: 14, shield: 3 },
  { minRaw: 11, shield: 2 },
  { minRaw: 0, shield: 1 },
];
const YLE_FLYERS_RW_SHIELD_TABLE: Array<{ minRaw: number; shield: number }> = [
  { minRaw: 42, shield: 5 },
  { minRaw: 36, shield: 4 },
  { minRaw: 24, shield: 3 },
  { minRaw: 18, shield: 2 },
  { minRaw: 0, shield: 1 },
];
const YLE_FLYERS_LISTENING_SHIELD_TABLE: Array<{ minRaw: number; shield: number }> = [
  { minRaw: 21, shield: 5 },
  { minRaw: 18, shield: 4 },
  { minRaw: 14, shield: 3 },
  { minRaw: 11, shield: 2 },
  { minRaw: 0, shield: 1 },
];

const KET_READING_SCALE_TABLE: Record<number, number> = {
  13: 100, 14: 102, 15: 105, 16: 108, 17: 111, 18: 114, 19: 117, 20: 120, 21: 122,
  22: 125, 23: 127, 24: 130, 25: 133, 26: 135, 27: 137, 28: 140, 29: 145, 30: 150,
};
const KET_WRITING_SCALE_TABLE: Record<number, number> = {
  12: 102, 13: 105, 14: 108, 15: 111, 16: 114, 17: 117, 18: 120, 19: 123, 20: 125,
  21: 128, 22: 130, 23: 133, 24: 135, 25: 138, 26: 140, 27: 143, 28: 145, 29: 148,
  30: 150,
};
const KET_LISTENING_SCALE_TABLE: Record<number, number> = {
  11: 100, 12: 103, 13: 106, 14: 110, 15: 113, 16: 116, 17: 120, 18: 123, 19: 126,
  20: 130, 21: 133, 22: 136, 23: 140, 24: 145, 25: 150,
};

const PET_READING_SCALE_TABLE: Record<number, number> = {
  13: 120, 14: 122, 15: 124, 16: 126, 17: 128, 18: 130, 19: 132, 20: 134, 21: 136,
  22: 138, 23: 140, 24: 143, 25: 146, 26: 150, 27: 153, 28: 156, 29: 160, 30: 163,
  31: 166, 32: 170,
};
const PET_WRITING_SCALE_TABLE: Record<number, number> = {
  16: 120, 17: 120, 18: 123, 19: 125, 20: 128, 21: 130, 22: 133, 23: 135, 24: 140,
  25: 142, 26: 144, 27: 146, 28: 148, 29: 150, 30: 152, 31: 154, 32: 156, 33: 158,
  34: 160, 35: 162, 36: 163, 37: 165, 38: 167, 39: 168, 40: 170,
};
const PET_LISTENING_SCALE_TABLE: Record<number, number> = {
  11: 120, 12: 122, 13: 125, 14: 128, 15: 131, 16: 134, 17: 137, 18: 140, 19: 144,
  20: 148, 21: 152, 22: 156, 23: 160, 24: 165, 25: 170,
};

const FCE_READING_SCALE_TABLE: Array<{ minRaw: number; scale: number }> = [
  { minRaw: 42, scale: 190 },
  { minRaw: 37, scale: 180 },
  { minRaw: 24, scale: 160 },
  { minRaw: 16, scale: 140 },
  { minRaw: 10, scale: 122 },
  { minRaw: 0, scale: 80 },
];
const FCE_WRITING_SCALE_TABLE: Array<{ minRaw: number; scale: number }> = [
  { minRaw: 40, scale: 190 },
  { minRaw: 34, scale: 180 },
  { minRaw: 24, scale: 160 },
  { minRaw: 16, scale: 140 },
  { minRaw: 10, scale: 122 },
  { minRaw: 0, scale: 80 },
];
const FCE_USE_OF_ENGLISH_SCALE_TABLE: Array<{ minRaw: number; scale: number }> = [
  { minRaw: 28, scale: 190 },
  { minRaw: 24, scale: 160 },
  { minRaw: 16, scale: 140 },
  { minRaw: 10, scale: 122 },
  { minRaw: 0, scale: 80 },
];

/** B2 First Listening：30 题各 1 分；量表换算参考 Cambridge practice test converter（CER/4240）。 */
const FCE_LISTENING_SCALE_TABLE: Array<{ minRaw: number; scale: number }> = [
  { minRaw: 30, scale: 190 },
  { minRaw: 27, scale: 180 },
  { minRaw: 18, scale: 160 },
  { minRaw: 12, scale: 140 },
  { minRaw: 8, scale: 122 },
  { minRaw: 0, scale: 80 },
];

const HEADER_ALIASES = {
  namePrimary: ['name', '姓名', 'student', '学生姓名'],
  nameZh: ['namezh', 'name_cn', '中文名'],
  nameEn: ['nameen', 'name_en', 'englishname', '英文名', '英文姓名'],
  className: ['class', 'classname', '班级', '班级名称'],
  setName: ['set', 'setname', '班组', '组别'],
  classSetLegacy: ['classset'],
  level: ['level', '级别', '考试级别'],
  examDate: ['date', 'examdate', '考试日期', '日期'],
};

function normalizeHeader(header: string): string {
  return header.replace(/\s+/g, '').replace(/[-_]/g, '').toLowerCase();
}

function isValidPartScore(value: unknown): { ok: true; numeric: number } | { ok: false; reason: string } {
  if (value === null || value === undefined) {
    return { ok: true, numeric: 0 };
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return { ok: true, numeric: 0 };
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      return { ok: false, reason: '分值不是有效数字' };
    }
    return { ok: true, numeric: parsed };
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return { ok: false, reason: '分值不是有效数字' };
    }
    return { ok: true, numeric: value };
  }
  return { ok: false, reason: '分值类型不支持' };
}

function readArrayCellByAliases(
  normalizedHeaders: string[],
  row: unknown[],
  aliases: string[],
): unknown {
  for (const alias of aliases) {
    const index = normalizedHeaders.indexOf(normalizeHeader(alias));
    if (index >= 0) {
      return row[index];
    }
  }
  return '';
}

function ensureRequiredHeaders(normalizedHeaders: string[]): PreflightIssue[] {
  const issues: PreflightIssue[] = [];

  const hasAny = (aliases: string[]): boolean =>
    aliases.some((alias) => normalizedHeaders.includes(normalizeHeader(alias)));

  const hasName = hasAny(HEADER_ALIASES.namePrimary) || hasAny(HEADER_ALIASES.nameZh) || hasAny(HEADER_ALIASES.nameEn);
  if (!hasName) {
    issues.push({ rowNumber: 1, message: '缺失必填列：Name/姓名（可用列名：Name、姓名、Student 等）。' });
  }
  if (!hasAny(HEADER_ALIASES.level)) {
    issues.push({ rowNumber: 1, message: '缺失必填列：Level/级别。' });
  }
  if (!hasAny(HEADER_ALIASES.examDate)) {
    issues.push({ rowNumber: 1, message: '缺失必填列：ExamDate/考试日期。' });
  }

  const requiredReading = ALL_READING_PARTS;
  requiredReading.forEach((part) => {
    if (!normalizedHeaders.includes(normalizeHeader(part))) {
      issues.push({ rowNumber: 1, message: `缺失阅读分项列：${part}。` });
    }
  });
  ALL_LISTENING_PARTS.forEach((part) => {
    if (!normalizedHeaders.includes(normalizeHeader(part))) {
      issues.push({ rowNumber: 1, message: `缺失听力分项列：${part}。` });
    }
  });

  return issues;
}

function preflightValidateSheet(table: unknown[][]): PreflightIssue[] {
  const issues: PreflightIssue[] = [];
  if (table.length === 0) {
    return [{ rowNumber: 0, message: '文件为空或无法读取内容。' }];
  }
  const headerRow = (table[0] ?? []).map((cell) => String(cell ?? '').trim());
  const normalizedHeaders = headerRow.map((cell) => normalizeHeader(cell));
  issues.push(...ensureRequiredHeaders(normalizedHeaders));

  // 导入前检查仅用于“结构性”问题：缺少必填列会导致解析无法正确进行。
  // 行级数据质量问题（级别空/日期异常/分值格式等）交给逐行解析产出 issues，不阻断整体导入。
  return issues.slice(0, PREFLIGHT_ISSUE_LIMIT);
}

function toSafeNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized) {
      return 0;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function clampScore(score: number, maxScore: number): number {
  if (score < 0) {
    return 0;
  }
  if (score > maxScore) {
    return maxScore;
  }
  return score;
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') {
    return file.arrayBuffer();
  }
  return new Promise((resolve, reject) => {
    if (typeof FileReader === 'undefined') {
      reject(new Error('当前环境不支持 FileReader。'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      if (!event.target?.result) {
        reject(new Error('文件读取失败：无法获取二进制内容。'));
        return;
      }
      resolve(event.target.result as ArrayBuffer);
    };
    reader.onerror = () => {
      reject(new Error('文件读取失败：请确认文件格式正确。'));
    };
    reader.readAsArrayBuffer(file);
  });
}

function readCellByAliases(row: Record<string, unknown>, aliases: string[]): string {
  const normalizedMap = new Map<string, unknown>();
  for (const [key, value] of Object.entries(row)) {
    normalizedMap.set(normalizeHeader(key), value);
  }

  for (const alias of aliases) {
    const hit = normalizedMap.get(normalizeHeader(alias));
    if (typeof hit === 'string' && hit.trim()) {
      return hit.trim();
    }
    if (typeof hit === 'number' && Number.isFinite(hit)) {
      return String(hit);
    }
  }
  return '';
}

function readRawCellByAliases(row: Record<string, unknown>, aliases: string[]): unknown {
  const normalizedMap = new Map<string, unknown>();
  for (const [key, value] of Object.entries(row)) {
    normalizedMap.set(normalizeHeader(key), value);
  }

  for (const alias of aliases) {
    const hit = normalizedMap.get(normalizeHeader(alias));
    if (hit !== undefined && hit !== null && String(hit).trim() !== '') {
      return hit;
    }
  }
  return '';
}

function formatDateToYMD(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseExcelSerialDate(serial: number): string {
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400;
  const date = new Date(utcValue * 1000);
  return formatDateToYMD(date);
}

function parseExamDateValue(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return parseExcelSerialDate(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }
    const asNumber = Number(trimmed);
    if (Number.isFinite(asNumber) && /^\d+(\.\d+)?$/.test(trimmed)) {
      return parseExcelSerialDate(asNumber);
    }

    const date = new Date(trimmed);
    if (!Number.isNaN(date.getTime())) {
      return formatDateToYMD(new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())));
    }
    return trimmed;
  }

  return '';
}

function parseLevel(rawLevel: string): CambridgeLevel | null {
  const normalized = rawLevel.trim().toLowerCase();
  const map: Record<string, CambridgeLevel> = {
    starters: 'Starters',
    movers: 'Movers',
    flyers: 'Flyers',
    ket: 'KET',
    pet: 'PET',
    fce: 'FCE',
  };
  return map[normalized] ?? null;
}

export function getReadingEnabledParts(level: CambridgeLevel): ReadingPartKey[] {
  const count = READING_PART_COUNT_BY_LEVEL[level];
  return ALL_READING_PARTS.slice(0, count);
}

function getWritingEnabledParts(level: CambridgeLevel): WritingPartKey[] {
  const count = WRITING_PART_COUNT_BY_LEVEL[level];
  return ALL_WRITING_PARTS.slice(0, count);
}

function extractPartValue(
  row: Record<string, unknown>,
  level: CambridgeLevel,
  rowNumber: number,
  partPrefix: 'R' | 'L' | 'W',
  partNumber: number,
): { score: number; issues: ParseIssue[] } {
  const normalizedMap = new Map<string, unknown>();
  for (const [key, value] of Object.entries(row)) {
    normalizedMap.set(normalizeHeader(key), value);
  }

  const aliases = getPartAliases(partPrefix, partNumber);
  const partKey = `${partPrefix}_P${partNumber}` as CambridgePartKey;
  const maxScore = getPartRawMax(level, partKey);
  const issues: ParseIssue[] = [];

  for (const alias of aliases) {
    const value = normalizedMap.get(normalizeHeader(alias));
    if (value !== undefined) {
      if (value === null || value === '') {
        return { score: 0, issues };
      }
      if (typeof value === 'string' && value.trim() === '') {
        return { score: 0, issues };
      }
      const numeric = toSafeNumber(value);
      const rawText = typeof value === 'string' ? value.trim() : String(value);
      if ((typeof value === 'string' && value.trim().length > 0 && !Number.isFinite(Number(value.trim()))) || Number.isNaN(numeric)) {
        issues.push({
          rowNumber,
          message: `${partKey} 分值“${rawText}”不是有效数字，已按 0 处理。`,
        });
        return { score: 0, issues };
      }
      if (numeric < 0) {
        issues.push({
          rowNumber,
          message: `${partKey} 分值 ${numeric} 低于 0，已按 0 处理。`,
        });
      } else if (numeric > maxScore) {
        issues.push({
          rowNumber,
          message: `${partKey} 分值 ${numeric} 超过当前级别上限 ${maxScore}，已按上限处理。`,
        });
      }
      return { score: clampScore(numeric, maxScore), issues };
    }
  }
  return { score: 0, issues };
}

function lookupThreshold(raw: number, table: Array<{ minRaw: number; scale: number }>): number {
  if (raw <= 0) {
    return 0;
  }
  const hit = table.find((item) => raw >= item.minRaw);
  return hit ? hit.scale : table[table.length - 1].scale;
}

function lookupShield(raw: number, table: Array<{ minRaw: number; shield: number }>): number {
  const hit = table.find((item) => raw >= item.minRaw);
  return hit ? hit.shield : table[table.length - 1].shield;
}

function lookupExactOrFloor(raw: number, table: Record<number, number>): number {
  if (raw <= 0) {
    return 0;
  }
  const keys = Object.keys(table)
    .map((key) => Number(key))
    .sort((a, b) => a - b);
  if (keys.length === 0) {
    return 0;
  }
  if (raw < keys[0]) {
    return 0;
  }
  if (raw === keys[0]) {
    return table[keys[0]];
  }
  if (raw >= keys[keys.length - 1]) {
    return table[keys[keys.length - 1]];
  }

  let floorKey = keys[0];
  for (const key of keys) {
    if (key <= raw) {
      floorKey = key;
      continue;
    }
    break;
  }
  return table[floorKey];
}

function averageAvailableScores(scores: number[]): number {
  const available = scores.filter((score) => score > 0);
  if (available.length === 0) {
    return 0;
  }
  const total = available.reduce((sum, score) => sum + score, 0);
  return Math.round(total / available.length);
}

function convertToYLEShields(level: CambridgeLevel, readingRaw: number, _writingRaw: number, listeningRaw: number): ConvertedShields {
  // YLE 的 Writing 已并入 Reading，R 列即 R&W 总正确数。
  const readingWritingRaw = readingRaw;

  if (level === 'Starters') {
    const rwShield = readingWritingRaw > 0 ? lookupShield(readingWritingRaw, YLE_STARTERS_RW_SHIELD_TABLE) : 0;
    const lShield = listeningRaw > 0 ? lookupShield(listeningRaw, YLE_STARTERS_LISTENING_SHIELD_TABLE) : 0;
    return {
      mode: 'YLE_SHIELDS',
      value: rwShield + lShield,
      readingWritingShield: rwShield,
      listeningShield: lShield,
    };
  }

  if (level === 'Movers') {
    const rwShield = readingWritingRaw > 0 ? lookupShield(readingWritingRaw, YLE_MOVERS_RW_SHIELD_TABLE) : 0;
    const lShield = listeningRaw > 0 ? lookupShield(listeningRaw, YLE_MOVERS_LISTENING_SHIELD_TABLE) : 0;
    return {
      mode: 'YLE_SHIELDS',
      value: rwShield + lShield,
      readingWritingShield: rwShield,
      listeningShield: lShield,
    };
  }

  if (level === 'Flyers') {
    const rwShield = readingWritingRaw > 0 ? lookupShield(readingWritingRaw, YLE_FLYERS_RW_SHIELD_TABLE) : 0;
    const lShield = listeningRaw > 0 ? lookupShield(listeningRaw, YLE_FLYERS_LISTENING_SHIELD_TABLE) : 0;
    return {
      mode: 'YLE_SHIELDS',
      value: rwShield + lShield,
      readingWritingShield: rwShield,
      listeningShield: lShield,
    };
  }
  // 理论上不会进入此分支，作为稳健兜底返回最低盾牌。
  return { mode: 'YLE_SHIELDS', value: 1, readingWritingShield: 1, listeningShield: 1 };
}

function convertKET(readingRaw: number, writingRaw: number, listeningRaw: number): ConvertedScaleScore {
  const readingScale = lookupExactOrFloor(readingRaw, KET_READING_SCALE_TABLE);
  const writingScale = lookupExactOrFloor(writingRaw, KET_WRITING_SCALE_TABLE);
  const listeningScale = lookupExactOrFloor(listeningRaw, KET_LISTENING_SCALE_TABLE);
  return {
    mode: 'MSE_SCALE',
    value: averageAvailableScores([readingScale, writingScale, listeningScale]),
    readingScale,
    writingScale,
    listeningScale,
  };
}

function convertPET(readingRaw: number, writingRaw: number, listeningRaw: number): ConvertedScaleScore {
  const readingScale = lookupExactOrFloor(readingRaw, PET_READING_SCALE_TABLE);
  const writingScale = lookupExactOrFloor(writingRaw, PET_WRITING_SCALE_TABLE);
  const listeningScale = lookupExactOrFloor(listeningRaw, PET_LISTENING_SCALE_TABLE);
  return {
    mode: 'MSE_SCALE',
    value: averageAvailableScores([readingScale, writingScale, listeningScale]),
    readingScale,
    writingScale,
    listeningScale,
  };
}

function convertFCE(
  fceReadingSectionRaw: number,
  fceUseOfEnglishRaw: number,
  writingRaw: number,
  listeningRaw: number,
): ConvertedScaleScore {
  const readingScale = lookupThreshold(fceReadingSectionRaw, FCE_READING_SCALE_TABLE);
  const useOfEnglishScale = lookupThreshold(fceUseOfEnglishRaw, FCE_USE_OF_ENGLISH_SCALE_TABLE);
  const writingScale = lookupThreshold(writingRaw, FCE_WRITING_SCALE_TABLE);
  const listeningScale = lookupThreshold(listeningRaw, FCE_LISTENING_SCALE_TABLE);
  return {
    mode: 'MSE_SCALE',
    value: averageAvailableScores([readingScale, useOfEnglishScale, writingScale, listeningScale]),
    readingScale,
    useOfEnglishScale,
    writingScale,
    listeningScale,
  };
}

export interface ConvertRawScoresOptions {
  /**
   * FCE 专用：试卷「语用」(Reading 卷 Part 2–4) 原始分合计。
   * 传入时 `readingRaw` 须为 Reading 分项（Part 1、5、6、7）原始分合计。
   */
  fceUseOfEnglishRaw?: number;
}

export function convertRawScores(
  level: CambridgeLevel,
  readingRaw: number,
  writingRaw: number,
  listeningRaw: number,
  options?: ConvertRawScoresOptions,
): ConvertedResult {
  if (level === 'Starters' || level === 'Movers' || level === 'Flyers') {
    return convertToYLEShields(level, readingRaw, writingRaw, listeningRaw);
  }
  if (level === 'KET') {
    return convertKET(readingRaw, writingRaw, listeningRaw);
  }
  if (level === 'PET') {
    return convertPET(readingRaw, writingRaw, listeningRaw);
  }
  const uoe = options?.fceUseOfEnglishRaw;
  if (uoe === undefined) {
    throw new Error('FCE 换算需要提供 options.fceUseOfEnglishRaw（语用 Part 2–4 原始分合计）。');
  }
  return convertFCE(readingRaw, uoe, writingRaw, listeningRaw);
}

function buildReadingMap(
  row: Record<string, unknown>,
  level: CambridgeLevel,
  rowNumber: number,
): { scores: Record<ReadingPartKey, number>; issues: ParseIssue[] } {
  const p1 = extractPartValue(row, level, rowNumber, 'R', 1);
  const p2 = extractPartValue(row, level, rowNumber, 'R', 2);
  const p3 = extractPartValue(row, level, rowNumber, 'R', 3);
  const p4 = extractPartValue(row, level, rowNumber, 'R', 4);
  const p5 = extractPartValue(row, level, rowNumber, 'R', 5);
  const p6 = extractPartValue(row, level, rowNumber, 'R', 6);
  const p7 = extractPartValue(row, level, rowNumber, 'R', 7);
  return {
    scores: {
      R_P1: p1.score,
      R_P2: p2.score,
      R_P3: p3.score,
      R_P4: p4.score,
      R_P5: p5.score,
      R_P6: p6.score,
      R_P7: p7.score,
    },
    issues: [...p1.issues, ...p2.issues, ...p3.issues, ...p4.issues, ...p5.issues, ...p6.issues, ...p7.issues],
  };
}

function buildListeningMap(
  row: Record<string, unknown>,
  level: CambridgeLevel,
  rowNumber: number,
): { scores: Record<ListeningPartKey, number>; issues: ParseIssue[] } {
  const p1 = extractPartValue(row, level, rowNumber, 'L', 1);
  const p2 = extractPartValue(row, level, rowNumber, 'L', 2);
  const p3 = extractPartValue(row, level, rowNumber, 'L', 3);
  const p4 = extractPartValue(row, level, rowNumber, 'L', 4);
  const p5 = extractPartValue(row, level, rowNumber, 'L', 5);
  return {
    scores: {
      L_P1: p1.score,
      L_P2: p2.score,
      L_P3: p3.score,
      L_P4: p4.score,
      L_P5: p5.score,
    },
    issues: [...p1.issues, ...p2.issues, ...p3.issues, ...p4.issues, ...p5.issues],
  };
}

function buildWritingMap(
  row: Record<string, unknown>,
  level: CambridgeLevel,
  rowNumber: number,
): { scores: Record<WritingPartKey, number>; issues: ParseIssue[] } {
  const p1 = extractPartValue(row, level, rowNumber, 'W', 1);
  const p2 = extractPartValue(row, level, rowNumber, 'W', 2);
  return {
    scores: {
      W_P1: p1.score,
      W_P2: p2.score,
    },
    issues: [...p1.issues, ...p2.issues],
  };
}

function sumEnabledScores<T extends string>(scores: Record<T, number>, enabledParts: T[]): number {
  return enabledParts.reduce((total, part) => total + scores[part], 0);
}

function parseRowToRecord(
  row: Record<string, unknown>,
  rowNumber: number,
): { record: CambridgeExamRecord | null; issues: ParseIssue[] } {
  const namePrimary = readCellByAliases(row, HEADER_ALIASES.namePrimary);
  const nameZh = readCellByAliases(row, HEADER_ALIASES.nameZh);
  const nameEn = readCellByAliases(row, HEADER_ALIASES.nameEn);
  const name = namePrimary || [nameZh, nameEn].filter((item) => item.length > 0).join(' ').trim();

  const className = readCellByAliases(row, HEADER_ALIASES.className);
  const setName = readCellByAliases(row, HEADER_ALIASES.setName);
  const classSetLegacy = readCellByAliases(row, HEADER_ALIASES.classSetLegacy);
  const classSet = [className, setName].filter((item) => item.length > 0).join('-').trim() || classSetLegacy;
  const rawLevel = readCellByAliases(row, HEADER_ALIASES.level);
  const examDateRaw = readRawCellByAliases(row, HEADER_ALIASES.examDate);
  const examDate = parseExamDateValue(examDateRaw);

  if (!name) {
    return {
      record: null,
      issues: [{ rowNumber, message: '缺少学生姓名（Name/姓名）。' }],
    };
  }

  const level = parseLevel(rawLevel);
  if (!level) {
    return {
      record: null,
      issues: [
        {
          rowNumber,
          message: `考试级别无效：${rawLevel || '空值'}。仅支持 Starters/Movers/Flyers/KET/PET/FCE。`,
        },
      ],
    };
  }

  const readingResult = buildReadingMap(row, level, rowNumber);
  const listeningResult = buildListeningMap(row, level, rowNumber);
  const writingResult = buildWritingMap(row, level, rowNumber);
  const reading = readingResult.scores;
  const listening = listeningResult.scores;
  const writing = writingResult.scores;
  const readingEnabledParts = getReadingEnabledParts(level);
  const listeningEnabledParts = getListeningEnabledParts(level);
  const writingEnabledParts = getWritingEnabledParts(level);
  const readingRaw = sumEnabledScores(reading, readingEnabledParts);
  const listeningRaw = sumEnabledScores(listening, listeningEnabledParts);
  const writingRaw = sumEnabledScores(writing, writingEnabledParts);
  const rawTotal = readingRaw + listeningRaw + writingRaw;
  const maxTotal =
    [...readingEnabledParts, ...listeningEnabledParts, ...writingEnabledParts].reduce(
      (sum, partKey) => sum + getPartRawMax(level, partKey),
      0,
    );
  const accuracyRate = maxTotal > 0 ? rawTotal / maxTotal : 0;
  const convertedResult =
    level === 'FCE'
      ? convertFCE(
          FCE_READING_SECTION_PARTS.reduce((sum, key) => sum + reading[key], 0),
          FCE_USE_OF_ENGLISH_PARTS.reduce((sum, key) => sum + reading[key], 0),
          writingRaw,
          listeningRaw,
        )
      : convertRawScores(level, readingRaw, writingRaw, listeningRaw);

  return {
    record: {
      id: `${level}-${name}-${rowNumber}`,
      nameZh,
      nameEn,
      name,
      className,
      setName,
      classSet,
      level,
      examDate,
      reading,
      listening,
      writing,
      readingEnabledParts,
      listeningEnabledParts,
      writingEnabledParts,
      rawTotal,
      maxTotal,
      accuracyRate,
      convertedResult,
    },
    issues: [...readingResult.issues, ...listeningResult.issues, ...writingResult.issues],
  };
}

export async function parseCambridgeSpreadsheet(file: File): Promise<ParseCambridgeResult> {
  const fileBuffer = await readFileAsArrayBuffer(file);
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return { records: [], issues: [{ rowNumber: 0, message: '文件中未检测到工作表。' }] };
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const table = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '' });
  const preflightIssues = preflightValidateSheet(table);
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

  const records: CambridgeExamRecord[] = [];
  const issues: ParseIssue[] = preflightIssues.map((issue) => ({ rowNumber: issue.rowNumber, message: issue.message }));

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const { record, issues: rowIssues } = parseRowToRecord(row, rowNumber);
    if (record) {
      records.push(record);
    }
    issues.push(...rowIssues);
  });

  return { records, issues };
}