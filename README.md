# 多岗位 AI 工作汇报生成器

一个本地优先的工作汇报工具，面向产品经理、前端、后端、测试、业务销售等岗位，把零散工作材料整理成适合给领导看的日报、周报、月报，并按老板人设进行评分和优化。

## 核心能力

- 5 个岗位预设：产品经理、前端、后端、测试、业务销售。
- 老板人设：用结果导向、数据敏感、风险敏感、喜欢简洁等标签控制汇报风格。
- 报告类型：日报、周报、月报。
- 多 AI 接入：支持 OpenAI-compatible 接口，预置 OpenAI、DeepSeek、通义千问。
- 本地 SQLite：身份、人设、报告、评分和优化稿只保存在本机。
- 上线级数据控制：支持导出本地数据、清空本地数据、健康检查。
- 无 Key 体验：未配置 API Key 时可生成本地体验稿，便于先验证工作流。
- 粘贴拆解：把会议纪要、流水记录或客户沟通粘贴到补充区，可一键拆成当前岗位字段草稿。
- 输入体检：生成前检查数据、风险、下一步、领导支持和岗位字段覆盖度。
- 复制格式：同一份报告可按 Markdown、IM 简洁版、邮件版预览和复制。

## 本地启动

```bash
pnpm install
pnpm dev
```

打开 `http://127.0.0.1:3000`。

## AI Key 配置

复制 `.env.example` 为 `.env`，按需填写：

```bash
OPENAI_API_KEY=
DEEPSEEK_API_KEY=
DASHSCOPE_API_KEY=
```

如果没有配置 Key，应用仍可生成“本地体验稿”，但正式上线建议至少配置一个可用模型。

## 验证命令

```bash
pnpm typecheck
pnpm build
```

健康检查：

```bash
curl http://127.0.0.1:3000/api/health
```

## 产品文档

- [调研洞察](docs/research-insights.md)
- [产品需求](docs/product-requirements.md)
- [上线检查清单](docs/launch-readiness.md)

## 隐私边界

- API Key 只从本地 `.env` 读取，不写入浏览器。
- 报告历史保存在 `data/work-summary.sqlite`。
- 导出接口不会包含 API Key。
- 清空本地数据后会恢复默认老板人设。

## Automated Launch Verification

Run the full local production smoke test before release:

```bash
pnpm build
pnpm verify:launch
pnpm verify:product
```

`verify:launch` starts `next start` on an isolated port with a temporary SQLite database, then verifies:

- `/api/health` initializes storage and default boss personas.
- `/api/reports/generate` can create a no-key local draft and score it.
- `/api/inputs/extract` can turn pasted work material into role-specific field drafts.
- `/api/inputs/preflight` checks whether the input is ready for a high-quality report.
- `/api/reports/format` can prepare Markdown, IM, and email-ready output.
- `/api/feedback` saves a user-fit feedback record.
- `/api/export` includes reports and feedback without credential-like text.
- `/api/settings/reset` restores a clean local workspace.

For custom test environments, set `WORK_SUMMARY_DB_PATH` to point the app at an isolated SQLite file.

`verify:product` checks the product contract that should not regress during optimization:

- 5 role presets remain available and role-specific.
- 7 scoring dimensions and 8 boss persona tags remain wired.
- Daily, weekly, and monthly guidance exists for every role.
- Feedback storage, export privacy, and no-key local draft fallback remain present.
- Paste-to-fields extraction remains wired into API and UI.
- Input preflight remains wired into API and UI.
- Markdown, IM, and email-ready copy formats remain wired into API and UI.
- Product, launch, and user-fit docs still describe the promised capabilities.

## Feedback API

Save user-fit feedback after a trial session:

```bash
curl -X POST http://127.0.0.1:3000/api/feedback \
  -H "content-type: application/json" \
  -d '{"rating":4,"rolePresetId":"sales","reportType":"daily","painPoint":"writing weekly summaries takes too long","usefulParts":"pipeline and risk fields","missingParts":"CRM import"}'
```

Read recent feedback:

```bash
curl http://127.0.0.1:3000/api/feedback?limit=20
```
