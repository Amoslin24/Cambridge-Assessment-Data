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

## 许可与仓库

私有项目；具体许可以仓库内 `LICENSE` 为准（若未添加则默认保留所有权利）。
