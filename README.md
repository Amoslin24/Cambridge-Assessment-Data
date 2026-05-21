# Cambridge Dashboard（Valruna）

基于 **Next.js** 的 **Cambridge English** 成绩导入、换算与分析面板。数据在浏览器本地处理与持久化，不上传学生成绩到业务方服务器（部署形态除外，请自行评估托管环境）。

## 功能概览

- **导入页** `/`：CSV / Excel 解析、级别校验、换算结果展示、覆盖或追加导入、模板与备份导出。
- **分析页** `/analysis`：班级与个人趋势、分技能对比、题段正确率、学生画像与导出。
- **诊断页** `/diagnosis`：单生最近一次或选定场次的诊断与提升建议（与画像共用建议引擎）。

支持考试级别：`Starters`、`Movers`、`Flyers`、`KET`、`PET`、`FCE`。阅读/听力各 Part 的合法上限与 Cambridge 官方题段满分对齐（由 `getPartRawMax` 驱动，详见 `public/templates/cambridge-import-guide.md`）。

## 本地运行

```bash
npm install
npm run dev
```

默认开发地址：<http://localhost:3000>。若需固定端口（例如 `3205`），可使用：

```bash
npx next dev --hostname 127.0.0.1 --port 3205
```

生产构建与启动：

```bash
npm run build
npm run start
# 示例：npm run start -- --hostname 127.0.0.1 --port 3205
```

修改 `app/`、`lib/` 后若用生产模式预览，请先重新执行 `npm run build` 再 `npm run start`，否则仍为旧构建产物。

## 组内成员使用（内网 / 小团队）

**数据口径（务必转告同事）**：成绩与导入记录存在**各人自己浏览器的本地存储**里，**不会**因为访问同一网址就自动合并；换电脑或清空站点数据会丢数据，请习惯用导入页的 **「导出本地完整备份（JSON）」** 留档。

### 方案 A：一台固定电脑当「小服务器」（最常见）

1. 在该电脑上安装 **Node.js LTS**，克隆或拷贝本仓库，`npm install`。  
2. 执行 `npm run build`。  
3. 监听局域网网卡（便于同事用 Wi‑Fi 访问），例如端口 `3205`：

   ```bash
   npm run start -- --hostname 0.0.0.0 --port 3205
   ```

4. 查这台机的 **局域网 IP**（如 `192.168.1.100`），告知同事在浏览器打开：  
   `http://192.168.1.100:3205/`（分析页、诊断页路径同上，替换端口即可）。  
5. **系统防火墙**需放行对应 **TCP 端口**；仅组内用时勿把 `0.0.0.0` 暴露到公网无防护端口。

### 方案 B：每人自己跑（开发或临时）

每人本地 `npm install` → `npm run dev`（或各自 `build` + `start`），适合开发或无法集中托管时；数据仍在各人浏览器。

### 给同事的极简说明（可复制）

- 用 Chrome / Edge 打开负责人提供的 **http://「服务器IP」:端口/**。  
- 按 [`TEACHER_QUICK_START.md`](TEACHER_QUICK_START.md) 准备 CSV；填分规则见 [`cambridge-import-guide.md`](public/templates/cambridge-import-guide.md)。  
- 重要数据请定期 **导出 JSON 备份**。

若将来需要「多人共用同一套成绩库、换电脑也能登录同步」，属于**新需求**（要后端账号与数据库），与当前纯前端架构不同，需单独立项。

## 其他命令

| 命令 | 说明 |
|------|------|
| `npm run lint` | ESLint |
| `npm run test:engine` | 剑桥解析与换算引擎的 Node 测试 |

## 文档索引

- [`TEACHER_QUICK_START.md`](TEACHER_QUICK_START.md)：教师快速上手（导入字段、常见问题）。
- [`PROJECT_SNAPSHOT.md`](PROJECT_SNAPSHOT.md)：项目状态、关键文件与续接约定。
- [`public/templates/cambridge-import-guide.md`](public/templates/cambridge-import-guide.md)：列说明与各级别 R/L 官方满分表。
- [`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md)：发布前检查项。

## 技术栈（摘要）

Next.js（App Router）、React、TypeScript、Tailwind CSS、Recharts、`xlsx`、html2canvas（画像 PNG 导出）。字体由 Next 的 `next/font` 加载（构建时需能访问 Google Fonts，否则请检查网络或字体配置）。

## 发布到 GitHub Pages（公网访问）

仓库：**[Cambridge-Assessment-Data](https://github.com/Amoslin24/Cambridge-Assessment-Data)**。启用 Pages 后访问：

| 页面 | 地址 |
|------|------|
| 导入首页 | `https://amoslin24.github.io/Cambridge-Assessment-Data/` |
| **数据分析面板** | `https://amoslin24.github.io/Cambridge-Assessment-Data/analysis/` |
| 诊断页 | `https://amoslin24.github.io/Cambridge-Assessment-Data/diagnosis/` |

### 一次性设置

1. 远程仓库：`https://github.com/Amoslin24/Cambridge-Assessment-Data`
2. 在本机项目根目录推送 `main`：

   ```bash
   git remote add origin https://github.com/Amoslin24/Cambridge-Assessment-Data.git
   git push -u origin main
   ```

3. 仓库 **Settings → Pages → Build and deployment** 选择 **GitHub Actions**。
4. 推送后打开 **Actions**，等待 **Deploy Valruna to GitHub Pages** 工作流成功（约 2–5 分钟）。

### 本地验证静态构建

```bash
npm run build:pages
# 产物在 out/，可用 npx serve out -l 3207 预览（需带 basePath 时以 GitHub Pages 为准）
```

> **说明**：GitHub Pages 为纯静态托管，成绩数据仍在**各访问者浏览器本地**；`/api/*` 与 KET 动态练习路由不会出现在 Pages 构建中。完整服务端能力请继续用 `npm run build && npm run start` 或 Vercel。

## 许可与仓库

私有项目；具体许可以仓库内 `LICENSE` 为准（若未添加则默认保留所有权利）。
