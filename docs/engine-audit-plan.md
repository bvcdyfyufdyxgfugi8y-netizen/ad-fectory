# Scalable engine audit and implementation plan — 2026-10-10

Inspected all authored source modules, unit/browser tests, configuration, briefs/assets and handoff/documentation. Generated dependencies/caches are implementation outputs, not authored architecture.

| Area | Existing behavior / coupling | Incremental change |
|---|---|---|
| Content | Brief → rule-based director → JSON scenes; facts have sources; UI approvedCopy | Keep contracts and fact provenance; add optional validated engine configuration |
| Scenes | Six kinds; problem shares hook; motion labels do not choose arbitrary animation | Template definition declares supported kinds/motions; reject unsupported combinations |
| Timing | 30 fps, 120 BPM; transition 10 frames; duplicated SFX code in builder/editor | Shared timeline and cue builder; validate totals, IDs, beat grid, readable copy and cue bounds before rendering |
| Typography/layout | Alexandria; fixed safe area, sizes 128/104/78/210/82; product heights 900/760/700 | Validated layout/typography configuration with exactly these defaults |
| Motion | Springs, cubic easing, interpolation, product float, rings and pulse inside components | Reusable pure frame functions and transition/camera primitives; optional per-scene camera; retain exact default formulas |
| Assets | Local original SVG + local font; Brief checks exist; edited storyboard can introduce unchecked assets | Validate render references against Brief and check real paths/content before audio/render |
| Rendering/export | Single hardcoded composition; H.264 CRF18 JPEG92; preview .5/CRF30 | Registry shared by Player/Root/renderer; validated export configuration; cache hashes include engine implementation |
| Audio | Local deterministic synth, frame cues, independent cache, hardcoded loudnorm | Keep synth and exact defaults; configurable music/SFX gains and mix targets, shared synchronized timeline |
| UI/storage | Next RTL UI, immutable SQLite job snapshots, isolated CLI worker | Preserve architecture and editing ownership; normalize/validate at production boundary |
| QA | Existing `qc` script referenced a missing CLI; restore it. 30 tests, full CLI e2e, ffprobe/detectors, contact sheets | Focused engine invariants; second fictional product; forced new reference render; full decoded-frame/audio hash comparison |

## Preserved reference
Original handoff video stays in samples/phase-1/. The current pre-refactor working output and storyboard are copied to samples/engine-regression/before.mp4 and before-storyboard.json; reference.sha256 records both videos. This distinguishes current-environment regression from the historic Claude export. No equivalence claim until full comparison.

## Implementation sequence
1. Add standalone validated configuration schemas and template definition/registry without rebuilding the app.
2. Centralize timeline/cues and validation; wire structured settings into existing layout, primitives, audio and exports.
3. Run check; render canonical Nafas and another product from JSON; run required CLI e2e, compare complete decoded streams and inspect stills.
4. Document evidence, outputs, extension contract and remaining limitations. Toon/Cinematic remain future implementations; CSS perspective is supported, real 3D geometry is not.

No new dependencies, paid services, publishing or deployment are needed.
