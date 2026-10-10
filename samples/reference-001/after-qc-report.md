# Quality report

File: `/workspace/ad-factory/out/worktrees/reference-learning-001/out/demo-reference-001/delivery/demo-reference-001.mp4`

**Automated result: PASS**

| Check | Result | Detail |
|---|---|---|
| file-exists | ✅ pass | 2.9 MB |
| resolution | ✅ pass | 1080×1920 (expected 1080×1920) |
| aspect-9x16 | ✅ pass | 0.5625 |
| fps | ✅ pass | 30 fps |
| duration | ✅ pass | 10.000 s (storyboard 10.000 s) |
| codec-h264 | ✅ pass | h264 yuv420p |
| audio-aac | ✅ pass | aac 48000 Hz 2ch |
| render-complete | ✅ pass | 300 decoded frames (storyboard 300) |
| no-black-gaps | ✅ pass | none ≥0.25 s |
| no-frozen-picture | ✅ pass | no still stretch ≥1.5 s |
| no-unintended-silence | ✅ pass | none ≥0.6 s below -45 dB |
| no-clipping | ✅ pass | true peak -0.9 dBFS, sample peak -1 dB |
| loudness | ✅ pass | -14 LUFS integrated (target -14 ±2) |
| text-contrast | ✅ pass | text on background 16.35:1 (WCAG AA ≥ 4.5) |
| cta-contrast | ✅ pass | CTA ink on primary 10.55:1 |

## Needs human review (not judged by the machine)
- [ ] Arabic text: letters joined, no broken shaping, no clipped diacritics (check the contact sheet).
- [ ] Product is clearly visible and recognisable in the reveal and the CTA.
- [ ] No text leaves the safe area on a real phone (platform UI overlays differ by app).
- [ ] Hook reads in the first second; CTA is clear; music suits the brand.
- [ ] Every on-screen claim matches what the client stated (see storyboard scene.source).
