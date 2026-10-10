# Reviewed creative reference library

Run `npm run references` to validate and retrieve the four current evidence-linked lessons.
`creative-memory.json` is the curated catalog; `src/creative/reference-memory.ts` exposes its provider interface.
This is a local reference knowledge library, not external model training or an automatic change to ad generation.

| Reference | Confirmed subject | Evidence | Source footage |
|---|---|---|---|
| 001 | Arabic educational cartoon about the stomach | Supplied contact sheet, owner confirmation | Missing |
| 003 | Mirinda asymmetric product grid | Native source samples + all 132 frames | Verified at import, local only |

The original supplied analyses conflict with the confirmed subjects. Read each `verification.md` and
validated `ingestion.json`; do not use the supplied choreography as fact. Confidence values are editorial
assessments, not measured probabilities. Any implementation guidance is a new proposal.

Only reports, metadata and review images are tracked. Unknown-license footage is reference-only and not
registered as production assets. `ReferenceSchema` tracks provenance, full hashes, supplied vs measured
metadata, availability and evidence. `loadReference()` checks distributed files and verification reports.
Do not put client material or source footage into Git. No references are sent to paid APIs.
