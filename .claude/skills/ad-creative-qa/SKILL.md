---
name: ad-creative-qa
description: Review an AD Factory render for technical and creative quality and write an honest report. Use after any production render or when asked whether an ad is ready for a client.
---

# Creative QA

**When:** after `npm run produce`, before anything is shown to a client.

**Inputs:** `out/<id>/qc-report.json`, `contact-sheet.jpg`, the MP4, `storyboard.json`, the brief.

**Steps**
1. Automated: confirm `passed: true`; list every `warn` with its measured value.
2. Visual (look at frames, do not assume): Arabic letters joined and not clipped; product clearly visible in reveal
   and CTA; no text outside the safe area; contrast readable; transitions motivated.
3. Creative: hook readable in the first second; scene order makes sense; CTA clear; motion not repetitive; music fits.
4. Claims: every on-screen line matches a `scene.source` brief field. Anything else is a defect.
5. Write findings in three groups: automated passes · problems found · needs owner/human review.

**Output:** a short report; never call an ad "professional" or "ready" on automated checks alone.

**Expected issues:** long Arabic lines wrapping into 3 lines (shorten copy); product art too small or low-res
(ask for better assets); identical motion across benefit scenes (vary in a later template).
