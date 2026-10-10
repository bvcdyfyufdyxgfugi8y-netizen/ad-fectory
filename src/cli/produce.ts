// End-to-end production for one brief:
//   npm run produce -- briefs/demo-nafas/brief.json            full: storyboard → audio → render → QC → delivery
//   npm run storyboard -- briefs/demo-nafas/brief.json         plan only, writes storyboard.json for review/editing
//   npm run preview -- briefs/demo-nafas/brief.json            half-resolution draft (cheap timing review)
//   --storyboard <file>   render an edited storyboard instead of re-planning from the brief
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { StoryboardSchema, type Storyboard } from "../core/schema.ts";
import { validatePlan } from "../engine/validate.ts";
import { checkAssets } from "../intake/loadBrief.ts";
import { ROOT, run } from "../core/exec.ts";
import { ruleBasedDirector } from "../creative/director.ts";
import { BriefError, loadBrief } from "../intake/loadBrief.ts";
import { planProduction } from "../creative/plan.ts";
import { buildAudio } from "../audio/mix.ts";
import { mux, renderCover, renderPicture } from "../render/render.ts";
import { qcMarkdown, runQc } from "../qc/qc.ts";
import { caption, coverFrame, sceneMidpoints } from "../delivery/package.ts";

export interface ProduceResult { outDir: string; final: string; qcPassed: boolean; timings: Record<string, number>; cached: { audio: boolean; video: boolean } }

export async function produce(briefFile: string, opts: { stage?: "storyboard" | "full"; preview?: boolean; storyboardFile?: string } = {}): Promise<ProduceResult> {
  const t0 = Date.now();
  const timings: Record<string, number> = {};
  const lap = (k: string, since: number) => (timings[k] = Number(((Date.now() - since) / 1000).toFixed(1)));
  const log = (m: string) => console.log(`[ad-factory] ${m}`);

  const { brief, dir } = loadBrief(briefFile);
  const outDir = path.join(ROOT, "out", brief.id);
  fs.mkdirSync(outDir, { recursive: true });

  let sb: Storyboard;
  if (opts.storyboardFile) {
    sb = StoryboardSchema.parse(JSON.parse(fs.readFileSync(opts.storyboardFile, "utf8")));
    log(`using edited storyboard ${opts.storyboardFile}`);
  } else {
    sb = planProduction(brief, dir);
  }
  validatePlan(sb, brief);
  const assetIssues = checkAssets({ ...brief, product: { ...brief.product, images: sb.scenes.flatMap(s => s.image ? [s.image] : []) }, brand: { ...brief.brand, logo: sb.brand.logo } }, dir);
  if (assetIssues.length) throw new BriefError(assetIssues);
  fs.writeFileSync(path.join(outDir, "storyboard.json"), JSON.stringify(sb, null, 2));
  log(`storyboard: ${sb.strategy}, ${sb.scenes.length} scenes, ${(sb.durationInFrames / sb.fps).toFixed(1)} s, hook "${sb.hooks[sb.selectedHook]}"`);
  if (opts.stage === "storyboard") return { outDir, final: "", qcPassed: false, timings, cached: { audio: false, video: false } };

  const cacheDir = path.join(ROOT, "cache");
  let t = Date.now();
  const audio = buildAudio(sb, dir, cacheDir);
  lap("audio", t);
  log(`audio ${audio.cached ? "reused from cache" : "built"} (${audio.cacheKey})`);

  t = Date.now();
  let last = -1;
  const picture = await renderPicture(sb, {
    briefDir: dir, cacheDir, preview: opts.preview,
    onProgress: (p) => { const pct = Math.floor(p * 10) * 10; if (pct !== last) { last = pct; log(`render ${pct}%`); } },
  });
  lap("render", t);
  log(`picture ${picture.cached ? "reused from cache" : "rendered"} (${picture.cacheKey})`);

  const name = opts.preview ? "preview.mp4" : `${brief.id}.mp4`;
  const deliveryDir = path.join(outDir, opts.preview ? "preview" : "delivery");
  const final = path.join(deliveryDir, name);
  t = Date.now();
  mux(picture.file, audio.file, final, sb.durationInFrames / sb.fps, sb.engine);
  lap("mux", t);

  if (opts.preview) {
    log(`preview ready: ${path.relative(process.cwd(), final)}`);
    lap("total", t0);
    return { outDir, final, qcPassed: false, timings, cached: { audio: audio.cached, video: picture.cached } };
  }

  t = Date.now();
  const report = runQc(final, sb);
  fs.writeFileSync(path.join(outDir, "qc-report.json"), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(outDir, "qc-report.md"), qcMarkdown(report));
  // contact sheet: one frame per scene, for the human review list
  const mids = sceneMidpoints(sb).map((f) => `eq(n\\,${f})`).join("+");
  run("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", final, "-vf", `select='${mids}',scale=360:-1,tile=${sb.scenes.length}x1:padding=8:color=black`, "-frames:v", "1", "-update", "1", path.join(outDir, "contact-sheet.jpg")]);
  lap("qc", t);
  log(`QC ${report.passed ? "PASS" : "FAIL"}: ${report.checks.filter((c) => c.status !== "pass").map((c) => `${c.id}=${c.status}`).join(", ") || "all checks pass"}`);

  t = Date.now();
  await renderCover(sb, { briefDir: dir, cacheDir }, coverFrame(sb), path.join(deliveryDir, "cover.jpg"));
  fs.writeFileSync(path.join(deliveryDir, "caption.txt"), caption(brief, sb));
  fs.copyFileSync(path.join(outDir, "qc-report.md"), path.join(deliveryDir, "qc-report.md"));
  lap("delivery", t);
  lap("total", t0);
  fs.writeFileSync(path.join(outDir, "run.json"), JSON.stringify({ briefId: brief.id, director: brief.creative ? "adaptive@1" : ruleBasedDirector.name, final: path.relative(ROOT, final), timings, cached: { audio: audio.cached, video: picture.cached }, paidApiCalls: 0, costUSD: 0 }, null, 2));
  log(`done in ${timings.total}s → ${path.relative(process.cwd(), deliveryDir)}/`);
  return { outDir, final, qcPassed: report.passed, timings, cached: { audio: audio.cached, video: picture.cached } };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { stage: { type: "string" }, preview: { type: "boolean" }, storyboard: { type: "string" } },
  });
  const brief = positionals[0] ?? path.join(ROOT, "briefs/demo-nafas/brief.json");
  produce(brief, { stage: values.stage === "storyboard" ? "storyboard" : "full", preview: values.preview, storyboardFile: values.storyboard })
    .then((r) => { if (values.stage !== "storyboard" && !values.preview && !r.qcPassed) process.exit(2); })
    .catch((e) => {
      console.error(e instanceof BriefError ? e.message : e);
      process.exit(1);
    });
}
