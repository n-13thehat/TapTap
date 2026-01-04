import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const home = process.env.HOME || process.env.USERPROFILE || "";

function resolveAgentsRoot(): string {
  // Prefer an explicit env var, then in-repo locations, then Desktop fallback.
  const envDir = (process.env.TAPTAP_AGENTS_DIR || "").trim();
  const repoDir = path.join(process.cwd(), "app", "agents");
  const repoNested = path.join(repoDir, "TapTap_AI_Agents");
  const desktopDir = path.join(home, "Desktop", "TapTap_AI_Agents");

  const candidates = [
    envDir && path.resolve(envDir),
    repoDir,
    repoNested,
    desktopDir,
  ].filter(Boolean) as string[];

  // First, pick the first candidate that both exists and contains a manifest
  for (const c of candidates) {
    try {
      if (c && fs.existsSync(c) && fs.existsSync(path.join(c, "agents.manifest.json"))) {
        return c;
      }
    } catch {}
  }

  // Otherwise, fall back to the first existing directory among candidates
  for (const c of candidates) {
    try { if (c && fs.existsSync(c)) return c; } catch {}
  }

  // Last resort: default to repo app/agents
  return repoDir;
}

const ROOT = resolveAgentsRoot();
const MANIFEST = path.join(ROOT, "agents.manifest.json");
const PROMPTS_DIR = path.join(ROOT, "prompts");
const WF_DIR = path.join(ROOT, "workflows");
const LOG_DIR = path.join(process.cwd(), "scripts", "logs");

async function ensureDir(p: string) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

type AgentIn = {
  name: string; role?: string; tone?: string; vibe?: string; signature?: string; summary?: string;
  tools?: string[]; datasources?: string[]; datasets?: string[]; playbooks?: string[]; guardrails?: string[];
  handoffs?: string[]; kpis?: Record<string, string>; evals?: string[];
  cadence?: any; ab_test?: { enabled?: boolean; variants?: string[]; sample?: number; metrics?: string[]; log?: string };
  meta?: any; changelog?: string[]; version?: string; theme?: any;
};

async function upsertAgent(a: AgentIn) {
  const combinedMeta = { ...(a.meta ?? {}), ...(a.theme ? { theme: a.theme } : {}) };
  const agent = await prisma.agent.upsert({
    where: { name: a.name },
    create: {
      name: a.name, role: a.role ?? "", tone: a.tone, vibe: a.vibe, signature: a.signature, summary: a.summary,
      version: a.version ?? "2.0.0", meta: combinedMeta, changelog: a.changelog ?? [],
    },
    update: {
      role: a.role ?? "", tone: a.tone, vibe: a.vibe, signature: a.signature, summary: a.summary,
      version: "2.0.0", meta: combinedMeta, changelog: a.changelog ?? [],
    },
  });

  await prisma.agentTool.deleteMany({ where: { agentId: agent.id } });
  await prisma.agentDataset.deleteMany({ where: { agentId: agent.id } });
  await prisma.agentPlaybook.deleteMany({ where: { agentId: agent.id } });
  await prisma.agentGuardrail.deleteMany({ where: { agentId: agent.id } });
  await prisma.agentHandoff.deleteMany({ where: { agentId: agent.id } });
  await prisma.agentKPI.deleteMany({ where: { agentId: agent.id } });
  await prisma.agentEval.deleteMany({ where: { agentId: agent.id } });

  const toArr = (x?: string[]) => (x ?? []).filter(Boolean);
  const datasets = [...toArr(a.datasources), ...toArr(a.datasets)];

  await prisma.$transaction([
    ...toArr(a.tools).map(name => prisma.agentTool.create({ data: { agentId: agent.id, name } })),
    ...datasets.map(key => prisma.agentDataset.create({ data: { agentId: agent.id, key } })),
    ...toArr(a.playbooks).map(name => prisma.agentPlaybook.create({ data: { agentId: agent.id, name } })),
    ...toArr(a.guardrails).map(rule => prisma.agentGuardrail.create({ data: { agentId: agent.id, rule } })),
    ...toArr(a.handoffs).map(toName => prisma.agentHandoff.create({ data: { agentId: agent.id, toName } })),
    ...Object.entries(a.kpis ?? {}).map(([key, target]) =>
      prisma.agentKPI.create({ data: { agentId: agent.id, key, target: String(target) } })
    ),
    ...toArr(a.evals).map(name => prisma.agentEval.create({ data: { agentId: agent.id, name } })),
  ]);

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
    await prisma.agentABTest.upsert({
      where: { agentId: agent.id },
      create: {
        agentId: agent.id,
        enabled: !!a.ab_test.enabled,
        variants: a.ab_test.variants ?? [],
        sample: a.ab_test.sample ?? 0,
        metrics: a.ab_test.metrics ?? [],
        logPath: a.ab_test.log ?? null,
      },
      update: {
        enabled: !!a.ab_test.enabled,
        variants: a.ab_test.variants ?? [],
        sample: a.ab_test.sample ?? 0,
        metrics: a.ab_test.metrics ?? [],
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
    const steps = (raw.steps ?? []).map((s: any, i: number) => ({
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
  if (!fs.existsSync(MANIFEST)) throw new Error(`Missing manifest: ${MANIFEST}`);
  const list: AgentIn[] = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const names: string[] = [];
  for (const a of list) names.push(await upsertAgent(a));
  const wfCount = await upsertWorkflows();
  fs.writeFileSync(
    path.join(LOG_DIR, `seed_agents_${Date.now()}.log`),
    JSON.stringify({ root: ROOT, agents: { count: names.length, names }, workflows: { count: wfCount } }, null, 2)
  );
  console.log(`Seeded ${names.length} agents from ${ROOT}. Imported ${wfCount} workflows.`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
