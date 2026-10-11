# Decisions

Format: ID · date · decision · why · consequences. Newest last.

**D-001 · 2026-10-10 · AD Factory is a separate directory with its own package.json, lockfile and node_modules.**
The only configured repository is the Toon Studio repo. A self-contained `ad-factory/` keeps both projects
independent (no shared dependency upgrades, nothing outside the folder is modified). It can move to its own
repository later with `git subtree split` without code changes.

**D-002 · 2026-10-10 · Stack: TypeScript + Remotion 4.0.529 + React 19 + ffmpeg; no Next.js, Tailwind or database yet.**
Phase 1 needs a reliable render, not a web app. Remotion gives deterministic, frame-exact React motion and a
programmatic renderer; ffmpeg does audio, muxing and QC. Pinned to the same Remotion version Toon Studio already
proved in this environment. GSAP/Motion/Three.js are not installed: nothing in the first template needs them.
Next.js + Tailwind come with the control UI (Phase 2); SQLite with the job system.

**D-003 · 2026-10-10 · Remotion licence must be confirmed before commercial scaling.**
Remotion's licence (read from the official LICENSE.md on 2026-10-10) is free for individuals, non-profits and
for-profit companies with ≤ 3 employees, including commercial video work; larger companies need a paid Company
License, and selling a derivative of Remotion itself is disallowed. Producing ads for clients as a small studio is
within the free tier. A SaaS where customers render videos needs a check of Remotion's terms (remotion.pro) and
likely a Company License. **Owner action before Phase 8.** The motion layer is isolated in `src/remotion/` so an
alternative renderer could replace it if the licence ever stops fitting.

**D-004 · 2026-10-10 · Phase 1 creative director is rule-based, not an LLM.**
Free, deterministic, testable, and it cannot hallucinate claims. It sits behind `CreativeDirector` so an
LLM-backed director (Phase 2) is a drop-in. Its rule — every line traces to a brief field — is enforced in tests and
applies to any future director.

**D-005 · 2026-10-10 · Music and SFX are synthesised locally.**
No licensing risk and $0. Quality is a clean placeholder bed, not a produced track. Phase 3 adds a licensed music
library or approved provider behind the same interface.

**D-006 · 2026-10-10 · Picture and audio are rendered separately and cached by content hash.**
Satisfies "re-export after editing without regenerating unchanged assets". Proven by `npm run e2e`.

**D-007 · 2026-10-10 · Output colour: BT.709 limited range (yuv420p, tv).**
The first render came out as full-range `yuvj420p` / BT.470BG, which some players and platforms mis-display. QC caught
it; the renderer now sets `colorSpace: "bt709"` and QC fails any other pixel format.

**D-008 · 2026-10-10 · Tests use node:test via tsx, not Vitest.**
Vitest 3 pulled a dependency with a critical advisory (tinypool) and Vitest 4 failed to install with the current
npm. node:test has no dependencies and covers what we need. `npm audit` reports 0 vulnerabilities.

**D-009 · 2026-10-10 · Short ads drop later benefits rather than flash unreadable text.**
Each scene has a reading-time floor. If the ad is too short, the last benefits are dropped (never the first). If it
still cannot fit, the plan fails with a clear message instead of rendering an unreadable ad.

**D-010 · 2026-10-10 · Phase 2 uses Next.js 16, Tailwind 4, Remotion Player and Node's built-in SQLite.**
The owner approved starting Phase 2. Raising the Node minimum to 22.13 avoids a native SQLite dependency;
the environment is Node 24.19. The server remains loopback-only and single-user. Optional paid LLM work is
deferred; the existing deterministic director stays behind its interface.

**D-011 · 2026-10-10 · Render jobs snapshot inputs and run in an independent worker process.**
The synchronous ffmpeg stages must not block UI requests. Each queued job copies its brief, plan and images;
deliveries use job-specific folders. Stable storyboard identity preserves cache reuse between exports. Only
approved revisions can queue; optimistic revision checks prevent overwrites from another tab. Interrupted
running jobs fail visibly on worker restart.

**D-012 · 2026-10-10 · Manual scene copy is recorded as an owner-supplied brief field.**
Free text from the editor belongs in `brief.approvedCopy`, with scene sources pointing to those values.
Edits revoke creative approval; approval does not imply that technical QC or creative review has passed.

**D-013 · 2026-10-10 · node:test runs without process isolation with the tsx loader.**
On Node 24.19 the isolated runner reported only file-level results; explicitly using `--test-isolation=none`
executes and reports all named assertions. Browser acceptance uses Playwright with the locally installed
Chromium, including a separate opt-in real render scenario.

**D-014 · 2026-10-10 · Extend the working engine with optional validated settings and a shared timeline.**
Preserve the legacy brief/storyboard contract and Bold defaults. Keep Remotion, Zod, synth audio, ffmpeg and
SQLite worker architecture; add no dependencies. Template-specific visual design stays in its component,
while capabilities/configuration and frame primitives are reusable. New template IDs require actual component
registration and verification. CSS perspective supports planar camera effects; real 3D is not claimed.

**D-015 · 2026-10-10 · Preserve two references and compare complete decoded output.**
Keep the original handoff video untouched and copy the latest working render before refactoring. Compare every
decoded video frame with timing and decoded PCM audio, after forcing a new picture render through changed
implementation hashes. Historical environments may differ, so identify the exact baseline in the report.


**D-016 · 2026-10-10 · References distinguish observed frames from supplied interpretations.**
The owner confirmed the cartoon contact sheet as Reference 001. Its accompanying advertising-montage
analysis conflicts with those images and is preserved only for provenance. The source MP4 is missing;
its hash/metadata remain reported. Reference media remain isolated from production assets. A generic
poster-stack-depth proposal is experimental and not represented as an observed source technique.

**D-017 · 2026-10-10 · Opt-in scene preset on an independent review branch.**
Extend the existing Bold template with an optional motionPreset in structured configuration. No preset
default is added; missing configuration uses the original scene components. Shared transition/camera/audio
clocks remain unchanged. Only reveal/benefit scenes are eligible and all planes must settle within their
scene. Keep main untouched and open a PR; merging requires owner approval.


**D-018 · 2026-10-10 · Owner-requested GSAP installation and image-only reference memory.**
Install GSAP 3.15.0 with exact lockfile pinning and its no-charge license. Existing transforms/parallax
remain deterministic frame primitives. Future GSAP integration must pause/seek by frame, not play timers.
The owner requested Reference 003 ingestion for creative memory and images only; halt the running demo
comparison and create no further videos. The confirmed product-grid footage contradicts supplied
READY/GO analysis. Track review images/reports, store source video in ignored local output, and expose
evidence-linked retrieval without modifying the default creative director. Review branch is now
`codex/reference-learning-003`; no automatic merge.

## 2026-10-11 — Optional illustrated 2D template
Owner explicitly requested a short 2D motion video, then clarified cartoon styling with
apparent 3D volume. Extend the existing registry with `toon-commercial`; use drawn facets,
highlights and shadows, not an out-of-plane camera. Reject unsupported perspective controls.
Keep actual product data/assets local and preserve the original template. New work stays on
`codex/kinza-2d-motion`; previous main integration approval does not authorize this merge.
