# Product-independent creative learning: verification

Date: 2026-10-10. Review branch: `codex/product-independent-creative-learning`, based on reference review commit `1d5de2f468ec0237fda4d98807ee8dc152da6dc0`. Main is unchanged. The new review is stacked on the existing reference branch; neither PR is merged.

## Automated checks

- `npm run check`: TypeScript, ESLint and 62 focused/unit/regression tests pass. Coverage includes reference-vs-product routing, mixed input roles, category-neutral choices, owned target assets, old storyboard/timeline equality, shape/tone adaptation, seven-factor scoring, unsupported 3D/lighting rejection, low-contrast selection rejection, canonical deduplication, evidence/feedback validation, 14-domain unknowns, editable binding updates and local image aspect without invented physical dimensions.
- Arabic Playwright editing/approval/upload/mobile integration test: **1/1 PASS** (17.7s), including adaptive new-project data and direction report. No render job was submitted.
- Next production build: **PASS**, including the final API/metadata integration.
- Reference-only and mixed-target CLI intake smoke checks: PASS; reference mode emits no target/no production, mixed mode targets MINT and keeps reference recipes separate.
- No video e2e or render-export browser test was run: the owner requested images only. Export codec/audio continuity/loudness of adaptive ads therefore remain unverified.

## Actual image comparison

`src/cli/creative-snapshots.ts` bundled the previous review commit in a detached baseline checkout and the current renderer independently, and rendered native 1080×1920 PNGs. Legacy MINT frames **173, 178, 220, 260** are exactly equal by full PNG SHA-256 (four of four). Old Nafas and MINT storyboards/cues also remain exactly equal in data regression tests. Original videos/assets were not changed.

Two target inputs use the same engine without animation source edits:

| Target | Inputs | Verified PNG frames |
| --- | --- | --- |
| Nafas cold brew | Original Arabic facts/colors/owned can; canvas aspect 0.6; intensity 0.3; pull-out | 137, 235 |
| MINT bottle | Original English facts/colors/owned bottle; canvas aspect 0.6; intensity 0.8; authored reveal camera preserved | 106, 181 |

Each pair was rendered through **two freshly built bundles**; all repeated PNG hashes match. Inspected reveal images show readable target-owned products/type and their respective brand colors; this does not establish professional advertising quality or continuous motion/audio quality. No reference branding is copied into production inputs.

Committed proof: `samples/product-independent-learning/verification.json` and four sample PNGs. Local full comparison/repeat images, generated editable storyboards and UI screenshots: `out/product-independent-learning/`. Pictures ZIP: `/workspace/ad-factory/out/product-independent-learning-images.zip`.

Claims are limited to selected frames and deterministic data; full visual equivalence is **not** claimed. Existing reference-derived grid/cartoon/variant techniques remain observed, not automatically executable. The current adapter is rule-based with one template, an authored audio beat grid and no autonomous raw-video understanding/custom lighting/true 3D. Commercial impact and audience appeal remain unmeasured.

Editable demo brief inputs: `briefs/demo-nafas/adaptive-brief.json`, `briefs/demo-mint/adaptive-brief.json`. Their new IDs keep original job outputs separate. Both CLI storyboard stages pass; outputs are `out/adaptive-nafas/storyboard.json` and `out/adaptive-mint/storyboard.json`.
