# Architecture

## Pipeline (Phase 1)

```
brief.json ──► Intake ──► Creative Director ──► Storyboard ──► Audio Engine ──┐
 (client)     validate     strategy, 3 hooks,     beat-quantised   synth bed+SFX,  │
              + assets     scene plan, sources    timing, SFX cues  duck, -14 LUFS │
                                                       │                       ▼
                                                       └──► Rendering Engine ──► mux ──► QC ──► Delivery
                                                            Remotion (silent       ffmpeg   ffprobe/   mp4, cover,
                                                            H.264), cached         AAC      detectors  caption, report
```

Two JSON contracts carry everything (`src/core/schema.ts`):
- **Brief**: what the client said. Validated with zod; assets checked for existence, size, magic bytes, unsafe SVG.
- **Storyboard**: what will be rendered. Reviewable and editable; each scene lists the brief fields its words came from.

## Modules

| Module (from the brief) | Location | Phase 1 state |
|---|---|---|
| Product Intake | `src/intake/` | ✅ schema + asset checks |
| Script Generator / AI Creative Director | `src/creative/` | ✅ rule-based (`CreativeDirector` interface; LLM later) |
| Storyboard Engine | `src/storyboard/` | ✅ beat-grid timing, reading-time floors, SFX cues |
| Motion Engine + Template Library | `src/remotion/` | ✅ 1 template: Bold Commercial |
| Audio Engine | `src/audio/` | ✅ synthesised music/SFX, ducking graph, loudness; ⏳ voice (Phase 3) |
| Rendering Engine | `src/render/` | ✅ Remotion → H.264, ffmpeg mux, content-hash cache, preview mode |
| Quality Control | `src/qc/` | ✅ technical checks; human-review list |
| Delivery (Publishing stage 1) | `src/delivery/` | ✅ MP4, cover, caption, report |
| Control UI and asset intake | `src/app/` | ✅ Arabic RTL UI, Remotion Player, uploads and delivery links |
| Projects, clients, render jobs | `src/server/` | ✅ SQLite, immutable job snapshots, single local worker |
| Publishing (Instagram), Analytics | — | ⏳ see ROADMAP |

## Key design choices
- **Picture and sound render separately** and are muxed at the end. Each is cached by a hash of exactly what affects
  it, so a text edit never rebuilds audio and an audio change never re-renders frames.
- **Beat grid**: 120 BPM at 30 fps = 15 frames per beat. Scene lengths are whole beats; transitions play in the
  10 frames before each cut, so every cut lands on a beat.
- **Safe area** (`theme.ts`): 230 px top, 430 px bottom, 90 px sides keep text clear of Reels/TikTok UI.
- **Fonts gate rendering** (`delayRender` until Alexandria is loaded) so Arabic shaping is measured with the real font.
- **Deterministic**: same storyboard → same frames and same audio bytes.

## Directory layout

```
ad-factory/
├── briefs/<id>/brief.json + assets/      inputs (demo is committed; client briefs are not)
├── src/core        schema, exec/hash helpers
├── src/intake      brief validation
├── src/creative    creative director + template copy
├── src/storyboard  timing and cues
├── src/audio       wav writer, synth, ffmpeg mix
├── src/remotion    compositions, components, templates
├── src/render      bundle/render/mux, cache
├── src/qc          checks and report
├── src/delivery    caption, cover frame
├── src/cli         produce, e2e
├── src/app         Next.js Arabic studio and API route handlers
├── src/server      SQLite store, editor validation, worker and launcher
├── tests/          node:test + browser acceptance tests
├── data/           SQLite, project assets and immutable job snapshots (git-ignored)
├── out/ cache/     generated (git-ignored)
```

## Local studio (Phase 2)
Next.js route handlers open short-lived SQLite connections (`node:sqlite`, WAL, busy timeout). `projects`
stores a brief, storyboard, revision and client reference; `jobs` records status and logs. Optimistic revision
checks prevent stale overwrites. A unique partial index prevents duplicate active jobs for the same revision.

Enqueue requires approved scenes and creates a copy of brief/storyboard/assets under `data/jobs/<uuid>/`.
Only the brief output id changes to `render-<uuid>`; storyboard identity stays stable for cache reuse. Output is
`out/render-<uuid>/delivery/`. Editing a project cannot change an already queued job or overwrite its delivery.

The launcher starts Next.js on loopback and a separate worker. A PID lock allows one worker, and SQLite
`BEGIN IMMEDIATE` atomically claims queued work. The worker spawns the existing CLI in a child process so
ffmpeg and Remotion do not block HTTP requests. On restart, interrupted running jobs become explicit failures;
queued jobs remain available. Delivery is exposed only for succeeded jobs (the CLI exits nonzero on QC failure).

The editor accepts only text, duration, order, images, colours, hook and emphasis; rendering geometry and
audio seed stay canonical. Sound cues are rebuilt after timeline edits. Owner-entered text is stored in the
brief's `approvedCopy` map, and scene sources reference it. Brief edits re-plan and revoke approval.

`AssetBase` lets the shared template use project API URLs in the Player and `staticFile()` in a render bundle.
The Player viewport uses LTR positioning; each scene keeps its own reading direction. Page typography/reset
styles are isolated from the composition. Preview has no music; the finished export includes audio.

## Scaling path (not built)
Authentication + Postgres + object storage → distributed workers → cloud render. The local studio intentionally
has no multi-user accounts, public hosting or paid integrations.

## Reusable engine extension (v0.3)

`src/engine/config.ts` validates optional engine settings. `templates.ts` declares capabilities; the browser-safe
component registry in `src/remotion/templates/registry.tsx` is shared by CLI/Studio/Player. `timeline.ts` is the
single source of scene cut/entrance clocks and SFX cues, including editor retiming. `validate.ts` checks the
production contract before work starts. Core contracts remain JSON and legacy inputs retain their defaults.

`src/remotion/motion/` supplies deterministic easing, sequencing progress, zoom, parallax, floating, spring,
transition and planar camera transforms. Template-specific art direction remains inside Bold Commercial.
Configuration context replaces layout/type/product size constants without changing default geometry. Full 3D
geometry and other templates are future implementations; unsupported identifiers are rejected.

Export settings are validated and honored by render/mux. Audio settings control local synthesis/mix; picture
cache excludes audio controls/bitrate while audio cache excludes visual settings. Engine/render implementation
hashes invalidate stale picture caches. Input assets are checked by realpath, including symlink escapes.


## Reference learning experiment
`src/core/reference.ts` and `src/references/load.ts` validate isolated, reference-only manifests and supplied
file hashes. `references/reference-001/` retains the source package with a reviewed evidence record.
An optional `engine.motionPreset` chooses the one experimental poster-stack-depth renderer in
`src/remotion/motion/presets/`; other scenes remain on their existing path. This creates no new template,
provider or dependency. `src/cli/reference-snapshots.ts` verifies three native PNGs across two fresh bundles.

`references/creative-memory.json` links original reuse guidance to verified observations.
`src/creative/reference-memory.ts` validates and retrieves lessons through `ReferenceMemory`;
`npm run references` exposes the catalog without rendering or invoking a model. Reference 003 source
hash/metadata were measured at import; its video remains local/untracked and the import report is verified.
GSAP 3.15.0 is installed; default render motion still uses the existing frame primitives.

## Experimental illustrated 2D template (2026-10-11)
`src/remotion/templates/toon-commercial/ToonCommercial.tsx` extends the existing shared
registry/Composition dispatcher. It takes the same Storyboard and assetBase, uses the same
scene timeline and frame primitives, and draws decorative planar layers separately from
product/text. Apparent depth comes from artwork and offset silhouettes. Validation rejects
rotateX/rotateY cameras and the old perspective preset for this template. See
`docs/toon-commercial.md`. No parallel pipeline or product-specific animation source.

Optional `engine.animation.toon` validates continuous assembly/orbit/burst controls.
`src/remotion/motion/toon-stage.ts` computes shared beat-aware planar hero state;
Toon Commercial separates that persistent asset layer from text sequences. Omitting the
optional controls preserves legacy config serialization and existing default production.
