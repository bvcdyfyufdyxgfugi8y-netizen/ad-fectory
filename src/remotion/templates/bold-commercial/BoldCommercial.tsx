import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import type { Scene, Storyboard } from "../../../core/schema.ts";
import { storyboardTimeline } from "../../../engine/timeline.ts";
import { settings } from "../../../engine/config.ts";
import { SCENES } from "./Scenes.tsx";
import { AssetBase } from "../../assets.tsx";
import { MotionSettings } from "../../motion/context.tsx";
import { cameraStyle, transitionStyle } from "../../motion/primitives.ts";

const Enter: React.FC<{ scene: Scene; sb: Storyboard; children: React.ReactNode }> = ({ scene, sb, children }) => {
  const frame = useCurrentFrame();
  const style = transitionStyle(frame, settings(sb.engine).animation.transitionFrames, scene.transition, sb.direction);
  return <AbsoluteFill style={style}>{scene.camera ? <AbsoluteFill style={cameraStyle(frame, scene.camera)}>{children}</AbsoluteFill> : children}</AbsoluteFill>;
};

export const BoldCommercial: React.FC<{ storyboard: Storyboard; assetBase?: string }> = ({ storyboard: sb, assetBase = "" }) => (
  <MotionSettings.Provider value={settings(sb.engine)}><AssetBase.Provider value={assetBase}>
    <AbsoluteFill style={{ background: sb.brand.colors.background }}>
      {storyboardTimeline(sb).map(({ scene, index, from, duration }) => {
        const Comp = SCENES[scene.kind];
        return <Sequence key={scene.id} from={from} durationInFrames={duration} name={scene.id}>
          <Enter scene={scene} sb={sb}><Comp scene={{ ...scene, durationInFrames: duration }} sb={sb} index={index} /></Enter>
        </Sequence>;
      })}
    </AbsoluteFill>
  </AssetBase.Provider></MotionSettings.Provider>
);
