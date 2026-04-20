import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export interface SkillLibraryEntry {
  id: string;
  level: string;
  typePart: string;
  fullMark: number;
  skill: string;
  advice: string;
  tips: string[];
  cautions: string[];
  drills: string[];
  acceptance: string[];
}

function pickCell(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return '';
}

function parseListCell(raw: string): string[] {
  if (!raw) {
    return [];
  }
  return raw
    .split(/\r?\n|；|;|。/g)
    .map((item) => item.replace(/^[\s\-*•·\d.)、]+/, '').trim())
    .filter(Boolean);
}

function resolveSkillLibraryXlsxPath(): string {
  // 默认读取项目根目录下的技能库文件（由你手动放入项目）
  return path.join(process.cwd(), '剑桥五级深度分析系统_V22_终极兼容版 .xlsx');
}

export async function GET(): Promise<Response> {
  try {
    const xlsxPath = resolveSkillLibraryXlsxPath();
    if (!fs.existsSync(xlsxPath)) {
      return NextResponse.json(
        { ok: false, message: `未找到技能库文件：${xlsxPath}` },
        { status: 404 },
      );
    }

    const workbook = XLSX.readFile(xlsxPath);
    const sheetName = workbook.SheetNames.find((name) => name === '技能库') ?? workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json({ ok: false, message: '技能库文件中未检测到工作表。' }, { status: 400 });
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    const entries: SkillLibraryEntry[] = rows
      .map((row) => {
        const id = String(row['ID (关键索引)'] ?? '').trim();
        const level = String(row['Level'] ?? '').trim();
        const typePart = String(row['Type-Part'] ?? '').trim();
        const fullMark = Number(row['满分'] ?? 0);
        const skill = String(row['考察能力 (Skill)'] ?? '').trim();
        const advice = String(row['建议 (Advice)'] ?? '').trim();
        const tips = parseListCell(
          pickCell(row, ['答题技巧', '技巧 (Tips)', 'Tips', 'Answer Tips', '作答技巧']),
        );
        const cautions = parseListCell(pickCell(row, ['注意事项', '注意点', 'Cautions', 'Warnings']));
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
          fullMark: Number.isFinite(fullMark) ? fullMark : 0,
          skill,
          advice,
          tips,
          cautions,
          drills,
          acceptance,
        } satisfies SkillLibraryEntry;
      })
      .filter((item): item is SkillLibraryEntry => item !== null);

    return NextResponse.json({ ok: true, entries });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

