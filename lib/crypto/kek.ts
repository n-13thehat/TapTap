import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const KEY_LEN = 32;

function loadKEK(): Buffer {
  const b64 = process.env.TOKEN_FORGE_KEK;
  if (!b64) throw new Error("TOKEN_FORGE_KEK not configured");
  const key = Buffer.from(b64, "base64");
  if (key.length !== KEY_LEN) {
    throw new Error(`TOKEN_FORGE_KEK must decode to ${KEY_LEN} bytes (got ${key.length})`);
  }
  return key;
}

export function encryptKEK(plain: Buffer): string {
  const key = loadKEK();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decryptKEK(packed: string): Buffer {
  const key = loadKEK();
  const parts = packed.split(":");
  if (parts.length !== 3) throw new Error("KEK ciphertext malformed");
  const [ivB64, tagB64, encB64] = parts;
  if (!ivB64 || !tagB64 || !encB64) throw new Error("KEK ciphertext malformed");
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const enc = Buffer.from(encB64, "base64");
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]);
}
