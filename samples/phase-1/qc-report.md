# Quality report

File: `/home/claude/Motion/ad-factory/out/demo-nafas-cold-brew/delivery/demo-nafas-cold-brew.mp4`

**Automated result: PASS**

| Check | Result | Detail |
|---|---|---|
| file-exists | ✅ pass | 6.98 MB |
| resolution | ✅ pass | 1080×1920 (expected 1080×1920) |
| aspect-9x16 | ✅ pass | 0.5625 |
| fps | ✅ pass | 30 fps |
| duration | ✅ pass | 20.000 s (storyboard 20.000 s) |
| codec-h264 | ✅ pass | h264 yuv420p |
| audio-aac | ✅ pass | aac 48000 Hz 2ch |
| render-complete | ✅ pass | 600 decoded frames (storyboard 600) |
| no-black-gaps | ✅ pass | none ≥0.25 s |
| no-frozen-picture | ✅ pass | no still stretch ≥1.5 s |
| no-unintended-silence | ✅ pass | none ≥0.6 s below -45 dB |
| no-clipping | ✅ pass | true peak -1.2 dBFS, sample peak -1.2 dB |
| loudness | ✅ pass | -14 LUFS integrated (target -14 ±2) |
| text-contrast | ✅ pass | text on background 17.48:1 (WCAG AA ≥ 4.5) |
| cta-contrast | ✅ pass | CTA ink on primary 9.43:1 |

## Needs human review (not judged by the machine)
- [ ] Arabic text: letters joined, no broken shaping, no clipped diacritics (check the contact sheet).
- [ ] Product is clearly visible and recognisable in the reveal and the CTA.
- [ ] No text leaves the safe area on a real phone (platform UI overlays differ by app).
- [ ] Hook reads in the first second; CTA is clear; music suits the brand.
- [ ] Every on-screen claim matches what the client stated (see storyboard scene.source).
