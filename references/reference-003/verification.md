# Reference 003 — product-grid evidence, images only

The actual source and supplied contact sheet show **Mirinda product tiles**, not READY/GO typography.
Both the supplied analysis and timeline are retained verbatim as provenance and are marked conflicting.
The inspected source has a stable rounded asymmetric grid throughout all 132 video frames. Hero flavor art,
wordmarks, icons and can positions change inside those cells. No full-screen READY/GO stage, lime card crossing
large headlines, or pink global palette reset is visible. Those supplied motion recipes remain unconfirmed.

## Measured source

736×414 (16:9), H.264, 30000/1001 fps, 132 video frames; video duration 4.404400 s.
AAC audio: 44.1 kHz, duration 4.436009 s. Audio presence was probed; it was not listened to or beat-analyzed.
The full source SHA-256 and import measurements are recorded in `source-verification.json` and `ingestion.json`.
Native PNG samples use exact frame indices 8, 28, 62, 80 and 107 (time = frame × 1001/30000).
`all-132-frames.jpg` includes every decoded video frame; `contact.jpg` is the untouched supplied contact sheet.
These are extractions from existing footage, not newly generated videos.

The MP4 is kept only in ignored `out/reference-library/reference-003/source.mp4`, outside Git.
`local-untracked` means its bytes were verified at import, not distributed to repository clones.
The loader checks the immutable import report's hash and its agreement with the recorded source hash;
it does not imply that clones can reverify absent source bytes.

## Creative memory lessons

- `asymmetric-product-grid`: stable tile structure with a dominant product and supporting content.
- `tile-content-loop`: movement/replacement inside tile boundaries without losing the outer hierarchy.
- `flavor-color-swap`: visible product variant changes inside the hero tile.

`references/creative-memory.json` contains original reusable guidance derived from verified observations.
Suggested implementations are advice, not recovered source keyframes or implemented production presets.
The memory loader rejects lessons linked to conflicting/hypothesized observations or missing evidence.
No default ad-director behavior changes; the catalog is available through `ReferenceMemory.listLessons()`
and `npm run references`. This is explicit reference retrieval, not training external model weights.

No Reference 003 animation or new video was made, per the owner's latest instruction. The brand artwork,
logos and footage remain reference-only; all future production imagery must come from owned brief assets.
Future vertical versions require reflowed layouts, not stretching. No physical 3D/parallax or soundtrack sync
is inferred from this source. Four prototypes in the supplied task were not executed under the image-only scope.
