import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { ROOT } from "../src/core/exec.ts";
import { ReferenceSchema } from "../src/core/reference.ts";
import { loadReference } from "../src/references/load.ts";
const file = path.join(ROOT, "references/reference-001/ingestion.json");
const record = () => JSON.parse(fs.readFileSync(file, "utf8"));

test("reference ingestion verifies provided files without claiming absent MP4 verification", () => {
  const r = loadReference(file);
  assert.equal(r.source.availability, "missing");
  assert.equal(r.source.hashVerification, "reported-only");
  assert.equal(r.analysis.status, "conflicting-evidence");
  assert.equal(r.license.usage, "reference-only");
});
test("reference rejects malformed hashes, paths, unknown fields and unsupported licensing", () => {
  for (const mutate of [
    (r: ReturnType<typeof record>) => { r.source.sha256 = "1234"; },
    (r: ReturnType<typeof record>) => { r.artifacts[0].file = "../outside.md"; },
    (r: ReturnType<typeof record>) => { r.artifacts[0].file = "https://example.com/file"; },
    (r: ReturnType<typeof record>) => { r.artifacts[0].file = "C:\\file"; },
    (r: ReturnType<typeof record>) => { r.license.usage = "production"; },
    (r: ReturnType<typeof record>) => { r.license.status = "licensed"; },
    (r: ReturnType<typeof record>) => { r.unexpected = true; },
  ]) { const r = record(); mutate(r); assert.equal(ReferenceSchema.safeParse(r).success, false); }
});
test("reference rejects invented video evidence, impossible time ranges and missing verification", () => {
  for (const mutate of [
    (r: ReturnType<typeof record>) => { r.source.hashVerification = "verified"; },
    (r: ReturnType<typeof record>) => { r.source.availability = "local"; },
    (r: ReturnType<typeof record>) => { r.analysis.observations[0].evidence = "source-video"; },
    (r: ReturnType<typeof record>) => { r.analysis.observations[0].endSeconds = 70; },
    (r: ReturnType<typeof record>) => { r.analysis.observations[0].endSeconds = 0.5; r.analysis.observations[0].startSeconds = 1; },
    (r: ReturnType<typeof record>) => { r.analysis.observations[0].confidence = 1.1; },
    (r: ReturnType<typeof record>) => { r.analysis.observations[0].evidence = "supplied-analysis"; },
  ]) { const r = record(); mutate(r); assert.equal(ReferenceSchema.safeParse(r).success, false); }
});
test("reference loader rejects tampered bytes, missing assets and symlink escapes", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ad-reference-"));
  try {
    fs.cpSync(path.dirname(file), dir, { recursive: true });
    const copy = path.join(dir, "ingestion.json");
    fs.appendFileSync(path.join(dir, "creative-analysis.md"), "tampered");
    assert.throws(() => loadReference(copy), /SHA-256 mismatch/);
    fs.unlinkSync(path.join(dir, "creative-analysis.md"));
    assert.throws(() => loadReference(copy));
    fs.symlinkSync(path.join(path.dirname(file), "creative-analysis.md"), path.join(dir, "creative-analysis.md"));
    assert.throws(() => loadReference(copy), /escapes/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test("local source records check existence, containment and explicitly verified source hashes", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ad-reference-source-"));
  try {
    fs.cpSync(path.dirname(file), dir, { recursive: true });
    const r = record();
    r.source.availability = "local";
    r.source.file = "missing.mp4";
    const copy = path.join(dir, "ingestion.json");
    const save = () => fs.writeFileSync(copy, JSON.stringify(r));
    save(); assert.throws(() => loadReference(copy));
    r.source.file = "contact-sheet.jpg";
    r.source.hashVerification = "verified";
    save(); assert.throws(() => loadReference(copy), /SHA-256 mismatch/);
    r.source.sha256 = r.artifacts.find((a: { role: string }) => a.role === "contact-sheet").sha256;
    save(); assert.equal(loadReference(copy).source.hashVerification, "verified");
    fs.unlinkSync(path.join(dir, "contact-sheet.jpg"));
    fs.symlinkSync(path.join(path.dirname(file), "contact-sheet.jpg"), path.join(dir, "contact-sheet.jpg"));
    save(); assert.throws(() => loadReference(copy), /escapes/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
