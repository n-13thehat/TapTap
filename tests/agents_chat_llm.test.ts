import { describe, it, expect, vi, beforeEach } from "vitest";

const prismaMock: any = {
  agent: {
    findUnique: vi.fn(async () => null),
  },
};
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const authMock = vi.fn(async () => ({ user: { id: "user-1" } }));
vi.mock("@/auth.config", () => ({ auth: authMock }));

const openaiCreateMock = vi.fn();
vi.mock("openai", () => {
  class OpenAI {
    chat = { completions: { create: openaiCreateMock } };
    constructor(_opts: any) {}
  }
  return { default: OpenAI };
});

const museAgent = {
  id: "muse-1",
  name: "Muse",
  role: "Creator Whisperer",
  tone: "Warm",
  vibe: "Purple",
  signature: "Tell me what inspires you.",
  summary: "Interviews creators",
  meta: { theme: { emoji: "🟣" }, guardrails: ["StayOnBrand", "NoPII"] },
};

function makeReq(body: any) {
  return new Request("http://localhost/api/agents/chat", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("/api/agents/chat LLM integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "user-1" } } as any);
  });

  it("returns 401 when not authenticated", async () => {
    authMock.mockResolvedValueOnce(null as any);
    const mod = await import("../app/api/agents/chat/route");
    const res = await (mod as any).POST(makeReq({ agentId: "muse-1", message: "hi" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when agentId or message is missing", async () => {
    const mod = await import("../app/api/agents/chat/route");
    const res = await (mod as any).POST(makeReq({ agentId: "muse-1" }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when agent is not found", async () => {
    prismaMock.agent.findUnique.mockResolvedValueOnce(null);
    const mod = await import("../app/api/agents/chat/route");
    const res = await (mod as any).POST(makeReq({ agentId: "nope", message: "hi" }));
    expect(res.status).toBe(404);
  });

  it("uses OpenAI when OPENAI_API_KEY is set and reports source=llm", async () => {
    const prev = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "sk-test";
    try {
      prismaMock.agent.findUnique.mockResolvedValueOnce(museAgent);
      openaiCreateMock.mockResolvedValueOnce({
        choices: [{ message: { content: "Hello, fellow creator!" } }],
      });
      const mod = await import("../app/api/agents/chat/route");
      const res = await (mod as any).POST(makeReq({ agentId: "muse-1", message: "hi" }));
      const body = await res.json();
      expect(res.ok).toBe(true);
      expect(body.success).toBe(true);
      expect(body.data.message).toBe("Hello, fellow creator!");
      expect(body.data.source).toBe("llm");
      expect(openaiCreateMock).toHaveBeenCalledTimes(1);
      const call = openaiCreateMock.mock.calls[0][0];
      const sys = call.messages.find((m: any) => m.role === "system");
      expect(sys.content).toContain("Muse");
      expect(sys.content).toContain("Creator Whisperer");
      expect(sys.content).toContain("StayOnBrand");
    } finally {
      if (prev === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = prev;
    }
  });

  it("falls back to keyword stub when LLM throws", async () => {
    const prev = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "sk-test";
    try {
      prismaMock.agent.findUnique.mockResolvedValueOnce(museAgent);
      openaiCreateMock.mockRejectedValueOnce(new Error("boom"));
      const mod = await import("../app/api/agents/chat/route");
      const res = await (mod as any).POST(makeReq({ agentId: "muse-1", message: "hello" }));
      const body = await res.json();
      expect(res.ok).toBe(true);
      expect(body.data.source).toBe("fallback");
      expect(typeof body.data.message).toBe("string");
      expect(body.data.message.length).toBeGreaterThan(0);
    } finally {
      if (prev === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = prev;
    }
  });

  it("uses keyword stub when OPENAI_API_KEY is absent", async () => {
    const prev = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      prismaMock.agent.findUnique.mockResolvedValueOnce(museAgent);
      const mod = await import("../app/api/agents/chat/route");
      const res = await (mod as any).POST(makeReq({ agentId: "muse-1", message: "thanks" }));
      const body = await res.json();
      expect(body.data.source).toBe("fallback");
      expect(openaiCreateMock).not.toHaveBeenCalled();
    } finally {
      if (prev !== undefined) process.env.OPENAI_API_KEY = prev;
    }
  });
});
