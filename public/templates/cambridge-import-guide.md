# Cambridge 数据导入字段说明

## 基础字段（中英对照）

- `Name`（姓名）：单列姓名，支持中文、英文，或“中文 英文”组合（如 `李安 Liam`）
- `Class`（班级）：班级编号或班级名称，选填
- `Set`（组别）：组别标识（如 A/B/1/2），选填
- `Level`（级别）：仅支持 `Starters`、`Movers`、`Flyers`、`KET`、`PET`、`FCE`
- `ExamDate`（考试日期）：建议使用 `YYYY-MM-DD`

## 原子分字段

- 阅读：`R_P1` 到 `R_P7`
- 听力：`L_P1` 到 `L_P5`
- 写作：`W_P1` 到 `W_P2`
- 阅读与听力各 Part 建议填写 `0-5` 的整数分值
- 写作（仅 KET/PET/FCE 生效）按级别填写原始分：
  - `KET`：`W_P1`、`W_P2` 各 `0-15`
  - `PET` / `FCE`：`W_P1`、`W_P2` 各 `0-20`

> 说明：`Starters` / `Movers` / `Flyers` 的 Writing 已并入 `Reading & Writing`，应填写在 `R_P*` 中，不需要单独填写 `W_P1`、`W_P2`。

> 兼容说明：系统仍兼容旧字段 `Name_ZH`、`Name_EN`、`姓名`、`英文名`，历史模板可继续导入。

## 级别与阅读分段约束

- `Starters`：使用 `R_P1` 到 `R_P5`
- `Movers`：使用 `R_P1` 到 `R_P6`
- `Flyers`：使用 `R_P1` 到 `R_P7`
- `KET`：使用 `R_P1` 到 `R_P5`
- `PET`：使用 `R_P1` 到 `R_P6`
- `FCE`：使用 `R_P1` 到 `R_P7`
