import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { BriefSchema, type Storyboard } from "../core/schema.ts";
import { ROOT, run } from "../core/exec.ts";
import { loadBrief } from "../intake/loadBrief.ts";
import { planProduction } from "../creative/plan.ts";
import { templateDefinition } from "../engine/templates.ts";
import { storyboardTimeline } from "../engine/timeline.ts";

// PNG-only verification: no audio files, encode, mux, preview or video export.
const baselineRoot = process.argv[2];
if (!baselineRoot) throw new Error("Usage: creative-snapshots.ts baseline-worktree");
const out = path.join(ROOT, "out/product-independent-learning");
fs.mkdirSync(out, { recursive: true });
const browserExecutable = process.env.REMOTION_BROWSER || undefined;
const digest = (file: string) => createHash("sha256").update(fs.readFileSync(file)).digest("hex");
async function shot(serveUrl: string, sb: Storyboard, frame: number, file: string) {
  const inputProps = { storyboard: sb };
  const composition = await selectComposition({ serveUrl, id: templateDefinition(sb.template).compositionId, inputProps, browserExecutable });
  await renderStill({ serveUrl, composition, inputProps, frame, output: file, imageFormat: "png", browserExecutable });
  return digest(file);
}
const legacy = loadBrief(path.join(ROOT, "briefs/demo-mint/brief.json"));
const legacySb = planProduction(legacy.brief);
const oldBundle = await bundle({ entryPoint: path.join(path.resolve(baselineRoot), "src/remotion/index.ts"), publicDir: legacy.dir });
const newBundle = await bundle({ entryPoint: path.join(ROOT, "src/remotion/index.ts"), publicDir: legacy.dir });
const regression = [];
for (const frame of [173, 178, 220, 260]) {
  const before = await shot(oldBundle, legacySb, frame, path.join(out, `legacy-before-${frame}.png`));
  const after = await shot(newBundle, legacySb, frame, path.join(out, `legacy-after-${frame}.png`));
  assert.equal(after, before, `Legacy PNG changed at frame ${frame}`);
  regression.push({ frame, before, after, exact: true });
}
const products = [];
for (const name of ["demo-nafas", "demo-mint"]) {
  const loaded = loadBrief(path.join(ROOT, `briefs/${name}/brief.json`));
  const brief = BriefSchema.parse({ ...loaded.brief, creative: { mode: "adaptive", profile: { assetAspect: 0.6 }, intensity: name === "demo-nafas" ? 0.3 : 0.8, cameraDirection: name === "demo-nafas" ? "pull-out" : "right" } });
  const sb = planProduction(brief);
  fs.writeFileSync(path.join(out, `${name}-storyboard.json`), JSON.stringify(sb, null, 2));
  const rows = storyboardTimeline(sb);
  const frames = [rows.find(r => r.scene.kind === "reveal")!, rows.find(r => r.scene.kind === "benefit")!].map(r => r.from + Math.floor(r.duration / 2));
  const snapshots: Array<{ frame: number; sha256: string; file: string }> = [];
  for (let pass = 0; pass < 2; pass++) {
    const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src/remotion/index.ts"), publicDir: loaded.dir });
    for (const frame of frames) {
      const file = `${name}-${frame}${pass ? "-repeat" : ""}.png`;
      const sha256 = await shot(serveUrl, sb, frame, path.join(out, file));
      if (!pass) snapshots.push({ frame, sha256, file });
      else assert.equal(sha256, snapshots.find(s => s.frame === frame)!.sha256, "Adaptive PNG is not repeatable");
    }
  }
  products.push({ product: brief.product.name, selected: sb.creativeDirection!.decisions.filter(d => d.selected).map(d => d.techniqueId), snapshots, freshBundles: 2 });
}
fs.writeFileSync(path.join(out, "verification.json"), JSON.stringify({ status: "PASS", baselineCommit: run("git", ["-C", path.resolve(baselineRoot), "rev-parse", "HEAD"]).stdout.trim(), regression, products, scope: "Selected native PNG frames only; no whole-video, motion continuity or audio-export equivalence claimed", videoExports: 0 }, null, 2));
console.log(`PNG verification PASS: ${out}`);
