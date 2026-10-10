# Structured advertisement engine

The existing Brief → Director → Storyboard → Remotion → ffmpeg → QC pipeline remains intact. The same registered template drives the CLI, Remotion Studio and Arabic Player. No dependency was added.

## Generate two products

```bash
REMOTION_BROWSER=/usr/bin/chromium RENDER_CONCURRENCY=2 npm run produce -- briefs/demo-nafas/brief.json
REMOTION_BROWSER=/usr/bin/chromium RENDER_CONCURRENCY=2 npm run produce -- briefs/demo-mint/brief.json
```

Both are fictional demonstration products. Original MINT artwork is authored in this repository. Product facts, branding and CTA live entirely in each brief. Change JSON and local assets, not animation source. `npm run storyboard -- <brief>` produces the reviewable plan; `--storyboard <file>` supports deliberate scene edits.

## Contracts and ownership

| Contract | Implementation | Validation / support |
|---|---|---|
| Product | `ProductSchema`, `BriefSchema` in `src/core/schema.ts` | Name, category, stated features, images, price/offer; cross-field price checks |
| Text/assets | `TextSchema`, `VisualAssetSchema`, `SceneSchema` | Headline ≤120; local image paths; asset existence/content/realpath checks; emphasis indices |
| Scene/timeline | `SceneSchema`, `validatePlan`, `timeline` | Unique IDs; hook first/CTA last; sum equals total; integer beat grid; readable scene durations; SFX bounds |
| Layout/template | `LayoutSchema`, `templateDefinition` | Safe padding, headline sizes, product heights; known template/kind/motion; fixed current canvas |
| Animation | `AnimationSchema`, `SpringSchema` | Transition frames, kinetic spring, product floating; pure reusable easing/transition/zoom/parallax helpers |
| Camera | `CameraSchema` | Frame interval, position, zoom, rotation, easing, perspective; interval must fit local scene clock |
| Audio/sync | `SfxCue`, `AudioSettingsSchema`, `soundCues` | Frame-exact cues rebuilt from the same clock as picture; gains and loudness settings; local deterministic synthesis |
| Export | `ExportSchema` | H.264 / yuv420p / BT.709 / AAC 48 kHz; CRF, JPEG quality and audio bitrate validated |

`brief.engine` is optional. Missing configuration uses the exact legacy Bold Commercial defaults. Zod expands partial sections and rejects unknown controls. Generated storyboards retain the expanded configuration only for configured briefs; old plans remain compatible.

```json
{
  "engine": {
    "template": "bold-commercial",
    "bpm": 120,
    "layout": { "type": { "cta": 70 } },
    "animation": { "transitionFrames": 12, "floatAmplitude": 6 },
    "audio": { "musicGainDb": -2, "sfxGainDb": -3 },
    "export": { "crf": 19 },
    "cameras": {
      "reveal": {
        "from": { "scale": 1, "rotateY": -2 },
        "to": { "scale": 1.04, "y": -12, "rotateY": 2 },
        "endFrame": 50,
        "easing": "cubic-in-out"
      }
    }
  }
}
```

A camera's frame zero is the beginning of its scene's entrance, before the beat cut. Its endFrame must be smaller than scene duration plus transition lead. Engine cameras select a preset by scene kind; a reviewed storyboard may set a camera per scene. Templates keep their distinctive internal motion; the motion enum declares compatible presets, not arbitrary cross-kind animation swapping.

The production boundary validates geometry, totals, durations, motion compatibility, asset ownership and audio bounds before audio/bundle/cache work. Editor requests still accept only owner-owned fields; configuration remains canonical. The CLI permits explicit structured engine changes; the UI has no advanced engine settings panel yet.

## Motion extension

`src/remotion/motion/primitives.ts` contains deterministic, frame-indexed helpers. `MotionSettings` supplies validated configuration to typography/products/layout. No wall-clock animation or randomness is introduced. Existing word springs preserve Arabic shaping and NBSP phrase grouping. CSS perspective supports planar 3D transforms, not a geometry/lighting engine.

To implement Toon Style or Cinematic Commercial:

1. Add capabilities, supported canvas and allowed scene motions to `src/engine/templates.ts`.
2. Implement a template component accepting `TemplateProps`, using the shared timeline/settings/asset resolver.
3. Register it in `src/remotion/templates/registry.tsx`; provide its own Studio default storyboard and matching composition metadata.
4. Extend layout/configuration validation where the template requires different dimensions or fields; do not silently reinterpret Bold settings.
5. Add timeline tests and real render/QC/visual regression fixtures before enabling the identifier.

Unknown template IDs currently fail explicitly. Additional templates and alternate aspect ratios are not implemented.

Standalone technical QC is available as `npm run qc -- <video.mp4> <storyboard.json>`.

## Reproduce visual verification

```bash
node --import tsx src/cli/compare.ts samples/engine-regression/before.mp4 out/demo-nafas-cold-brew/delivery/demo-nafas-cold-brew.mp4 samples/engine-regression/comparison.json
```

This compares every decoded video frame with timing and the full decoded audio stream. A nonzero exit means exact decoded equivalence was not proven; inspect the report. The original handoff export remains separately preserved under `samples/phase-1/`. Historical rendering environments may differ; the current pre-refactor reference is the comparison baseline.

Do not confuse decoded equivalence with creative approval, text/safe-area detection or matching MP4 file bytes. QC and inspected review frames are complementary evidence.
