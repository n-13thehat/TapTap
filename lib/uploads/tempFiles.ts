import fs from "fs/promises";
import path from "path";

const ROOT_DIR = path.join(process.cwd(), ".upload_sessions_tmp");

async function ensureSessionDir(sessionId: string) {
  const dir = path.join(ROOT_DIR, sessionId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function writeChunkFile(
  sessionId: string,
  chunkIndex: number,
  data: Buffer
) {
  const dir = await ensureSessionDir(sessionId);
  const filePath = path.join(dir, `chunk-${chunkIndex}`);
  await fs.writeFile(filePath, data);
  return filePath;
}

export async function chunkFilePath(sessionId: string, chunkIndex: number) {
  const dir = await ensureSessionDir(sessionId);
  return path.join(dir, `chunk-${chunkIndex}`);
}

export async function mergeChunksToFile(
  sessionId: string,
  totalChunks: number
) {
  const dir = await ensureSessionDir(sessionId);
  const outputPath = path.join(dir, "merged");
  const handle = await fs.open(outputPath, "w");

  try {
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(dir, `chunk-${i}`);
      const chunk = await fs.readFile(chunkPath);
      await handle.write(chunk);
    }
  } finally {
    await handle.close();
  }

  return outputPath;
}

export async function cleanupSessionFiles(sessionId: string) {
  try {
    const dir = path.join(ROOT_DIR, sessionId);
    await fs.rm(dir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}
