# Reviewed creative reference library

Run `npm run references` to validate and retrieve the current evidence-linked lessons and canonical technique catalog.
`creative-memory.json` is the curated catalog; `src/creative/reference-memory.ts` exposes its provider interface.
This is a local reference knowledge library, not external model training or an automatic change to ad generation.

| Reference | Confirmed subject | Evidence | Source footage |
|---|---|---|---|
| 001 | Arabic educational cartoon about the stomach | Supplied contact sheet, owner confirmation | Missing |
| 003 | Mirinda asymmetric product grid | Native source samples + all 132 frames | Verified at import, local only |
| 004 | PUZZLE graphic assembly, burst and title reveal | Six native samples + all 236 frames; signal-only audio review | Verified at import, local only |

For 001 and 003, supplied analyses conflict with the confirmed subjects. Read their `verification.md` and
validated `ingestion.json`; for 004 read `analysis.md` and `source-verification.json`. Do not use unverified choreography as fact. Confidence values are editorial
assessments, not measured probabilities. Any implementation guidance is a new proposal.

Only reports, metadata and review images are tracked. Unknown-license footage is reference-only and not
registered as production assets. `ReferenceSchema` tracks provenance, full hashes, supplied vs measured
metadata, availability and evidence. `loadReference()` checks distributed files and verification reports.
Do not put client material or source footage into Git. No references are sent to paid APIs.

Product-independent planning retrieves tested approved executors from this same catalog. New observed techniques are not auto-approved. The canonical policy is the existing ad-render skill, section 14. Earlier Toon Studio palette facts/provenance are under `toon-studio/`; product colors remain owned brief inputs.
