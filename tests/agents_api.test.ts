import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma client used by the routes
const prismaMock: any = {
  agent: {
    findMany: vi.fn(async () => []),
    findFirst: vi.fn(async () => null),
    count: vi.fn(async () => 0),
  },
};
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const mockAgentRegistry = {
  getAllAgents: vi.fn(() => []),
  getAgent: vi.fn(() => null),
  getWorkflow: vi.fn(() => null),
  getAction: vi.fn(() => null),
  registerAgent: vi.fn(),
};

const mockAgentExecutor = {
  getActiveExecutions: vi.fn(() => []),
  executeAction: vi.fn(async () => ({
    result: {},
    executionTime: 0,
    retryCount: 0,
    success: true,
    error: null,
  })),
};

vi.mock("@/lib/agents/executor", () => ({
  agentRegistry: mockAgentRegistry,
  agentExecutor: mockAgentExecutor,
}));

describe("agents API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/agents returns list with fields", async () => {
    const now = new Date();
    prismaMock.agent.findMany.mockResolvedValueOnce([
      { id: "a2", name: "Muse", role: "Creator Whisperer", version: "2.0.0", updatedAt: now },
      { id: "a1", name: "Aura", role: "Brand Spirit", version: "2.0.0", updatedAt: now },
    ]);
    prismaMock.agent.count.mockResolvedValueOnce(2);
    const mod = await import("../app/api/agents/route");
    const res = await (mod as any).GET(new Request("http://localhost/api/agents"));
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data[0]).toHaveProperty("id");
    expect(data.data[0]).toHaveProperty("name");
    expect(data.data[0]).toHaveProperty("role");
    expect(data.data[0]).toHaveProperty("version");
    expect(data.pagination.total).toBe(2);
  });

  it("GET /api/agents/[name] returns full agent", async () => {
    const now = new Date();
    const fullAgent = {
      id: "aMuse",
      name: "Muse",
      role: "Creator Whisperer",
      tone: "Warm",
      vibe: "Purple",
      signature: "Tell me what inspires you.",
      summary: "Interviews creators",
      version: "2.0.0",
      updatedAt: now,
      tools: [{ name: "InterviewTree.v1" }],
      datasets: [{ key: "TapTap.Brand.Guide" }],
      playbooks: [{ name: "Interview-10Q" }],
      guardrails: [{ rule: "StayOnBrand" }],
      handoffs: [{ toName: "Fable" }],
      kpis: [{ key: "completed_intakes", target: "↑" }],
      evals: [{ name: "StyleMatch.v1" }],
      cadence: null,
      abTest: null,
      prompt: { body: "You are Muse..." },
    };
    prismaMock.agent.findFirst.mockResolvedValueOnce(fullAgent);

    const mod = await import("@/api/agents/[name]/route");
    const res = await (mod as any).GET(new Request("http://localhost/api/agents/Muse"), { params: { name: "Muse" } });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.name).toBe("Muse");
    expect(Array.isArray(data.data.tools)).toBe(true);
    expect(Array.isArray(data.data.datasets)).toBe(true);
    expect(data.data.prompt?.body).toContain("Muse");
  });

  it("POST /api/agents/[name] returns simulation plan and guardrails", async () => {
    prismaMock.agent.findFirst.mockResolvedValueOnce({ id: "aMuse", name: "Muse", version: "2.0.0" });
    const mod = await import("@/api/agents/[name]/route");
    const body = { feature: "add agent detail view", impact: "high", path: "app/admin/agents" };
    const req = new Request("http://localhost/api/agents/Muse", { method: "POST", body: JSON.stringify(body) });
    const res = await (mod as any).POST(req, { params: { name: "Muse" } });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.plan)).toBe(true);
    expect(data.guardrails.some((g: string) => g.toLowerCase().includes("high-impact"))).toBe(true);
    expect(data.suggestedCommands).toContain("pnpm typecheck");
  });

  it("POST /api/agents/[name] validates input", async () => {
    prismaMock.agent.findFirst.mockResolvedValueOnce({ id: "aMuse", name: "Muse", version: "2.0.0" });
    const mod = await import("@/api/agents/[name]/route");
    const req = new Request("http://localhost/api/agents/Muse", { method: "POST", body: JSON.stringify({ feature: "" }) });
    const res = await (mod as any).POST(req, { params: { name: "Muse" } });
    expect(res.status).toBe(400);
  });
});
