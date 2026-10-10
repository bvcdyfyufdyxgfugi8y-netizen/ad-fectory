# Phase 0 — Discovery & Architecture (2026-10-10)

## Environment (measured)
| Item | Found |
|---|---|
| OS | Linux 6.18 x86_64 (cloud container), 4 cores, ~15 GB RAM |
| Node / npm | 22.22.0 / 10.9.4 |
| ffmpeg / ffprobe | 6.1.1 (libx264, aac, loudnorm, ebur128, blackdetect, silencedetect, freezedetect, sidechaincompress available) |
| Python | 3.13 + numpy (not used by AD Factory, to keep it Node-only) |
| Browser | Chromium headless shell 1194 at `/opt/pw-browsers` (Remotion's own download is not needed here) |
| npm registry | reachable |

## Toon Studio (read-only inspection)
The configured repository is the Toon Studio / NOCTA motion repository. Nothing outside `ad-factory/` was changed.

What exists and what we took (ideas only, no files copied):
| Toon Studio piece | What it does | Used in AD Factory |
|---|---|---|
| `remotion.config.js` | Points Remotion at a local headless shell when downloads are blocked | Same idea via `REMOTION_BROWSER` env var |
| `remotion/Root.jsx` font gate | `delayRender` until Arabic fonts load | Same pattern in `src/remotion/Root.tsx` |
| `tools/gen-sfx.py` | Deterministic, synthesised, licence-free SFX (numpy) | Re-implemented in TypeScript (`src/audio/synth.ts`) |
| `tools/word-align.py`, `audio/` cache by segment hash | Word timing from phrase timing; paid takes cached forever | Planned for Phase 3 (voice cache by text hash) |
| `tools/frame-stats.py`, `loopcheck.py` | Exposure / seam checks on frames | Inspiration for QC; Phase 5 frame analysis |
| `.claude/skills/cartoon`, `video-ad-editor` | Full creative skills for cartoon reels and talking-head ads | Not reused: different product, and they carry their own rules/voice decisions |
| `toon-studio/docs` | Content strategy rules (hooks, Arabic, CTA) | Not copied; AD Factory has its own no-invented-claims rule |
| Packages | remotion 4.0.529, react 19.3, gsap, motion, howler, @fontsource | Same Remotion + React versions pinned; others not needed yet |

Licences: Toon Studio is `UNLICENSED` (private, same owner). Fonts via @fontsource are OFL. No `.env` or keys exist in
the repo; none were copied.

## Technology evaluation
| Candidate | Verdict for Phase 1 | Why |
|---|---|---|
| Remotion | **Use** | Deterministic React frames, programmatic render API, proven in this repo |
| GSAP / Motion | Defer | Remotion's `spring`/`interpolate` cover the template; add if a template needs timelines |
| Three.js | Defer | No 3D need yet |
| FFmpeg | **Use** | Mix, loudness, mux, all QC detectors |
| ElevenLabs | Phase 3, paid | Needs approval and budget |
| Next.js + Tailwind | Phase 2 | UI not needed to prove the engine |
| SQLite → Postgres | Phase 2 → 8 | No multi-job state yet |
| Instagram Graph API | Phase 6 | Needs business account, app review, approval |

## Risks
| Risk | Mitigation |
|---|---|
| Remotion licence for a future SaaS | D-003: confirm before Phase 8; renderer isolated |
| Invented or misleading claims | Source tracing per scene + tests; template copy limited to `copy.ts` |
| Arabic shaping / fonts | Font gate before render; OFL Arabic font bundled via npm; human review item |
| Music rights | Synthesised now; licensed library later |
| Paid API overspend | Budget env var = 0; cache paid outputs by hash |
| Platform UI covering text | Safe-area constants; real-phone check in human review |
| Render time on small machines | Preview mode at half resolution; caching |

## Cost estimate
Phase 0–1: $0. See `COSTS.md` for future items.
