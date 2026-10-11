import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene, Storyboard } from "../../../core/schema.ts";
import { settings, ToonMotionSchema } from "../../../engine/config.ts";
import { storyboardTimeline } from "../../../engine/timeline.ts";
import { AssetBase, useAssetUrl } from "../../assets.tsx";
import { clamp, floatOffset, kineticSpring, parallax, progress, transitionStyle } from "../../motion/primitives.ts";

import { toonStage } from "../../motion/toon-stage.ts";

// Drawn highlights, offset silhouettes and planar transforms suggest volume without a 3D camera.
const Decorations: React.FC<{ sb: Storyboard }> = ({ sb }) => {
  const frame = useCurrentFrame();
  const c = sb.brand.colors;
  const rows = storyboardTimeline(sb);
  const cfg = settings(sb.engine);
  const stage = cfg.animation.toon ? toonStage(frame, sb.durationInFrames, rows[1]!.cut, rows.at(-1)!.cut, sb.fps * 60 / sb.bpm, cfg.animation.toon) : undefined;
  const a = settings(sb.engine).animation;
  return <AbsoluteFill style={{ overflow: "hidden" }}>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", transform: stage ? `translateY(${(1 - stage.burst) * 450}px)` : undefined }}>
      {stage && <circle cx="550" cy="980" r={430 * (0.15 + stage.burst * 0.85)} fill={c.secondary} stroke={c.text} strokeWidth="5" />}
      <path d="M-90 1720 Q180 1300 360 850 Q500 480 750 540 Q1060 640 1190 1040 L1190 2000 L-90 2000Z" fill={c.secondary} />
      <path d="M-60 1820 Q450 1480 860 1050 Q1090 930 1200 1120 L1200 2000 L-60 2000Z" fill={c.primary} />
    </svg>
    {Array.from({ length: 9 }, (_, i) => {
      const x = i % 2 ? 810 + (i % 3) * 45 : 40 + (i % 3) * 55;
      const y = ((parallax(frame, 360 + i * 177, -(0.6 + i * 0.1)) + 1920) % 1920);
      const r = 32 + i % 3 * 12;
      return <svg key={i} width={r * 2 + 16} height={r * 2 + 16} style={{ position: "absolute", left: x + floatOffset(frame + i * 7, a.floatAmplitude, a.floatPeriod), top: y }}>
        <circle cx={r + 10} cy={r + 10} r={r} fill={c.primary} opacity={0.28} />
        <circle cx={r + 5} cy={r + 5} r={r} fill={c.secondary} stroke={c.text} strokeWidth={4} />
        <path d={`M${r * 0.55} ${r * 0.9} Q${r * 0.55} ${r * 0.45} ${r * 1.1} ${r * 0.4}`} stroke="white" strokeWidth={7} strokeLinecap="round" fill="none" />
      </svg>;
    })}
    {stage && <div style={{ position: "absolute", width: 1800, height: 1000, borderRadius: "50%", background: c.accent, left: -350, top: 1800 - Math.sin(stage.wave * Math.PI) * 1200, transform: "rotate(-14deg)", border: `8px solid ${c.text}`, opacity: Math.sin(stage.wave * Math.PI) }} />}
    {[0, 1, 2].map(i => <svg key={i} width={85} height={85} viewBox="0 0 100 100" style={{ position: "absolute", left: i % 2 ? 870 : 125, top: 560 + i * 360, transform: `rotate(${floatOffset(frame + i * 20, 12, a.floatPeriod)}deg)` }}>
      <path d="M50 3 L62 38 L97 50 L62 62 L50 97 L38 62 L3 50 L38 38Z" fill={c.accent} stroke={c.text} strokeWidth={3} />
    </svg>)}
  </AbsoluteFill>;
};

const CartoonScene: React.FC<{ scene: Scene; sb: Storyboard }> = ({ scene, sb }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cfg = settings(sb.engine);
  const url = useAssetUrl();
  const p = kineticSpring(frame, fps, cfg.animation.kineticSpring);
  const productP = kineticSpring(frame - 7, fps, cfg.animation.kineticSpring);
  const c = sb.brand.colors;
  const words = scene.headline.split(/\s+/);
  const size = Math.min(cfg.layout.type[scene.kind === "problem" ? "hook" : scene.kind], words.join(" ").length > 18 ? 92 : 112);
  const productHeight = scene.kind === "reveal" ? cfg.layout.product.reveal : scene.kind === "benefit" ? cfg.layout.product.benefit : cfg.layout.product.cta;
  const tilt = scene.kind === "hook" ? -6 : scene.kind === "benefit" ? 7 : -3;
  const movement = scene.motion === "slide-card" ? `translateX(${(1 - productP) * -420}px)` : `translateY(${(1 - productP) * 540}px)`;
  const pulse = scene.motion === "pulse" ? 1 + Math.sin(frame / (fps / 2)) * 0.012 : 1;
  const camera = scene.camera;
  const cameraP = camera ? progress(frame, camera.startFrame, camera.endFrame, camera.easing) : 0;
  const cv = (key: "x" | "y" | "scale" | "rotateZ") => camera ? interpolate(cameraP, [0, 1], [camera.from[key], camera.to[key]]) : key === "scale" ? 1 : 0;
  return <AbsoluteFill style={{ ...transitionStyle(frame, cfg.animation.transitionFrames, scene.transition, sb.direction), overflow: "hidden" }}>
    <AbsoluteFill style={{ transform: `translate(${cv("x")}px, ${cv("y")}px) scale(${cv("scale")}) rotate(${cv("rotateZ")}deg)` }}>
      <div dir={sb.direction} style={{ position: "absolute", top: cfg.layout.safe.top, left: cfg.layout.safe.side, right: cfg.layout.safe.side, textAlign: "center", opacity: 1 - progress(frame, scene.durationInFrames - cfg.animation.transitionFrames * 2, scene.durationInFrames - cfg.animation.transitionFrames), color: c.text, fontFamily: "Alexandria Variable", fontWeight: 800, fontSize: size, lineHeight: 1.4 }}>
        {words.map((word, i) => {
          const k = kineticSpring(frame - i * 3, fps, cfg.animation.kineticSpring);
          return <span key={i} style={{ display: "inline-block", margin: "0 9px", opacity: interpolate(frame - i * 3, [0, 8], [0, 1], clamp), transform: `translateY(${(1 - k) * 65}px) scale(${0.85 + k * 0.15})`, textShadow: `4px 5px 0 ${c.secondary}` }}>{word}</span>;
        })}
        {scene.sub && <div style={{ fontWeight: 600, fontSize: 42, marginTop: 24, opacity: progress(frame, 12, 24) }}>{scene.sub}</div>}
      </div>
      {!cfg.animation.toon && scene.image && <div style={{ position: "absolute", left: "50%", top: 575, height: productHeight, width: 750, marginLeft: -375, transform: `${movement} rotate(${tilt + floatOffset(frame, cfg.animation.floatAmplitude * 0.15, cfg.animation.floatPeriod)}deg) scale(${(0.9 + productP * 0.1) * pulse})`, opacity: progress(frame, 7, 15), clipPath: scene.motion === "mask-reveal" ? `inset(${(1 - Math.min(1, productP)) * 100}% 0 0 0)` : undefined }}>
        <Img src={url(scene.image)} style={{ width: "100%", height: "100%", objectFit: "contain", filter: `drop-shadow(16px 18px 0 ${c.text}33)` }} />
      </div>}
      {!cfg.animation.toon && <div style={{ position: "absolute", left: "50%", top: 575 + productHeight + 28, width: 340, height: 30, marginLeft: -170, borderRadius: "50%", background: c.text, opacity: 0.12 * Math.min(1, p), transform: `scaleX(${0.8 + p * 0.2})` }} />}
    </AbsoluteFill>
  </AbsoluteFill>;
};


const ContinuousProduct: React.FC<{ sb: Storyboard }> = ({ sb }) => {
  const frame = useCurrentFrame();
  const url = useAssetUrl();
  const cfg = settings(sb.engine);
  const options = cfg.animation.toon ?? ToonMotionSchema.parse({});
  const rows = storyboardTimeline(sb);
  const stage = toonStage(frame, sb.durationInFrames, rows[1]!.cut, rows.at(-1)!.cut, sb.fps * 60 / sb.bpm, options);
  // Preserve target asset ownership; swapping scene artwork uses the authored cut, never a reference asset.
  const active = [...rows].reverse().find(row => frame >= row.cut && row.scene.image);
  const asset = active?.scene.image ?? sb.scenes.find(scene => scene.image)?.image;
  const c = sb.brand.colors;
  if (!asset) return null;
  const height = cfg.layout.product.reveal;
  const orbitBubbles = Array.from({ length: 5 }, (_, i) => {
    const angle = stage.orbit + i * Math.PI * 2 / 5;
    const depth = Math.sin(angle);
    const x = 540 + stage.x + Math.cos(angle) * (290 + stage.burst * 50);
    const y = 1080 + Math.sin(angle) * 180;
    const size = 58 + (depth + 1) * 20;
    return <svg key={i} width={size + 10} height={size + 10} style={{ position: "absolute", left: x - size / 2, top: y - size / 2, zIndex: depth > 0 ? 3 : 0, opacity: progress(frame, rows[1]!.cut - 15, rows[1]!.cut + 15) * options.burstIntensity }}>
      <circle cx={size / 2 + 6} cy={size / 2 + 7} r={size / 2 - 4} fill={c.text} opacity={0.2} />
      <circle cx={size / 2} cy={size / 2} r={size / 2 - 4} fill={c.secondary} stroke={c.text} strokeWidth={4} />
      <path d={`M${size * 0.26} ${size * 0.42} Q${size * 0.3} ${size * 0.2} ${size * 0.52} ${size * 0.22}`} fill="none" stroke="white" strokeWidth={6} strokeLinecap="round" />
    </svg>;
  });
  return <AbsoluteFill style={{ pointerEvents: "none" }}>
    {orbitBubbles}
    <div style={{ position: "absolute", zIndex: 1, left: "50%", top: 560, width: 750, height, marginLeft: -375, transform: `translate(${stage.x}px, ${stage.y}px) rotate(${stage.rotation}deg) scale(${stage.scale})` }}>
      {stage.pieces.map(piece => <div key={piece.index} style={{ position: "absolute", inset: 0, opacity: piece.opacity, transform: `translate(${piece.x}px, ${piece.y}px) rotate(${piece.rotation}deg)` }}>
        <Img src={url(asset)} style={{ width: "100%", height: "100%", objectFit: "contain", clipPath: `inset(${piece.index * 25}% 0 ${(3 - piece.index) * 25}% 0)` }} />
      </div>)}
    </div>
    <div style={{ position: "absolute", top: 560 + height + 70, left: 350 + stage.x, width: 380, height: 28, background: c.text, opacity: 0.12 * stage.pieces[3]!.opacity, borderRadius: "50%", transform: `scaleX(${stage.scale})` }} />
  </AbsoluteFill>;
};

export const ToonCommercial: React.FC<{ storyboard: Storyboard; assetBase?: string }> = ({ storyboard: sb, assetBase = "" }) => (
  <AssetBase.Provider value={assetBase}><AbsoluteFill style={{ background: sb.brand.colors.background }}>
    <Decorations sb={sb} />
    {settings(sb.engine).animation.toon && <ContinuousProduct sb={sb} />}
    {storyboardTimeline(sb).map(({ scene, from, duration }) => <Sequence key={scene.id} from={from} durationInFrames={duration} premountFor={sb.fps} name={scene.id}>
      <CartoonScene scene={{ ...scene, durationInFrames: duration }} sb={sb} />
    </Sequence>)}
  </AbsoluteFill></AssetBase.Provider>
);
