// Quality control: measurable checks on the delivered file. Creative quality is NOT judged here; the report
// lists what a human still has to review. A failed check blocks delivery.
import fs from "node:fs";
import type { Storyboard } from "../core/schema.ts";
import { settings } from "../engine/config.ts";
import { run } from "../core/exec.ts";
import { contrast } from "../remotion/templates/bold-commercial/theme.ts";

export type Status = "pass" | "fail" | "warn";
export interface Check { id: string; status: Status; detail: string }
export interface QcReport { file: string; checks: Check[]; measured: Record<string, number | string>; humanReview: string[]; passed: boolean }

export interface Probe { width: number; height: number; fps: number; duration: number; vcodec: string; pixfmt: string; acodec?: string; sampleRate?: number; channels?: number }

export function probe(file: string): Probe {
  const j = JSON.parse(run("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", file]).stdout);
  const v = j.streams.find((s: { codec_type: string }) => s.codec_type === "video");
  const a = j.streams.find((s: { codec_type: string }) => s.codec_type === "audio");
  const [num, den] = String(v.r_frame_rate).split("/").map(Number);
  return {
    width: v.width, height: v.height, fps: num! / (den || 1), duration: Number(j.format.duration), vcodec: v.codec_name, pixfmt: v.pix_fmt,
    acodec: a?.codec_name, sampleRate: a ? Number(a.sample_rate) : undefined, channels: a?.channels,
  };
}

/** Parse ffmpeg detector output (blackdetect / silencedetect / freezedetect) into [start, end] spans. */
export function parseSpans(stderr: string, kind: "black" | "silence" | "freeze"): [number, number][] {
  const spans: [number, number][] = [];
  if (kind === "black") for (const m of stderr.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)) spans.push([Number(m[1]), Number(m[2])]);
  if (kind === "silence" || kind === "freeze") {
    const key = kind === "silence" ? "silence" : "lavfi.freezedetect.freeze";
    const starts = [...stderr.matchAll(new RegExp(`${key}_start: ?([\\d.]+)`, "g"))].map((m) => Number(m[1]));
    const ends = [...stderr.matchAll(new RegExp(`${key}_end: ?([\\d.]+)`, "g"))].map((m) => Number(m[1]));
    starts.forEach((s, i) => spans.push([s, ends[i] ?? Infinity]));
  }
  return spans;
}

export function runQc(file: string, sb: Storyboard): QcReport {
  const checks: Check[] = [];
  const measured: QcReport["measured"] = {};
  const add = (id: string, ok: boolean | "warn", detail: string) => checks.push({ id, status: ok === "warn" ? "warn" : ok ? "pass" : "fail", detail });

  if (!fs.existsSync(file) || fs.statSync(file).size === 0) {
    add("file-exists", false, `${file} missing or empty`);
    return { file, checks, measured, humanReview: [], passed: false };
  }
  measured.sizeMB = Number((fs.statSync(file).size / 1e6).toFixed(2));
  add("file-exists", true, `${measured.sizeMB} MB`);

  const p = probe(file);
  const expected = sb.durationInFrames / sb.fps;
  Object.assign(measured, { width: p.width, height: p.height, fps: Number(p.fps.toFixed(3)), duration: Number(p.duration.toFixed(3)), vcodec: p.vcodec, acodec: p.acodec ?? "none" });
  add("resolution", p.width === sb.width && p.height === sb.height, `${p.width}×${p.height} (expected ${sb.width}×${sb.height})`);
  add("aspect-9x16", Math.abs(p.width / p.height - 9 / 16) < 0.001, `${(p.width / p.height).toFixed(4)}`);
  add("fps", Math.abs(p.fps - sb.fps) < 0.01, `${p.fps} fps`);
  add("duration", Math.abs(p.duration - expected) <= 0.1, `${p.duration.toFixed(3)} s (storyboard ${expected.toFixed(3)} s)`);
  add("codec-h264", p.vcodec === "h264" && p.pixfmt === "yuv420p", `${p.vcodec} ${p.pixfmt}`);
  add("audio-aac", p.acodec === "aac" && p.sampleRate === 48000, `${p.acodec ?? "no audio"} ${p.sampleRate ?? ""} Hz ${p.channels ?? ""}ch`);

  // complete render: decode every frame and count them
  const frames = parseInt(run("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", file]).stdout, 10);
  measured.frames = frames;
  add("render-complete", Math.abs(frames - sb.durationInFrames) <= 1, `${frames} decoded frames (storyboard ${sb.durationInFrames})`);

  const det = run("ffmpeg", ["-hide_banner", "-nostats", "-i", file,
    "-vf", "blackdetect=d=0.25:pix_th=0.06,freezedetect=n=0.0005:d=1.5",
    "-af", "silencedetect=n=-45dB:d=0.6,volumedetect,ebur128=peak=true", "-f", "null", "-"]).stderr;
  const black = parseSpans(det, "black");
  add("no-black-gaps", black.length === 0, black.length ? `black at ${black.map(([a, b]) => `${a.toFixed(2)}–${b.toFixed(2)}s`).join(", ")}` : "none ≥0.25 s");
  const freeze = parseSpans(det, "freeze");
  add("no-frozen-picture", freeze.length === 0 ? true : "warn", freeze.length ? `still picture at ${freeze.map(([a, b]) => `${a.toFixed(2)}–${Math.min(b, p.duration).toFixed(2)}s`).join(", ")}` : "no still stretch ≥1.5 s");
  // a short fade-out tail is intended; anything else silent is not
  const silence = parseSpans(det, "silence").filter(([a]) => a < p.duration - 0.8);
  add("no-unintended-silence", silence.length === 0, silence.length ? `silence at ${silence.map(([a, b]) => `${a.toFixed(2)}–${Math.min(b, p.duration).toFixed(2)}s`).join(", ")}` : "none ≥0.6 s below -45 dB");

  const maxVol = Number(det.match(/max_volume: (-?[\d.]+) dB/)?.[1] ?? NaN);
  const truePeak = Number(det.match(/True peak:\s+Peak:\s+(-?[\d.]+) dBFS/)?.[1] ?? NaN);
  const lufs = Number(det.match(/Integrated loudness:\s+I:\s+(-?[\d.]+) LUFS/)?.[1] ?? NaN);
  Object.assign(measured, { maxVolumeDb: maxVol, truePeakDbfs: truePeak, integratedLufs: lufs });
  add("no-clipping", truePeak <= -0.5, `true peak ${truePeak} dBFS, sample peak ${maxVol} dB`);
  add("loudness", Math.abs(lufs - settings(sb.engine).audio.targetLufs) <= 2 ? true : "warn", `${lufs} LUFS integrated (target ${settings(sb.engine).audio.targetLufs} ±2)`);

  const c = sb.brand.colors;
  const ratio = contrast(c.text, c.background);
  measured.textContrast = Number(ratio.toFixed(2));
  add("text-contrast", ratio >= 4.5 ? true : "warn", `text on background ${ratio.toFixed(2)}:1 (WCAG AA ≥ 4.5)`);
  const btn = contrast(c.background, c.primary);
  add("cta-contrast", btn >= 4.5 ? true : "warn", `CTA ink on primary ${btn.toFixed(2)}:1`);

  const humanReview = [
    "Arabic text: letters joined, no broken shaping, no clipped diacritics (check the contact sheet).",
    "Product is clearly visible and recognisable in the reveal and the CTA.",
    "No text leaves the safe area on a real phone (platform UI overlays differ by app).",
    "Hook reads in the first second; CTA is clear; music suits the brand.",
    "Every on-screen claim matches what the client stated (see storyboard scene.source).",
  ];
  return { file, checks, measured, humanReview, passed: checks.every((x) => x.status !== "fail") };
}

export function qcMarkdown(r: QcReport): string {
  const icon = { pass: "✅", fail: "❌", warn: "⚠️" } as const;
  return [
    `# Quality report`, ``, `File: \`${r.file}\``, ``, `**Automated result: ${r.passed ? "PASS" : "FAIL"}**`, ``,
    `| Check | Result | Detail |`, `|---|---|---|`,
    ...r.checks.map((c) => `| ${c.id} | ${icon[c.status]} ${c.status} | ${c.detail} |`), ``,
    `## Needs human review (not judged by the machine)`, ...r.humanReview.map((h) => `- [ ] ${h}`), ``,
  ].join("\n");
}
