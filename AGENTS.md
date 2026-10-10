# Agent instructions

Follow `CLAUDE.md` in this folder: its rules apply to every coding agent working on AD Factory (Codex included).
Start with `HANDOFF.md`, then `PROGRESS.md`. Run `npm run check` after changes and `npm run e2e` after render-path changes.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Product-independent creative policy

Read [.claude/skills/ad-render/SKILL.md](.claude/skills/ad-render/SKILL.md), section 14 (Video Motion Intelligence), before reference intake or new product production. It is the single canonical policy; use the existing registry and production engine. Main merges require explicit owner approval.
