// Audio engine (Phase 1): synthesised bed + SFX → fades → optional voice-over with ducking → loudness to -14 LUFS.
import fs from "node:fs";
import path from "node:path";
import type { Storyboard } from "../core/schema.ts";
import { settings } from "../engine/config.ts";
import { ROOT, hashTree, run, sha256 } from "../core/exec.ts";
import { musicBed } from "./synth.ts";
import { writeWav } from "./wav.ts";

export interface AudioResult { file: string; cacheKey: string; cached: boolean }

export function audioCacheKey(sb: Storyboard, briefDir: string): string {
  const vo = sb.audio.voiceover ? fs.readFileSync(path.resolve(briefDir, sb.audio.voiceover)) : "";
  return sha256(JSON.stringify(sb.audio), JSON.stringify(settings(sb.engine).audio), String(sb.durationInFrames), String(sb.fps), String(sb.bpm), hashTree(path.join(ROOT, "src/audio")), vo);
}

/**
 * The ffmpeg graph for the final mix. With a voice-over the bed is side-chain compressed by the voice
 * (ducking), then both are summed. Loudness targets social platforms: -14 LUFS integrated, -1.5 dBTP.
 */
export function mixFilter(seconds: number, withVoice: boolean, engine?: Storyboard["engine"]): string {
  const cfg = settings(engine).audio;
  const fades = `afade=t=in:d=0.04,afade=t=out:st=${(seconds - 0.5).toFixed(3)}:d=0.5`;
  const master = `loudnorm=I=${cfg.targetLufs}:TP=${cfg.truePeakDb}:LRA=11,aresample=48000,atrim=0:${seconds.toFixed(3)}`;
  if (!withVoice) return `[0:a]${fades},${master}[out]`;
  return [
    `[1:a]aresample=48000,apad,atrim=0:${seconds.toFixed(3)},asplit=2[vo][key]`,
    `[0:a][key]sidechaincompress=threshold=0.02:ratio=10:attack=15:release=350:makeup=1[bed]`,
    `[bed][vo]amix=inputs=2:normalize=0,${fades},${master}[out]`,
  ].join(";");
}

export function buildAudio(sb: Storyboard, briefDir: string, cacheDir: string): AudioResult {
  const cacheKey = audioCacheKey(sb, briefDir);
  const file = path.join(cacheDir, "audio", `${cacheKey}.wav`);
  if (fs.existsSync(file)) return { file, cacheKey, cached: true };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const bed = path.join(cacheDir, "audio", `${cacheKey}.bed.wav`);
  writeWav(bed, musicBed(sb));
  const seconds = sb.durationInFrames / sb.fps;
  const vo = sb.audio.voiceover ? path.resolve(briefDir, sb.audio.voiceover) : undefined;
  run("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "error", "-i", bed, ...(vo ? ["-i", vo] : []),
    "-filter_complex", mixFilter(seconds, Boolean(vo), sb.engine), "-map", "[out]", "-ac", "2", "-ar", "48000", "-c:a", "pcm_s16le", file,
  ]);
  fs.rmSync(bed);
  return { file, cacheKey, cached: false };
}
