import path from "node:path";
import { spawn } from "node:child_process";
import { ROOT } from "../core/exec.ts";
const mode = process.argv.includes("--production") ? "start" : "dev";
const children = [
  spawn(process.execPath, ["--import", "tsx", path.join(ROOT, "src/server/worker.ts")], { cwd: ROOT, stdio: "inherit" }),
  spawn(process.execPath, [path.join(ROOT, "node_modules/next/dist/bin/next"), mode, "--hostname", "127.0.0.1", "--port", process.env.PORT ?? "3000"], { cwd: ROOT, stdio: "inherit" }),
];
let closing = false;
function stop() { if (closing) return; closing = true; children.forEach(child => child.kill("SIGTERM")); }
process.on("SIGINT", stop); process.on("SIGTERM", stop);
children.forEach(child => child.on("exit", code => { if (!closing) { process.exitCode = code ?? 1; stop(); } }));
