# Changelog

## Unreleased · Reference memory 001/003 and optional motion experiment
- GSAP 3.15.0 installed on explicit owner request; existing transforms/parallax retained.
- Reference 003 source inspection, corrected product-grid findings and evidence-linked creative memory.
- Image-only Reference 003 delivery; original footage remains local and untracked.
- Reference-only ingestion schema with full SHA-256, provenance, license and evidence/confidence validation.
- Reviewed cartoon contact sheet; documented its conflict with the supplied montage analysis.
- One optional JSON-selected poster-stack-depth preset, leaving default scenes intact.
- Focused metadata/timing/cache tests and repeatable native PNG snapshot verification CLI.
- Independent branch and before/after evidence; owner review required before merge.

## 0.3.0 · 2026-10-10 · Reusable advertisement engine
- Validated optional layout/type/motion/camera/audio/export settings and named product/text/asset contracts.
- Shared template registry and timeline/SFX generator; early render-plan and asset ownership validation.
- Reusable frame primitives with legacy defaults, configurable kinetic springs and planar camera presets.
- Second fictional product input (MINT) with original local artwork; full decoded regression comparison CLI.
- Seven focused engine tests alongside existing unit/browser/e2e tests.


## 0.2.0 — 2026-10-10 · Phase 2 (local production studio)
### Added
- Arabic RTL Next.js + Tailwind studio, responsive intake form, project navigation and local image/logo uploads.
- Hook selection, scene text/order/beat-duration/image editor, word emphasis and local brand colours.
- Shared-template Remotion Player preview; isolated LTR viewport positioning with RTL scene typography.
- SQLite clients/projects/jobs with optimistic revisions, immutable job inputs and approval before enqueue.
- Single render worker with durable logs, QC-gated delivery links, duplicate active job prevention and interrupted-job recovery.
- Owner-supplied `approvedCopy` fields for tracing manually edited scene text to the brief.
- Editor/store tests and Playwright desktop/mobile acceptance, plus opt-in real UI render/cache/re-export checks.
### Changed
- Node minimum 22.13 for built-in SQLite; development and production commands start UI + worker together.
- Rebuild sound cues when scene order or durations change; strengthen SVG external-reference checks.
- Explicit non-isolated node:test execution to run named tests with tsx on Node 24.19.


## 0.1.0 — 2026-10-10 · Phase 0 + Phase 1 (Working MVP)
### Added
- Standalone `ad-factory/` project: TypeScript strict, ESLint (typescript-eslint), node:test, `.env.example`, README, CLAUDE.md.
- Brief schema + intake validation (fields, colours, prices, safe relative asset paths, magic-byte and unsafe-SVG checks, 15 MB limit).
- Rule-based creative director: three strategies (product reveal, problem→solution, offer first), three hooks, scene plan with per-scene source tracing.
- Storyboard engine: beat-grid timing (120 BPM / 15 frames per beat), reading-time floors, auto-drop of later benefits for short ads, SFX cues on cuts.
- Bold Commercial template (Remotion): kinetic Arabic/English typography with motion blur and highlight wipe, iris mask product reveal with parallax rings and light sweep, benefit cards, price stamp with sunburst and strike-through, CTA with beat pulse; diagonal wipe / slide / zoom / fade transitions; safe area.
- Audio engine: deterministic synthesised music bed (Am–F–C–G, side-chained) and SFX (whoosh, impact, pop, tick, riser), ffmpeg ducking graph for voice-over files, loudness normalisation to −14 LUFS / −1.5 dBTP.
- Rendering: silent H.264 render + AAC mux, BT.709 limited range, content-hash caches for picture and audio, half-resolution preview mode, cover still.
- QC: resolution, aspect, fps, duration, codec/pixel format, audio format, decoded frame count, black gaps, frozen picture, silence, true peak, loudness, contrast; Markdown/JSON report with human-review list; contact sheet.
- Delivery package: MP4, cover.jpg, caption.txt (brief-only content + client hashtags), QC report.
- Demo brief "نَفَس كولد برو" (fictional brand) with original SVG art.
- E2E acceptance script; skills `ad-render`, `ad-creative-qa`.
### Fixed during Phase 1
- First export was full-range `yuvj420p` / BT.470BG → now `yuv420p` BT.709 (caught by QC).
- QC frame count parse (`600,` from ffprobe CSV).
- Product name broke across lines in the hook → names are kept together with no-break spaces.
- 10-second ads with 3 benefits + price could not fit readable text → later benefits drop automatically; impossible fits fail clearly.
