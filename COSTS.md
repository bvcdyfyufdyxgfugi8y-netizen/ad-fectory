# Costs

Rule: no paid call without the owner's approval. `PAID_BUDGET_USD_PER_AD=0` (default) refuses paid calls.

## Spend to date

| Date | Item | Paid calls | USD |
|---|---|---|---|
| 2026-10-10 | Phase 0 + Phase 1 (development, demo ad, all renders and tests) | 0 | 0.00 |
| 2026-10-10 | Phase 2 local UI, SQLite, browser tests and acceptance renders | 0 | 0.00 |

## Cost per ad today
- Money: **$0** (all local: Remotion, ffmpeg, synthesised audio, local fonts).
- Compute (measured in a 4-core cloud container, 20 s ad): first render ≈ 65–75 s wall time; unchanged re-export a few
  seconds (cache); text edit ≈ one picture render, audio reused. Exact numbers per run are in `out/<id>/run.json`.
- Phase 2 verification on this shared environment was slower: a 20-second picture render took about 5–6 minutes
  with concurrency 2; cached full re-export about 13–15 seconds. Concurrent browser/build work affects timings.
  These are observations, not a service-level promise. API spend remains $0.
- The final UI acceptance measured a 10-second first export at 382.8 s, unchanged at 28.9 s, and text edit at
  329.4 s, while other renders were running. Final CLI first export under that contention took 759.4 s.

## Known future costs (not incurred; need approval)
| Item | When | Notes |
|---|---|---|
| ElevenLabs voice | Phase 3 | Priced per character on the owner's plan; cache every take by text hash so a line is paid once |
| LLM creative director | Phase 2 (optional) | Small per ad; off by default |
| Licensed music library | Phase 3 | Subscription or per-track licence |
| Video hosting for Instagram API | Phase 6 | The Graph API fetches the video from a public URL |
| Remotion Company License | Phase 8 | Only if the business exceeds the free-tier size or becomes a SaaS (D-003) |
| Cloud rendering | Phase 8 | Per-minute compute |

## Scalable engine extension — 2026-10-10
No new dependencies, paid API calls, publishing or deployment. Paid spend $0. Full CLI e2e: 336.6 s first,
16.4 s cached, 306.0 s text edit, 13.9 s restored. Additional product uses local original SVGs and synth audio.
MINT: first export 148.6 s; corrected artwork re-export 121.5 s, picture rebuilt / audio cached. Both QC PASS.


## Reference 001 experiment — 2026-10-10
Paid API calls 0; spend $0; new dependencies 0. Only local rendering and supplied-reference inspection.
No deployment or paid generation. Review branch/PR delivery is authorized by the supplied task.

GSAP 3.15.0 was subsequently installed on the owner's explicit request, under its standard no-charge
license. One new dependency; no paid calls or spend. Reference 003 delivery consists of images and data.

## Kinza 2D design preview — 2026-10-11
No external paid provider APIs, new dependencies, deployment or publishing. Product artwork
uses the session's native image generation; its platform billing is not measured here.
Motion, music/SFX synthesis, encoding and QC run locally. No ElevenLabs or other paid
music/voice API was called.
