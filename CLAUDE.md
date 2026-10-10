# AD Factory — standing rules

Read this first in every session. Detail lives in the linked files; do not pile instructions in here.

## What this is
A production engine for short vertical ads (brief → storyboard → motion → audio → render → QC → delivery).
Owner: makes business decisions and final creative approval. Claude: builds, tests, documents.

## Boundaries
- AD Factory lives only in `ad-factory/`. Never modify, move or delete anything outside it (the rest of the repo is
  Toon Studio). Reading Toon Studio for ideas is fine; copy nothing without checking its licence and dependencies.
- No paid API calls, subscriptions, uploads or publishing without the owner's explicit approval for that action.
  `PAID_BUDGET_USD_PER_AD=0` means paid calls are refused.
- Never commit `.env`, keys, client files that are not demo assets, or anything from `out/` and `cache/`.
- Never invent product claims, results, reviews or offers. Every on-screen line must trace to a brief field
  (`scene.source`). Template copy is limited to `src/creative/copy.ts`.
- Music/SFX/fonts/images must have a clear licence. Default: synthesise locally.

## How to work
- Phases in order (`ROADMAP.md`). Do not start a phase before the previous one's acceptance tests pass.
- After any change: `npm run check`. After render-path changes: `npm run e2e` (real renders).
- A feature "works" only when a real export proves it. Say what is experimental.
- Record: decisions → `DECISIONS.md`, changes → `CHANGELOG.md`, status/next step → `PROGRESS.md`,
  spend → `COSTS.md`, structure → `ARCHITECTURE.md`.
- Every provider (creative director, voice, music, storage, publishing) sits behind an interface so it can be swapped.

## Map
- Contracts: `src/core/schema.ts` (Brief, Storyboard)
- Pipeline entry: `src/cli/produce.ts`
- Template: `src/remotion/templates/bold-commercial/` (safe area + type rules in `theme.ts`)
- Skills: `.claude/skills/ad-render/`, `.claude/skills/ad-creative-qa/`
