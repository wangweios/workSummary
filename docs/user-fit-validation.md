# 用户契合度验证记录

## 已覆盖痛点

| 用户痛点 | 产品回应 | 验证证据 |
| --- | --- | --- |
| 不知道领导想看什么 | 老板人设标签影响报告重点和评分 | 工作台支持结果、数据、风险、简洁等权重 |
| 日报容易写成流水账 | 岗位专属字段引导用户输入成果、风险、下一步 | 5 个岗位预设字段不同 |
| 不同岗位模板不通用 | 产品、前端、后端、测试、销售分别定义字段和评分权重 | `src/lib/role-presets.ts` |
| AI 容易编造 | Prompt 和本地体验稿都要求缺数据时写“暂无量化数据” | 运行时验证 `hasNoFabricationGuard=true` |
| 首次没 API Key 卡住 | 无 Key 时生成本地体验稿 | 运行时验证 `hasLocalDraft=true` |
| 本地隐私焦虑 | API Key 只读 `.env`，数据本地 SQLite，支持导出和清空 | `/api/export`、`/api/settings/reset` |
| 周报/月报材料难整理 | 周报/月报可读取历史报告并允许补充重点 | 生成服务按周期查询历史报告 |
| 不愿一格一格填写 | 补充粘贴区支持一键拆成岗位字段草稿 | `/api/inputs/extract` 和页面“拆解粘贴”按钮 |
| 不同渠道复制格式不同 | 输出区支持 Markdown、IM 简洁版、邮件版 | `/api/reports/format` 和复制格式选择 |

## 上线验证结果

验证日期：2026-06-08

- `pnpm typecheck`：通过。
- `pnpm build`：通过。
- `/api/health`：通过，返回默认老板人设 3 个。
- `/api/reports/generate`：通过；未配置 API Key 时生成本地体验稿并返回评分。
- `/api/history`：通过；生成报告后可查询历史。
- `/api/export`：通过；导出包含报告，不包含 `API_KEY` 或 `Bearer` 字样。
- `/api/settings/reset`：通过；清空测试报告并恢复默认老板人设。

## 用户访谈脚本

目标：确认产品是否真正减少汇报成本，并提升领导可读性。

1. 你现在写日报/周报/月报最痛苦的一步是什么？
2. 你最常被领导追问的是结果、数据、风险、计划还是资源？
3. 你所在岗位的汇报里，哪些字段最不能缺？
4. 你是否担心 AI 把工作写得过度夸张？能接受什么样的防护？
5. 你愿意每天结构化填写，还是更愿意粘贴一段材料让系统自动拆解？
6. 你会把生成结果发到微信、飞书、钉钉、邮件还是 OA？
7. 你希望评分告诉你“哪里差”，还是直接给你改好的版本？

## 下一轮优先级

1. 从大段粘贴材料自动拆成岗位字段。
2. 增加“领导关注事项置顶”开关。
3. 增加飞书/钉钉/邮件三种复制格式。
4. 增加真实用户反馈入口和满意度记录。
5. 增加 Playwright 端到端测试，覆盖生成、优化、导出、清空。

## Feedback Loop Added

The product now has a feedback API for trial users. Each record captures:

- rating from 1 to 5
- role preset
- report type
- original pain point
- useful parts
- missing parts
- optional contact

This turns user-fit validation into product data. In trial sessions, collect feedback immediately after the user generates and copies a report.
