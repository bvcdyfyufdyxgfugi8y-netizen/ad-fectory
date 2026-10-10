# AD Factory — Reference 003: READY → GO → Product Grid

Source: `1137893752099073286.mp4`. Duration 4.436 s, 736×414, 30000/1001 fps, audio present. This is an approximately 4.4-second horizontal graphic motion sequence, **not a vertical 9:16 advertisement**. Timings are approximate observations at source resolution, not recoverable source keyframes.

## Visual breakdown

| Approx. time | What is visible | Motion/camera inference | Transition and design lessons |
|---|---|---|---|
| 0.00–0.55 | Saturated cyan-blue background, huge white/cream `READY` typography, tilted vivid-lime rectangular card with a partial ring/icon element | Layer rotation and translation; scale/position animation are more plausible than a moving 3D camera | Intro should establish a single dominant typographic word and bold shape contrast |
| 0.55–1.65 | The lime card repeatedly repositions/rotates, revealing different amounts of large headline behind it | 2D transforms, possibly slight keyframed acceleration/deceleration; preserve occlusion and hierarchy | Build rhythm with shape-over-type occlusion and energetic easing |
| 1.65–2.65 | Wipe/shape movement resets the large-type scene; the typography reads `GO` | 2D stage or composition replacement; no evidence of physical lens shift | Make impact word replacement legible through a foreground graphical transition |
| 2.65–3.15 | Large `GO` still on cyan background, lime shape moves out/in around text | Bold type + graphic element choreography | Hold hero word briefly before cut |
| 3.15–4.44 | Warm pink/red field, light/green outlines and a multi-column assortment of small illustrated product/object marks; some art elements rise/slide/reveal | Grid reveal / stagger and shape motion; not necessarily camera 3D | Strong contrast cut from singular hero word to many repeated smaller motifs; build an original product-grid reveal |

## Camera analysis — distinguish observation from implementation

- **Observed:** Flat high-contrast graphics, foreground lime shape overlapping large white typography, scene-wide hard color switch, grid of symbols in the final scene.
- **Not demonstrated by the footage:** A real 3D camera, focal length, camera tracking, physically-based depth of field, or multi-plane parallax. Do not falsely tag them as confirmed.
- **Proposed implementation:** A single full-frame composition with independent `readyWord`, `goWord`, `limeCard`, and `productGrid` layers; GSAP transforms on DOM/SVG; CSS clip-path/masks if useful; Remotion timeline to place cuts at deterministic frame indices.

## Motion recipes (original technique, not copied layout)

1. `headline-card-occlusion`: oversized hero text and independently moving tilted foreground brand card. Parameters: enteringAngle, crossingDirection, maskCoverage, anticipationFrames, settlingFrames.
2. `impact-word-switch`: legible text swap during dominant shape wipe. Parameters: oldWord, newWord, swapFrame, direction, impactSoundId.
3. `single-to-many-grid`: graphic contrast cut from one large central concept to a staggered set of smaller graphic tiles. Parameters: gridColumns, gridRows, staggerFrames, tileMotionType, contrastColor.
4. `palette-hard-reset`: purposeful switch from cool cyan/lime to warm pink/green while maintaining type legibility. Parameters: entryFrame, paletteA, paletteB, holdFrames.

## Sound and musical synchronization

Audio exists, but attribution of specific SFX or exact beat mapping is **not verified** by visual inspection. Extract peaks/onsets from the audio waveform for a timing guide; listen before labeling particular sounds. Align `READY`, `GO`, and grid reveal with the strongest **verified** audio accents only when it improves readability. Do not claim BPM from this 4.4-second sample without enough repeated beats.

## Engineering quality gates

- Keep at least 8–12 frames of stable legibility around the hero words where feasible; quick cuts cannot make the text unreadable.
- Verify occlusion never obscures the only essential word during its semantic peak.
- Adapt layout to 9:16 with responsive safe areas; do not stretch the 736×414 reference.
- Compare render frames at moments of type swap and color reset and ensure no black/blank frames.
- Make parameters configurable and all shapes/text separately editable.
- Do not reproduce this video's exact type design, graphic motif, artwork, or brand assets; derive general choreography.

## Confidence/limitations

The coarse timings are approximate based on sampled frames. Exact keyframes/easing curves cannot be recovered from the final compressed video. A short four-second source is not enough to establish a longform pacing model or reliable music tempo.
