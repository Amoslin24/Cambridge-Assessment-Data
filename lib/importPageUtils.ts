import type { CambridgeExamRecord, ParseIssue } from '@/lib/cambridgeEngine';
import { classifyIssueKind, classifyIssuePart, getIssueKindLabel } from '@/lib/importIssueUtils';

export type ImportMode = 'replace' | 'append';

export interface ImportAuditEntry {
  id: string;
  importedAt: string;
  fileName: string;
  mode: ImportMode;
  addedCount: number;
  replacedCount: number;
  issueCount: number;
  totalAfterImport: number;
}

export type TemplateLanguage = 'zh' | 'en';

export interface SkillRawScores {
  readingRaw: number;
  writingRaw: number;
  listeningRaw: number;
}

export interface ReplacedRecordPreview {
  key: string;
  previous: CambridgeExamRecord;
  incoming: CambridgeExamRecord;
}

export interface MergeOutcome {
  merged: CambridgeExamRecord[];
  addedCount: number;
  replacedCount: number;
  replacedPreviews: ReplacedRecordPreview[];
}

export function renderConvertedResult(record: CambridgeExamRecord): string {
  if (record.convertedResult.mode === 'YLE_SHIELDS') {
    return `${record.convertedResult.value} 盾（总10，R&W ${record.convertedResult.readingWritingShield} / L ${record.convertedResult.listeningShield}）`;
  }
  return `${record.convertedResult.value} 分（R ${record.convertedResult.readingScale} / W ${record.convertedResult.writingScale} / L ${record.convertedResult.listeningScale}）`;
}

export function isYLELevel(level: CambridgeExamRecord['level']): boolean {
  return level === 'Starters' || level === 'Movers' || level === 'Flyers';
}

export function sumScores<T extends string>(scores: Record<T, number>, enabled: T[]): number {
  return enabled.reduce((total, key) => total + scores[key], 0);
}

export function getSkillRawScores(record: CambridgeExamRecord): SkillRawScores {
  return {
    readingRaw: sumScores(record.reading, record.readingEnabledParts),
    writingRaw: sumScores(record.writing, record.writingEnabledParts),
    listeningRaw: sumScores(record.listening, record.listeningEnabledParts),
  };
}

export function renderSkillConvertedBreakdown(record: CambridgeExamRecord): string {
  if (record.convertedResult.mode === 'YLE_SHIELDS') {
    return `R&W: ${record.convertedResult.readingWritingShield}盾 | L: ${record.convertedResult.listeningShield}盾`;
  }
  return `R: ${record.convertedResult.readingScale} | W: ${record.convertedResult.writingScale} | L: ${record.convertedResult.listeningScale}`;
}

export function createEmptyTemplateCsvContent(language: TemplateLanguage): string {
  const header =
    language === 'en'
      ? 'Name,Class,Set,Level,ExamDate,R_P1,R_P2,R_P3,R_P4,R_P5,R_P6,R_P7,L_P1,L_P2,L_P3,L_P4,L_P5,W_P1,W_P2'
      : '姓名,班级,组别,级别,考试日期,R_P1,R_P2,R_P3,R_P4,R_P5,R_P6,R_P7,L_P1,L_P2,L_P3,L_P4,L_P5,W_P1,W_P2';
  const emptyRow = ',,,,,,,,,,,,,,,,,,,';
  return `${header}\n${emptyRow}\n`;
}

export function escapeCsvCell(value: string | number): string {
  const stringValue = String(value);
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r')
  ) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }
  return stringValue;
}

export function buildRecordDedupKey(record: CambridgeExamRecord): string {
  return [
    record.name.trim().toLowerCase(),
    record.examDate.trim(),
    record.level,
    record.className.trim().toLowerCase(),
    record.setName.trim().toLowerCase(),
  ].join('|');
}

export function mergeRecordsByKey(
  existing: CambridgeExamRecord[],
  incoming: CambridgeExamRecord[],
): MergeOutcome {
  const mergedMap = new Map<string, CambridgeExamRecord>();
  const existingMap = new Map<string, CambridgeExamRecord>();
  existing.forEach((record) => {
    const key = buildRecordDedupKey(record);
    mergedMap.set(key, record);
    existingMap.set(key, record);
  });

  let addedCount = 0;
  let replacedCount = 0;
  const replacedPreviews: ReplacedRecordPreview[] = [];
  incoming.forEach((record) => {
    const key = buildRecordDedupKey(record);
    const previous = existingMap.get(key);
    if (previous) {
      replacedCount += 1;
      replacedPreviews.push({ key, previous, incoming: record });
    } else {
      addedCount += 1;
    }
    mergedMap.set(key, record);
  });

  return {
    merged: Array.from(mergedMap.values()),
    addedCount,
    replacedCount,
    replacedPreviews,
  };
}

export function buildRecordsCsvContent(items: CambridgeExamRecord[]): string {
  const header = [
    'Name',
    'Class',
    'Set',
    'ClassSet',
    'Level',
    'ExamDate',
    'R_P1',
    'R_P2',
    'R_P3',
    'R_P4',
    'R_P5',
    'R_P6',
    'R_P7',
    'L_P1',
    'L_P2',
    'L_P3',
    'L_P4',
    'L_P5',
    'W_P1',
    'W_P2',
    'RawTotal',
    'MaxTotal',
    'AccuracyRate',
    'ConvertedMode',
    'ConvertedValue',
    'ConvertedReadingOrRW',
    'ConvertedWriting',
    'ConvertedListening',
  ];

  const rows = items.map((record) => [
    record.name,
    record.className,
    record.setName,
    record.classSet,
    record.level,
    record.examDate,
    record.reading.R_P1,
    record.reading.R_P2,
    record.reading.R_P3,
    record.reading.R_P4,
    record.reading.R_P5,
    record.reading.R_P6,
    record.reading.R_P7,
    record.listening.L_P1,
    record.listening.L_P2,
    record.listening.L_P3,
    record.listening.L_P4,
    record.listening.L_P5,
    record.writing.W_P1,
    record.writing.W_P2,
    record.rawTotal,
    record.maxTotal,
    Number(record.accuracyRate.toFixed(4)),
    record.convertedResult.mode,
    record.convertedResult.value,
    record.convertedResult.mode === 'YLE_SHIELDS'
      ? record.convertedResult.readingWritingShield
      : record.convertedResult.readingScale,
    record.convertedResult.mode === 'YLE_SHIELDS' ? '' : record.convertedResult.writingScale,
    record.convertedResult.mode === 'YLE_SHIELDS'
      ? record.convertedResult.listeningShield
      : record.convertedResult.listeningScale,
  ]);

  const lines = [header, ...rows].map((row) => row.map(escapeCsvCell).join(','));
  return `${lines.join('\n')}\n`;
}

export function buildIssuesCsvContent(items: ParseIssue[]): string {
  const header = ['RowNumber', 'IssueType', 'Part', 'Message'];
  const rows = items.map((issue) => [
    issue.rowNumber,
    getIssueKindLabel(classifyIssueKind(issue)),
    classifyIssuePart(issue),
    issue.message,
  ]);
  const lines = [header, ...rows].map((row) => row.map(escapeCsvCell).join(','));
  return `${lines.join('\n')}\n`;
}

export function buildAuditCsvContent(items: ImportAuditEntry[]): string {
  const header = [
    'ImportedAt',
    'FileName',
    'Mode',
    'AddedCount',
    'ReplacedCount',
    'IssueCount',
    'TotalAfterImport',
  ];
  const rows = items.map((entry) => [
    entry.importedAt,
    entry.fileName,
    entry.mode,
    entry.addedCount,
    entry.replacedCount,
    entry.issueCount,
    entry.totalAfterImport,
  ]);
  const lines = [header, ...rows].map((row) => row.map(escapeCsvCell).join(','));
  return `${lines.join('\n')}\n`;
}
