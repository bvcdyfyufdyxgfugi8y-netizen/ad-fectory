// Local, deterministic, licence-free audio: a short commercial music bed and the SFX the storyboard cues.
// Everything is synthesised from a seed, so the same storyboard always yields the same bytes (cacheable) and
// there are no third-party rights to clear. Quality goal: a clean, punchy placeholder bed, not a produced track.
import type { Storyboard } from "../core/schema.ts";
import { settings } from "../engine/config.ts";
import { SR } from "./wav.ts";

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => ((s = Math.imul(s ^ (s >>> 15), 0x2c1b3c6d) ^ Math.imul(s ^ (s >>> 7), 0x297a2d39)), ((s >>> 0) % 1e6) / 1e6) * 2 - 1;
}
const midi = (n: number) => 440 * 2 ** ((n - 69) / 12);

/** Add a mono signal into a stereo pair at `at` samples with gain and pan (-1..1). */
function addInto(L: Float32Array, R: Float32Array, sig: Float32Array, at: number, gain: number, pan = 0) {
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4), gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < sig.length && at + i < L.length; i++) {
    if (at + i < 0) continue;
    L[at + i]! += sig[i]! * gl;
    R[at + i]! += sig[i]! * gr;
  }
}

export function sfx(name: Storyboard["audio"]["sfx"][number]["sound"], seed = 7): Float32Array {
  const r = rng(seed);
  const make = (sec: number, f: (t: number, i: number) => number) => {
    const out = new Float32Array(Math.round(sec * SR));
    for (let i = 0; i < out.length; i++) out[i] = f(i / SR, i);
    return out;
  };
  let lp = 0, lp2 = 0;
  switch (name) {
    case "whoosh": // band-limited noise whose brightness rises then falls: something passing the lens
      return make(0.42, (t) => {
        const p = t / 0.42, shape = Math.sin(Math.PI * p) ** 2;
        const a = Math.exp((-2 * Math.PI * (400 + 4200 * Math.sin(Math.PI * p) ** 1.5)) / SR);
        lp = (1 - a) * r() + a * lp; lp2 = (1 - 0.92) * lp + 0.92 * lp2;
        return (lp - lp2) * shape * 3.2;
      });
    case "impact": // sub thump with a pitch drop + a short bright transient
      return make(0.7, (t) => Math.sin(2 * Math.PI * (62 * t - 34 * t * t)) * Math.exp(-t * 7) + r() * Math.exp(-t * 80) * 0.35);
    case "pop":
      return make(0.12, (t) => Math.sin(2 * Math.PI * (900 - 2600 * t) * t) * Math.exp(-t * 38));
    case "tick":
      return make(0.06, (t) => Math.sin(2 * Math.PI * 2400 * t) * Math.exp(-t * 120));
    case "riser": // noise + tone rising over one second into the CTA
      return make(1.0, (t) => {
        const a = Math.exp((-2 * Math.PI * (300 + 6000 * t * t)) / SR); lp = (1 - a) * r() + a * lp;
        return (lp * 1.6 + Math.sin(2 * Math.PI * (220 + 440 * t * t) * t) * 0.25) * t * t;
      });
  }
}

/**
 * Music bed in A minor at the storyboard's BPM: Am–F–C–G, four-on-the-floor kick, off-beat hats, a side-chained
 * bass and a soft pad. The last scene gets a final hit and the bed fades out with the picture.
 */
export function musicBed(sb: Storyboard): [Float32Array, Float32Array] {
  const seconds = sb.durationInFrames / sb.fps;
  const n = Math.round(seconds * SR);
  const L = new Float32Array(n), R = new Float32Array(n);
  const beat = 60 / sb.bpm, bs = Math.round(beat * SR);
  const r = rng(sb.audio.musicSeed + 11);
  const chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]; // Am F C G
  const beats = Math.ceil(seconds / beat);

  const kick = new Float32Array(Math.round(0.35 * SR)).map((_, i) => { const t = i / SR; return Math.sin(2 * Math.PI * (50 * t + 70 * (1 - Math.exp(-t * 30)) / 30)) * Math.exp(-t * 9); });
  const hat = new Float32Array(Math.round(0.05 * SR)).map((_, i) => r() * Math.exp(-(i / SR) * 90));
  const clap = new Float32Array(Math.round(0.18 * SR)).map((_, i) => { const t = i / SR; return r() * (Math.exp(-t * 30) + 0.6 * Math.exp(-Math.abs(t - 0.012) * 400)); });

  // side-chain envelope: everything melodic ducks under the kick
  const duck = new Float32Array(n).fill(1);
  for (let b = 0; b < beats; b++) for (let i = 0; i < bs && b * bs + i < n; i++) duck[b * bs + i] = 0.35 + 0.65 * Math.min(1, i / (0.22 * SR));

  for (let b = 0; b < beats; b++) {
    const at = b * bs;
    const bar = Math.floor(b / 4), chord = chords[bar % 4]!;
    const intro = b < 2; // first beat pair: pad + hats only, so the hook's first word lands on a fuller drop
    if (!intro) addInto(L, R, kick, at, 0.9);
    if (!intro && b % 2 === 1) addInto(L, R, clap, at, 0.22, 0.1);
    addInto(L, R, hat, at + Math.round(bs / 2), 0.16, b % 2 ? 0.35 : -0.35);
    // bass: root on the off-eighths
    const root = midi(chord[0]! - 24);
    const bass = new Float32Array(Math.round(bs / 2)).map((_, i) => { const t = i / SR; return (Math.sin(2 * Math.PI * root * t) + 0.3 * Math.sin(4 * Math.PI * root * t)) * Math.min(1, t * 200) * Math.exp(-t * 3); });
    if (!intro) { addInto(L, R, bass, at, 0.32); addInto(L, R, bass, at + Math.round(bs / 2), 0.28); }
  }
  // pad: detuned triangle-ish voices per bar, low-passed, under the side-chain
  const padL = new Float32Array(n), padR = new Float32Array(n);
  let lpL = 0, lpR = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, chord = chords[Math.floor(t / (4 * beat)) % 4]!;
    let vl = 0, vr = 0;
    for (const note of chord) {
      const f = midi(note);
      vl += Math.asin(Math.sin(2 * Math.PI * f * 0.997 * t)) / 1.57;
      vr += Math.asin(Math.sin(2 * Math.PI * f * 1.003 * t)) / 1.57;
    }
    const a = 0.9;
    lpL = (1 - a) * vl + a * lpL; lpR = (1 - a) * vr + a * lpR;
    padL[i] = lpL * 0.09 * duck[i]!; padR[i] = lpR * 0.09 * duck[i]!;
  }
  for (let i = 0; i < n; i++) { L[i]! += padL[i]!; R[i]! += padR[i]!; }

  const cfg = settings(sb.engine).audio;
  if (cfg.musicGainDb !== 0) {
    const gain = 10 ** (cfg.musicGainDb / 20);
    for (let i = 0; i < n; i++) { L[i]! *= gain; R[i]! *= gain; }
  }

  // cued SFX, sample-accurate to the picture
  for (const cue of sb.audio.sfx) {
    const s = sfx(cue.sound, sb.audio.musicSeed + cue.frame);
    const g = 10 ** ((cue.gainDb + cfg.sfxGainDb) / 20);
    addInto(L, R, s, Math.round((cue.frame / sb.fps) * SR), g * 0.9);
  }
  return [L, R];
}
