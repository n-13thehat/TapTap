import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoisted so the vi.mock factory can safely reference it.
const { prismaMock } = vi.hoisted(() => {
  return {
    prismaMock: {
      notification: {
        create: vi.fn(async ({ data }: any) => ({ id: "notif_1", ...data })),
      },
      agent: {
        findMany: vi.fn(async () => [
          {
            id: "muse-1",
            name: "Muse",
            role: "Creator Whisperer",
            tone: "Warm",
            vibe: "Purple",
            signature: "Tell me what inspires you.",
            summary: "Interviews creators",
            meta: { theme: { color: "#C280FF", emoji: "🟣" }, guardrails: ["StayOnBrand"] },
          },
          {
            id: "haven-1",
            name: "Haven",
            role: "Guardian",
            tone: "Calm",
            vibe: "Shield",
            signature: "I keep you safe.",
            summary: "Security and trust",
            meta: { theme: { color: "#33CFFF", emoji: "🛡️" } },
          },
          {
            id: "treasure-1",
            name: "Treasure",
            role: "Economy Keeper",
            tone: "Protective",
            vibe: "Emerald",
            signature: "Your value is safe with me.",
            summary: "TapCoin flows",
            meta: { theme: { color: "#32D47B", emoji: "💰" } },
          },
        ]),
      },
    } as any,
  };
});
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { notifyAgentEventSync } from "@/lib/agents/notify";

describe("agents/notify helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists a Notification row for upload.completed mapped to SYSTEM", async () => {
    await notifyAgentEventSync({
      userId: "user-1",
      eventType: "upload.completed",
      data: { title: "First Track" },
    });

    expect(prismaMock.notification.create).toHaveBeenCalledTimes(1);
    const arg = prismaMock.notification.create.mock.calls[0][0];
    expect(arg.data.userId).toBe("user-1");
    expect(arg.data.type).toBe("SYSTEM");
    const payload = JSON.parse(arg.data.payload);
    expect(payload.eventType).toBe("upload.completed");
    expect(payload.agentId).toBe("muse-1");
    expect(payload.title).toContain("Upload Complete");
  });

  it("maps marketplace.item_purchased to ORDER_STATUS notification type", async () => {
    await notifyAgentEventSync({
      userId: "buyer-1",
      eventType: "marketplace.item_purchased",
      data: { item: "prod_1", amount: 100, currency: "TAP" },
    });
    const arg = prismaMock.notification.create.mock.calls[0][0];
    expect(arg.data.type).toBe("ORDER_STATUS");
    const payload = JSON.parse(arg.data.payload);
    expect(payload.agentId).toBe("treasure-1");
  });

  it("routes royalty.claim_submitted to Haven with SYSTEM type", async () => {
    await notifyAgentEventSync({
      userId: "artist-1",
      eventType: "royalty.claim_submitted",
      data: { stageName: "Test Artist", pendingTap: 50 },
    });
    const arg = prismaMock.notification.create.mock.calls[0][0];
    expect(arg.data.type).toBe("SYSTEM");
    const payload = JSON.parse(arg.data.payload);
    expect(payload.agentId).toBe("haven-1");
    expect(payload.message).toContain("Test Artist");
  });

  it("falls through to SYSTEM for unknown event types", async () => {
    await notifyAgentEventSync({
      userId: "user-1",
      eventType: "totally.unknown.event",
      data: {},
    });
    const arg = prismaMock.notification.create.mock.calls[0][0];
    expect(arg.data.type).toBe("SYSTEM");
  });

  it("never throws when notification.create fails", async () => {
    prismaMock.notification.create.mockRejectedValueOnce(new Error("db down"));
    await expect(
      notifyAgentEventSync({
        userId: "user-1",
        eventType: "upload.completed",
        data: { title: "x" },
      }),
    ).resolves.toBeUndefined();
  });

  it("skips persistence when userId is empty", async () => {
    await notifyAgentEventSync({ userId: "", eventType: "upload.completed", data: {} });
    expect(prismaMock.notification.create).not.toHaveBeenCalled();
  });
});
