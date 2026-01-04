import killPort from "kill-port";
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();

async function freePorts() {
  const configured = process.env.NEXT_DEV_PORTS
    ? process.env.NEXT_DEV_PORTS.split(",").map((port) => Number(port.trim()))
    : [];

  const defaultPorts = [
    Number(process.env.PORT ?? 3000),
    Number(process.env.PORT ?? 3000) + 1,
    3001,
  ];

  const ports = Array.from(
    new Set(
      [...configured, ...defaultPorts].filter(
        (port) => Number.isFinite(port) && port > 0
      )
    )
  );

  for (const port of ports) {
    try {
      await killPort(port);
      console.log(`[dev-clean] released port ${port}`);
    } catch (error) {
      const message = error?.message ?? "";
      const noListener =
        message.includes("does not exist") ||
        message.includes("there is no process");

      if (!noListener) {
        console.warn(
          `[dev-clean] could not release port ${port}: ${message || error}`
        );
      }
    }
  }
}

function removeStaleDevLock() {
  const lockPath = path.join(rootDir, ".next", "dev", "lock");
  if (fs.existsSync(lockPath)) {
    fs.rmSync(lockPath, { force: true });
    console.log("[dev-clean] removed stale Next.js dev lock");
  }
}

async function runEnvCheck() {
  await import("./check_env.js");
}

await freePorts();
removeStaleDevLock();
await runEnvCheck();
