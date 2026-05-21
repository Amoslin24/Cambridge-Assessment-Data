#!/usr/bin/env node
/**
 * 为 GitHub Pages 生成静态站点（out/）。
 * 临时移走仅服务端可用的路由，避免 `output: export` 构建失败。
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stashRoot = path.join(root, '.pages-build-stash');
const stashPaths = ['app/api', 'app/ket/practice'];

function moveToStash(relPath) {
  const from = path.join(root, relPath);
  const to = path.join(stashRoot, relPath);
  if (!fs.existsSync(from)) {
    return;
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.renameSync(from, to);
}

function restoreFromStash(relPath) {
  const from = path.join(stashRoot, relPath);
  const to = path.join(root, relPath);
  if (!fs.existsSync(from)) {
    return;
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (fs.existsSync(to)) {
    fs.rmSync(to, { recursive: true, force: true });
  }
  fs.renameSync(from, to);
}

function stashRoutes() {
  if (fs.existsSync(stashRoot)) {
    fs.rmSync(stashRoot, { recursive: true, force: true });
  }
  fs.mkdirSync(stashRoot, { recursive: true });
  for (const rel of stashPaths) {
    moveToStash(rel);
  }
}

function restoreRoutes() {
  for (const rel of stashPaths) {
    restoreFromStash(rel);
  }
  if (fs.existsSync(stashRoot)) {
    fs.rmSync(stashRoot, { recursive: true, force: true });
  }
}

stashRoutes();
try {
  execSync('npm run build', {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, GITHUB_PAGES: 'true' },
  });
} finally {
  restoreRoutes();
}
