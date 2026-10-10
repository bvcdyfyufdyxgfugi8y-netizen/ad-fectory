import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { ROOT } from "../src/core/exec.ts";
import { openReferenceMemory, CreativeMemorySchema } from "../src/creative/reference-memory.ts";
import { loadReference } from "../src/references/load.ts";
import { ReferenceSchema } from "../src/core/reference.ts";
const folder = path.join(ROOT, "references");
const memory = () => JSON.parse(fs.readFileSync(path.join(folder, "creative-memory.json"), "utf8"));

test("creative memory retrieves four evidence-linked lessons and preserves immutable retrieval", () => {
  const provider = openReferenceMemory();
  const lessons = provider.listLessons();
  assert.equal(lessons.length, 4);
  assert.deepEqual(lessons.filter(l => l.referenceId === "reference-003").map(l => l.technique), ["asymmetric-product-grid", "tile-content-loop", "flavor-color-swap"]);
  lessons[0]!.guidance.length = 0;
  assert.ok(provider.listLessons()[0]!.guidance.length > 0);
});
test("memory rejects unknown references, escaped manifests, duplicates and unsupported confidence", () => {
  for (const mutate of [
    (m: ReturnType<typeof memory>) => { m.lessons[0].referenceId = "reference-999"; },
    (m: ReturnType<typeof memory>) => { m.references[0].manifest = "../external.json"; },
    (m: ReturnType<typeof memory>) => { m.lessons.push(m.lessons[0]); },
    (m: ReturnType<typeof memory>) => { m.lessons[0].confidence = 0.2; },
  ]) { const m = memory(); mutate(m); assert.equal(CreativeMemorySchema.safeParse(m).success, false); }
});
test("memory refuses conflicting source interpretations as verified lessons", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ad-memory-"));
  try {
    fs.cpSync(folder, tmp, { recursive: true });
    const m = memory(); m.lessons[0].observationIndices = [3];
    fs.writeFileSync(path.join(tmp, "creative-memory.json"), JSON.stringify(m));
    assert.throws(() => openReferenceMemory(tmp), /Unsupported memory lesson evidence/);
    m.lessons[0].observationIndices = [999];
    fs.writeFileSync(path.join(tmp, "creative-memory.json"), JSON.stringify(m));
    assert.throws(() => openReferenceMemory(tmp), /Unsupported memory lesson evidence/);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test("Reference 003 validates import evidence without distributing source video", () => {
  const r = loadReference(path.join(folder, "reference-003/ingestion.json"));
  assert.equal(r.source.availability, "local-untracked");
  assert.equal(r.source.measuredWidth, 736);
  assert.equal(r.source.measuredHeight, 414);
  assert.equal(r.source.hashVerification, "verified");
  assert.equal(r.source.file, undefined);
  assert.ok(r.artifacts.every(a => !a.file.endsWith(".mp4")));
  const bad = structuredClone(r); bad.source.verificationReport = undefined;
  assert.equal(ReferenceSchema.safeParse(bad).success, false);
});
