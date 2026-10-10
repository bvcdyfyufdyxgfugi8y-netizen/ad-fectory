# Product-independent creative learning — implementation plan

Extend the existing ad-render skill (Video Motion Intelligence entry point), reference-memory provider,
CreativeDirector, storyboard builder and existing renderer. Do not create a separate production system.
Old briefs remain reproducible; explicit new-ad routing selects adaptive direction. Main is not merged.
Latest owner scope remains no new video: validate data, existing-plan regressions and native PNGs only.

1. One canonical policy in the existing skill: reference-only vs product-production routing; fourteen analysis
   domains; observations vs inference, portable techniques vs physical constraints, truthful status, no blind copying.
2. Extend existing creative-memory.json with a deduplicated universal technique registry. Keep reference identity
   only in provenance. Imported proposals remain unapproved until implementation/test evidence exists.
3. Product profile from stated category/shape/dimensions/material and local image dimensions; unknowns remain
   unknown. Brief facts supply audience/goal/primary feature; never infer promises from reference brands.
4. Score approved executable techniques for product, brand, clarity, objective, feasibility, audience and motion/audio
   harmony. Reject unsupported 3D, unknown evidence, conflicts or missing physical inputs. Produce explanations.
5. Parameterize selected techniques into existing engine fields: camera, layout/type, animation, transition and cue
   clocks. Reuse rule-based copy, existing scenes, shared timeline and renderer. Preserve editable direction report.
6. Wire the same optional adaptive planner into CLI and server planning; old briefs/edited jobs retain old behavior.
   Reference ingestion routes never produce ads. Explicit product-ad requests choose adaptation; mixed video+product
   treats the video as a source and the supplied product as target.
7. Record outcome feedback in the same library with evidence/status checks, no automatic promotions or default-rule
   mutations. Persist agent policy pointers, run focused tests and native image verification; no new video or main merge.

Limits to report: one current visual template, CSS planar depth only, local rule-based interpretation rather than
an external vision/LLM/audio model, audio synch uses authored engine cues rather than unmeasured reference BPM.

## Implemented integration

The existing `references/creative-memory.json` now holds canonical techniques and aliases, lifecycle status, requirements, evidence links and feedback alongside its original lessons. No source brand assets enter target briefs. `variant-in-place` aliases the former flavor-specific recipe; its original lesson remains intact as evidence. Four reference-derived recipes are observed only, poster-stack remains experimental, and three existing engine executors (camera, typography, transition) are approved for the bounded rule-based adapter.

`creative/contracts.ts` provides validated profile/options/report/technique/feedback contracts. `creative/adaptation.ts` ranks seven dimensions, rejects unmet physical/true-3D requirements and unknown executors, permits one technique per motion family, and uses existing camera, layout, spring, float, transition and timeline controls. The score is a transparent heuristic, not a measured advertising-performance prediction; audience appeal stays neutral and unmeasured. Brand contrast affects clarity. Engine-native light/font are the supported choices; unsupported custom lighting/font requests fail validation or planning.

`creative/plan.ts` is the shared server/CLI boundary; no filesystem imports enter the Remotion director/browser bundle. New UI projects use adaptive planning, existing stored projects and briefs without `creative` retain their legacy path. Local asset inspection measures canvas aspect only (SVG/PNG headers; bounded ffprobe for JPEG/WebP); it does not invent physical facts. Edited storyboards refresh duration/asset/color/cue bindings and retain quiet cue settings.

`creative:intake` routes reviewed reference manifests alone to coverage output, explicit product requests to adaptive planning, and mixed requests to reference style plus target product. It never renders. Raw media still needs the existing agent-assisted import/review; automatic raw-video understanding is not implemented. The 14-domain coverage contract records unknown measurements explicitly. Existing reference manifests classify reviewed visual observations only; original supplied media/analyses stay unchanged.

Feedback is validated and appended to the same registry with comparison ID, observations and evidence, without changing technique approvals/defaults. Canonical IDs/aliases prevent structural duplicates; semantic deduplication and approval remain reviewed actions.

The permanent creative policy lives only in the expanded `.claude/skills/ad-render/SKILL.md`, section 14, named Video Motion Intelligence. AGENTS/CLAUDE point there. There was no separate VMI skill file to migrate.

## Use

```json
{
  "creative": {
    "mode": "adaptive",
    "profile": { "shape": "tall", "material": "unknown" },
    "intensity": 0.35,
    "cameraDirection": "pull-out",
    "lightingStyle": "template",
    "typography": "alexandria",
    "transition": "fade",
    "audio": "engine-cues"
  }
}
```

Add this optional object to a new validated brief. Leave `profile.assetAspect` absent for local image measurement when a brief directory is available. Supply actual physical dimensions only when known. `npm run storyboard -- <brief>` writes the editable storyboard and its creativeDirection without producing video. `audio:"quiet"` removes SFX cues; background music remains governed by engine audio settings. Reference selection can use `referenceIds`; unknown IDs are rejected. Until observed recipes gain tested executors, production falls back to the approved existing motion vocabulary and reports those rejections.

Example intake request: `{ "references": ["../../references/reference-003/ingestion.json"], "productBrief": "../product/brief.json", "advertise": true }` (paths relative to the request file). Omitting productBrief and advertise yields reference-learning mode. `npm run creative:intake -- request.json` prints the result; references must already be registered/reviewed before adaptation.

## Verification and remaining work

See [verification results](reports/product-independent-learning-results.md). Verification is PNG-only under the owner's standing instruction; full video e2e/export QC was intentionally not run. No new MP4, paid API, deployment or main merge.

Next phase: implement and visually/motion-test one reference-derived composition executor (grid or Toon), then approve it through evidence review; add timing/audio measurement and a reviewed multimodal director through existing provider interfaces. Expand font/lighting/true-3D capabilities with real implementation and tests before enabling their presets. Gather comparative production reviews and measured audience feedback before treating heuristic scores as learned performance.

Ready-to-use adaptive inputs preserve the originals: `briefs/demo-nafas/adaptive-brief.json` and `briefs/demo-mint/adaptive-brief.json`, each with a new production ID.
