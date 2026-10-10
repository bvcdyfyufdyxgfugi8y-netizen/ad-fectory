# Reference 001 — reviewed evidence

The owner confirmed on 2026-10-10 that **the cartoon contact sheet is the intended reference**.
The supplied `creative-analysis.md` is retained verbatim for provenance, but its advertising montage
classification and time-indexed UI/poster claims are contradicted by the contact sheet. Do not use them as verified facts.

## What was actually inspected

The supplied JPEG has 33 labeled samples (00–61 s), 1260×2340. Its visible subject is an Arabic educational
cartoon about the stomach, with outlined characters, purple environments, green/blue clothing,
yellow skin/props, and red anatomy backgrounds. Labels 19–29 show diagram callouts; labels 45–49 show
Arabic medical labels. The shift between wide shots and close crops is visible. Exact camera paths,
easing, scene boundaries, BPM, sound or synchronized movements cannot be established from these stills.
The montage is not established: continuity between samples suggests an educational sequence, but the MP4 is missing.

The source duration, dimensions, frame rate and hash in `reference-index.json` remain **reported** values.
The archive and individual supplied files have independently computed SHA-256 hashes in `ingestion.json`.
No original MP4 was present among local attachments. No generated output claims to reproduce it.

## Proposal vs observation

`poster-stack-depth` is an independent, general-purpose layered-card proposal from the task document.
The contact sheet does **not** demonstrate a poster stack. Its experiment uses only existing owned fictional
MINT product SVGs and existing brand colors. No characters, anatomy, medical claims, third-party logo,
reference image or supplied audio enter the advertisement. The reference license remains unknown/reference-only.

All five supplied motion proposals remain unconfirmed as source techniques. Only one is implemented as
an optional proof of concept. The default template and the Toon Studio source repository are preserved.

## Ingestion

`ReferenceSchema` validates provenance, full hashes, licensing, evidence/confidence, time bounds and local paths.
`loadReference()` verifies all artifact hashes, rejects symlink escapes and verifies the MP4 only when a
local source is present and explicitly marked verified. This reference is not a production-asset manifest.

Contact sheet was retained at its supplied size (571 KiB), already suitable for Git review, without recompression
that could blur small Arabic labels. Its original bytes and hash are preserved. No source video is committed.
