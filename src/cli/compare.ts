// Full decoded streams, not a few stills. Hash rows preserve each frame's timing and pixel content.
import fs from "node:fs";
import path from "node:path";
import { run } from "../core/exec.ts";
import { probe } from "../qc/qc.ts";
function decoded(file: string, stream: "video" | "audio") {
  const args = stream === "video" ? ["-map", "0:v:0", "-f", "framemd5"] : ["-map", "0:a:0", "-c:a", "pcm_s16le", "-f", "hash", "-hash", "sha256"];
  return run("ffmpeg", ["-v", "error", "-i", file, ...args, "-"]).stdout.split("\n").filter(line => line && !line.startsWith("#"));
}
export function compareOutputs(before: string, after: string) {
  const a = decoded(before, "video"), b = decoded(after, "video");
  const differentFrames = Math.max(a.length, b.length) - a.filter((row, i) => row === b[i]).length;
  const audioEqual = JSON.stringify(decoded(before, "audio")) === JSON.stringify(decoded(after, "audio"));
  return { before, after, beforeMetadata: probe(before), afterMetadata: probe(after), comparedFrames: a.length, afterFrames: b.length, differentFrames, decodedVideoEqual: differentFrames === 0, decodedAudioEqual: audioEqual, exactDecodedEquivalence: differentFrames === 0 && audioEqual };
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const [before, after, output] = process.argv.slice(2);
  if (!before || !after) throw new Error("Usage: compare.ts before.mp4 after.mp4 [report.json]");
  const report = compareOutputs(before, after);
  if (output) { fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, JSON.stringify(report, null, 2)); }
  console.log(JSON.stringify(report, null, 2));
  if (!report.exactDecodedEquivalence) process.exitCode = 1;
}
