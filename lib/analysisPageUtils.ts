import { extractConvertedTotal } from '@/lib/convertedTotalDistribution';
import type { CambridgeExamRecord } from '@/lib/cambridgeEngine';
import {
  mapPartToTypePart,
  pickMinPartsPerSkill,
  pickPartForSuggestion,
  type PartThresholdPartition,
  type SkillDetail,
  type SkillStrength,
} from '@/lib/examSkillBreakdown';
import { getPartRawMax, type CambridgePartKey } from '@/lib/cambridgeEngine';
import type { SkillLibraryEntry } from '@/lib/skillLibrary.generated';

export interface TrendPoint {
  examDate: string;
  converted: number;
  rawTotal: number;
  maxTotal: number;
}

export interface SkillBarPoint {
  skill: string;
  raw: number;
  converted: number;
}

/** 小题对比表：含各日期正确率（%）及 rawByDate 原始分映射。 */
export type PartComparisonRow = Record<string, string | number | Record<string, number>>;

export interface ProgressMetrics {
  mode: 'YLE_SHIELDS' | 'MSE_SCALE';
  recordCount: number;
  firstDate: string;
  latestDate: string;
  firstConverted: number;
  latestConverted: number;
  deltaConverted: number;
  averageDeltaPerExam: number;
  stdDevConverted: number;
  note: string;
}

export function isYLELevel(level: CambridgeExamRecord['level']): boolean {
  return level === 'Starters' || level === 'Movers' || level === 'Flyers';
}

export function sumScores<T extends string>(scores: Record<T, number>, enabled: T[]): number {
  return enabled.reduce((total, key) => total + scores[key], 0);
}

export function formatConvertedTotal(record: CambridgeExamRecord): string {
  const value = extractConvertedTotal(record);
  if (record.convertedResult.mode === 'YLE_SHIELDS') {
    return `${value} 盾（总10）`;
  }
  return `${value} 分（Scale）`;
}

export function formatConvertedSkillValue(record: CambridgeExamRecord, detail: SkillDetail): string {
  if (record.convertedResult.mode === 'YLE_SHIELDS') {
    return `${detail.converted} 盾`;
  }
  if (detail.converted === 0 && detail.rawTotal > 0) {
    return `0 分（未达到量表最低阈值）`;
  }
  return `${detail.converted} 分`;
}

export function buildSkillRadarData(
  record: CambridgeExamRecord,
  details: SkillDetail[],
): Array<{ skill: string; converted: number; fullMark: number }> {
  if (record.convertedResult.mode === 'YLE_SHIELDS') {
    return details.map((detail) => ({
      skill: detail.skill,
      converted: detail.converted,
      fullMark: 5,
    }));
  }
  return details.map((detail) => ({
    skill: detail.skill,
    converted: detail.converted,
    fullMark: 190,
  }));
}

type MinPartsRows = ReturnType<typeof pickMinPartsPerSkill>;

type PracticeDimension = 'LISTENING' | 'READING' | 'WRITING' | 'LANGUAGE_USE';
type QuestionPattern =
  | 'FILL_BLANK'
  | 'MULTIPLE_CHOICE'
  | 'MATCHING'
  | 'WORD_FORMATION_OR_GRAMMAR'
  | 'SENTENCE_REORDER'
  | 'WRITING_TASK'
  | 'GENERAL';

interface ActionableGuidance {
  answerTips: string[];
  cautionPoints: string[];
  microDrillPlan: string[];
  acceptanceCriteria: string[];
}

function inferPracticeDimension(typePart: string | null, entrySkill: string | undefined, fallbackSkill: string): PracticeDimension {
  const skillText = `${entrySkill ?? ''}|${fallbackSkill}`.toLowerCase();
  if (typePart?.startsWith('L-') || skillText.includes('听力')) {
    return 'LISTENING';
  }
  if (typePart?.startsWith('W-') || skillText.includes('写作')) {
    return 'WRITING';
  }
  if (skillText.includes('语用') || skillText.includes('语法') || skillText.includes('构词')) {
    return 'LANGUAGE_USE';
  }
  return 'READING';
}

function inferQuestionPattern(entry: SkillLibraryEntry | undefined): QuestionPattern {
  const text = `${entry?.skill ?? ''}|${entry?.advice ?? ''}|${entry?.tips?.join(' ') ?? ''}`.toLowerCase();
  if (text.includes('写作') || text.includes('essay') || text.includes('邮件') || text.includes('故事')) {
    return 'WRITING_TASK';
  }
  if (text.includes('还原')) {
    return 'SENTENCE_REORDER';
  }
  if (text.includes('匹配') || text.includes('连线')) {
    return 'MATCHING';
  }
  if (text.includes('填空') || text.includes('补全') || text.includes('完形')) {
    return 'FILL_BLANK';
  }
  if (text.includes('多选') || text.includes('选择题') || text.includes('三选一')) {
    return 'MULTIPLE_CHOICE';
  }
  if (text.includes('构词') || text.includes('语法') || text.includes('句型转换') || text.includes('word formation')) {
    return 'WORD_FORMATION_OR_GRAMMAR';
  }
  return 'GENERAL';
}

function buildActionableGuidance(
  dimension: PracticeDimension,
  pattern: QuestionPattern,
  strength: SkillStrength,
): ActionableGuidance {
  const weakIntensityNote =
    strength === 'WEAK'
      ? '本阶段先追求“稳定做对基础题”，再逐步提高速度。'
      : '本阶段重点是“稳定率”，避免在已掌握题型上反复丢分。';

  if (dimension === 'LISTENING') {
    if (pattern === 'FILL_BLANK') {
      return {
        answerTips: [
          '先浏览题干并预测词性（名词/数字/动词），听时只抓该位置信息。',
          '第一遍先定位答案区间，第二遍再确认拼写、单复数和时态。',
          '听到同义改写时立刻标记，不等待原词复现。',
        ],
        cautionPoints: [
          '避免“听到单词就写”，需确认其与题干语义一致。',
          '数字、日期、人名容易失分，必须做拼写复核。',
          '填写后检查语法是否通顺，尤其冠词与复数形式。',
        ],
        microDrillPlan: [
          '3分钟：教师带做1题，示范“预测词性-定位-复核”流程。',
          '6分钟：学生独立做同类3题，要求写出定位依据。',
          '4分钟：同伴互查拼写和语法，归类错因并口头复述。',
        ],
        acceptanceCriteria: [
          '同类小练连续2次正确率达到70%以上。',
          '错因记录中“拼写/单复数”类错误占比逐周下降。',
          weakIntensityNote,
        ],
      };
    }
    if (pattern === 'MULTIPLE_CHOICE') {
      return {
        answerTips: [
          '先读选项差异词，明确每个选项的判别点。',
          '听时关注转折词（but/however/actually）后的真实信息。',
          '用排除法记录“已被证伪”的选项，减少反复犹豫。',
        ],
        cautionPoints: [
          '首个听到的信息常是干扰项，不可提前定答案。',
          '区分事实陈述与说话人态度，避免“词对义错”。',
          '避免只凭关键词匹配，必须对齐完整语义。',
        ],
        microDrillPlan: [
          '2分钟：标注每题选项差异词。',
          '8分钟：完成1组多选训练并写出排除理由。',
          '3分钟：教师复盘干扰项设计，强调转折后信息。',
        ],
        acceptanceCriteria: [
          '每题都能写出至少1条排除依据。',
          '同类题连续两次错误不超过1题。',
          weakIntensityNote,
        ],
      };
    }
    return {
      answerTips: [
        '听前先读题，明确要抓“人物-事件-时间/地点”哪一类信息。',
        '听中做关键词速记，听后用题干回查语义一致性。',
        '优先保证定位准确，再追求答题速度。',
      ],
      cautionPoints: [
        '避免依赖单词命中，需验证上下文逻辑。',
        '听力答案要做拼写与语法双重复核。',
        '同类错因连续出现时必须单独训练。',
      ],
      microDrillPlan: ['3分钟策略示范 + 8分钟同类题练习 + 4分钟错因复盘。'],
      acceptanceCriteria: ['本题型周测正确率稳定达到70%以上。', weakIntensityNote],
    };
  }

  if (dimension === 'WRITING') {
    return {
      answerTips: [
        '先列提纲：明确开头-主体-结尾，每段只承载一个核心信息。',
        '先确保任务点完整覆盖，再提升词汇与句式复杂度。',
        '完成后执行“内容-结构-语言”三步自检。',
      ],
      cautionPoints: [
        '避免只写模板句而缺少题目要求的信息回应。',
        '时态、主谓一致、拼写是稳定失分点，需逐句检查。',
        '语域要与任务匹配（正式/非正式），避免混用。',
      ],
      microDrillPlan: [
        '5分钟：拆题并标注必须覆盖的信息点。',
        '10分钟：限时写作（先完成骨架句）。',
        '5分钟：按评分维度进行同伴互评与修订。',
      ],
      acceptanceCriteria: [
        '每次写作均覆盖全部任务点，无遗漏。',
        '语法与拼写低级错误控制在可复核范围内并持续下降。',
        weakIntensityNote,
      ],
    };
  }

  if (dimension === 'LANGUAGE_USE') {
    return {
      answerTips: [
        '先判断空格语法角色，再决定词形/时态/搭配。',
        '优先调用高频语法框架（介词搭配、从句引导、固定短语）。',
        '做完后整句回读，检验语义与语法双一致。',
      ],
      cautionPoints: [
        '不要只看局部词汇，必须结合前后句逻辑。',
        '构词题要检查词性是否匹配句法位置。',
        '句型转换需保持原句核心意义不变。',
      ],
      microDrillPlan: [
        '4分钟：归纳本节高频语法点与常错项。',
        '8分钟：完成同类型小题并标注语法依据。',
        '3分钟：对错题做“规则-例句-再做1题”闭环。',
      ],
      acceptanceCriteria: [
        '同类语法点错误不连续出现超过2次。',
        '能口头说明每题答案的语法依据。',
        weakIntensityNote,
      ],
    };
  }

  if (pattern === 'MATCHING' || pattern === 'SENTENCE_REORDER') {
    return {
      answerTips: [
        '先抓题干与选项的核心语义，再进行同义替换匹配。',
        '优先利用代词、连接词和逻辑关系词定位。',
        '先完成确定项，最后处理模糊项。',
      ],
      cautionPoints: [
        '避免仅凭关键词表面重合做匹配。',
        '警惕“局部匹配正确、整体逻辑错误”。',
        '还原类题型要检查前后文衔接是否自然。',
      ],
      microDrillPlan: [
        '3分钟：标注逻辑连接词与指代词。',
        '8分钟：完成题组并写出匹配依据。',
        '4分钟：对照依据复盘错误，补充同义替换表达。',
      ],
      acceptanceCriteria: ['同类题型每题均能给出文本依据。', weakIntensityNote],
    };
  }

  return {
    answerTips: [
      '先明确题目任务与评分点，再选择对应策略。',
      '坚持“先准确后速度”的做题顺序。',
      '每次练习后保留错因标签，便于下次定向复训。',
    ],
    cautionPoints: [
      '避免无复盘重复刷题，需记录错误模式。',
      '同一错误连续出现时要立刻回到基础规则。',
      '作答结束后必须完成一次快速复核。',
    ],
    microDrillPlan: ['5分钟示范 + 10分钟同类训练 + 5分钟错因复盘。'],
    acceptanceCriteria: ['周内同类任务正确率持续提升。', weakIntensityNote],
  };
}

function mergeStructuredGuidance(
  base: ActionableGuidance,
  entry: SkillLibraryEntry | undefined,
): ActionableGuidance {
  if (!entry) {
    return base;
  }
  return {
    answerTips: entry.tips.length > 0 ? entry.tips : base.answerTips,
    cautionPoints: entry.cautions.length > 0 ? entry.cautions : base.cautionPoints,
    microDrillPlan: entry.drills.length > 0 ? entry.drills : base.microDrillPlan,
    acceptanceCriteria: entry.acceptance.length > 0 ? entry.acceptance : base.acceptanceCriteria,
  };
}

/** 将题段列表格式化为「题段 + 答对题数/满分 + 约等于正确率」，避免读者将括号内数字误认为百分比。 */
function formatPartThresholdLine(
  record: CambridgeExamRecord,
  groups: Array<{ skill: string; parts: Array<{ part: string; value: number }> }>,
): string {
  return groups
    .map((group) => {
      const partsText = group.parts
        .map((p) => {
          const denom = getPartRawMax(record.level, p.part as CambridgePartKey);
          const pct = denom > 0 ? Math.round((p.value / denom) * 1000) / 10 : 0;
          return `${p.part}（本次答对 ${p.value}/${denom} 题，约 ${pct}%）`;
        })
        .join('；');
      return `${group.skill}：${partsText}`;
    })
    .join('。');
}

/**
 * 单张「优先改进」任务卡文案（分析页画像与诊断页共用）。
 * 句式拆为短行，便于家长与教师快速扫读。
 */
export function buildImprovementTaskCard(
  record: CambridgeExamRecord,
  skill: string,
  typePart: string | null,
  strength: SkillStrength,
  skillLibraryMap: Map<string, SkillLibraryEntry> | null,
): string {
  const key = typePart ? `${record.level}|${typePart}` : '';
  const entry = typePart && skillLibraryMap ? skillLibraryMap.get(key) : undefined;
  const freqText = strength === 'WEAK' ? '每周约 3 次' : '每周约 2 次';
  const minutesText = strength === 'WEAK' ? '单次约 15 分钟' : '单次约 10–15 分钟';
  const targetText =
    record.convertedResult.mode === 'YLE_SHIELDS'
      ? '阶段目标：该技能在后续测验中达到 3 盾或以上（总盾制）。'
      : '阶段目标：该技能对应题段的正确率在后续测验中稳定在 70% 或以上。';

  const focusName = entry?.skill ?? `「${skill}」维度下的具体题型需结合本次试卷与课堂观察再定`;
  const levelTag = typePart ? `${record.level}，题段 ${typePart}` : record.level;
  const dimension = inferPracticeDimension(typePart, entry?.skill, skill);
  const pattern = inferQuestionPattern(entry);
  const guidance = mergeStructuredGuidance(buildActionableGuidance(dimension, pattern, strength), entry);
  const basisLine =
    strength === 'WEAK'
      ? '判定说明：根据本次成绩，该技能整体处于「薄弱」档，建议近期作为备课与作业的重点。'
      : '判定说明：根据本次成绩，该技能整体处于「需关注」档，建议加强巩固，避免继续下滑。';

  const referenceLine = entry?.advice
    ? `参考训练要点（摘自技能库）：${entry.advice}`
    : '参考训练要点：技能库中暂无与本题段完全匹配的条目，可先按下列通用步骤组织训练；若后续补充技能库，将自动显示更具体的训练描述。';

  const lines: string[] = [
    `【优先改进】${focusName}（${levelTag}）`,
    basisLine,
    `建议练习频次与时长：${freqText}；${minutesText}。`,
    '【答题技巧】',
    ...guidance.answerTips.map((item) => `· ${item}`),
    '【注意事项】',
    ...guidance.cautionPoints.map((item) => `· ${item}`),
    referenceLine,
    '【课堂微训练流程（单次）】',
    ...guidance.microDrillPlan.map((item) => `· ${item}`),
    '【阶段验收标准】',
    ...guidance.acceptanceCriteria.map((item) => `· ${item}`),
    targetText,
  ];

  return lines.join('\n');
}

export function buildImprovementSuggestion(
  record: CambridgeExamRecord,
  weakSkills: Array<{ skill: string; converted: number; rawTotal: number; maxTotal: number; strength: SkillStrength }>,
  attentionSkills: Array<{
    skill: string;
    converted: number;
    rawTotal: number;
    maxTotal: number;
    strength: SkillStrength;
  }>,
  partitioned: PartThresholdPartition,
  minParts: MinPartsRows,
  skillLibraryMap: Map<string, SkillLibraryEntry> | null,
): string {
  const suggestions: string[] = [];

  const appendPartNarrative = (yle: boolean): void => {
    if (partitioned.weakBySkill.length > 0) {
      const partText = formatPartThresholdLine(record, partitioned.weakBySkill);
      suggestions.push(
        yle
          ? `【小题补充】下列题段在本次考试中正确率低于 60%（按各题段满分折算）。${partText}。教学建议：将上述题段纳入错题回顾与同类微练习，并在下一次小测或单元测中复查。`
          : `【小题补充】下列题段在本次考试中正确率低于 60%（按各题段满分折算）。${partText}。教学建议：结合课堂讲评进行分技能、分题型的错因分析，并布置针对性巩固作业。`,
      );
      return;
    }
    if (partitioned.attentionBySkill.length > 0) {
      const partText = formatPartThresholdLine(record, partitioned.attentionBySkill);
      suggestions.push(
        yle
          ? `【小题补充】下列题段正确率处于 60%–70% 的需关注区间（按各题段满分折算）。${partText}。教学建议：纳入周练与课堂即时反馈，防止波动发展为明显短板。`
          : `【小题补充】下列题段正确率处于 60%–70% 的需关注区间（按各题段满分折算）。${partText}。教学建议：纳入周练与课堂即时反馈，巩固审题与作答规范。`,
      );
    }
  };

  if (record.convertedResult.mode === 'YLE_SHIELDS') {
    if (weakSkills.length > 0) {
      const targetSkill = weakSkills[0]?.skill ?? 'R&W';
      const part = pickPartForSuggestion(targetSkill, partitioned, minParts);
      const typePart = part ? mapPartToTypePart(record, targetSkill, part) : null;
      suggestions.push(buildImprovementTaskCard(record, targetSkill, typePart, 'WEAK', skillLibraryMap));
    }
    if (weakSkills.length === 0 && attentionSkills.length > 0) {
      const targetSkill = attentionSkills[0]?.skill ?? 'R&W';
      const part = pickPartForSuggestion(targetSkill, partitioned, minParts);
      const typePart = part ? mapPartToTypePart(record, targetSkill, part) : null;
      suggestions.push(buildImprovementTaskCard(record, targetSkill, typePart, 'ATTENTION', skillLibraryMap));
    }
    appendPartNarrative(true);
  } else {
    if (weakSkills.length > 0) {
      const targetSkill = weakSkills[0]?.skill ?? 'Reading';
      const part = pickPartForSuggestion(targetSkill, partitioned, minParts);
      const typePart = part ? mapPartToTypePart(record, targetSkill, part) : null;
      suggestions.push(buildImprovementTaskCard(record, targetSkill, typePart, 'WEAK', skillLibraryMap));
    }
    if (weakSkills.length === 0 && attentionSkills.length > 0) {
      const targetSkill = attentionSkills[0]?.skill ?? 'Reading';
      const part = pickPartForSuggestion(targetSkill, partitioned, minParts);
      const typePart = part ? mapPartToTypePart(record, targetSkill, part) : null;
      suggestions.push(buildImprovementTaskCard(record, targetSkill, typePart, 'ATTENTION', skillLibraryMap));
    }
    appendPartNarrative(false);
  }

  if (suggestions.length === 0) {
    return '根据本次数据，未检出需要单独列项的明显薄弱技能或题段。建议维持当前教学节奏，并继续通过阶段性测验观察长期表现是否稳定。';
  }

  return suggestions.join('\n\n');
}

function computeStdDev(values: number[]): number {
  if (values.length <= 1) {
    return 0;
  }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) * (value - mean), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function buildProgressMetrics(records: CambridgeExamRecord[]): ProgressMetrics | null {
  if (records.length === 0) {
    return null;
  }

  const sorted = [...records].sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());
  const latest = [...records].sort((a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime())[0];
  const targetMode = latest.convertedResult.mode;
  const sameMode = sorted.filter((record) => record.convertedResult.mode === targetMode);
  if (sameMode.length === 0) {
    return null;
  }

  const first = sameMode[0];
  const latestInMode = sameMode[sameMode.length - 1];
  const convertedValues = sameMode.map((record) => extractConvertedTotal(record)).filter((value) => !Number.isNaN(value));
  const firstConverted = extractConvertedTotal(first);
  const latestConverted = extractConvertedTotal(latestInMode);
  const deltaConverted = latestConverted - firstConverted;
  const averageDeltaPerExam = sameMode.length > 1 ? deltaConverted / (sameMode.length - 1) : 0;
  const stdDevConverted = computeStdDev(convertedValues);

  const mixedNote =
    records.some((record) => record.convertedResult.mode !== targetMode) && records.length !== sameMode.length
      ? '提示：该学生存在跨口径记录（YLE/MSE），进步指标仅基于与最近一次同口径的考试记录计算。'
      : '';

  return {
    mode: targetMode,
    recordCount: sameMode.length,
    firstDate: first.examDate || '未知',
    latestDate: latestInMode.examDate || '未知',
    firstConverted,
    latestConverted,
    deltaConverted,
    averageDeltaPerExam,
    stdDevConverted,
    note: mixedNote,
  };
}

export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function minusDays(baseDate: Date, days: number): Date {
  const result = new Date(baseDate);
  result.setDate(result.getDate() - days);
  return result;
}

export function getCurrentSemesterRange(now: Date): { from: string; to: string } {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 2 && month <= 7) {
    return {
      from: `${year}-02-01`,
      to: `${year}-07-31`,
    };
  }
  if (month >= 8 && month <= 12) {
    return {
      from: `${year}-08-01`,
      to: `${year + 1}-01-31`,
    };
  }
  return {
    from: `${year - 1}-08-01`,
    to: `${year}-01-31`,
  };
}
