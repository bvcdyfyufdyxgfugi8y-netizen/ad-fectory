# Kinza — continuous cartoon 2D motion (review branch)

A product-independent optional template in the existing engine now supports a continuous
cartoon choreography: staggered paper-slice assembly, a single persistent hero, orbiting
illustrated bubbles with drawn depth, an expanding backdrop, a gold color wave and a
settled brand finish. It follows the owner's request to restructure production using
transferable directing principles from the sent references with an original composition.

Reference 004 informed assembly/reveal/secondary-motion pacing; reference 001 informed
outlines and hierarchy. Reference products, claims, images and original scripts are not
production inputs. All product identity comes from the owner's Kinza photo; brand/category
are the only on-screen information. The old engine and original advertisement remain intact.

## Structured inputs and technique status

The same Brief/Storyboard own asset, color, copy, timing, source tracing and local audio.
`engine.animation.toon` validates assemblyBeats, orbitTurns and burstIntensity; shared
`toonStage` computes deterministic planar movement. Artwork slices are a graphic treatment,
not a physical-disassembly claim. Shape/proportions are visual only, not inferred physical
measurements. Audience is unknown; awareness is an explicit preview goal assumption.

Palette is estimated from target packaging: navy #303A77, teal #109EAA, aqua #B9DFE1,
gold #D9B54D, off-white #F8FAF8. Native-generated can is reconstructed artwork and needs
brand review. Observed catalog recipes remain unapproved; this owner-selected template
variant is experimental and is not automatically selected by the adaptive planner.

## Verification

- Typecheck/lint and all 68 tests PASS. Four focused template checks cover two independent
  target inputs, ownership/timing, rejected perspective controls, continuous/clamped planar
  staging and settling before the first cut. Legacy storyboard tests still pass.
- A feedback-growth regression no longer assumes an empty library: it verifies one added
  record, preservation of existing records and duplicate rejection.
- Studio runs locally on port 3015 (HTTP 200).
- Earlier complete engine e2e passed: first 301.2s, fully cached 12.7s, CTA edit 225.2s,
  canonical restore 12.8s. Final source is undergoing the required repeat e2e below.
- Fresh pre-/post-change bundles rendered old-template frames 60, 200, 431 and 580
  after the continuous revision. All four PNG files are byte-identical. Selected-frame
  equivalence is not whole-video equivalence.

## Outputs and remaining review

`out/kinza-2d-motion/` holds ignored client artwork, editable brief/storyboard, assumptions,
adaptive retrieval report, creative direction, export, QC and logs. Earlier four-scene V1
is preserved under `versions/v1`; the revised version uses three continuous segments.
Client assets and generated artwork are not committed. Source stays on
`codex/kinza-2d-motion`; no approval to merge this new work into main is implied.

Raster can pixels are not editable vector paths. Apparent depth is drawn, not real 3D.
Sound is local synthesis on an authored 120BPM grid; no reference music/BPM match or
subjective audio fit is claimed. Audience response and commercial improvement are
unmeasured. Human review of packaging, motion/audio and platform overlays remains necessary.

Next: review the revised direction, supply vector brand assets, add template-specific QC
text surfaces and then evaluate whether to approve a reusable assembly recipe.

## Revised export and visual evidence

The final revised video completed in 149.1s: 10.000s, 1080×1920/30fps, 300 decoded
frames, H.264 yuv420p + AAC stereo 48kHz. Overall QC PASS; measured -14 LUFS and
-1dBFS true peak, with no black gaps or unintended silence. One warning is retained:
CTA ink on primary 3.08:1 is the legacy button heuristic; this template has no button.
Actual header text is navy on off-white (10.02:1). This is not pixel-based text detection.

Inspected the final three scene-midpoint frames and 30 decoded samples at 3fps. They
show sliced-drawing convergence, persistent product framing, orbiting depth accents,
color-wave transition and readable joined Arabic/Latin holds. Duplicate-heading overlap
seen in an intermediate export was corrected by exiting the old type before new entry.
Closing text fades while the recognizable full product remains. Subjective continuous
playback/audio fit and actual phone overlays remain human review.

Revised MP4: `out/kinza-2d-motion/delivery/kinza-2d-motion-v2.mp4`.
Editable inputs: `out/kinza-2d-motion/kinza-editable-inputs.zip`.
Feedback `toon-continuous-preview-002` records the experimental transferred variant in
the existing library without approving catalog recipes or asserting commercial improvement.
