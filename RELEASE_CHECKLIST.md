# Cambridge Dashboard 发布前检查清单

更新时间：2026-04-21

## 1. 构建与静态检查

- [ ] 执行 `npm run build`，确认构建成功且无阻断错误。
- [ ] 若有新增依赖，确认已写入 `package.json` 与锁文件。
- [ ] 打开生产模式服务（示例）：`npm run start -- --hostname 127.0.0.1 --port 3205`。

## 2. 核心业务规则回归

- [ ] 验证受支持级别仅为：`Starters`、`Movers`、`Flyers`、`KET`、`PET`、`FCE`。
- [ ] 验证题段封顶：同一 `R_P1` 在 KET 与 PET 等不同级别下上限不同；**FCE** 听力为 4 段；与 `getPartRawMax` / `cambridge-import-guide.md` 一致。
- [ ] 验证 YLE 口径：Writing 并入 Reading（R&W），不单列写作评分。
- [ ] 验证姓名字段为单列（`Name/姓名`），支持中英文与混合姓名。
- [ ] 验证 `Class` 与 `Set` 分列导入，不发生字段混淆。
- [ ] 验证追加导入去重键：`Name + ExamDate + Level + Class + Set`。

## 3. 导入链路回归（`/`）

- [ ] 使用 `public/templates/cambridge-import-sample.csv` 执行覆盖导入，确认解析成功。
- [ ] 使用 `public/templates/cambridge-import-sample-anomalies.csv` 执行覆盖导入，确认异常行可见且描述准确。
- [ ] 验证导入前结构预检（缺列）可触发提示；行级问题进入异常列表且不导致流程崩溃。
- [ ] 验证导出能力：当前解析结果 CSV、异常行 CSV、审计日志 CSV。
- [ ] 验证本地完整备份导出与恢复（JSON）可闭环。

## 4. 分析与诊断回归（`/analysis`、`/diagnosis`）

- [ ] 在分析页验证筛选（级别、班级、日期范围、姓名关键词）联动正确。
- [ ] 验证学生画像中薄弱技能与小题判定阈值（<60% 薄弱，60-70% 需关注）正确；小题正确率分母为 **该级别该题段官方满分**（非固定 5）。
- [ ] 验证 **FCE** 最近一次分技能柱状图与学生画像为 **四项**（含 Use of English），换算核对面板含 UoE 时展示一致。
- [ ] 验证 `buildImprovementTaskCard` 生成文案结构完整，且与诊断页建议一致。
- [ ] 验证班级/级别总分分布图按级别拆分显示，避免 YLE/MSE 混图误读。
- [ ] 验证学生画像导出：PNG 可下载，打印路径可输出 PDF。

## 5. 发布交付与文档

- [ ] 核对 `TEACHER_QUICK_START.md` 与当前界面文案一致。
- [ ] 核对 `PROJECT_SNAPSHOT.md` 待办状态与最新功能一致。
- [ ] 保证面向教师与学生的界面文案为专业中文表述。
