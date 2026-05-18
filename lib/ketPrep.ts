import {
  getListeningEnabledParts,
  getPartRawMax,
  getReadingEnabledParts,
  type CambridgePartKey,
  type ListeningPartKey,
  type ReadingPartKey,
  type WritingPartKey,
} from '@/lib/cambridgeEngine';
import { SKILL_LIBRARY_ENTRIES, type SkillLibraryEntry } from '@/lib/skillLibrary.generated';

export type KetPrepSkill = 'reading' | 'listening' | 'writing';

export type KetPartAvailability = 'demo' | 'coming_soon';

export interface KetPrepPart {
  partKey: CambridgePartKey;
  skill: KetPrepSkill;
  partNumber: number;
  titleZh: string;
  taskTypeZh: string;
  maxScore: number;
  teachingAdvice: string;
  availability: KetPartAvailability;
  demoExerciseCount: number;
}

export interface KetMcqItem {
  id: string;
  /** 结构化视觉题干（便签 / 手机 / 告示 / 邮件） */
  prompt?: import('@/lib/ketPromptTypes').KetReadingPrompt;
  /** 视觉下方的提问句，如 "The club wants to find people who" */
  question: string;
  /** 旧版整段题干；无 prompt 时回退显示 */
  stem?: string;
  options: string[];
  correctAnswer: string;
  explanationZh: string;
}

export interface KetDemoExerciseSet {
  partKey: ReadingPartKey;
  titleZh: string;
  introZh: string;
  items: KetMcqItem[];
}

const KET_LEVEL = 'KET' as const;

const SKILL_LABEL: Record<KetPrepSkill, string> = {
  reading: '阅读',
  listening: '听力',
  writing: '写作',
};

function partKeyToSkill(partKey: CambridgePartKey): KetPrepSkill | null {
  if (partKey.startsWith('R_')) {
    return 'reading';
  }
  if (partKey.startsWith('L_')) {
    return 'listening';
  }
  if (partKey.startsWith('W_')) {
    return 'writing';
  }
  return null;
}

function stripSkillPrefix(skillLabel: string): string {
  return skillLabel.replace(/^\[[^\]]+\]\s*/, '').trim();
}

function findKetLibraryEntry(partKey: CambridgePartKey): SkillLibraryEntry | undefined {
  const match = /^([RLW])_P(\d+)$/.exec(partKey);
  if (!match) {
    return undefined;
  }
  const typePart = `${match[1]}-Pt${match[2]}`;
  return SKILL_LIBRARY_ENTRIES.find((entry) => entry.level === KET_LEVEL && entry.typePart === typePart);
}

/** URL 段：`r-p1` ↔ `R_P1` */
export function slugToPartKey(slug: string): CambridgePartKey | null {
  const match = /^([rlw])-p(\d+)$/i.exec(slug.trim());
  if (!match) {
    return null;
  }
  return `${match[1].toUpperCase()}_P${match[2]}` as CambridgePartKey;
}

export function partKeyToSlug(partKey: CambridgePartKey): string {
  const match = /^([RLW])_P(\d+)$/.exec(partKey);
  if (!match) {
    return '';
  }
  return `${match[1].toLowerCase()}-p${match[2]}`;
}

export function getKetSkillLabel(skill: KetPrepSkill): string {
  return SKILL_LABEL[skill];
}

const DEMO_EXERCISES_BY_PART: Partial<Record<ReadingPartKey, KetDemoExerciseSet>> = {
  R_P1: {
    partKey: 'R_P1',
    titleZh: '阅读 Part 1 · 示范练习',
    introZh:
      '以下为原创示范题，格式对齐 A2 Key 短讯息理解（非官方真题）。正式题库接入后，本页将从服务端加载练习套次。',
    items: [
      {
        id: 'r1-q1',
        prompt: {
          variant: 'note',
          lines: [
            'Drama club starts 15 minutes earlier this Friday.',
            'Meet at Room 12, not the hall.',
          ],
        },
        question: 'What must members remember?',
        options: [
          'They should go to the main hall.',
          'They need to arrive sooner on Friday.',
          'The club is cancelled this week.',
        ],
        correctAnswer: 'They need to arrive sooner on Friday.',
        explanationZh:
          '原文说明周五戏剧社提前 15 分钟开始，对应选项为「周五需更早到达」。干扰项分别偷换地点与取消信息。',
      },
      {
        id: 'r1-q2',
        question: '',
        stem: 'An email says:\n\n"Your library book is due tomorrow. You can renew it online if you need one more week."\n\nWhat can the student do?',
        options: [
          'Keep the book longer by renewing online.',
          'Buy the book from the library shop.',
          'Return the book after two months.',
        ],
        correctAnswer: 'Keep the book longer by renewing online.',
        explanationZh:
          '「renew online」与「one more week」表明可在线续借以延长一周；其余选项与邮件信息不符。',
      },
      {
        id: 'r1-q3',
        question: '',
        stem: 'A sign at the sports centre reads:\n\n"Pool closed for cleaning until 4 p.m. Gym and café stay open."\n\nWhich place is NOT available in the afternoon?',
        options: ['The swimming pool', 'The gym', 'The café'],
        correctAnswer: 'The swimming pool',
        explanationZh: '游泳池清洁关闭至下午 4 点；健身房与咖啡厅仍开放。',
      },
    ],
  },
};

function isKetEnabledPart(partKey: CambridgePartKey): boolean {
  if (partKey.startsWith('R_')) {
    return getReadingEnabledParts(KET_LEVEL).includes(partKey as ReadingPartKey);
  }
  if (partKey.startsWith('L_')) {
    return getListeningEnabledParts(KET_LEVEL).includes(partKey as ListeningPartKey);
  }
  if (partKey.startsWith('W_')) {
    return (['W_P1', 'W_P2'] as WritingPartKey[]).includes(partKey as WritingPartKey);
  }
  return false;
}

function buildKetPrepPart(partKey: CambridgePartKey): KetPrepPart | null {
  if (!isKetEnabledPart(partKey)) {
    return null;
  }
  const skill = partKeyToSkill(partKey);
  if (!skill) {
    return null;
  }
  const library = findKetLibraryEntry(partKey);
  const partNumber = Number(partKey.split('_P')[1]);
  const demoSet = DEMO_EXERCISES_BY_PART[partKey as ReadingPartKey];
  const hasDemo = Boolean(demoSet && demoSet.items.length > 0);

  return {
    partKey,
    skill,
    partNumber,
    titleZh: `${getKetSkillLabel(skill)} Part ${partNumber}`,
    taskTypeZh: library ? stripSkillPrefix(library.skill) : partKey,
    maxScore: getPartRawMax(KET_LEVEL, partKey),
    teachingAdvice: library?.advice ?? '请关注官方考纲对该题段的技能要求，并结合错题进行针对性巩固。',
    availability: hasDemo ? 'demo' : 'coming_soon',
    demoExerciseCount: demoSet?.items.length ?? 0,
  };
}

export function getKetPrepParts(): KetPrepPart[] {
  const keys: CambridgePartKey[] = [
    ...getReadingEnabledParts(KET_LEVEL),
    ...getListeningEnabledParts(KET_LEVEL),
    'W_P1',
    'W_P2',
  ];
  return keys
    .map((partKey) => buildKetPrepPart(partKey))
    .filter((part): part is KetPrepPart => part !== null);
}

export function getKetPrepPartsBySkill(skill: KetPrepSkill): KetPrepPart[] {
  return getKetPrepParts().filter((part) => part.skill === skill);
}

export function getKetPrepPart(partKey: CambridgePartKey): KetPrepPart | null {
  return buildKetPrepPart(partKey);
}

export function getKetDemoExercise(partKey: CambridgePartKey): KetDemoExerciseSet | null {
  if (!partKey.startsWith('R_')) {
    return null;
  }
  return DEMO_EXERCISES_BY_PART[partKey as ReadingPartKey] ?? null;
}

export const KET_EXAM_OVERVIEW_ZH = {
  title: 'Cambridge English: A2 Key (KET)',
  cefr: 'CEFR A2',
  durationZh: '阅读与写作约 60 分钟；听力约 30 分钟；口语约 8–10 分钟（与考官互动）。',
  papersZh:
    '试卷涵盖阅读与写作、听力、口语。本练习中心按阅读 / 听力 / 写作 Part 组织，题段满分与 Valruna 成绩导入口径一致（`getPartRawMax`）。',
  yleNote:
    'YLE（Starters / Movers / Flyers）练习入口将随后续版本开放；当前优先建设 KET 备考模块，并预留与分析面板的弱项联动接口。',
} as const;
