// Product intake: read a brief file, validate it, and check every asset it points to before any work starts.
import fs from "node:fs";
import path from "node:path";
import type { Brief } from "../core/schema.ts";
import { BriefError, parseBrief } from "./parseBrief.ts";

export { BriefError, parseBrief };
export const MAX_ASSET_BYTES = 15 * 1024 * 1024;

/** Problems with the files a brief references (missing, too big, wrong content, unsafe SVG). */
export function checkAssets(brief: Brief, briefDir: string): string[] {
  const files = [...brief.product.images, ...(brief.brand.logo ? [brief.brand.logo] : [])];
  const issues: string[] = [];
  for (const rel of files) {
    const abs = path.resolve(briefDir, rel);
    if (!abs.startsWith(path.resolve(briefDir) + path.sep)) { issues.push(`${rel}: outside the brief folder`); continue; }
    if (!fs.existsSync(abs)) { issues.push(`${rel}: file not found`); continue; }
    if (!fs.realpathSync(abs).startsWith(fs.realpathSync(briefDir) + path.sep) || !fs.statSync(abs).isFile()) { issues.push(`${rel}: outside the brief folder or not a file`); continue; }
    const size = fs.statSync(abs).size;
    if (size === 0) issues.push(`${rel}: empty file`);
    if (size > MAX_ASSET_BYTES) issues.push(`${rel}: ${(size / 1e6).toFixed(1)} MB is over the 15 MB limit`);
    const head = fs.readFileSync(abs).subarray(0, 512);
    const ext = path.extname(rel).toLowerCase();
    const ok =
      ext === ".png" ? head.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])) :
      ext === ".jpg" || ext === ".jpeg" ? head[0] === 0xff && head[1] === 0xd8 :
      ext === ".webp" ? head.subarray(8, 12).toString() === "WEBP" :
      ext === ".svg" ? /<svg[\s>]/i.test(head.toString("utf8")) || /<svg[\s>]/i.test(fs.readFileSync(abs, "utf8")) : false;
    if (!ok) issues.push(`${rel}: content does not match its ${ext} extension`);
    if (ext === ".svg" && /<script|on\w+\s*=|javascript:|<foreignObject|<!ENTITY|<!DOCTYPE|(?:href\s*=\s*["']\s*(?!#)|url\(\s*["']?\s*(?!#))[a-z:/]/i.test(fs.readFileSync(abs, "utf8"))) issues.push(`${rel}: SVG contains scripts, external references or event handlers`);
  }
  if (brief.voiceover.mode === "file" && brief.voiceover.file) {
    const abs = path.resolve(briefDir, brief.voiceover.file);
    if (!abs.startsWith(path.resolve(briefDir) + path.sep)) issues.push(`${brief.voiceover.file}: outside the brief folder`);
    else if (!fs.existsSync(abs)) issues.push(`${brief.voiceover.file}: voice-over file not found`);
    else if (!fs.statSync(abs).isFile() || !fs.realpathSync(abs).startsWith(fs.realpathSync(briefDir) + path.sep)) issues.push(`${brief.voiceover.file}: outside the brief folder or not a file`);
  }
  return issues;
}

export function loadBrief(file: string): { brief: Brief; dir: string } {
  let json: unknown;
  try { json = JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (e) { throw new BriefError([`cannot read ${file}: ${(e as Error).message}`]); }
  const brief = parseBrief(json);
  const dir = path.dirname(path.resolve(file));
  const issues = checkAssets(brief, dir);
  if (issues.length) throw new BriefError(issues);
  return { brief, dir };
}
