# Codex task — import Reference 001 into AD Factory safely

Repository target: `bvcdyfyufdyxgfugi8y-netizen/ad-fectory` (not `Motion`).

## Preflight / no destruction
1. Inspect actual source and current git status. The remote appeared empty when this package was prepared; do not assume it contains the running Ad Factory engine.
2. Preserve all existing JSON-driven ad engine code, templates, reference videos, tests, exports, assets and configuration.
3. If source is local, push its existing verified initial commit to `ad-fectory/main` **only with owner's approval**. Never replace existing source or force-push.
4. Once main is established, create branch `codex/reference-learning-001`, in its own worktree if possible.
5. Add this package under `references/reference-001/` excluding the original MP4 until storage policy is decided. Commit analysis/index and optimized contact sheet; never check huge videos into Git without an explicit strategy.

## Task scope
- Read creative-analysis.md and inspect the user-supplied MP4 if available locally.
- Verify proposed techniques against sampled frames/time ranges; mark observed vs hypothesized aspects.
- Create a reference ingestion schema with hash, license metadata, provenance and analysis confidence.
- Implement **one** proof-of-concept motion preset only (`grid-to-hero` or `poster-stack-depth`) as a new isolated preset compatible with the existing JSON configuration; do not alter default styles.
- Use the project's existing animation framework; don't introduce GSAP or Remotion if the current engine does not use them.
- Build tests for data validation, timing, rendering, visual-regression snapshots and no changes to existing example ads.
- Provide before/after demo and test evidence on a PR; no merge without owner approval.

## Important
- File is a compilation; do not claim one common tempo/BPM or soundtrack-driven structure without measuring audio.
- Never reverse-engineer exact third-party imagery for redistribution; learn reusable animation principles.
- Do not perform paid generation, deploy, publish, or push changes to another repo.
