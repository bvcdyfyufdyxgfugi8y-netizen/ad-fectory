import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import type { Scene, Storyboard } from "../../../core/schema.ts";
import { storyboardTimeline } from "../../../engine/timeline.ts";
import { settings } from "../../../engine/config.ts";
import { PosterStackDepth } from "../../motion/presets/PosterStackDepth.tsx";
import { SCENES } from "./Scenes.tsx";
import { AssetBase } from "../../assets.tsx";
import { MotionSettings } from "../../motion/context.tsx";
import { cameraStyle, transitionStyle } from "../../motion/primitives.ts";

const Enter: React.FC<{ scene: Scene; sb: Storyboard; duration: number; children: React.ReactNode }> = ({ scene, sb, duration, children }) => {
  const frame = useCurrentFrame();
  const preset = settings(sb.engine).motionPreset;
  const content = preset?.applyTo.includes(scene.kind as "reveal" | "benefit") ? <PosterStackDepth scene={{ ...scene, durationInFrames: duration }} sb={sb} preset={preset} /> : children;
  const style = transitionStyle(frame, settings(sb.engine).animation.transitionFrames, scene.transition, sb.direction);
  return <AbsoluteFill style={style}>{scene.camera ? <AbsoluteFill style={cameraStyle(frame, scene.camera)}>{content}</AbsoluteFill> : content}</AbsoluteFill>;
};

export const BoldCommercial: React.FC<{ storyboard: Storyboard; assetBase?: string }> = ({ storyboard: sb, assetBase = "" }) => (
  <MotionSettings.Provider value={settings(sb.engine)}><AssetBase.Provider value={assetBase}>
    <AbsoluteFill style={{ background: sb.brand.colors.background }}>
      {storyboardTimeline(sb).map(({ scene, index, from, duration }) => {
        const Comp = SCENES[scene.kind];
        return <Sequence key={scene.id} from={from} durationInFrames={duration} name={scene.id}>
          <Enter scene={scene} sb={sb} duration={duration}><Comp scene={{ ...scene, durationInFrames: duration }} sb={sb} index={index} /></Enter>
        </Sequence>;
      })}
    </AbsoluteFill>
  </AssetBase.Provider></MotionSettings.Provider>
);
