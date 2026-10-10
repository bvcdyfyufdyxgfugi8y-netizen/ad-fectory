import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import type { Brief } from "../core/schema.ts";
import { checkAssets, BriefError } from "./loadBrief.ts";

/** Read image canvas proportions only; no material, physical dimensions or commercial claims inferred. */
export function assetAspect(brief: Brief, dir: string): number | undefined {
  const issues = checkAssets(brief, dir);
  if (issues.length) throw new BriefError(issues);
  const file = path.resolve(dir, brief.product.images[0]!);
  let width = 0, height = 0;
  if (file.toLowerCase().endsWith(".svg")) {
    const root = fs.readFileSync(file, "utf8").match(/<svg\b[^>]*>/i)?.[0] ?? "";
    const viewBox = root.match(/viewBox\s*=\s*["']([^"']+)["']/i)?.[1]?.trim().split(/[\s,]+/).map(Number);
    if (viewBox?.length === 4) { width = viewBox[2]!; height = viewBox[3]!; }
  } else if (file.toLowerCase().endsWith(".png")) {
    const bytes = fs.readFileSync(file);
    if (bytes.length >= 24 && bytes.subarray(12, 16).toString() === "IHDR") { width = bytes.readUInt32BE(16); height = bytes.readUInt32BE(20); }
  } else {
    const probe = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", file], { encoding: "utf8", timeout: 5000, maxBuffer: 65536 });
    if (!probe.error && probe.status === 0) {
      try { const stream = JSON.parse(probe.stdout).streams?.[0]; width = stream?.width ?? 0; height = stream?.height ?? 0; } catch { /* unknown metadata remains unknown */ }
    }
  }
  const ratio = width / height;
  return width > 0 && height > 0 && Number.isFinite(ratio) && ratio <= 100 ? ratio : undefined;
}
