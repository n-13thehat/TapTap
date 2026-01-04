import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const BASE_DIR =
  process.env.UPLOAD_STORAGE_DIR ||
  path.join(process.cwd(), "uploads");

function ensureDirSync(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function getChunkDir(sessionId: string) {
  const dir = path.join(BASE_DIR, "tmp", sessionId);
  ensureDirSync(dir);
  return dir;
}

export async function writeChunk(sessionId: string, index: number, data: ArrayBuffer) {
  const dir = getChunkDir(sessionId);
  const filePath = path.join(dir, `${index}.part`);
  await fs.promises.writeFile(filePath, Buffer.from(data));
}

export async function finalizeChunks(sessionId: string, originalFileName: string) {
  const chunkDir = getChunkDir(sessionId);
  const entries = await fs.promises.readdir(chunkDir).catch(() => []);
  const partFiles = entries
    .filter((f) => f.endsWith(".part"))
    .map((f) => ({
      index: Number(f.replace(".part", "")),
      path: path.join(chunkDir, f),
    }))
    .filter((f) => Number.isFinite(f.index))
    .sort((a, b) => a.index - b.index);

  const finalDir = path.join(BASE_DIR, "final");
  ensureDirSync(finalDir);

  const safeName = sanitizeFileName(originalFileName);
  const finalName = `${Date.now()}-${randomUUID()}-${safeName}`;
  const finalPath = path.join(finalDir, finalName);

  const writeStream = fs.createWriteStream(finalPath);
  for (const part of partFiles) {
    const data = await fs.promises.readFile(part.path);
    writeStream.write(data);
  }
  writeStream.end();
  await new Promise((resolve, reject) => {
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });

  // cleanup temp parts
  await cleanupChunks(sessionId);

  const storageKey = `/uploads/final/${finalName}`;
  return { storageKey, finalPath };
}

export async function cleanupChunks(sessionId: string) {
  const dir = path.join(BASE_DIR, "tmp", sessionId);
  try {
    await fs.promises.rm(dir, { recursive: true, force: true });
  } catch {
    // ignore cleanup errors
  }
}
