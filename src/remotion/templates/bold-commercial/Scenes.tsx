// The five scene types of the Bold Commercial template. Every motion here has a job:
// the hook grabs (words punch in), the reveal shows the product (mask + rise), benefits read one at a time
// (card slides toward the product), the price lands (stamp), the CTA asks (pulse on the beat).
import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { useAssetUrl } from "../../assets.tsx";
import type { Scene, Storyboard } from "../../../core/schema.ts";
import { KineticLine } from "../../components/Kinetic.tsx";
import { useMotionSettings } from "../../motion/context.tsx";
import { zoom, parallax, floatOffset, easings } from "../../motion/primitives.ts";
import { COPY } from "../../../creative/copy.ts";
import { FONT, alpha, clamp } from "./theme.ts";

type Props = { scene: Scene; sb: Storyboard; index: number };
type Colors = Storyboard["brand"]["colors"];

const Emphasized: React.FC<{ scene: Scene }> = ({ scene }) => scene.emphasis.length ? <>{scene.headline.split(/[ \t\n]+/).filter(Boolean).map((word, i) => <React.Fragment key={i}>{i > 0 ? " " : ""}<span style={scene.emphasis.includes(i) ? { textDecoration: "underline", textUnderlineOffset: "0.15em", textDecorationThickness: "0.06em", fontWeight: 900 } : undefined}>{word}</span></React.Fragment>)}</> : <>{scene.headline}</>;

const framesPerBeat = (sb: Storyboard) => Math.round((sb.fps * 60) / sb.bpm);

/** Living background: two slow light blobs, a beat pulse, a fine grain. Opaque, so wipes reveal cleanly. */
export const Backdrop: React.FC<{ c: Colors; tint: string; sb: Storyboard; seed: number }> = ({ c, tint, sb, seed }) => {
  const frame = useCurrentFrame();
  const fpb = framesPerBeat(sb);
  const beat = Math.exp(-((frame % fpb) / fpb) * 5);         // 1 on the beat, decays before the next
  const a = frame / 90 + seed;
  return (
    <AbsoluteFill style={{ background: c.background, overflow: "hidden" }}>
      <div style={{
        position: "absolute", width: 1500, height: 1500, borderRadius: "50%",
        left: -210 + Math.sin(a) * 120, top: 160 + Math.cos(a * 0.8) * 140,
        background: `radial-gradient(circle, ${alpha(tint, 0.55)} 0%, ${alpha(tint, 0)} 62%)`,
        transform: `scale(${1 + beat * 0.035})`,
      }} />
      <div style={{
        position: "absolute", width: 1100, height: 1100, borderRadius: "50%",
        left: 300 + Math.cos(a * 1.3) * 160, top: 1000 + Math.sin(a) * 120,
        background: `radial-gradient(circle, ${alpha(c.secondary, 0.6)} 0%, ${alpha(c.secondary, 0)} 65%)`,
      }} />
      <AbsoluteFill style={{
        opacity: 0.08, mixBlendMode: "overlay",
        backgroundImage: "repeating-linear-gradient(0deg, #fff 0 1px, transparent 1px 3px)",
        transform: `translateY(${(frame * 7) % 3}px)`,
      }} />
    </AbsoluteFill>
  );
};

const Safe: React.FC<{ children: React.ReactNode; justify?: React.CSSProperties["justifyContent"]; dir: string }> = ({ children, justify = "center", dir }) => {
  const safe = useMotionSettings().layout.safe;
  return (
  <AbsoluteFill style={{
    padding: `${safe.top}px ${safe.side}px ${safe.bottom}px`, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: justify, textAlign: "center", fontFamily: FONT, direction: dir as "rtl" | "ltr",
  }}>{children}</AbsoluteFill>
);
};

/** Product image with a soft floor shadow and a light sweep. */
const Product: React.FC<{ src: string; height: number; enter: number; sweepAt?: number; float?: boolean }> = ({ src, height, enter, sweepAt = 0, float = true }) => {
  const assetUrl = useAssetUrl();
  const frame = useCurrentFrame();
  const y = interpolate(enter, [0, 1], [500, 0]);
  const rot = interpolate(enter, [0, 1], [-14, 0]);
  const animation = useMotionSettings().animation;
  const bob = float ? floatOffset(frame, animation.floatAmplitude, animation.floatPeriod) : 0;
  const sweep = interpolate(frame - sweepAt, [0, 22], [-60, 160], clamp);
  return (
    <div style={{ position: "relative", height, transform: `translateY(${y + bob}px) rotate(${rot}deg)`, opacity: interpolate(enter, [0, 0.2], [0, 1], clamp) }}>
      <Img src={assetUrl(src)} style={{ height, display: "block", filter: "drop-shadow(0 40px 50px rgba(0,0,0,.45))" }} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "overlay",
        WebkitMaskImage: `url(${assetUrl(src)})`, WebkitMaskSize: "contain", WebkitMaskRepeat: "no-repeat", WebkitMaskPosition: "center",
        background: `linear-gradient(105deg, transparent ${sweep - 18}%, rgba(255,255,255,.9) ${sweep}%, transparent ${sweep + 18}%)`,
      }} />
    </div>
  );
};

export const HookScene: React.FC<Props> = ({ scene, sb }) => {
  const frame = useCurrentFrame();
  const c = sb.brand.colors;
  const layout = useMotionSettings().layout;
  const push = zoom(frame, scene.durationInFrames);
  return (
    <AbsoluteFill>
      <Backdrop c={c} tint={c.primary} sb={sb} seed={0} />
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        <Safe dir={sb.direction}>
          <KineticLine text={scene.headline} size={layout.type.hook} color={c.text} delay={3} stagger={4} dir={sb.direction}
            emphasis={scene.emphasis} highlight={{ color: c.primary, ink: c.background, word: -1 }} />
        </Safe>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const RevealScene: React.FC<Props> = ({ scene, sb }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = sb.brand.colors;
  const layout = useMotionSettings().layout;
  const iris = interpolate(frame, [0, 14], [0, 1500], { ...clamp, easing: easings["cubic-out"] });
  const enter = spring({ frame: frame - 6, fps, config: { damping: 13, stiffness: 90 } });
  const ring = frame / 3;
  return (
    <AbsoluteFill>
      <Backdrop c={c} tint={c.secondary} sb={sb} seed={2} />
      <AbsoluteFill style={{ clipPath: `circle(${iris}px at 50% 46%)`, background: `radial-gradient(circle at 50% 42%, ${alpha(c.primary, 0.95)}, ${c.secondary} 70%)` }} />
      {/* parallax rings: far layer moves slower than the product */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `translateY(${parallax(frame, -80, -0.6)}px)` }}>
        {[620, 820].map((d, i) => (
          <div key={d} style={{ position: "absolute", width: d, height: d, borderRadius: "50%", border: `3px solid ${alpha(c.text, 0.25 - i * 0.1)}`, transform: `rotate(${ring * (i ? -1 : 1)}deg) scale(${enter})` }} />
        ))}
      </AbsoluteFill>
      <Safe justify="space-between" dir={sb.direction}>
        <div style={{
          fontSize: 44, fontWeight: 700, color: c.background, background: c.text, borderRadius: 999, padding: "10px 34px",
          opacity: interpolate(frame, [10, 18], [0, 1], clamp), transform: `translateY(${interpolate(frame, [10, 18], [-30, 0], clamp)}px)`,
        }}>{scene.sub}</div>
        {scene.image && <Product src={scene.image} height={layout.product.reveal} enter={enter} sweepAt={22} />}
        <KineticLine text={scene.headline} size={layout.type.reveal} color={c.text} delay={16} stagger={4} dir={sb.direction} from="scale" emphasis={scene.emphasis} highlight={scene.emphasis.length ? { color: c.primary, ink: c.background, word: -1 } : undefined} />
      </Safe>
    </AbsoluteFill>
  );
};

export const BenefitScene: React.FC<Props> = ({ scene, sb, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = sb.brand.colors;
  const layout = useMotionSettings().layout;
  const side = index % 2 === 0 ? 1 : -1;
  const card = spring({ frame: frame - 4, fps, config: { damping: 15, stiffness: 120 } });
  const prod = spring({ frame, fps, config: { damping: 16, stiffness: 80 } });
  const line = interpolate(frame, [14, 30], [0, 1], { ...clamp, easing: easings["cubic-out"] });
  return (
    <AbsoluteFill>
      <Backdrop c={c} tint={index % 2 ? c.secondary : c.primary} sb={sb} seed={4 + index} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: layout.safe.top }}>
        <div style={{ transform: `translateX(${side * 150}px) scale(${interpolate(frame, [0, scene.durationInFrames], [1, 1.05])})` }}>
          {scene.image && <Product src={scene.image} height={layout.product.benefit} enter={prod} sweepAt={10} />}
        </div>
      </AbsoluteFill>
      <Safe justify="flex-end" dir={sb.direction}>
        <div style={{
          width: "100%", background: alpha(c.background, 0.82), border: `2px solid ${alpha(c.primary, 0.6)}`, borderRadius: 44,
          padding: "40px 46px", backdropFilter: "blur(14px)",
          transform: `translateX(${interpolate(card, [0, 1], [-side * 900, 0])}px) rotate(${interpolate(card, [0, 1], [-side * 4, 0])}deg)`,
          boxShadow: "0 30px 60px rgba(0,0,0,.35)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 22, justifyContent: "center", marginBottom: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: 32, background: c.primary, color: c.background, fontSize: 40, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${spring({ frame: frame - 12, fps, config: { damping: 9 } })})` }}>✓</div>
            <div style={{ fontSize: 40, fontWeight: 700, color: c.primary, letterSpacing: 2 }}>{scene.sub}</div>
          </div>
          <KineticLine text={scene.headline} size={layout.type.benefit} color={c.text} delay={8} stagger={3} dir={sb.direction} emphasis={scene.emphasis} highlight={scene.emphasis.length ? { color: c.primary, ink: c.background, word: -1 } : undefined} />
          <div style={{ height: 8, borderRadius: 4, background: c.primary, marginTop: 22, transform: `scaleX(${line})`, transformOrigin: "center" }} />
        </div>
      </Safe>
    </AbsoluteFill>
  );
};

export const OfferScene: React.FC<Props> = ({ scene, sb }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = sb.brand.colors;
  const layout = useMotionSettings().layout;
  const stamp = spring({ frame: frame - 6, fps, config: { damping: 10, stiffness: 160, mass: 0.9 } });
  const shake = frame >= 8 && frame < 16 ? Math.sin(frame * 2.7) * (16 - frame) * 1.6 : 0;
  const strike = interpolate(frame, [22, 32], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ transform: `translate(${shake}px, ${shake * 0.6}px)` }}>
      <Backdrop c={c} tint={c.primary} sb={sb} seed={9} />
      {/* rotating sunburst behind the price */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{
          width: 1900, height: 1900, borderRadius: "50%", opacity: 0.22 * stamp,
          background: `repeating-conic-gradient(${c.primary} 0 7deg, transparent 7deg 18deg)`,
          transform: `rotate(${frame * 0.5}deg)`, WebkitMaskImage: "radial-gradient(circle, #000 20%, transparent 62%)",
        }} />
      </AbsoluteFill>
      <Safe dir={sb.direction}>
        <div style={{ fontSize: 46, fontWeight: 600, color: alpha(c.text, 0.8), marginBottom: 20, opacity: interpolate(frame, [0, 8], [0, 1], clamp) }}>{COPY[sb.language].priceLabel}</div>
        <div style={{
          fontSize: layout.type.offer, fontWeight: 900, color: c.background, background: c.primary, borderRadius: 48, padding: "0 60px",
          transform: `scale(${interpolate(stamp, [0, 1], [2.6, 1])}) rotate(${interpolate(stamp, [0, 1], [-10, -3])}deg)`,
          opacity: interpolate(stamp, [0, 0.15], [0, 1], clamp), boxShadow: `0 24px 0 ${alpha("#000000", 0.3)}`, lineHeight: 1.35,
        }}><Emphasized scene={scene} /></div>
        {scene.sub && (
          <div style={{ position: "relative", marginTop: 54, fontSize: 64, fontWeight: 700, color: c.text, opacity: interpolate(frame, [16, 24], [0, 1], clamp) }}>
            {scene.sub}
            {scene.source.includes("product.oldPrice") && (
              <div style={{ position: "absolute", left: "-4%", right: "-4%", top: "52%", height: 9, background: "#E5484D", borderRadius: 5, transform: `scaleX(${strike}) rotate(-4deg)` }} />
            )}
          </div>
        )}
      </Safe>
    </AbsoluteFill>
  );
};

export const CtaScene: React.FC<Props> = ({ scene, sb }) => {
  const assetUrl = useAssetUrl();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = sb.brand.colors;
  const layout = useMotionSettings().layout;
  const fpb = framesPerBeat(sb);
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const btn = spring({ frame: frame - 14, fps, config: { damping: 11, stiffness: 140 } });
  const pulse = frame > 24 ? 1 + 0.045 * Math.exp(-((frame % fpb) / fpb) * 6) : 1;
  const fadeOut = interpolate(frame, [scene.durationInFrames - 8, scene.durationInFrames], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      <Backdrop c={c} tint={c.primary} sb={sb} seed={13} />
      <Safe justify="space-between" dir={sb.direction}>
        <div style={{ display: "flex", alignItems: "center", gap: 26, opacity: enter, transform: `translateY(${interpolate(enter, [0, 1], [-60, 0])}px)` }}>
          {sb.brand.logo && <Img src={assetUrl(sb.brand.logo)} style={{ width: 120, height: 120 }} />}
          <div style={{ fontSize: 84, fontWeight: 800, color: c.text }}>{sb.brand.name}</div>
        </div>
        {scene.image && <Product src={scene.image} height={layout.product.cta} enter={enter} sweepAt={30} />}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
          <div style={{
            fontSize: layout.type.cta, fontWeight: 800, color: c.background, background: c.primary, borderRadius: 999, padding: "18px 70px 26px",
            transform: `scale(${btn * pulse})`, boxShadow: `0 0 0 ${interpolate(frame % fpb, [0, fpb], [0, 40])}px ${alpha(c.primary, interpolate(frame % fpb, [0, fpb], [0.45, 0]))}`,
          }}><Emphasized scene={scene} /></div>
          {scene.sub && <div style={{ fontSize: 46, fontWeight: 600, color: alpha(c.text, 0.85), direction: "ltr", opacity: interpolate(frame, [22, 30], [0, 1], clamp) }}>{scene.sub}</div>}
        </div>
      </Safe>
    </AbsoluteFill>
  );
};

export const SCENES: Record<Scene["kind"], React.FC<Props>> = {
  hook: HookScene,
  problem: HookScene,
  reveal: RevealScene,
  benefit: BenefitScene,
  offer: OfferScene,
  cta: CtaScene,
};
