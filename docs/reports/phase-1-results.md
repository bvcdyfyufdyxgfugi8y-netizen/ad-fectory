# Phase 1 results — 2026-10-10

## Deliverable
Demo ad for a **fictional** brand "نَفَس كولد برو" (no real client), Arabic RTL, 20 s, 7 scenes:
hook → product reveal → 3 benefits → price (12 ريال بدل 15 ريال) → CTA. All art, music and SFX were generated in the
repository; font is Alexandria (OFL).

## Automated QC (final export)
| Check | Result |
|---|---|
| Resolution / aspect | 1080×1920, 9:16 ✅ |
| Frame rate / duration / frames | 30 fps, 20.000 s, 600 decoded frames ✅ |
| Video | H.264, yuv420p, BT.709 limited range ✅ |
| Audio | AAC 48 kHz stereo, −14 LUFS integrated, true peak −1.2 dBFS ✅ |
| Black gaps / frozen picture / unintended silence | none ✅ |
| Text contrast | 17.5:1 text on background, 9.4:1 CTA ✅ |
| File size | ≈ 7 MB |

## E2E acceptance (`npm run e2e`)
| Step | Wall time (4-core container) | Cache |
|---|---|---|
| First production | 63 s | audio built, picture rendered |
| Same brief again | 6.5 s | both reused |
| CTA text edited in storyboard → re-export | 62 s | audio reused, picture re-rendered |
Result: **E2E PASS**.

## Errors found and fixed
1. Full-range `yuvj420p` / BT.470BG output (would look washed out or crushed on some players) → BT.709 limited range.
2. QC could not read ffprobe's frame count (`600,`) → parser fixed; QC had correctly failed the run.
3. Hook broke the product name over two lines → product names now stay on one line.
4. 10-second ads with 3 benefits and a price could not fit readable text → later benefits drop automatically;
   impossible plans fail with a clear message.
5. Test runner: Vitest 3 had a critical advisory in a dependency; Vitest 4 failed to install → node:test, 0 vulnerabilities.

## Gaps (honest)
- No voice-over yet (Phase 3). Music is a synthesised placeholder bed, not a produced track.
- One template; benefit scenes share the same motion pattern, which can feel repetitive on longer ads.
- Product art is vector illustration; real product photos need cut-outs with transparent background for the best result.
- No UI: editing means editing `storyboard.json`. Hook choice and scene lengths are edited there too.
- Safe-area, Arabic shaping and creative quality are checked by a person, not by the machine.
- Publishing: none (by design). Delivery is a local package.
- Tested only in a Linux cloud container; README steps not yet run on a fresh Mac/Windows machine.

## Costs
$0. No paid API calls. Compute only (see table above).
