import fs from "node:fs";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { ROOT } from "../core/exec.ts";
import { Store } from "./store.ts";

const store = new Store();
const lock = path.join(store.dir, "worker.lock");
try {
  fs.writeFileSync(lock, String(process.pid), { flag: "wx" });
} catch {
  const pid = Number(fs.readFileSync(lock, "utf8"));
  try { process.kill(pid, 0); throw new Error("يوجد عامل إنتاج آخر يعمل بالفعل"); }
  catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ESRCH") throw e;
    fs.unlinkSync(lock);
    fs.writeFileSync(lock, String(process.pid), { flag: "wx" });
  }
}
// Interrupted jobs are explicit failures, never reported as successful or silently retried.
store.db.prepare("UPDATE jobs SET status='failed',finished_at=?,log=log || ? WHERE status='running'").run(new Date().toISOString(), "\nتوقف العامل قبل اكتمال التصدير. يمكنك إعادة المحاولة.\n");
let child: ChildProcess | undefined;
let activeId: string | undefined;
let stopping = false;
const timer = setInterval(() => {
  if (child || stopping) return;
  const job = store.claim();
  if (!job) return;
  activeId = job.id;
  const dir = store.jobDir(job.id);
  child = spawn(process.execPath, ["--import", "tsx", path.join(ROOT, "src/cli/produce.ts"), path.join(dir, "brief.json"), "--storyboard", path.join(dir, "storyboard.json")], {
    cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, RENDER_CONCURRENCY: process.env.RENDER_CONCURRENCY ?? "2", ...(process.env.REMOTION_BROWSER ? {} : fs.existsSync("/usr/bin/chromium") ? { REMOTION_BROWSER: "/usr/bin/chromium" } : {}) },
  });
  child.stdout?.on("data", chunk => store.append(job.id, String(chunk)));
  child.stderr?.on("data", chunk => store.append(job.id, String(chunk)));
  child.on("error", error => store.append(job.id, `${error.message}\n`));
  child.on("close", code => {
    store.finish(job.id, code === 0 && !stopping);
    child = undefined; activeId = undefined;
    if (stopping) cleanup();
  });
}, 750);

function cleanup() { fs.rmSync(lock, { force: true }); store.close(); process.exit(0); }
function stop() {
  stopping = true; clearInterval(timer);
  if (activeId) store.append(activeId, "\nأُوقف عامل الإنتاج.\n");
  if (child) child.kill("SIGTERM"); else cleanup();
}
process.on("SIGINT", stop); process.on("SIGTERM", stop);
console.log("AD Factory worker ready");
