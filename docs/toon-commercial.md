# Toon Commercial (experimental)

An optional reusable 1080×1920/30fps template in the existing AD Factory registry.
Select `engine.template: "toon-commercial"` in the same validated brief. Product images,
copy, colors, scene duration, springs, safe area, product size, planar camera, transitions
and audio remain structured inputs. No product or brand is hardcoded in the component.

The illustrated product is an input asset; the template does not automatically turn
photographs into cartoons. Use owned/supplied or separately reviewed illustrated artwork.
Drawn highlights, offset silhouettes and overlapping shapes suggest volume; all transforms
are planar. Out-of-plane camera rotations and perspective presets are rejected.

## Continuous staging

Set the optional validated `engine.animation.toon` object:

```json
{"assemblyBeats":3,"orbitTurns":1.25,"burstIntensity":0.85}
```

The first scene must allow assembly plus one beat to settle. A shared frame-based
`toonStage` primitive masks the target illustration into four paper slices and converges
those slices before the first cut. The same hero then moves continuously through a middle
framing change and a final settle; text changes do not restart its entrance. Bubble size,
planar orbit and painter order suggest depth. An expanding backdrop and gold color wave
connect the reveal and final hold. Text exits before the incoming text starts, avoiding
stacked duplicate brand headings during overlap. Continuous staging owns hero motion;
per-scene planar camera controls affect the scene text layer. Without `animation.toon`,
the template keeps its simpler per-scene product mode.

It reuses the existing storyboard/timeline, shared easing/float/parallax/springs, asset
resolver, local synth audio, render cache, export and QC. Original Bold Commercial,
canonical briefs and historical reference exports remain unchanged. This prototype does
not automatically approve the observed reference recipes or change default production.
Real 3D, physical lighting and automatic vectorization remain absent.

Authorized owner production is local/untracked in `out/kinza-2d-motion/`:

```bash
npm run produce -- out/kinza-2d-motion/brief.json \
  --storyboard out/kinza-2d-motion/edited-storyboard.json
```

The package contains client/generated assets and must not be committed. Brief/storyboard
controls remain editable. The can is a raster illustration, not editable vector paths or
an After Effects project. Reviewed brand artwork is preferable for final delivery.
