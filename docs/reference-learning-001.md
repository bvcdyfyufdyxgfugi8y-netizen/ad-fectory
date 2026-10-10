# Reference learning 001 — experimental poster stack

The owner-supplied cartoon contact sheet is cataloged under `references/reference-001/`.
Read `verification.md` there before the supplied analysis: the latter describes a different visual subject.
The MP4 is unavailable and its metadata/hash/audio are not independently verified. No third-party media
or medical copy is used in an ad. Toon Studio's repository is unchanged.

## Optional preset

The existing Bold Commercial template now accepts one optional `engine.motionPreset`:

```json
{
  "name": "poster-stack-depth",
  "applyTo": ["reveal", "benefit"],
  "settleFrames": 24,
  "offset": 36,
  "tiltDegrees": 4
}
```

Omit this field for exactly the existing default. No default palette, layout, animation timing or audio
setting was changed. The preset replaces only opted-in reveal/benefit visuals with one owned product
card and two colored planes, staggered entrances and subtle parallax. The existing scene transition,
configured camera, assets, font, timeline and audio pipeline are reused. GSAP 3.15.0 was added on the owner’s later request; the preset itself uses existing frame primitives.

`applyTo` accepts unique reveal/benefit kinds only. Settling is 8–60 frames; rear layers delay 6 and 12 frames.
Validation rejects scenes ending before all planes settle. Offset is 12–48 px, tilt 0–6 degrees.
All animation is deterministic and frame-driven. This is CSS planar depth, not a 3D mesh/camera.
The experiment currently targets the existing fixed 1080×1920/30 fps template and short product copy.
Its typography/card geometry is fixed; broader text lengths need additional fit checks before production.

The general layered-card idea was proposed in the supplied task; it is **not observed** in the confirmed
cartoon contact sheet and is not presented as a recreation of the original footage.

## Commands

```bash
npm run check
REMOTION_BROWSER=/usr/bin/chromium RENDER_CONCURRENCY=2 npm run e2e
REMOTION_BROWSER=/usr/bin/chromium RENDER_CONCURRENCY=2 npm run produce -- briefs/demo-reference-001/brief.json
REMOTION_BROWSER=/usr/bin/chromium npx tsx src/cli/reference-snapshots.ts out/demo-reference-001/storyboard.json briefs/demo-reference-001 out/reference-001/snapshots samples/reference-001/snapshots/snapshots.json
npx tsx src/cli/compare.ts before.mp4 after.mp4 comparison.json
```

The snapshot command renders three native-resolution PNGs twice using two fresh bundles, asserts exact
PNG hashes against the optional committed manifest and records the first-pass baselines. It fails on a repeat mismatch. They are same-environment
baselines; cross-Chromium/platform equality is not assumed. The existing comparison command decodes every
video frame and audio sample to verify default-export regression. Reviewed evidence is in
`samples/reference-001/` and `docs/reports/reference-learning-results.md`.

A separate reference ingestion contract validates full SHA-256, provenance, license limitations,
availability, supplied vs verified metadata, evidence/confidence and temporal bounds. Its loader verifies
provided artifact bytes and rejects escaped/symlink paths. Reference media are not registered as product assets.

## Review boundary

Work is on `codex/reference-learning-003`, based on the verified `4c4f80b` engine on main.
Do not merge without owner approval. No deployments, paid generation or source video uploads. GSAP is installed with its no-charge license.
