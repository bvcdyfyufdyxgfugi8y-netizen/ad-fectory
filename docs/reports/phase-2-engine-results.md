# Phase 2 — scalable advertisement engine (v0.3.0)

## Implemented
Existing application and pipeline were extended after auditing authored source, tests, documentation and assets.
The audit and incremental plan are in `docs/engine-audit-plan.md`; structured input/extension guide is
`docs/engine-inputs.md`. No dependency was added and nothing was rebuilt from scratch.

- Optional validated layout, typography, animation, camera, audio and export settings; named product/text/asset contracts.
- Browser-safe template capabilities and component registry shared by Remotion Root, renderer and Player.
- One shared scene/entrance timeline and SFX cue builder replaces duplicated builder/editor logic.
- Frame primitives: kinetic springs, cubic easing/progress, transitions, pan/zoom, parallax, floating and CSS perspective transforms.
- Production checks for duration sums, scene IDs/order, beat grid, readable text, motion compatibility, camera/audio bounds and asset ownership.
- Realpath asset validation rejects symlink escapes; independent caches honor visual/audio settings.
- Existing missing standalone QC CLI restored; full decoded comparison CLI added.
- Independent fictional MINT product/brand/artwork input exercises configuration, transition timing and camera effects.

## Preserved
Original handoff video in `samples/phase-1/` unchanged, with SHA-256 verification. Latest pre-refactor render and
storyboard copied to `samples/engine-regression/` before edits. Legacy storyboard JSON and SFX timing compare
identically after serialization. Default Bold Commercial font, safe area, sizes, colors, scene order, springs,
entrances, product float and music behavior retain their existing values. Arabic UI, SQLite job snapshots,
worker, approval/revision safeguards and cache workflow remain operational.

## Verification
| Check | Actual result |
|---|---|
| Baseline check before edits | 30 tests + TypeScript + lint PASS |
| Final check | 37 tests + TypeScript + lint PASS |
| Production build | Next.js build PASS |
| Browser acceptance | 1 PASS: Arabic intake/uploads/edit/approval/reload/phone preview; invalid assets and stale/cross-origin requests rejected |
| Full CLI e2e | PASS: fresh 336.6 s; cached 16.4 s; text edit 306.0 s; restore 13.9 s |
| Cache assertions | Unchanged: picture/audio true; text edit: picture false/audio true |
| Standalone QC CLI | Canonical Nafas PASS |
| Nafas export | 20 s, 600 frames, 1080×1920/30 fps H.264 yuv420p/AAC 48 kHz stereo; QC all pass; −14 LUFS, −1.2 dBFS true peak |
| MINT exports | 148.6 s; 10 s/300 frames, same 1080×1920/30 fps codecs; all QC pass; −14 LUFS, −1.1 dBFS true peak. Final SVG correction export also QC PASS, 121.5 s, audio cached / picture fresh; same technical measurements. |

Build/CLI/browser subprocesses needed the execution sandbox's network-enabled profile for local IPC/browser
servers. No paid service, external asset generation, publishing or deployment was used.

## Actual visual comparison — no exact equivalence claim
Every native decoded frame and the full decoded audio stream were compared, rather than selected stills only.
Current pre/post refactor: **506 of 600 frames exact, 94 differ; decoded audio exact**. Aggregate SSIM is
**0.999338**, minimum frame SSIM **0.990280** at frame 431. Before/after PNG pairs at 200, 380 and 431 were
inspected: no obvious change in text arrangement, product shape or layout in those pairs. The residual pixel
differences' cause has not been isolated, so **exact decoded visual equivalence is not established**.
Evidence: `samples/engine-regression/comparison.json`, per-frame SSIM log, paired images and retained MP4s.

The historic Claude handoff already differs from the current pre-refactor render: all 600 native frames differ,
SSIM 0.995150, decoded audio exact. This separate baseline comparison is retained; it is not attributed to this
refactor. No environment/codec explanation is claimed without further isolation.

## Output locations
- Canonical Nafas: `out/demo-nafas-cold-brew/delivery/`; immutable comparison copy `samples/engine-regression/after.mp4`.
- MINT: `out/demo-mint-bottle/delivery/` and `samples/engine-products/mint/`; reproducible input `briefs/demo-mint/brief.json`.
- Original: `samples/phase-1/demo-nafas-cold-brew.mp4`.
- Regression: `samples/engine-regression/`; e2e timing evidence `out/engine-acceptance/e2e-results.json`.

## Remaining limitations / next phase
One implemented visual template; future identifiers explicitly rejected until registered and verified. Current
canvas is 1080×1920/30 fps; Alexandria is fixed. Advanced settings are JSON-driven and not exposed as UI controls.
CSS perspective is planar, not a 3D geometry/lighting engine. No voice generation/import acceptance, multi-user
hosting or distributed render was added. Safe area, shaping and creative/music fit still require human review;
QC does not perform OCR or semantic fact verification. Exact pixel equivalence remains unproven. Contact sheets for both products and MINT cover were inspected; product, headlines and CTA are legible in those stills. A malformed bottle wordmark was found and corrected in the SVG input before the final re-export. Music suitability remains for the owner.

Recommended next engine phase: implement Toon Style and Cinematic Commercial through the registry, each with a
real two-product render/QC fixture; add raw-frame regression fixtures and investigate residual pixel differences,
then automate text/safe-area detection. Voice synchronization remains a separate follow-up requiring real audio
and provider approval only if a paid generator is chosen.

Paid API calls: **0**. Paid dependencies: **0**. Paid spend: **$0**.
