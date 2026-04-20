import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// xlsx 为 CommonJS 包，用 require 以兼容 Node ESM 运行
const XLSX = require('xlsx');

/**
 * 将项目根目录的 Excel 技能库固化为 TypeScript 常量文件，避免运行时读取 xlsx。
 *
 * 输入文件（默认）：<repoRoot>/剑桥五级深度分析系统_V22_终极兼容版 .xlsx
 * 输出文件：<repoRoot>/lib/skillLibrary.generated.ts
 */

const repoRoot = process.cwd();
const inputXlsx = path.join(repoRoot, '剑桥五级深度分析系统_V22_终极兼容版 .xlsx');
const outputTs = path.join(repoRoot, 'lib', 'skillLibrary.generated.ts');

if (!fs.existsSync(inputXlsx)) {
  console.error(`未找到技能库 Excel：${inputXlsx}`);
  process.exit(1);
}

const workbook = XLSX.readFile(inputXlsx);
const sheetName = workbook.SheetNames.find((name) => name === '技能库') ?? workbook.SheetNames[0];
if (!sheetName) {
  console.error('Excel 中未检测到工作表。');
  process.exit(1);
}

const sheet = workbook.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

function pickCell(row, keys) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return '';
}

function parseListCell(raw) {
  if (!raw) {
    return [];
  }
  return String(raw)
    .split(/\r?\n|；|;|。/g)
    .map((item) => item.replace(/^[\s\-*•·\d.)、]+/, '').trim())
    .filter(Boolean);
}

const entries = rows
  .map((row) => {
    const id = String(row['ID (关键索引)'] ?? '').trim();
    const level = String(row['Level'] ?? '').trim();
    const typePart = String(row['Type-Part'] ?? '').trim();
    const fullMarkRaw = Number(row['满分'] ?? 0);
    const skill = String(row['考察能力 (Skill)'] ?? '').trim();
    const advice = String(row['建议 (Advice)'] ?? '').trim();
    const tips = parseListCell(
      pickCell(row, ['答题技巧', '技巧 (Tips)', 'Tips', 'Answer Tips', '作答技巧']),
    );
    const cautions = parseListCell(
      pickCell(row, ['注意事项', '注意点', 'Cautions', 'Warnings']),
    );
    const drills = parseListCell(
      pickCell(row, ['课堂微训练', '训练步骤', 'Drill', 'Micro Drill', '执行步骤']),
    );
    const acceptance = parseListCell(
      pickCell(row, ['验收标准', '达标标准', 'Acceptance', 'Success Criteria']),
    );
    if (!id || !level || !typePart) {
      return null;
    }
    return {
      id,
      level,
      typePart,
      fullMark: Number.isFinite(fullMarkRaw) ? fullMarkRaw : 0,
      skill,
      advice,
      tips,
      cautions,
      drills,
      acceptance,
    };
  })
  .filter(Boolean);

entries.sort((a, b) => {
  const ka = `${a.level}|${a.typePart}|${a.id}`;
  const kb = `${b.level}|${b.typePart}|${b.id}`;
  return ka.localeCompare(kb);
});

const header = `/*\n * 本文件由 scripts/generate-skill-library.mjs 自动生成。\n * 请勿手工编辑。\n */\n\n`;

const typeDef = `export interface SkillLibraryEntry {\n  id: string;\n  level: string;\n  typePart: string;\n  fullMark: number;\n  skill: string;\n  advice: string;\n  tips: string[];\n  cautions: string[];\n  drills: string[];\n  acceptance: string[];\n}\n\n`;

const entriesCode =
  `export const SKILL_LIBRARY_ENTRIES: SkillLibraryEntry[] = ${JSON.stringify(entries, null, 2)} as const;\n\n`;

const mapCode = `export const SKILL_LIBRARY_MAP: Map<string, SkillLibraryEntry> = new Map(\n  SKILL_LIBRARY_ENTRIES.map((entry) => [\`\${entry.level}|\${entry.typePart}\`, entry] as const),\n);\n`;

fs.mkdirSync(path.dirname(outputTs), { recursive: true });
fs.writeFileSync(outputTs, `${header}${typeDef}${entriesCode}${mapCode}`, 'utf8');

console.log(`已生成：${outputTs}`);
console.log(`条目数：${entries.length}`);

