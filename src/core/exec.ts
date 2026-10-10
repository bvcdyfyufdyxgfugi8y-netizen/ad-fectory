import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/** Run a command; throw with its stderr tail when it fails. Returns stdout and stderr. */
export function run(cmd: string, args: string[]): { stdout: string; stderr: string } {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (r.error) throw new Error(`${cmd} could not start: ${r.error.message}`);
  if (r.status !== 0) throw new Error(`${cmd} ${args.slice(0, 6).join(" ")}… exited ${r.status}\n${(r.stderr || "").slice(-1500)}`);
  return { stdout: r.stdout, stderr: r.stderr };
}

export function sha256(...parts: (string | Buffer)[]): string {
  const h = crypto.createHash("sha256");
  for (const p of parts) h.update(p);
  return h.digest("hex").slice(0, 16);
}

/** Hash of every file under `dir` (sorted, content + relative path). */
export function hashTree(dir: string): string {
  const files: string[] = [];
  const walk = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p); else files.push(p);
    }
  };
  walk(dir);
  return sha256(...files.flatMap((f) => [path.relative(dir, f), fs.readFileSync(f)]));
}

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
