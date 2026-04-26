import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: { update: vi.fn() },
    profile: { upsert: vi.fn() },
    tapPass: { findFirst: vi.fn(), update: vi.fn() },
    setting: {
      upsert: vi.fn(async () => ({})),
      findUnique: vi.fn(),
    },
  } as any,
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const authMock = vi.fn();
vi.mock("@/auth.config", () => ({ auth: authMock }));

const notifyMock = vi.fn();
vi.mock("@/lib/agents/notify", () => ({ notifyAgentEvent: notifyMock }));

const generateBioMock = vi.fn();
vi.mock("@/lib/agents/onboarding", () => ({ generateOnboardingBio: generateBioMock }));

function makeReq(body: any) {
  return new Request("http://localhost/api/onboarding/step", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("/api/onboarding/step", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "user-1", username: "alice" } });
    prismaMock.user.update.mockResolvedValue({ id: "user-1" });
    prismaMock.profile.upsert.mockResolvedValue({ id: "p1" });
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValueOnce(null);
    const mod = await import("../app/api/onboarding/step/route");
    const res = await mod.POST(makeReq({ step: 1, payload: {} }));
    expect(res.status).toBe(401);
  });

  it("rejects invalid step numbers", async () => {
    const mod = await import("../app/api/onboarding/step/route");
    const res = await mod.POST(makeReq({ step: 99, payload: {} }));
    expect(res.status).toBe(400);
  });

  it("persists Muse interview answers under onboarding:answers:1", async () => {
    const mod = await import("../app/api/onboarding/step/route");
    const res = await mod.POST(
      makeReq({ step: 1, payload: { q1: "I'm here for the vibes" } }),
    );
    expect(res.status).toBe(200);
    expect(prismaMock.setting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_key: { userId: "user-1", key: "onboarding:answers:1" } },
      }),
    );
  });

  it("Fable step generates a bio and updates the user + profile", async () => {
    prismaMock.setting.findUnique.mockResolvedValueOnce({
      value: JSON.stringify({ q1: "Indie kid" }),
    });
    generateBioMock.mockResolvedValueOnce("A short heartfelt bio.");
    const mod = await import("../app/api/onboarding/step/route");
    const res = await mod.POST(makeReq({ step: 2, payload: { displayName: "Ali" } }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.bio).toBe("A short heartfelt bio.");
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: { bio: "A short heartfelt bio." },
      }),
    );
    expect(prismaMock.profile.upsert).toHaveBeenCalled();
  });

  it("Merit step assigns role from payload", async () => {
    const mod = await import("../app/api/onboarding/step/route");
    const res = await mod.POST(makeReq({ step: 5, payload: { role: "CREATOR" } }));
    expect(res.status).toBe(200);
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: "CREATOR" }) }),
    );
  });

  it("Merit step defaults non-CREATOR roles to LISTENER", async () => {
    const mod = await import("../app/api/onboarding/step/route");
    const res = await mod.POST(makeReq({ step: 5, payload: { role: "garbage" } }));
    expect(res.status).toBe(200);
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: "LISTENER" }) }),
    );
  });

  it("Treasure step appends beta_pioneer to TapPass features", async () => {
    prismaMock.tapPass.findFirst.mockResolvedValueOnce({
      id: "tp-1",
      features: ["existing"],
    });
    prismaMock.tapPass.update.mockResolvedValueOnce({ id: "tp-1" });
    const mod = await import("../app/api/onboarding/step/route");
    const res = await mod.POST(makeReq({ step: 6, payload: {} }));
    expect(res.status).toBe(200);
    const args = prismaMock.tapPass.update.mock.calls[0][0];
    expect(args.where).toEqual({ id: "tp-1" });
    expect(args.data.features).toEqual(["existing", "beta_pioneer"]);
  });
});

describe("/api/onboarding/complete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "user-1" } });
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValueOnce(null);
    const mod = await import("../app/api/onboarding/complete/route");
    const res = await mod.POST();
    expect(res.status).toBe(401);
  });

  it("flips onboardingComplete + onboardedAt and fires user.onboarded", async () => {
    prismaMock.user.update.mockResolvedValueOnce({
      id: "user-1",
      onboardingComplete: true,
      onboardedAt: new Date(),
    });
    const mod = await import("../app/api/onboarding/complete/route");
    const res = await mod.POST();
    expect(res.status).toBe(200);
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: expect.objectContaining({ onboardingComplete: true }),
      }),
    );
    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", eventType: "user.onboarded" }),
    );
  });
});
