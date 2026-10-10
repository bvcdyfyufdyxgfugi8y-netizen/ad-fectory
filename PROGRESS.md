# Progress

_Last updated: 2026-10-10_

## Current engine extension (v0.3)
Validated structured settings, shared motion/timeline/template registry and two-product verification.
37 tests, production build, Arabic browser acceptance and full CLI e2e pass. Both product exports pass QC;
final MINT artwork correction also exported successfully (121.5 s, audio reused).
See `docs/reports/phase-2-engine-results.md` for actual results and residual pixel differences; exact visual
equivalence is not claimed. The historical local-studio results below remain as prior evidence.

## Where we are
**Phase 0 ✅ · Phase 1 ✅ · Phase 2 ✅ (local production studio).** Arabic UI, editable scenes, live preview,
SQLite projects/jobs and a separate render worker. Real UI exports pass QC; unchanged exports reuse both caches,
and a text edit re-renders picture only. Results: `docs/reports/phase-2-results.md`.

## Phase 2 — verified
| Item | Evidence |
|---|---|
| Typecheck, lint, 30 named unit tests | `npm run check` green |
| Production build | `npm run build` green |
| Arabic intake, upload, scene edit, save, approval, reload persistence, phone layout | Playwright UI acceptance |
| Stale revision, cross-origin mutation and scripted SVG rejected | Browser/API acceptance |
| Real 10 s UI export, 1080×1920 / 30 fps / H.264 + AAC, 300 decoded frames | QC PASS; `samples/phase-2/` |
| Unchanged export reuses picture + audio | UI acceptance: 28.9 s; both caches true |
| CTA edit re-renders picture, keeps audio and updates caption | UI acceptance: 329.4 s; video false, audio true |
| Independent snapshots and duplicate active-job prevention | SQLite acceptance tests |
| Final CLI regression after template changes | E2E PASS: 759.4 s / 16.3 s cached / 272.6 s text edit; QC PASS each |

All verification used fictional demo data. No paid calls, publishing or external uploads.

## Done (verified by running it)
| Item | Evidence |
|---|---|
| Typecheck, lint, 25 unit tests | `npm run check` green |
| Real export 1080×1920 / 30 fps / H.264 yuv420p BT.709 / AAC 48 kHz, 20.0 s, 600 frames | `out/<id>/qc-report.json` |
| Audio −14 LUFS, true peak −1.2 dBFS, no silence gaps, no black gaps | QC report |
| Edit → re-export (picture only re-renders, audio reused); unchanged → 6.5 s cached re-run | `npm run e2e` → `E2E PASS` |
| Preview mode 540×960 | `npm run preview` |
| Delivery package (mp4, cover, caption, report) | `out/<id>/delivery/` |
| Nothing outside `ad-factory/` changed | `git status` |

## Experimental / not yet proven
- Voice-over ducking: the ffmpeg graph is unit-tested but no real voice-over file has been mixed yet.
- Creative quality: judged only by the owner. The template is one style; motion is not yet varied per brand tone.
- Safe area: enforced by layout constants, not detected from rendered frames.

## Next step → Phase 3 (not started)
Recorded voice import first, measured ducking, word timestamps and caption sync. Generated voice needs a provider
and explicit budget approval. Optional LLM director remains deferred. See `ROADMAP.md`.

## Owner decisions pending
1. Approve the Bold Commercial look as the base template (or list changes).
2. Real first client/product for the next ad (real photos + stated facts).
3. Phase 3 voice: import recorded voice, or approve an ElevenLabs budget.
4. Remotion licence fit for the business size (DECISIONS D-003).
