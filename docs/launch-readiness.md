# 上线检查清单

## 当前状态

| 项目 | 状态 | 证据 |
| --- | --- | --- |
| 核心应用可运行 | 已完成 | Next.js App Router，本地 Web 工作台 |
| 5 个岗位预设 | 已完成 | `src/lib/role-presets.ts` |
| 老板人设 | 已完成 | 默认人设 + 可编辑标签权重 |
| AI provider | 已完成 | OpenAI、DeepSeek、通义千问 OpenAI-compatible 适配 |
| 本地数据持久化 | 已完成 | SQLite `data/work-summary.sqlite` |
| 报告生成/评分/优化 | 已完成 | `/api/reports/generate`、`/score`、`/optimize` |
| 无 Key 首次体验 | 已完成 | 缺 API Key 时生成本地体验稿 |
| 数据导出 | 已完成 | `/api/export` |
| 数据清空 | 已完成 | `/api/settings/reset` |
| 健康检查 | 已完成 | `/api/health` |
| 类型检查 | 已完成 | `pnpm typecheck` |
| 生产构建 | 已完成 | `pnpm build` |

## 上线前必须验证

- 配置至少一个真实 API Key 后，日报、周报、月报都能生成。
- 同一输入切换不同老板人设，报告顺序和语气有明显差异。
- 缺少数据时不会编造数字。
- 周报/月报能使用历史报告聚合。
- 导出文件包含报告、人设、身份，不包含 API Key。
- 清空本地数据后默认老板人设恢复。
- 复制出的 Markdown 在微信、飞书、钉钉、邮件里结构清楚。

## 暂不阻塞 v1 的风险

- `node:sqlite` 在当前 Node 版本仍是实验模块；本地 MVP 可接受，正式商业化建议换成稳定 SQLite 依赖或服务端数据库。
- 暂无自动化端到端测试；上线前建议补 Playwright 覆盖关键流程。
- 暂无外部系统同步；先验证手动输入是否解决核心痛点。
- 暂无账号权限；当前定位是个人本地工具。

## 下一阶段建议

1. 增加“从大段文本自动拆字段”。
2. 增加 Word/PDF 导出。
3. 增加模板版本管理和行业模板。
4. 增加飞书/钉钉复制格式优化。
5. 增加真实用户访谈记录和反馈看板。

## 2026-06-08 Update

Added an automated launch verification command: `pnpm verify:launch`.

The verification uses a temporary SQLite database through `WORK_SUMMARY_DB_PATH`, so release checks do not pollute real local user data. It covers health check, local no-key generation, scoring, feedback capture, export privacy, and reset.

Added `/api/feedback` as the first product feedback loop. This gives the team a concrete place to capture whether the product is solving the user's actual reporting pain instead of only relying on assumptions.

Added product contract verification: `pnpm verify:product`.

This check protects the non-negotiable product promises: 5 role presets, 7 scoring dimensions, 8 boss persona tags, daily/weekly/monthly guidance, feedback storage, export privacy, no-key fallback, and launch/user-fit documentation.
