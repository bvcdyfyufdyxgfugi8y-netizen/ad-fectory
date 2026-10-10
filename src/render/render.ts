// Rendering engine: storyboard → silent H.264 picture (Remotion) → mux with the mixed audio (ffmpeg).
// Picture and sound are cached separately, so changing a line of copy re-renders the picture but reuses the audio,
// and changing only the music re-muxes without re-rendering a single frame.
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import type { Storyboard } from "../core/schema.ts";
import { settings } from "../engine/config.ts";
import { templateDefinition } from "../engine/templates.ts";
import { validatePlan } from "../engine/validate.ts";
import { ROOT, hashTree, run, sha256 } from "../core/exec.ts";

export interface RenderOptions {
  briefDir: string;             // becomes the bundle's public dir: staticFile("assets/can.svg") resolves here
  cacheDir: string;
  preview?: boolean;            // half resolution, higher CRF: a cheap draft for timing review
  onProgress?: (p: number) => void;
}

const browserExecutable = () => process.env.REMOTION_BROWSER || undefined;
const concurrency = () => (process.env.RENDER_CONCURRENCY ? Number(process.env.RENDER_CONCURRENCY) : null);

export function videoCacheKey(sb: Storyboard, briefDir: string, preview: boolean): string {
  const { audio: _audio, approved: _approved, ...picture } = sb;
  if (picture.engine) {
    const { audio: _settingsAudio, export: exportSettings, ...visualSettings } = picture.engine;
    const { audioBitrateK: _bitrate, sampleRate: _sampleRate, ...visualExport } = exportSettings;
    // Audio controls must not invalidate the picture cache.
    Object.assign(picture, { engine: { ...visualSettings, export: visualExport } });
  }
  const used = [...new Set([...sb.scenes.flatMap((s) => (s.image ? [s.image] : [])), ...(sb.brand.logo ? [sb.brand.logo] : [])])].sort();
  return sha256(
    JSON.stringify(picture), preview ? "preview" : "final",
    hashTree(path.join(ROOT, "src/remotion")), hashTree(path.join(ROOT, "src/engine")), fs.readFileSync(path.join(ROOT, "src/render/render.ts")), fs.readFileSync(path.join(ROOT, "src/storyboard/build.ts")),
    ...used.flatMap((u) => [u, fs.readFileSync(path.resolve(briefDir, u))]),
  );
}

let bundled: { dir: string; url: string } | undefined;
async function getBundle(publicDir: string): Promise<string> {
  if (bundled?.dir === publicDir) return bundled.url;
  const url = await bundle({ entryPoint: path.join(ROOT, "src/remotion/index.ts"), publicDir });
  bundled = { dir: publicDir, url };
  return url;
}

export async function renderPicture(sb: Storyboard, o: RenderOptions): Promise<{ file: string; cacheKey: string; cached: boolean }> {
  validatePlan(sb);
  const cfg = settings(sb.engine).export;
  const preview = Boolean(o.preview);
  const cacheKey = videoCacheKey(sb, o.briefDir, preview);
  const file = path.join(o.cacheDir, "video", `${cacheKey}.mp4`);
  if (fs.existsSync(file)) return { file, cacheKey, cached: true };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const serveUrl = await getBundle(o.briefDir);
  const inputProps = { storyboard: sb };
  const composition = await selectComposition({ serveUrl, id: templateDefinition(sb.template).compositionId, inputProps, browserExecutable: browserExecutable() });
  const tmp = `${file}.part.mp4`;
  await renderMedia({
    serveUrl, composition, inputProps, codec: cfg.codec, outputLocation: tmp, muted: true,
    crf: preview ? 30 : cfg.crf, scale: preview ? 0.5 : 1, pixelFormat: cfg.pixelFormat, colorSpace: cfg.colorSpace, imageFormat: "jpeg", jpegQuality: preview ? 75 : cfg.jpegQuality,
    concurrency: concurrency(), browserExecutable: browserExecutable(),
    onProgress: ({ progress }) => o.onProgress?.(progress),
  });
  fs.renameSync(tmp, file);
  return { file, cacheKey, cached: false };
}

export async function renderCover(sb: Storyboard, o: RenderOptions, frame: number, out: string): Promise<void> {
  validatePlan(sb);
  const serveUrl = await getBundle(o.briefDir);
  const inputProps = { storyboard: sb };
  const composition = await selectComposition({ serveUrl, id: templateDefinition(sb.template).compositionId, inputProps, browserExecutable: browserExecutable() });
  await renderStill({ serveUrl, composition, inputProps, frame, output: out, imageFormat: "jpeg", jpegQuality: 90, browserExecutable: browserExecutable() });
}

/** Final file: copy the picture stream, encode audio to AAC, web-optimised (moov atom first). */
export function mux(video: string, audio: string, out: string, seconds: number, engine?: Storyboard["engine"]): void {
  const cfg = settings(engine).export;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  run("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "error", "-i", video, "-i", audio,
    "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", `${cfg.audioBitrateK}k`, "-ar", String(cfg.sampleRate),
    "-t", seconds.toFixed(3), "-movflags", "+faststart", out,
  ]);
}
