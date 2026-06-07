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
