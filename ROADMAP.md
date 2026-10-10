# Roadmap

Each phase starts only after the previous one's acceptance tests pass. Costs are estimates until measured.

| Phase | Goal | Acceptance | Likely cost | Status |
|---|---|---|---|---|
| 0 Discovery & Architecture | Environment, licences, architecture, risks | Documented in `docs/phase-0-discovery.md` | $0 | ✅ |
| 1 Working MVP | One real 1080×1920 ad, editable and re-exportable | `npm run e2e` passes, QC PASS | $0 | ✅ |
| 2 Creative Production | Intake form UI, storyboard editor, brand controls, SQLite jobs (LLM optional/deferred) | Brief → approved storyboard in the UI; edit → re-export | $0 local | ✅ local scope |
| 3 Audio & Sync | Voice-over (file import first, ElevenLabs after approval), word timestamps, captions synced to words, licensed music | VO ad with word-synced text, ducking measured, no clipping | ElevenLabs plan (owner decision) | ⏭ next |
| 4 Templates | Luxury Cinematic, Modern Minimal, Playful Cartoon, Dynamic Typography | Same brief renders in each; all pass QC | $0 | ○ |
| 5 Quality Control | Safe-area detection from rendered frames, OCR check of on-screen text, creative checklist workflow | QC catches seeded defects | $0 | ○ |
| 6 Publishing & Delivery | Client delivery zip; then Instagram Graph API Reels (owner's account, explicit approval per post) | Manual package; one approved test Reel with logged media ID | $0 + hosting for the video URL | ○ |
| 7 Analytics | Pull insights where the API permits; experiment log; hypothesis per next ad | Real data only; no inferred causation | $0 | ○ |
| 8 Commercial Scaling | Accounts, brand kits, credits, queue, cloud render, payments, API, white label | Only after proven demand | Remotion Company License likely; cloud render | ○ |

## Phase 2 — implemented local scope
1. Control UI (Next.js + Tailwind, RTL): brief form with validation messages, project list, storyboard scene editor
   (text, order, length in beats, image per scene), embedded `@remotion/player` preview, render panel with logs.
2. SQLite job table (`jobs`, `projects`, `clients`), one local worker running `produce()`.
3. Hook picker (choose 1 of the 3 hooks) and per-scene emphasis control.
4. Optional LLM creative director remains deferred behind `CreativeDirector` until provider/budget approval; no paid integration was built.
5. Brief from real photos: background removal is out of scope until a free local option is validated.

## Backlog (prioritised by feasibility × value × dependencies)
1. Word-level caption sync (needs Phase 3 timestamps)
2. Brand kits per client (needs Phase 2 DB)
3. Multiple aspect ratios (1:1, 4:5) from the same storyboard
4. Production queue + cloud rendering
5. Scheduled publishing (needs Phase 6)
6. Credits, subscriptions, payments, client API, white label (needs Phase 8 demand)
7. AI image / video generation for assets (paid; owner approval)

## Phase 2 engine extension — owner requested
The scalable engine adds structured configuration, reusable motion, template registration and two-product
acceptance before voice or additional visual styles. See `docs/engine-audit-plan.md`. A Toon/Cinematic template
is the recommended next engine phase; existing voice roadmap remains a separate follow-up.
