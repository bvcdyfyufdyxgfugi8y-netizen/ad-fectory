---
name: ad-render
description: Produce, preview or re-export an AD Factory ad from a brief or an edited storyboard. Use when asked to render, export, re-export, preview or regenerate an ad in ad-factory/.
---

# Ad rendering

**When:** a brief is ready, a storyboard was edited, or an export must be repeated.

**Inputs:** `briefs/<id>/brief.json` (+ assets in that folder); optionally an edited storyboard JSON.

**Steps**
1. `npm run storyboard -- <brief>` and read `out/<id>/storyboard.json`: hook, scene order, every `source`.
2. Optional cheap check: `npm run preview -- <brief>` (540×960).
3. Full: `npm run produce -- <brief> [--storyboard <edited.json>]`.
4. Read `out/<id>/qc-report.md` and look at `contact-sheet.jpg` and `delivery/cover.jpg` yourself.

**Outputs:** `out/<id>/delivery/` (mp4, cover, caption, QC report), `run.json` (timings, cache hits, cost).

**Quality bar:** QC PASS (exit code 0); 1080×1920, 30 fps, H.264 yuv420p BT.709, AAC 48 kHz; true peak ≤ −0.5 dBFS;
loudness ≈ −14 LUFS; human-review items reported, not claimed.

**Expected errors**
- `text needs N beats but the ad only has M`: copy too long for the duration → shorten copy or raise `durationSec`.
- `brief is invalid`: the message lists each field; fix the brief, never loosen the schema to pass.
- Browser not found / download blocked: set `REMOTION_BROWSER` (see `.env.example`).
- Edited storyboard: scene lengths must be multiples of 15 frames and sum to `durationInFrames`.
