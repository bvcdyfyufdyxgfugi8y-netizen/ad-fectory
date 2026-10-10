"use client";
import React, { useRef } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import type { Storyboard } from "../core/schema.ts";
import { AdComposition } from "../remotion/templates/registry.tsx";

export default function PlayerPanel({ storyboard, projectId, sceneIndex }: { storyboard: Storyboard; projectId: string; sceneIndex: number }) {
  const ref = useRef<PlayerRef>(null);
  React.useEffect(() => {
    const from = storyboard.scenes.slice(0, sceneIndex).reduce((n, s) => n + s.durationInFrames, 0);
    ref.current?.pause();
    const offset = Math.min(45, (storyboard.scenes[sceneIndex]?.durationInFrames ?? 60) - 12);
    ref.current?.seekTo(Math.min(from + offset, storyboard.durationInFrames - 1));
  }, [sceneIndex, storyboard.durationInFrames, storyboard.scenes]);
  // Player's scaling offsets use left margins; inheriting RTL moves the entire picture outside its viewport.
  // Each scene still sets its own reading direction from the storyboard.
  return <div dir="ltr"><Player ref={ref} component={AdComposition} inputProps={{ storyboard, assetBase: `/api/projects/${projectId}` }} durationInFrames={storyboard.durationInFrames} fps={storyboard.fps} compositionWidth={1080} compositionHeight={1920} controls loop showVolumeControls={false} style={{ width: "100%", aspectRatio: "9 / 16", borderRadius: 18, overflow: "hidden" }} /></div>;
}
