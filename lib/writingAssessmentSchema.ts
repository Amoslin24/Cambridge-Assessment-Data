export type WritingAssessmentLevel = 'Flyers' | 'KET' | 'PET' | 'FCE' | 'CAE';

export type WritingDimensionKey =
  | 'content'
  | 'taskAchievement'
  | 'communicativeAchievement'
  | 'organisation'
  | 'language'
  | 'vocabulary'
  | 'grammar';

export interface WritingDimensionDefinition {
  key: WritingDimensionKey;
  labelZh: string;
  labelEn: string;
  min: number;
  max: number;
  step: number;
  required: boolean;
}

export interface WritingLevelDefinition {
  level: WritingAssessmentLevel;
  officialExamName: string;
  scoringScaleName: string;
  dimensions: WritingDimensionDefinition[];
  overallRule: {
    formulaZh: string;
    formulaEn: string;
    rounding: 'none' | 'nearest_integer' | 'nearest_0.5';
    min: number;
    max: number;
  };
  notes: string[];
}

export interface WritingAssessmentJsonOutput {
  schemaVersion: '1.0.0';
  level: WritingAssessmentLevel;
  rubricSource: {
    family: 'Cambridge';
    summary: string;
  };
  task: {
    prompt: string;
    candidateText: string;
    wordCount: number;
  };
  scores: {
    dimensions: Partial<Record<WritingDimensionKey, number>>;
    overall: number;
  };
  diagnostic: {
    strengths: string[];
    priorities: string[];
    corrections: Array<{
      original: string;
      suggestion: string;
      reason: string;
      category: 'grammar' | 'vocabulary' | 'spelling' | 'cohesion' | 'task';
    }>;
  };
  confidence: {
    score: number;
    reason: string;
  };
}

const FLYERS_DIMENSIONS: WritingDimensionDefinition[] = [
  { key: 'content', labelZh: '内容覆盖', labelEn: 'Content Coverage', min: 0, max: 5, step: 1, required: true },
  { key: 'organisation', labelZh: '故事连贯', labelEn: 'Organisation', min: 0, max: 5, step: 1, required: true },
  { key: 'language', labelZh: '语言准确', labelEn: 'Language', min: 0, max: 5, step: 1, required: true },
];

const KET_DIMENSIONS: WritingDimensionDefinition[] = [
  { key: 'content', labelZh: '内容完成度', labelEn: 'Content', min: 0, max: 5, step: 1, required: true },
  { key: 'organisation', labelZh: '组织结构', labelEn: 'Organisation', min: 0, max: 5, step: 1, required: true },
  { key: 'language', labelZh: '语言表现', labelEn: 'Language', min: 0, max: 5, step: 1, required: true },
];

const PET_FCE_CAE_DIMENSIONS: WritingDimensionDefinition[] = [
  { key: 'content', labelZh: '内容完成度', labelEn: 'Content', min: 0, max: 5, step: 1, required: true },
  {
    key: 'communicativeAchievement',
    labelZh: '交际效果',
    labelEn: 'Communicative Achievement',
    min: 0,
    max: 5,
    step: 1,
    required: true,
  },
  { key: 'organisation', labelZh: '组织结构', labelEn: 'Organisation', min: 0, max: 5, step: 1, required: true },
  { key: 'language', labelZh: '语言表现', labelEn: 'Language', min: 0, max: 5, step: 1, required: true },
];

export const WRITING_LEVEL_DEFINITIONS: Record<WritingAssessmentLevel, WritingLevelDefinition> = {
  Flyers: {
    level: 'Flyers',
    officialExamName: 'A2 Flyers (YLE)',
    scoringScaleName: 'Shields-aligned analytic rubric',
    dimensions: FLYERS_DIMENSIONS,
    overallRule: {
      formulaZh: 'overall = round((content + organisation + language) / 3)',
      formulaEn: 'overall = round((content + organisation + language) / 3)',
      rounding: 'nearest_integer',
      min: 0,
      max: 5,
    },
    notes: [
      'Flyers 为少儿体系，官方成绩报告以 shields 呈现，不等同于 PET/FCE/CAE 四维量表。',
      '用于 AI 批改时建议保持 0-5 整数档，避免引入半分档造成解释歧义。',
    ],
  },
  KET: {
    level: 'KET',
    officialExamName: 'A2 Key / A2 Key for Schools',
    scoringScaleName: 'Cambridge Writing Assessment Scales (A2)',
    dimensions: KET_DIMENSIONS,
    overallRule: {
      formulaZh: 'overall = (content + organisation + language) / 3',
      formulaEn: 'overall = (content + organisation + language) / 3',
      rounding: 'none',
      min: 0,
      max: 5,
    },
    notes: [
      'KET 写作为 3 维：Content / Organisation / Language。',
      '官方卷面标注为整分；系统内可保留小数用于模型校准。',
    ],
  },
  PET: {
    level: 'PET',
    officialExamName: 'B1 Preliminary / B1 Preliminary for Schools',
    scoringScaleName: 'Cambridge Writing Assessment Scales (B1)',
    dimensions: PET_FCE_CAE_DIMENSIONS,
    overallRule: {
      formulaZh: 'overall = (content + communicativeAchievement + organisation + language) / 4',
      formulaEn: 'overall = (content + communicativeAchievement + organisation + language) / 4',
      rounding: 'none',
      min: 0,
      max: 5,
    },
    notes: ['PET 起采用 4 维写作量表。'],
  },
  FCE: {
    level: 'FCE',
    officialExamName: 'B2 First / B2 First for Schools',
    scoringScaleName: 'Cambridge Writing Assessment Scales (B2)',
    dimensions: PET_FCE_CAE_DIMENSIONS,
    overallRule: {
      formulaZh: 'overall = (content + communicativeAchievement + organisation + language) / 4',
      formulaEn: 'overall = (content + communicativeAchievement + organisation + language) / 4',
      rounding: 'none',
      min: 0,
      max: 5,
    },
    notes: ['FCE 建议输出四维分 + 总评，便于后续映射 Cambridge English Scale。'],
  },
  CAE: {
    level: 'CAE',
    officialExamName: 'C1 Advanced',
    scoringScaleName: 'Cambridge Writing Assessment Scales (C1)',
    dimensions: PET_FCE_CAE_DIMENSIONS,
    overallRule: {
      formulaZh: 'overall = (content + communicativeAchievement + organisation + language) / 4',
      formulaEn: 'overall = (content + communicativeAchievement + organisation + language) / 4',
      rounding: 'none',
      min: 0,
      max: 5,
    },
    notes: [
      'CAE 与 PET/FCE 同为 4 维框架，但对语言成熟度、体裁控制和逻辑完整性要求显著更高。',
      '建议在模型输出中保留每个维度的证据句，支持人工复核。',
    ],
  },
};

export function getWritingLevelDefinition(level: WritingAssessmentLevel): WritingLevelDefinition {
  return WRITING_LEVEL_DEFINITIONS[level];
}

export function getRequiredDimensionKeys(level: WritingAssessmentLevel): WritingDimensionKey[] {
  return WRITING_LEVEL_DEFINITIONS[level].dimensions.filter((item) => item.required).map((item) => item.key);
}

export const WRITING_JSON_OUTPUT_TEMPLATE: WritingAssessmentJsonOutput = {
  schemaVersion: '1.0.0',
  level: 'FCE',
  rubricSource: {
    family: 'Cambridge',
    summary: 'Cambridge Writing Assessment Scales aligned output',
  },
  task: {
    prompt: '',
    candidateText: '',
    wordCount: 0,
  },
  scores: {
    dimensions: {
      content: 0,
      communicativeAchievement: 0,
      organisation: 0,
      language: 0,
    },
    overall: 0,
  },
  diagnostic: {
    strengths: [],
    priorities: [],
    corrections: [],
  },
  confidence: {
    score: 0,
    reason: '',
  },
};
