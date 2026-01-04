import { describe, it, expect } from "vitest";
import { rateGate } from "../app/api/_lib/rate";

function makeReq(ip: string) {
  return new Request("http://localhost/api/test", {
    headers: { "x-forwarded-for": ip },
  });
}

describe("rateGate (memory)", () => {
  it("allows under capacity then returns 429", async () => {
    process.env.ENABLE_RATE_LIMIT_TESTS = "true";
    const req = makeReq("1.2.3.4");
    let blocked = 0;
    for (let i = 0; i < 5; i++) {
      const res = await rateGate(req, "unit:test", { capacity: 3, refillPerSec: 0 });
      if (res) blocked++;
    }
    expect(blocked).toBe(2);
  });
});
