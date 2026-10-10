import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { ROOT } from "../core/exec.ts";
import type { Brief, Storyboard } from "../core/schema.ts";

export type Project = { id: string; brief: Brief; storyboard: Storyboard; revision: number; updatedAt: string };
export type Job = { id: string; projectId: string; revision: number; status: "queued" | "running" | "succeeded" | "failed"; log: string; createdAt: string; finishedAt: string | null };
export class Store {
  readonly db: DatabaseSync;
  constructor(readonly dir = path.join(ROOT, "data")) {
    fs.mkdirSync(dir, { recursive: true });
    this.db = new DatabaseSync(path.join(dir, "factory.sqlite"));
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;
      CREATE TABLE IF NOT EXISTS clients (id TEXT PRIMARY KEY, name TEXT NOT NULL, brand TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, client_id TEXT NOT NULL REFERENCES clients(id), brief TEXT NOT NULL, storyboard TEXT NOT NULL, revision INTEGER NOT NULL, updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), revision INTEGER NOT NULL, status TEXT NOT NULL, log TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, finished_at TEXT);
      CREATE UNIQUE INDEX IF NOT EXISTS one_active_revision ON jobs(project_id, revision) WHERE status IN ('queued','running');`);
  }
  close() { this.db.close(); }
  projectDir(id: string) { return path.join(this.dir, "projects", id); }
  jobDir(id: string) { return path.join(this.dir, "jobs", id); }
  list(): Project[] {
    return (this.db.prepare("SELECT * FROM projects ORDER BY updated_at DESC").all() as Record<string, unknown>[]).map(this.decode);
  }
  private decode(row: Record<string, unknown>): Project {
    return { id: String(row.id), brief: JSON.parse(String(row.brief)), storyboard: JSON.parse(String(row.storyboard)), revision: Number(row.revision), updatedAt: String(row.updated_at) };
  }
  get(id: string): Project {
    const row = this.db.prepare("SELECT * FROM projects WHERE id=?").get(id);
    if (!row) throw new Error("المشروع غير موجود");
    return this.decode(row);
  }
  create(brief: Brief, storyboard: Storyboard): Project {
    const id = randomUUID();
    this.db.exec("BEGIN IMMEDIATE");
    try {
      this.db.prepare("INSERT INTO clients VALUES (?,?,?)").run(id, brief.client.name, brief.client.brand);
      this.db.prepare("INSERT INTO projects VALUES (?,?,?,?,1,?)").run(id, id, JSON.stringify(brief), JSON.stringify(storyboard), new Date().toISOString());
      this.db.exec("COMMIT");
    } catch (e) { this.db.exec("ROLLBACK"); throw e; }
    fs.mkdirSync(path.join(this.projectDir(id), "assets"), { recursive: true });
    return this.get(id);
  }
  save(id: string, revision: number, brief: Brief, storyboard: Storyboard): Project {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const result = this.db.prepare("UPDATE projects SET brief=?, storyboard=?, revision=revision+1, updated_at=? WHERE id=? AND revision=?").run(JSON.stringify(brief), JSON.stringify(storyboard), new Date().toISOString(), id, revision);
      if (!result.changes) throw new Error("تغيّر المشروع في نافذة أخرى. أعد تحميله قبل الحفظ.");
      this.db.prepare("UPDATE clients SET name=?, brand=? WHERE id=?").run(brief.client.name, brief.client.brand, id);
      this.db.exec("COMMIT");
    } catch (e) { this.db.exec("ROLLBACK"); throw e; }
    return this.get(id);
  }
  jobs(projectId?: string): Job[] {
    const rows = projectId ? this.db.prepare("SELECT * FROM jobs WHERE project_id=? ORDER BY created_at DESC LIMIT 50").all(projectId) : this.db.prepare("SELECT * FROM jobs ORDER BY created_at DESC LIMIT 50").all();
    return (rows as Record<string, unknown>[]).map(this.decodeJob);
  }
  private decodeJob(row: Record<string, unknown>): Job { return { id: String(row.id), projectId: String(row.project_id), revision: Number(row.revision), status: row.status as Job["status"], log: String(row.log), createdAt: String(row.created_at), finishedAt: row.finished_at ? String(row.finished_at) : null }; }
  job(id: string): Job | undefined {
    const row = this.db.prepare("SELECT * FROM jobs WHERE id=?").get(id);
    return row ? this.decodeJob(row) : undefined;
  }
  enqueue(id: string, revision: number): Job {
    const jobId = randomUUID();
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const p = this.get(id);
      if (p.revision !== revision) throw new Error("تغيّرت نسخة المشروع. أعد تحميلها.");
      if (!p.storyboard.approved) throw new Error("اعتمد المشاهد قبل التصدير");
      const existing = this.db.prepare("SELECT id FROM jobs WHERE project_id=? AND revision=? AND status IN ('queued','running')").get(id, revision);
      if (existing) { this.db.exec("COMMIT"); return this.job(String(existing.id))!; }
      const dir = this.jobDir(jobId);
      fs.mkdirSync(dir, { recursive: true });
      fs.cpSync(path.join(this.projectDir(id), "assets"), path.join(dir, "assets"), { recursive: true });
      const renderId = `render-${jobId}`;
      fs.writeFileSync(path.join(dir, "brief.json"), JSON.stringify({ ...p.brief, id: renderId }));
      // Keep the plan identity stable so an unchanged re-export can reuse picture/audio caches.
      // Only the output brief id changes to give every job its own delivery folder.
      fs.writeFileSync(path.join(dir, "storyboard.json"), JSON.stringify(p.storyboard));
      this.db.prepare("INSERT INTO jobs (id,project_id,revision,status,created_at) VALUES (?,?,?,'queued',?)").run(jobId, id, revision, new Date().toISOString());
      this.db.exec("COMMIT");
    } catch (e) { this.db.exec("ROLLBACK"); fs.rmSync(this.jobDir(jobId), { recursive: true, force: true }); throw e; }
    return this.job(jobId)!;
  }
  claim(): Job | undefined {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const row = this.db.prepare("SELECT id FROM jobs WHERE status='queued' ORDER BY created_at LIMIT 1").get();
      if (!row) { this.db.exec("COMMIT"); return; }
      this.db.prepare("UPDATE jobs SET status='running' WHERE id=?").run(String(row.id));
      this.db.exec("COMMIT");
      return this.job(String(row.id));
    } catch (e) { this.db.exec("ROLLBACK"); throw e; }
  }
  append(id: string, message: string) { this.db.prepare("UPDATE jobs SET log=substr(log || ?, -60000) WHERE id=?").run(message, id); }
  finish(id: string, success: boolean) { this.db.prepare("UPDATE jobs SET status=?,finished_at=? WHERE id=? AND status='running'").run(success ? "succeeded" : "failed", new Date().toISOString(), id); }
}
