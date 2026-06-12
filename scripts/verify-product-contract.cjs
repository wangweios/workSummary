const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function includesAll(source, items, label) {
  const missing = items.filter((item) => !source.includes(item));
  assert(missing.length === 0, `${label} missing: ${missing.join(", ")}`);
}

const rolePresets = read("src/lib/role-presets.ts");
const types = read("src/lib/types.ts");
const db = read("src/lib/db.ts");
const extractor = read("src/lib/input-extractor.ts");
const preflight = read("src/lib/input-preflight.ts");
const formatter = read("src/lib/report-formatter.ts");
const providers = read("src/lib/ai/providers.ts");
const playbooks = read("src/lib/market-playbooks.ts");
const reportService = read("src/lib/report-service.ts");
const page = read("src/app/page.tsx");
const packageJson = JSON.parse(read("package.json"));
const readme = read("README.md");
const prd = read("docs/product-requirements.md");
const launch = read("docs/launch-readiness.md");
const userFit = read("docs/user-fit-validation.md");

const requiredRoles = ["product_manager", "frontend", "backend", "qa", "sales"];
const requiredRoleNames = ["产品经理", "前端工程师", "后端工程师", "测试工程师", "业务销售"];
const prdRoleNames = ["产品经理", "前端", "后端", "测试", "业务销售"];
const requiredDimensions = [
  "boss_fit",
  "impact",
  "data",
  "clarity",
  "risk",
  "next_steps",
  "factfulness"
];
const requiredBossTags = [
  "result",
  "data",
  "risk",
  "concise",
  "process",
  "customer",
  "cost",
  "collaboration"
];
const requiredReportTypes = ["daily", "weekly", "monthly"];

includesAll(rolePresets, requiredRoles, "role preset ids");
includesAll(rolePresets, requiredRoleNames, "role preset names");
includesAll(rolePresets, requiredDimensions, "score dimensions in presets");
includesAll(rolePresets, requiredBossTags, "boss tags in presets");
includesAll(rolePresets, requiredReportTypes, "report type guidance");

for (const roleId of requiredRoles) {
  const roleStart = rolePresets.indexOf(`id: "${roleId}"`);
  assert(roleStart >= 0, `role preset ${roleId} not found`);
  const nextRoleStart = requiredRoles
    .map((id) => rolePresets.indexOf(`id: "${id}"`, roleStart + 1))
    .filter((index) => index > roleStart)
    .sort((a, b) => a - b)[0] ?? rolePresets.length;
  const roleBlock = rolePresets.slice(roleStart, nextRoleStart);
  const fieldCount = (roleBlock.match(/label: "/g) || []).length;
  assert(fieldCount >= 5, `role preset ${roleId} should have at least 5 input fields, found ${fieldCount}`);
  includesAll(roleBlock, requiredReportTypes.map((type) => `${type}: [`), `report guidance for ${roleId}`);
  includesAll(roleBlock, requiredDimensions.map((dimension) => `${dimension}:`), `score weights for ${roleId}`);
}

includesAll(types, ["UserFeedbackInput", "UserFeedback", "ReportType", "ScoreDimensionId", "playbookId"], "public product types");
includesAll(playbooks, ["executive_brief", "risk_blocker", "outcome_proof", "customer_revenue", "quality_release"], "market playbook ids");
includesAll(playbooks, ["sourceProducts", "marketSignals", "generationRules", "scoreEmphasis"], "market playbook research contract");
includesAll(db, ["WORK_SUMMARY_DB_PATH", "user_feedback", "createFeedback", "listFeedback"], "feedback storage contract");
includesAll(page, ["submitFeedback", "/api/feedback", "feedbackDraft"], "feedback UI contract");
includesAll(extractor, requiredRoles, "input extractor role coverage");
includesAll(page, ["extractFieldsFromPaste", "/api/inputs/extract", "WandSparkles"], "input extraction UI contract");
includesAll(preflight, ["analyzeWorkInput", "数据支撑", "风险问题", "下一步", "领导支持"], "input preflight contract");
includesAll(page, ["runInputPreflight", "/api/inputs/preflight", "preflight"], "input preflight UI contract");
includesAll(formatter, ["markdown", "im", "email", "formatReportOutput"], "report formatter contract");
includesAll(page, ["outputFormat", "/api/reports/format", "IM 简洁版", "邮件版"], "report format UI contract");
includesAll(providers, ["testProviderConnection", "Provider connection succeeded", "Bearer [redacted]"], "provider diagnostic contract");
includesAll(page, ["testCurrentProvider", "/api/providers/test", "PlugZap"], "provider diagnostic UI contract");
includesAll(page, ["marketPlaybooks", "selectedPlaybookId", "汇报打法", "Compass"], "market playbook UI contract");
includesAll(reportService, ["getMarketPlaybook", "playbook.summary", "playbook.fallbackSections"], "market playbook generation contract");
includesAll(db, ["sanitizeExport", "API_KEY", "Bearer [redacted]"], "export privacy contract");
includesAll(reportService, ["本地体验稿", "暂无量化数据", "buildLocalExperienceReport"], "no-key and no-fabrication fallback");

assert(packageJson.scripts?.typecheck, "package.json must expose typecheck");
assert(packageJson.scripts?.build, "package.json must expose build");
assert(packageJson.scripts?.["verify:launch"], "package.json must expose verify:launch");
assert(packageJson.scripts?.["verify:product"], "package.json must expose verify:product");

includesAll(readme, ["pnpm verify:launch", "/api/feedback", "WORK_SUMMARY_DB_PATH"], "README launch instructions");
includesAll(prd, prdRoleNames, "PRD role coverage");
includesAll(prd, ["事实忠实度", "老板人设", "日报", "周报", "月报"], "PRD product promises");
includesAll(launch, ["pnpm verify:launch", "/api/feedback", "上线前必须验证"], "launch readiness promises");
includesAll(userFit, ["Feedback Loop", "pain point", "missing parts"], "user-fit feedback loop docs");

console.log(JSON.stringify({
  ok: true,
  roles: requiredRoles.length,
  dimensions: requiredDimensions.length,
  bossTags: requiredBossTags.length,
  checks: [
    "role presets",
    "score weights",
    "boss persona tags",
    "feedback storage",
    "feedback UI",
    "input extraction",
    "input preflight",
    "copy formatting",
    "provider diagnostic",
    "market playbooks",
    "export privacy",
    "no-key fallback",
    "launch docs"
  ]
}, null, 2));
