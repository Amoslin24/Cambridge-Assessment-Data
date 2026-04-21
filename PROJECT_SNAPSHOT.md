# Cambridge Dashboard 项目快照

更新时间：2026-04-21

## 1) 当前状态（可直接续接）

项目主链路已可用：导入（覆盖/追加）→ 解析换算 → 结果筛选导出 → 分析页趋势与多日期对比。  
目前进入“第二阶段增强”，重点是教研分析能力与数据治理能力。

**工程结构（2026-04-18）**：已对导入页、分析页做**仅拆文件、不改行为**的模块化拆分（状态与业务逻辑仍在 `app/page.tsx`、`app/analysis/page.tsx`；展示块迁至 `components/home/*`、`app/analysis/components/*`；纯函数迁至 `lib/importPageUtils.ts`、`lib/analysisPageUtils.ts`；共享类型 `lib/importHomeTypes.ts`）。`valruna-app` 根目录若未初始化 Git，进度以本文件与本地备份 JSON 为准。

**文案（2026-04-18）**：学生画像「针对性提升建议」与 `/diagnosis` 核心建议已统一为 `lib/analysisPageUtils.ts` 中的 **`buildImprovementTaskCard`**（由 `buildImprovementSuggestion` 调用）；题段补充说明中已标明「答对题数/题段满分」与约 **正确率**，多段建议以空行分隔，便于阅读。判定阈值与技能库匹配逻辑未改。

### 1.1 重要提醒（避免“打不开/404”）

- **正确项目目录**：`/Users/amoslin/valruna-app`（含 `/analysis`、`/diagnosis`、静态技能库等）。
- **易混淆目录**：`.../Cambridge-Dashboard` 为另一套工程；在其端口上访问 `/analysis` 可能 **404**。
- **当前常用启动**：用户侧已在 `valruna-app` 使用 `npm run start -- --hostname 127.0.0.1 --port 3205`（以实际终端为准）。
- **`next start` 与界面更新**：`next start` 只服务**上一次** `npm run build` 的产物。修改 `app/`、`lib/` 后若未重新 `build` 就重启，浏览器仍会看到旧版图表/文案；更新后请 **`npm run build` → 再 `npm run start`**，并建议 **强制刷新**（Mac：`Cmd+Shift+R`）。

## 2) 已完成能力

### 2.1 数据导入与解析（`/`）
- 支持文件：`.csv` / `.xlsx` / `.xls`
- 支持级别：`Starters` / `Movers` / `Flyers` / `KET` / `PET` / `FCE`
- 原子分项：
  - 阅读：`R_P1` ~ `R_P7`
  - 听力：`L_P1` ~ `L_P5`
  - 写作：`W_P1` ~ `W_P2`（仅 MSE 级别参与换算）
- 日期解析已兼容：
  - 常见字符串日期
  - Excel 序列号（如 `46126`）自动转 `YYYY-MM-DD`
- 模板体系已更新：
  - 姓名单列（`Name/姓名`，兼容中英文）
  - `Class` 与 `Set` 分列
  - 兼容旧模板字段别名

### 2.2 换算引擎（`lib/cambridgeEngine.ts`）
- **题段原始满分与导入封顶**：一律以 **`getPartRawMax(level, partKey)`** 为准（各级别阅读/听力/写作各 Part 的 Cambridge 官方满分与题量；`maxTotal`、班级题段均分、小题正确率分母与此同源）。**`SCORE_LIMIT_PER_PART`** 仅为历史兼容导出（旧版「每格 0–5」），**不得**在新逻辑或文档中当作通用 R/L 上限。
- YLE（Starters/Movers/Flyers）：
  - Writing 并入 Reading（即 R 列代表 R&W）
  - 输出 `R&W 盾`、`L 盾`、`总盾（10分制）`
- MSE（KET/PET）：
  - Reading / Writing / Listening 按查表换算为 Cambridge English Scale；总分采用三科尺度分的「可用技能均值」（忽略 0 分技能）。
- **FCE**：
  - **Reading**（`R_P1`、`R_P5`–`R_P7`）与 **Use of English**（`R_P2`–`R_P4`）分别查表，另加 Writing、Listening；界面总分（`value`）为上述 **四科** 尺度分的可用均值（不含口语，与成绩单「五段」展示仍有差异，以产品约定为准）。
- 查表逻辑、阈值与 0 分处理已按参考表对齐。

### 2.3 导入页交互（`app/page.tsx`）
- 导入模式：
  - 覆盖导入
  - 追加导入（按 `Name + ExamDate + Level + Class + Set` 去重）
- 追加冲突流程：
  - 导入前预览覆盖项
  - 用户确认后再落库
- 本地持久化：
  - 记录与异常自动保存/恢复
  - 一键清空本地数据
- 导出能力：
  - 下载中英文空模板
  - 导出当前解析结果 CSV
  - 导出异常行 CSV
- 导入审计（已完成）：
  - 自动记录每次导入：时间、文件名、模式、统计结果
  - 可导出审计 CSV / 清空审计
- 本地完整状态备份（已完成）：
  - 导出本地完整备份（JSON）：`fileName + records + issues + auditLog`
  - 从备份 JSON 一键恢复本地状态
- 筛选能力：
  - 级别、班级、日期、姓名关键词
  - 仅看异常行

### 2.4 分析页（`app/analysis/page.tsx`）
- 学生与级别筛选
- 个人多次考试趋势（原始分 + 换算分）
- 最近一次分技能对比（柱状）
- 最近一次分技能详表（含小题原始正确数）
- 多日期分技能对比（支持多选日期）
- 多日期**小题明细对比**（按技能分区柱状图）：
  - **横轴**：仍按题段编号 `R_P1`、`R_P2`…（或听力 `L_P*`）顺序，不改名。
  - **纵轴**：**题段正确率（%）** = 该次考试该题段原始正确数 ÷ **`getPartRawMax(该生级别, 该题段)`** × 100%；与解析引擎同源。
  - **参考线**：60%、70% 正确率；Tooltip 同时展示百分比与「原始 x/该题段满分」（按日期取当次试卷级别下的满分）。
- MSE 参考线：
  - KET 基准线 `120`
  - PET 基准线 `150`
- 日期范围增强已完成：
  - 起止日期输入
  - 快捷：`最近30天`、`最近90天`、`最近一次考试周`、`本学期`、`清除范围`
- 可比性过滤已完成：
  - 仅显示有对比数据的技能与小题
- **班级/级别分布图（换算总分）**（已完成）：
  - **选定单一级别**：与筛选器一致，每人该级别下「最近一次」换算总分分布（YLE 0–10 盾；MSE 80–190 分箱）。
  - **全部级别**：按考试级别**分列多张图**（各级别内每人取该级别最近一次），避免 YLE/MSE 混在同一分布里误读。
- **班级题段均分（最近一次）**（已完成）：按当前筛选与级别，对每人该级别最近一次试卷，在 **Reading / Listening（及 MSE 写作）** 各题段上求班级平均原始分，并按 **各题段在该级别下的官方满分** 折算为正确率（%）；用于看班级在阅读或听力哪一段相对更弱。
- **班级宏观分析（分层与进步汇总）**（已完成，见 `lib/classMacroAnalytics.ts`）：能力分层条形图、进步分差分布、提升/持平等汇总；与筛选条件联动。
- 学生画像卡（已完成）：
  - **导出**：支持 **「导出 PNG」**（`html2canvas` 截取 `#student-portrait-export-root`）与 **「打印为 PDF」**（`@media print` 仅打印画像区域；打印对话框中选「存储为 PDF」）。
  - **YLE 技能图**：为避免两维雷达退化为“一条线”，已改为 **横向条形图（0–5 盾）**，并保留 **3盾/5盾** 标杆线。
  - **MSE 技能图**：仍为 **RadarChart（80–190）**。
  - 薄弱技能与薄弱小题展示（小题已改为 **题段正确率阈值**：&lt;60% 薄弱、60–70% 需关注；与选项 3 对齐）
  - 进步指标：首次 vs 最近一次（提升、均次提升、稳定性标准差）
  - 薄弱判定口径（选项3）：
    - YLE：盾数 ≤2 判薄弱，=3 判需关注
    - KET/PET/FCE：分技能正确率 <60% 判薄弱，60–70% 判需关注（**FCE** 在存在 `useOfEnglishScale` 时拆成 **Reading / Use of English / Writing / Listening** 四技能，与诊断页、最近一次分技能柱状图一致）
  - **MSE 换算为 0 的说明**：若原始分已读取但换算为 0，界面会标注为 **“未达到量表最低阈值”**，避免误判为“未读取”。
  - **针对性提升建议**（可读性已优化）：任务卡式分段（判定说明、频次时长、技能库要点、执行步骤、阶段目标）；小题补充段中题段列表含「答对 x/满分、约 xx%」表述；与 `/diagnosis` 共用 **`buildImprovementTaskCard`**。
  - 技能库驱动建议（已完成，**静态内置**）：
  - 生成脚本：`scripts/generate-skill-library.mjs`
  - 生成文件：`lib/skillLibrary.generated.ts`（由 Excel `技能库` sheet 固化，当前 **63** 条）
  - `/analysis` 与 `/diagnosis` **直接 import `SKILL_LIBRARY_MAP`** 匹配 `Level|Type-Part`，不再依赖运行时读 Excel。
  - 建议输出为“可执行任务卡”：频次/时长/流程/验收目标 + 技能库 `Advice` 原文。
  - 备注：`/api/skill-library` 仍可作为备用接口存在，但**主路径已不依赖**。
### 2.5 学生诊断页（`/diagnosis`，`app/diagnosis/page.tsx`）
- 新增独立诊断页（浅色风格）：
  - 选择学生/级别/考试日期（或最近一次）
  - **YLE**：条形图（盾）+ **MSE**：Radar（Scale）+ 学习成长曲线（换算总分）
  - 核心短板诊断与建议：与画像同源，调用 **`buildImprovementTaskCard`**（`SKILL_LIBRARY_MAP` + 结构化步骤与阶段目标）

## 3) 已确认业务硬规则（必须保持）

- YLE 不单列 Writing，统一按 R&W 口径处理。
- 级别固定：`Starters` / `Movers` / `Flyers` / `KET` / `PET` / `FCE`。
- 姓名单列可混合中英文；`Class`/`Set` 必须分列。
- 数据导入必须保持原子分项结构（R/L/W part）。
- **各题段可填最高分**以 Cambridge 官方该 Part 满分为准（代码：`getPartRawMax`）；Starters/PET/FCE 仅 **4** 段听力，勿把 `L_P5` 当作有效段。

## 4) 当前待办（按优先级）

### P1 教研分析能力（第二批）
1. 学生画像卡小题与建议（已完成）：题段 **阈值判定** + 技能库 `Type-Part` 匹配；建议卡按薄弱→需关注→最小题段兜底选题。
2. 诊断页完善（可选）：阈值与技能库已对齐引擎侧逻辑；若需进一步对齐某套视觉稿，可单独开任务。
3. 班级宏观与分布（已完成）：宏观汇总、按级别分列总分分布、班级题段均分；若需「班级画像卡」叙事化文案可再迭代。

### P2 数据治理与安全（第三批）
1. 导入前字段检查器（已完成但策略调整）：当前仅做“结构性缺列”预检；行级问题进入 issues，不阻断导入
2. 导入审计信息（已完成）
3. 本地完整状态备份/恢复（已完成）

### P3 交付物（收口）
1. 老师 3 分钟上手文档（已完成：`TEACHER_QUICK_START.md`）
2. 演示数据包（已完成：`public/templates/cambridge-import-sample.csv` + `public/templates/cambridge-import-sample-anomalies.csv`）
3. 发布前检查清单（已完成：`RELEASE_CHECKLIST.md`）

## 5) 关键文件索引

- `app/page.tsx`：导入页状态与事件处理（持久化、解析、追加冲突、导出）；UI 块见 `components/home/*`
- `components/home/*`：导入页展示子组件（上传与模式、冲突预览、筛选卡片、模板/备份/审计区等）
- `lib/importPageUtils.ts`：导入页纯函数（CSV、去重合并、展示文案等）
- `lib/importHomeTypes.ts`：`PersistedDashboardState`、`PendingAppendImport`、`ImportStats` 等与导入持久化相关类型
- `app/analysis/page.tsx`：分析页状态、`useMemo` 与导出 PNG；图表与筛选 UI 见下述 components
- `app/analysis/components/*`：分析页筛选条、班级总览、学生画像、个人对比等展示块
- `app/analysis/analysisTypes.ts`：学生画像数据结构 `AnalysisStudentProfileData`
- `lib/analysisPageUtils.ts`：分析页纯函数（进步指标、**`buildImprovementTaskCard` / `buildImprovementSuggestion`** 提升建议文案、日期工具等）
- `app/globals.css`：打印样式（仅输出画像卡区域、`.no-print` 隐藏按钮）
- `app/diagnosis/page.tsx`：学生诊断页（雷达图 + 成长曲线 + 诊断建议）
- `scripts/generate-skill-library.mjs`：从 Excel 生成静态技能库 TS
- `lib/skillLibrary.generated.ts`：静态技能库（`SKILL_LIBRARY_ENTRIES` / `SKILL_LIBRARY_MAP`）
- `app/api/skill-library/route.ts`：备用：从 Excel 技能库读取建议条目（JSON API）
- `lib/cambridgeEngine.ts`：模板兼容、解析校验、换算查表；**导出** `getPartRawMax`、`getReadingEnabledParts`、`getListeningEnabledParts`、FCE Part 列表等；**`SCORE_LIMIT_PER_PART`** 仅历史兼容
- `lib/examSkillBreakdown.ts`：技能/题段明细构建、强弱与题段阈值（正确率分母为 **`getPartRawMax`**）
- `lib/convertedTotalDistribution.ts`：总分分布分箱、`pickLatestRecordPerStudent`
- `lib/classCohortPartMeans.ts`：按级别拆分分布、班级题段均分
- `lib/classMacroAnalytics.ts`：班级宏观分层与进步汇总
- `public/templates/cambridge-import-template.csv`：英文模板
- `public/templates/cambridge-import-template-zh.csv`：中文模板
- `public/templates/cambridge-import-sample.csv`：示例数据
- `public/templates/cambridge-import-sample-anomalies.csv`：异常示例数据
- `public/templates/cambridge-import-guide.md`：字段规范与填写说明（含各级别 **R/L 官方满分表**）
- `RELEASE_CHECKLIST.md`：发布前检查项（构建/规则/关键流程回归）

## 6) 建议验证命令

- `npm run build`
- 启动（端口以空闲为准，示例）：`npm run start -- --hostname 127.0.0.1 --port 3205`
- 验证入口（**必须在 `valruna-app` 对应端口**）：
  - 导入页：`http://localhost:<port>/`
  - 分析页：`http://localhost:<port>/analysis`
  - 诊断页：`http://localhost:<port>/diagnosis`
- 技能库（静态）：无需单独 API；如需排查可访问 `http://localhost:<port>/api/skill-library`（备用）
- 学生画像导出：`npm run build` 后于 `/analysis` 选定学生，验证 **「导出 PNG」**（依赖 `html2canvas`）与 **「打印为 PDF」**（系统打印对话框中选「存储为 PDF」）

## 7) 新会话续接模板

```text
请继续 Cambridge Dashboard 项目。
先读取项目根目录 PROJECT_SNAPSHOT.md，然后按“当前待办（P1→P2→P3）”推进。
必须保持以下口径：
1) YLE 的 Writing 并入 Reading (R&W)；
2) 姓名单列 Name/姓名，兼容中英文；
3) Class 与 Set 分列；
4) 追加导入按 Name+ExamDate+Level+Class+Set 去重。
5) 题段满分与正确率分母以 `getPartRawMax` 为准，不得写回「一律 0–5」。
本次任务目标：<填写本轮目标>
```
