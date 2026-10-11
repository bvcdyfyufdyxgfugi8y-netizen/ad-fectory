---
name: ad-render
description: Video Motion Intelligence for AD Factory. Learn directing and motion from references, adapt tested techniques to any target product, then plan, preview, render or re-export through the existing engine.
---

# Video Motion Intelligence and ad rendering

This is the existing ad-render skill expanded in place, not a parallel system. This file is the canonical creative-transfer policy for Codex and other agents.

## 14. Product-independent creative learning and adaptation

Learn the advertising technique, not the advertised product. Separate reference identity, images, colors, text and claims from target product assets and facts. Techniques are category-neutral unless a genuine physical requirement (depth, reflections, deformation, transparency) is recorded and satisfied. Never infer physical measurements, audience, material, benefits or marketing claims from a reference product.

### Route the input before production

- **VIDEO REFERENCE MODE:** a video without an advertisement request and target product is knowledge input. Review the complete available video, record coverage and gaps, inspect contact sheets/native frames, measure metadata and inspect audio when available. Save evidence-linked observations and transferable techniques in the existing reference library. Do not produce an ad for the reference product.
- **PRODUCT PRODUCTION MODE:** explicit ad request plus target image, description or assets means production using this engine. A description/image still needs the existing validated brief fields; collect missing brand, audience, facts and assets rather than inventing them.
- **Mixed input:** video is a style reference and the supplied product is the target, unless explicitly overridden. Reference assets remain reference-only.
- `src/intake/creative-mode.ts` implements routing. `npm run creative:intake -- request.json` accepts reviewed reference **manifest** paths and/or `productBrief` with `advertise:true`; it emits analysis coverage or an adaptive storyboard without rendering. Raw video analysis is agent-assisted, not an automatic vision model/API. Import/review a raw file with the existing reference workflow before passing its manifest to this CLI.

### Analyze how the advertisement works

Review these fourteen domains: camera language/movement; composition; product reveal; transitions/match cuts; kinetic typography; curves/easing; 2D/2.5D/3D; lighting/color rhythm; music synchronization; sound design; storytelling; attention/persuasion; emotional pacing; commercial impact. Each conclusion needs evidence, confidence and observed/hypothesized/unverified status. A sampled image cannot establish continuous motion or sound. Commercial impact and audience response remain unmeasured without evaluation data. Distinguish observed color from measured lighting or rhythm. Do not claim complete analysis when media or evidence is missing.

Keep the supplied source analysis as provenance even if wrong. Use reviewed ingestion records and their `analysis.domains` to correct it. `analysisCoverage` exposes all fourteen domains, leaving absent measurements unverified.

### Save universal techniques, not duplicate ads

The single registry is `references/creative-memory.json`, accessed by `openReferenceMemory`; no second library. Keep existing evidence-linked lessons. Deduplicate by canonical technique ID and aliases, then attach additional lessons/reference evidence to that technique. `variant-in-place` generalizes the existing `flavor-color-swap` lesson without changing its source evidence.

Statuses are **observed**, **experimental**, **approved**. Observed does not mean executable. Approval requires an implemented compatible executor, focused tests, actual visual/motion verification and reviewed evidence. Test new techniques before adoption; neither GSAP installation nor an impressive reference proves implementability. No automatic promotion from reference ingestion or feedback. Do not change production defaults because of one reference.

### Adapt to the target product

1. Read supplied category, shape, proportions/dimensions and material; inspect owned assets. Local image canvas aspect can be measured during CLI/server planning when no aspect is supplied; pixel aspect is not a physical measurement. Unknown information stays unknown.
2. Use the brief's audience, goal, brand identity and supplied primary feature; do not invent a USP.
3. Retrieve relevant reference lessons and tested executable techniques. Mix compatible techniques from multiple references when available; do not force a blend when no suitable tested recipes exist.
4. Evaluate **product compatibility, brand identity, visual clarity, marketing objective, technical feasibility, audience appeal and motion/audio harmony**. Persist scores and reasons, including rejection and uncertainty. Reject unmet physical requirements, unsupported true 3D and untested recipes. Do not use motion just because it is impressive.
5. Build an original creative direction and readable storyboard using the existing director, allocator, template registry and engine. Parameterize assets/category/dimensions, brand colors, typography, scene duration, intensity, camera direction, lighting, audio cues and transition. Separate all these bindings from motion implementation. Honor only implemented controls; reject unsupported lighting/fonts/effects rather than silently pretending they work.
6. Keep settings, scene layers, source tracing and the `creativeDirection` report editable. Synchronize supported motion/transitions to the same authored beat grid as audio; do not claim reference BPM or sound matching without measurement.
7. Render only when requested and run QC. Compare with earlier outputs using appropriate frame, motion, audio and human review; report actual evidence and limitations.

Examples: push-in/rotation/impact can transfer from construction material to a can, but true 3D rotation needs an implemented 3D executor/asset and tested physical lighting; a flat image's CSS tilt is not that rotation. Slow camera/light/elegant type can transfer from perfume to headphones, adapted to target dimensions, colors and audience. Transfer principles, not the original advertisement's appearance.

New structured product production uses `brief.creative.mode="adaptive"`, shared `planProduction`, and existing render pipeline. Omitted `creative` preserves legacy planning; new UI projects enable adaptive planning and existing projects retain their saved mode. Shape/aspect, intensity and tone vary camera, fitting, springs, float and transitions; the original `bold-commercial` template remains the default. An optional experimental `toon-commercial` template adds cartoon 2D motion with drawn depth (see `docs/toon-commercial.md`); it requires a reviewed illustrated product asset and rejects perspective presets/out-of-plane cameras. Cinematic/grid templates, true 3D, custom lighting and automated multimodal/audio analysis remain future work. Do not describe this initial rule-based adapter as a fully autonomous professional creative model.

### Improve through verified feedback

After a new ad, record successful choices, improvements needed, comparison production ID, actual evidence and tested status via `npm run references -- --feedback review.json`. Feedback appends to the same registry without changing approval/defaults. Compare quality with previous productions before proposing changes. Apply future improvements through a tested review branch. Preserve old ads, original references and their visual identity. **Never merge into main without the owner's explicit approval.** An approval to commit/push/open a draft PR is not permission to merge.

## Production workflow

1. Validate the brief and owned assets. For new production use adaptive options; preserve existing briefs unless explicitly asked to adapt them.
2. `npm run storyboard -- <brief>`; read `out/<id>/storyboard.json`, hook/order/source and creative decisions/bindings. No video is created by this step.
3. When authorized: optional `npm run preview -- <brief>`; full `npm run produce -- <brief> [--storyboard <edited.json>]`.
4. Inspect QC, contact sheet and cover yourself using the existing ad-creative-qa skill. Do not claim visual equivalence without actual verification.

Outputs remain `out/<id>/delivery/`, storyboard, QC and run metadata. Expected export: 1080×1920, 30fps, H.264 yuv420p BT.709, AAC48kHz; true peak ≤−0.5dBFS, loudness≈−14LUFS. Human review remains required. Respect an images-only request; do not run video e2e/preview/produce under that restriction. Report which export/motion checks were therefore not performed.

Errors: shorten copy or raise duration when reading floors exceed beats; fix schema/asset errors rather than weakening validation; set REMOTION_BROWSER for the existing local browser. Scene lengths use the configured integer frame beat grid (15 frames at 120BPM/30fps), and must sum to the total.
