import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { ROOT } from "../src/core/exec.ts";
import { loadBrief } from "../src/intake/loadBrief.ts";
import { editStoryboard, plan } from "../src/server/editor.ts";
import { Store } from "../src/server/store.ts";
import { caption } from "../src/delivery/package.ts";

const { brief } = loadBrief(path.join(ROOT, "briefs/demo-nafas/brief.json"));

test("scene edits preserve owner-supplied copy, remove approval and retime sound cues", () => {
  const current = { ...plan(brief), approved: true };
  const input = structuredClone(current);
  input.scenes[2]!.headline = "بدون سكر مضاف";
  input.scenes[2]!.emphasis = [1];
  input.scenes[2]!.durationInFrames += 15;
  const result = editStoryboard(brief, current, input);
  assert.equal(result.storyboard.approved, false);
  assert.equal(result.storyboard.durationInFrames, current.durationInFrames + 15);
  assert.equal(result.brief.durationSec, 20.5);
  assert.equal(result.brief.approvedCopy?.[input.scenes[2]!.id]?.headline, input.scenes[2]!.headline);
  assert.ok(result.storyboard.scenes[2]!.source[0]!.startsWith("approvedCopy."));
  const originalLast = current.audio.sfx.at(-1)!;
  assert.equal(result.storyboard.audio.sfx.at(-1)!.frame, originalLast.frame + 15);
});

test("editor rejects unsafe images, unknown scenes, unreadable durations and invalid ordering", () => {
  const current = plan(brief);
  const unsafe = structuredClone(current); unsafe.scenes[1]!.image = "../../secrets.png";
  assert.throws(() => editStoryboard(brief, current, unsafe), /صورة/);
  const unknown = structuredClone(current); unknown.scenes[1]!.id = "invented";
  assert.throws(() => editStoryboard(brief, current, unknown), /معروف/);
  const short = structuredClone(current); short.scenes[0]!.durationInFrames = 15;
  assert.throws(() => editStoryboard(brief, current, short), /قصيرة/);
  const reordered = structuredClone(current); reordered.scenes.reverse();
  assert.throws(() => editStoryboard(brief, current, reordered), /يبدأ/);
});

test("editor cannot change render geometry, scene types or audio inputs", () => {
  const current = plan(brief);
  const input = structuredClone(current);
  input.width = 12; input.fps = 120; input.direction = "ltr";
  input.audio.voiceover = "/etc/passwd"; input.scenes[1]!.kind = "offer";
  const result = editStoryboard(brief, current, input);
  assert.equal(result.storyboard.width, 1080);
  assert.equal(result.storyboard.fps, 30);
  assert.equal(result.storyboard.direction, "rtl");
  assert.equal(result.storyboard.audio.voiceover, undefined);
  assert.equal(result.storyboard.scenes[1]!.kind, "reveal");
});

test("delivery caption follows owner-edited hook and CTA", () => {
  const current = plan(brief);
  const input = structuredClone(current);
  input.scenes[0]!.headline = "قهوة باردة جاهزة";
  input.scenes.at(-1)!.headline = "اطلب اليوم";
  const result = editStoryboard(brief, current, input);
  const text = caption(result.brief, result.storyboard);
  assert.ok(text.startsWith("قهوة باردة جاهزة"));
  assert.match(text, /اطلب اليوم/);
  assert.ok(!text.includes(brief.cta));
});

test("SQLite persists projects, detects stale saves and snapshots approved jobs", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "factory-store-"));
  let store = new Store(dir);
  try {
    let p = store.create(brief, plan(brief));
    fs.cpSync(path.join(ROOT, "briefs/demo-nafas/assets"), path.join(store.projectDir(p.id), "assets"), { recursive: true });
    assert.throws(() => store.enqueue(p.id, p.revision), /اعتمد/);
    p = store.save(p.id, p.revision, p.brief, { ...p.storyboard, approved: true });
    assert.throws(() => store.save(p.id, 1, p.brief, p.storyboard), /تغيّر/);
    const job = store.enqueue(p.id, p.revision);
    assert.equal(store.enqueue(p.id, p.revision).id, job.id);
    const snapshot = fs.readFileSync(path.join(store.jobDir(job.id), "storyboard.json"), "utf8");
    store.save(p.id, p.revision, p.brief, { ...p.storyboard, approved: false });
    assert.equal(fs.readFileSync(path.join(store.jobDir(job.id), "storyboard.json"), "utf8"), snapshot);
    store.close(); store = new Store(dir);
    assert.equal(store.list().length, 1);
    assert.equal(store.claim()?.id, job.id);
    assert.equal(store.claim(), undefined);
    store.append(job.id, "render 100%\n"); store.finish(job.id, true);
    assert.equal(store.job(job.id)?.status, "succeeded");
    assert.match(store.job(job.id)!.log, /100%/);
  } finally { store.close(); fs.rmSync(dir, { recursive: true, force: true }); }
});
