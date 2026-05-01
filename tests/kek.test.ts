import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { encryptKEK, decryptKEK } from "@/lib/crypto/kek";
import { randomBytes } from "node:crypto";

const ORIGINAL_KEK = process.env.TOKEN_FORGE_KEK;

function setKEK(buf: Buffer) {
  process.env.TOKEN_FORGE_KEK = buf.toString("base64");
}

describe("lib/crypto/kek", () => {
  beforeEach(() => {
    setKEK(Buffer.alloc(32, 7));
  });

  afterEach(() => {
    if (ORIGINAL_KEK === undefined) delete process.env.TOKEN_FORGE_KEK;
    else process.env.TOKEN_FORGE_KEK = ORIGINAL_KEK;
  });

  it("round-trips arbitrary buffers", () => {
    const plain = randomBytes(64);
    const cipher = encryptKEK(plain);
    const out = decryptKEK(cipher);
    expect(out.equals(plain)).toBe(true);
  });

  it("emits the expected three-part packed format", () => {
    const cipher = encryptKEK(Buffer.from("hello"));
    const parts = cipher.split(":");
    expect(parts).toHaveLength(3);
    parts.forEach((p) => expect(p.length).toBeGreaterThan(0));
  });

  it("produces distinct ciphertexts for the same plaintext (random IV)", () => {
    const plain = Buffer.from("same-plaintext");
    const a = encryptKEK(plain);
    const b = encryptKEK(plain);
    expect(a).not.toEqual(b);
  });

  it("rejects tampered ciphertext via auth tag check", () => {
    const cipher = encryptKEK(Buffer.from("payload"));
    const [iv, tag, body] = cipher.split(":");
    const flipped = Buffer.from(body, "base64");
    flipped[0] ^= 0xff;
    const tampered = `${iv}:${tag}:${flipped.toString("base64")}`;
    expect(() => decryptKEK(tampered)).toThrow();
  });

  it("rejects tampered auth tag", () => {
    const cipher = encryptKEK(Buffer.from("payload"));
    const [iv, tag, body] = cipher.split(":");
    const tagBuf = Buffer.from(tag, "base64");
    tagBuf[0] ^= 0xff;
    const tampered = `${iv}:${tagBuf.toString("base64")}:${body}`;
    expect(() => decryptKEK(tampered)).toThrow();
  });

  it("rejects malformed packed string", () => {
    expect(() => decryptKEK("not-a-cipher")).toThrow(/malformed/);
    expect(() => decryptKEK("a:b")).toThrow(/malformed/);
  });

  it("throws when TOKEN_FORGE_KEK is missing", () => {
    delete process.env.TOKEN_FORGE_KEK;
    expect(() => encryptKEK(Buffer.from("x"))).toThrow(/not configured/);
  });

  it("throws when TOKEN_FORGE_KEK has the wrong length", () => {
    setKEK(Buffer.alloc(16, 1));
    expect(() => encryptKEK(Buffer.from("x"))).toThrow(/32 bytes/);
  });

  it("rejects ciphertext encrypted under a different key", () => {
    const cipher = encryptKEK(Buffer.from("secret"));
    setKEK(Buffer.alloc(32, 9));
    expect(() => decryptKEK(cipher)).toThrow();
  });
});
