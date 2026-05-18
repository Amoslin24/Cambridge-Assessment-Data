/**
 * 将 data/ket/r-p1/*.json 导入 Supabase（阅读 Part 1，每套 6 题）
 *
 * 前置：
 * 1. 在 Supabase 执行 supabase/ket_practice_schema.sql
 * 2. .env.local 配置 NEXT_PUBLIC_SUPABASE_URL、SUPABASE_SERVICE_ROLE_KEY
 *
 * 运行：npm run import:ket-r-p1
 */
import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data', 'ket', 'r-p1');
const PART_KEY = 'R_P1';
const REQUIRED_ITEMS = 6;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY（写入请用 service role）');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

function validatePayload(payload, fileName) {
  if (!payload.title_zh || typeof payload.title_zh !== 'string') {
    throw new Error(`${fileName}: 缺少 title_zh`);
  }
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new Error(`${fileName}: items 为空`);
  }
  const wantPublish = payload.is_published !== false;
  if (wantPublish && payload.items.length !== REQUIRED_ITEMS) {
    throw new Error(
      `${fileName}: 发布套卷须恰好 ${REQUIRED_ITEMS} 题（当前 ${payload.items.length}）。可先设 "is_published": false`,
    );
  }
  for (const item of payload.items) {
    if (!item.stem || !Array.isArray(item.options) || item.options.length < 2) {
      throw new Error(`${fileName}: 第 ${item.order_index} 题 stem/options 无效`);
    }
    if (!item.options.includes(item.correct_answer)) {
      throw new Error(
        `${fileName}: 第 ${item.order_index} 题 correct_answer 必须与 options 中某项完全一致`,
      );
    }
  }
}

async function importFile(filePath) {
  const fileName = path.basename(filePath);
  if (fileName.startsWith('_')) {
    return { skipped: true, fileName };
  }
  const raw = await readFile(filePath, 'utf8');
  const payload = JSON.parse(raw);
  validatePayload(payload, fileName);

  const isPublished = payload.is_published !== false;
  const { data: exercise, error: exError } = await supabase
    .from('ket_exercises')
    .insert({
      level: 'KET',
      part_key: PART_KEY,
      title_zh: payload.title_zh,
      source_label: payload.source_label ?? null,
      pdf_ref: payload.pdf_ref ?? fileName.replace(/\.json$/, '.pdf'),
      item_count: payload.items.length,
      is_published: isPublished,
      sort_order: payload.sort_order ?? 0,
    })
    .select('id')
    .single();

  if (exError) {
    throw new Error(`${fileName}: 插入套卷失败 — ${exError.message}`);
  }

  const rows = payload.items.map((item) => ({
    exercise_id: exercise.id,
    order_index: item.order_index,
    stem: item.stem,
    options: item.options,
    correct_answer: item.correct_answer,
    explanation_zh: item.explanation_zh ?? null,
  }));

  const { error: itemsError } = await supabase.from('ket_items').insert(rows);
  if (itemsError) {
    await supabase.from('ket_exercises').delete().eq('id', exercise.id);
    throw new Error(`${fileName}: 插入小题失败 — ${itemsError.message}`);
  }

  return { skipped: false, fileName, id: exercise.id, published: isPublished };
}

async function main() {
  const entries = await readdir(DATA_DIR);
  const jsonFiles = entries.filter((name) => name.endsWith('.json') && !name.startsWith('_'));
  if (jsonFiles.length === 0) {
    console.log(`未找到可导入 JSON。请复制 _template.json 为例如 2024-test1.json 并填入 6 题后重试。`);
    console.log(`目录：${DATA_DIR}`);
    process.exit(0);
  }

  let ok = 0;
  for (const name of jsonFiles) {
    const result = await importFile(path.join(DATA_DIR, name));
    if (result.skipped) {
      continue;
    }
    ok += 1;
    console.log(`✓ ${result.fileName} → ${result.id}（${result.published ? '已发布' : '草稿'}）`);
  }
  console.log(`\n完成：导入 ${ok} 套。网页：/ket/practice/r-p1`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
