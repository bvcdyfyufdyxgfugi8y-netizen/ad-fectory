import React from "react";
import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import type { Scene, Storyboard } from "../../../core/schema.ts";
import type { MotionPreset } from "../../../engine/config.ts";
import { useAssetUrl } from "../../assets.tsx";
import { KineticLine } from "../../components/Kinetic.tsx";
import { Backdrop } from "../../templates/bold-commercial/Scenes.tsx";
import { FONT, alpha } from "../../templates/bold-commercial/theme.ts";
import { posterStackState } from "./poster-stack.ts";

/** Optional experimental scene. Uses only brief-owned text/images and existing brand colors. */
export const PosterStackDepth: React.FC<{ scene: Scene; sb: Storyboard; preset: MotionPreset }> = ({ scene, sb, preset }) => {
  const frame = useCurrentFrame();
  const assetUrl = useAssetUrl();
  const colors = sb.brand.colors;
  return <AbsoluteFill>
    <Backdrop c={colors} tint={colors.secondary} sb={sb} seed={20} />
    {posterStackState(frame, scene.durationInFrames, preset).map(({ layer, opacity, x, y, rotation, scale }) => (
      <div key={layer} style={{ position: "absolute", left: 140, top: 300, width: 800, height: 1080,
        borderRadius: 40, boxSizing: "border-box", border: `3px solid ${colors.primary}`,
        background: layer === 0 ? colors.background : layer === 1 ? colors.secondary : colors.primary,
        boxShadow: `0 ${20 + layer * 8}px 40px ${alpha("#000000", 0.3)}`,
        opacity, transform: `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`,
        overflow: "hidden", color: colors.text, fontFamily: FONT, direction: sb.direction,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "36px 32px",
      }}>
        {layer === 0 && <>
          <div style={{ fontSize: 36, fontWeight: 700, textAlign: "center" }}>{scene.sub || sb.brand.name}</div>
          {scene.image && <Img src={assetUrl(scene.image)} style={{ height: 650, maxWidth: "100%", objectFit: "contain", filter: "drop-shadow(0 20px 18px rgba(0,0,0,.35))" }} />}
          <KineticLine text={scene.headline} size={scene.kind === "reveal" ? 68 : 62} color={colors.text} delay={12} stagger={3} dir={sb.direction} emphasis={scene.emphasis} />
        </>}
      </div>
    ))}
  </AbsoluteFill>;
};
