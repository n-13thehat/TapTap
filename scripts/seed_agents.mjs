import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

// Load environment variables
config({ path: ".env.local" });

console.log("DATABASE_URL:", process.env.DATABASE_URL);

const prisma = new PrismaClient();

const home = process.env.HOME || process.env.USERPROFILE || "";

function resolveAgentsRoot() {
  const envDir = (process.env.TAPTAP_AGENTS_DIR || "").trim();
  const repoDir = path.join(process.cwd(), "app", "agents");
  const repoNested = path.join(repoDir, "TapTap_AI_Agents");
  const desktopDir = path.join(home, "Desktop", "TapTap_AI_Agents");

  const candidates = [
    envDir && path.resolve(envDir),
    repoDir,
    repoNested,
    desktopDir,
  ].filter(Boolean);

  for (const c of candidates) {
    try {
      if (c && fs.existsSync(c) && fs.existsSync(path.join(c, "agents.manifest.json"))) {
        return c;
      }
    } catch {}
  }

  for (const c of candidates) {
    try { if (c && fs.existsSync(c)) return c; } catch {}
  }

  return repoDir;
}

const ROOT = resolveAgentsRoot();
const MANIFEST = path.join(ROOT, "agents.manifest.json");
const PROMPTS_DIR = path.join(ROOT, "prompts");
const WF_DIR = path.join(ROOT, "workflows");
const LOG_DIR = path.join(process.cwd(), "scripts", "logs");

async function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

async function upsertAgent(a) {
  const combinedMeta = { ...(a.meta ?? {}), ...(a.theme ? { theme: a.theme } : {}) };
  const changelogStr = Array.isArray(a.changelog) ? a.changelog.join('\n') : (a.changelog ?? '');
  
  const agent = await prisma.agent.upsert({
    where: { name: a.name },
    create: {
      name: a.name, 
      role: a.role ?? "", 
      tone: a.tone, 
      vibe: a.vibe, 
      signature: a.signature, 
      summary: a.summary,
      version: a.version ?? "2.0.0", 
      meta: combinedMeta, 
      changelog: changelogStr,
    },
    update: {
      role: a.role ?? "", 
      tone: a.tone, 
      vibe: a.vibe, 
      signature: a.signature, 
      summary: a.summary,
      version: "2.0.0", 
      meta: combinedMeta, 
      changelog: changelogStr,
    },
  });

  await prisma.agentTool.deleteMany({ where: { agentId: agent.id } });
  await prisma.agentDataset.deleteMany({ where: { agentId: agent.id } });
  await prisma.agentPlaybook.deleteMany({ where: { agentId: agent.id } });
  await prisma.agentGuardrail.deleteMany({ where: { agentId: agent.id } });
  await prisma.agentHandoff.deleteMany({ where: { agentId: agent.id } });
  await prisma.agentKPI.deleteMany({ where: { agentId: agent.id } });
  await prisma.agentEval.deleteMany({ where: { agentId: agent.id } });

  const toArr = (x) => (x ?? []).filter(Boolean);
  const datasets = [...toArr(a.datasources), ...toArr(a.datasets)];

  const operations = [];
  
  for (const name of toArr(a.tools)) {
    operations.push(prisma.agentTool.create({ data: { agentId: agent.id, name } }));
  }
  
  for (const key of datasets) {
    operations.push(prisma.agentDataset.create({ data: { agentId: agent.id, key } }));
  }
  
  for (const name of toArr(a.playbooks)) {
    operations.push(prisma.agentPlaybook.create({ data: { agentId: agent.id, name } }));
  }
  
  for (const rule of toArr(a.guardrails)) {
    operations.push(prisma.agentGuardrail.create({ data: { agentId: agent.id, rule } }));
  }
  
  for (const toName of toArr(a.handoffs)) {
    operations.push(prisma.agentHandoff.create({ data: { agentId: agent.id, toName } }));
  }
  
  for (const [key, target] of Object.entries(a.kpis ?? {})) {
    operations.push(prisma.agentKPI.create({ data: { agentId: agent.id, key, target: String(target) } }));
  }
  
  for (const name of toArr(a.evals)) {
    operations.push(prisma.agentEval.create({ data: { agentId: agent.id, name } }));
  }

  if (operations.length > 0) {
    await prisma.$transaction(operations);
  }

  if (a.cadence) {
    await prisma.agentCadence.upsert({
      where: { agentId: agent.id },
      create: { agentId: agent.id, config: a.cadence },
      update: { config: a.cadence },
    });
  } else {
    await prisma.agentCadence.deleteMany({ where: { agentId: agent.id } });
  }

  if (a.ab_test) {
    const variantsStr = Array.isArray(a.ab_test.variants) ? a.ab_test.variants.join(',') : (a.ab_test.variants ?? '');
    const metricsStr = Array.isArray(a.ab_test.metrics) ? a.ab_test.metrics.join(',') : (a.ab_test.metrics ?? '');
    
    await prisma.agentABTest.upsert({
      where: { agentId: agent.id },
      create: {
        agentId: agent.id,
        enabled: !!a.ab_test.enabled,
        variants: variantsStr,
        sample: a.ab_test.sample ?? 0,
        metrics: metricsStr,
        logPath: a.ab_test.log ?? null,
      },
      update: {
        enabled: !!a.ab_test.enabled,
        variants: variantsStr,
        sample: a.ab_test.sample ?? 0,
        metrics: metricsStr,
        logPath: a.ab_test.log ?? null,
      },
    });
  } else {
    await prisma.agentABTest.deleteMany({ where: { agentId: agent.id } });
  }

  const p = path.join(PROMPTS_DIR, `${a.name}.prompt.txt`);
  if (fs.existsSync(p)) {
    const body = fs.readFileSync(p, "utf8");
    await prisma.agentPrompt.upsert({
      where: { agentId: agent.id },
      create: { agentId: agent.id, body },
      update: { body },
    });
  }

  return agent.name;
}

async function upsertWorkflows() {
  if (!fs.existsSync(WF_DIR)) return 0;
  const files = fs.readdirSync(WF_DIR).filter(f => f.endsWith(".json"));
  let count = 0;
  for (const f of files) {
    const p = path.join(WF_DIR, f);
    const raw = JSON.parse(fs.readFileSync(p, "utf8"));
    const wf = await prisma.workflow.upsert({
      where: { name: raw.name },
      create: { name: raw.name },
      update: {},
    });
    await prisma.workflowStep.deleteMany({ where: { workflowId: wf.id } });
    const steps = (raw.steps ?? []).map((s, i) => ({
      workflowId: wf.id,
      order: i,
      agentName: s.agent,
      action: s.action,
      inputs: s.inputs ?? null,
      outputs: s.outputs ?? null,
    }));
    if (steps.length) await prisma.workflowStep.createMany({ data: steps });
    count++;
  }
  return count;
}

async function main() {
  await ensureDir(LOG_DIR);
  if (!fs.existsSync(MANIFEST)) {
    console.error(`Missing manifest: ${MANIFEST}`);
    process.exit(1);
  }
  
  const list = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const names = [];
  
  for (const a of list) {
    console.log(`Seeding agent: ${a.name}...`);
    names.push(await upsertAgent(a));
  }
  
  const wfCount = await upsertWorkflows();
  
  const logData = {
    root: ROOT,
    agents: { count: names.length, names },
    workflows: { count: wfCount }
  };
  
  fs.writeFileSync(
    path.join(LOG_DIR, `seed_agents_${Date.now()}.log`),
    JSON.stringify(logData, null, 2)
  );
  
  console.log(`✅ Seeded ${names.length} agents from ${ROOT}. Imported ${wfCount} workflows.`);
}

main()
  .catch(e => { 
    console.error(e); 
    process.exit(1); 
  })
  .finally(() => prisma.$disconnect());

