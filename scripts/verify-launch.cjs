const http = require("node:http");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const root = process.cwd();
const port = Number(process.env.VERIFY_PORT || 3107);
const dbPath = path.join(os.tmpdir(), `work-summary-verify-${Date.now()}.sqlite`);
const nextBin = require.resolve("next/dist/bin/next");

function request(method, route, body) {
  const payload = body ? JSON.stringify(body) : undefined;
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path: route,
        method,
        headers: payload
          ? { "content-type": "application/json", "content-length": Buffer.byteLength(payload) }
          : undefined
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let json;
          try {
            json = JSON.parse(data || "{}");
          } catch (error) {
            reject(new Error(`Invalid JSON from ${route}: ${data.slice(0, 300)}`));
            return;
          }
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`${method} ${route} failed ${res.statusCode}: ${data.slice(0, 500)}`));
            return;
          }
          resolve(json);
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function waitForServer() {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try {
      return await request("GET", "/api/health");
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error("Server did not become ready in 30s");
}

async function main() {
  if (fs.existsSync(dbPath)) fs.rmSync(dbPath, { force: true });
  const child = spawn(process.execPath, [nextBin, "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: root,
    env: { ...process.env, WORK_SUMMARY_DB_PATH: dbPath },
    stdio: ["ignore", "pipe", "pipe"]
  });

  let logs = "";
  child.stdout.on("data", (chunk) => (logs += chunk.toString()));
  child.stderr.on("data", (chunk) => (logs += chunk.toString()));

  try {
    const health = await waitForServer();
    if (!health.ok || health.database.bossCount < 3) throw new Error("Health check did not seed boss personas");

    const bosses = await request("GET", "/api/bosses");
    const bossId = bosses.bosses[0].id;
    const extracted = await request("POST", "/api/inputs/extract", {
      rolePresetId: "sales",
      text: "拜访/沟通：Visited two renewal customers.\n成交/金额：Estimated pipeline 120k.\n回款风险：Payment approval may slip by one week.\n下周推进：Send revised quote and escalate legal review."
    });
    if (!extracted.fields.visits?.value) throw new Error("Input extraction did not fill sales visit field");
    if (!extracted.fields.revenue?.value) throw new Error("Input extraction did not fill sales revenue field");

    const generated = await request("POST", "/api/reports/generate", {
      rolePresetId: "sales",
      roleProfile: {
        name: "Launch verification sales role",
        title: "Business Sales",
        responsibilities: "Own customer pipeline and payment risk",
        projectContext: "Renewal campaign",
        metrics: "pipeline amount, conversion, payment risk",
        tone: "formal and concise"
      },
      bossPersonaId: bossId,
      provider: "openai",
      model: "gpt-4.1-mini",
      workInput: {
        reportType: "daily",
        periodStart: "2026-06-08",
        periodEnd: "2026-06-08",
        fields: {
          "拜访/沟通": "Visited two renewal customers and confirmed decision process.",
          "成交/金额": "No signed amount yet; estimated pipeline 120k pending legal review.",
          "回款风险": "One customer payment approval may slip by one week.",
          "下周推进": "Send revised quote and ask manager to support legal escalation."
        },
        extraText: "Customer feedback: pricing is acceptable, but contract terms need clarification.",
        historyFrom: "2026-06-08",
        historyTo: "2026-06-08"
      }
    });
    if (!generated.report.content.includes("本地体验稿")) throw new Error("Missing local draft fallback marker");
    if (!generated.score || generated.score.total < 1) throw new Error("Missing score");
    const emailFormatted = await request("POST", "/api/reports/format", {
      content: generated.report.content,
      format: "email",
      reportType: "daily"
    });
    if (!emailFormatted.content.includes("主题：日报汇报")) throw new Error("Email formatting missing subject");
    const imFormatted = await request("POST", "/api/reports/format", {
      content: generated.report.content,
      format: "im",
      reportType: "daily"
    });
    if (imFormatted.content.includes("#")) throw new Error("IM formatting did not strip markdown headings");

    const feedback = await request("POST", "/api/feedback", {
      rating: 4,
      rolePresetId: "sales",
      reportType: "daily",
      painPoint: "Need less time writing daily sales updates.",
      usefulParts: "Pipeline and payment risk fields are useful.",
      missingParts: "Need CRM import later.",
      contact: ""
    });
    if (!feedback.feedback.id) throw new Error("Feedback was not saved");

    const exported = await request("GET", "/api/export");
    const exportText = JSON.stringify(exported);
    if (!exported.reports.length) throw new Error("Export did not include generated report");
    if (!exported.feedback.length) throw new Error("Export did not include feedback");
    if (exportText.includes("API_KEY") || exportText.includes("Bearer ")) throw new Error("Export leaked credential-like text");

    const reset = await request("DELETE", "/api/settings/reset");
    if (!reset.ok || reset.bossPersonas.length < 3) throw new Error("Reset failed");

    console.log(JSON.stringify({ ok: true, reportId: generated.report.id, score: generated.score.total, feedbackId: feedback.feedback.id }, null, 2));
  } finally {
    child.kill("SIGTERM");
    await Promise.race([once(child, "exit"), new Promise((resolve) => setTimeout(resolve, 3000))]);
    if (!child.killed) child.kill("SIGKILL");
    if (fs.existsSync(dbPath)) fs.rmSync(dbPath, { force: true });
    if (fs.existsSync(`${dbPath}-shm`)) fs.rmSync(`${dbPath}-shm`, { force: true });
    if (fs.existsSync(`${dbPath}-wal`)) fs.rmSync(`${dbPath}-wal`, { force: true });
    if (process.env.DEBUG_VERIFY_LOGS) console.error(logs);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
