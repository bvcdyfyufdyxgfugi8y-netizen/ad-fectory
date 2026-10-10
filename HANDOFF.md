# AD Factory — handoff (for Codex or any new agent)

## Reference memory review branch
`codex/reference-learning-003` adds Reference 001/003 evidence-linked memory, optional poster-stack POC
and owner-requested GSAP 3.15.0. Latest user instruction: images only, no further videos. Main is unchanged.
Read `references/README.md` and `docs/reports/reference-learning-results.md`; supplied analyses conflict
with actual images. Reference 003 source is local/untracked. PR requires owner approval before merge.

## Scalable engine extension — v0.3.0

Read `docs/reports/phase-2-engine-results.md`, `docs/engine-audit-plan.md` and `docs/engine-inputs.md` for the latest requested engine work. Optional validated settings, shared timeline/registry and reusable motion extend the existing studio. The current engine regression reference is `samples/engine-regression/`; the historical original remains untouched. Exact pixel equivalence is not claimed.


## تحديث المرحلة الثانية — 2026-10-10

تمت إضافة استوديو إنتاج محلي بواجهة عربية: بيانات المنتج والصور والشعار، محرّر المشاهد، اختيار الافتتاحية،
معاينة Remotion، اعتماد المشاهد، وطابور إنتاج محفوظ في SQLite. تشغيل الواجهة والعامل:

```bash
npm ci --include=dev              # Node >= 22.13
npm run dev                      # http://127.0.0.1:3000
# أو نسخة الإنتاج:
npm run build
npm start
```

المصدر الأصلي هو الحزمة المذكورة أدناه؛ هذا التحديث ليس لقطة commit جديد. نسخة المشروع الآن `0.2.0`.
لا تتضمن حزمة التسليم `.git` أو `node_modules` أو بيانات العملاء في `data/` أو `out/` أو `cache/`.
كل مشروع جديد يبدأ ببيانات وصور تجريبية يجب استبدالها. المصدر يدعم رفع صور المنتج والشعار محليًا.

اقرأ `docs/reports/phase-2-results.md` لنتائج التحقق الحالية. صور الواجهة في `docs/reports/phase-2-*.png`.
نجحت اختبارات الأنواع وlint و30 اختبارًا مسمى، وبناء الإنتاج، واختبارا المتصفح (مع تصدير فعلي)،
واختبار CLI الكامل. العينة المعدّلة والتقرير في `samples/phase-2/`.
بيانات المشاريع والصور ونسخ المهام في `data/`؛ التسليمات في `out/render-<job-id>/delivery/`.
تعديل المشروع أثناء الإنتاج لا يغيّر نسخة المهمة. تغيير بيانات المنتج يعيد بناء المشاهد ويلغي اعتمادها.
النص اليدوي في المحرّر محفوظ ضمن `brief.approvedCopy` مع مصدره؛ يجب مراجعته قبل الاعتماد.

الواجهة محلية لمستخدم واحد؛ لا يوجد نشر عام أو حسابات. لا توجد تكاملات مدفوعة أو تعليق صوتي مُولّد.
المخرج الإبداعي بالقواعد ما زال خلف `CreativeDirector`؛ المخرج المعتمد على LLM مؤجل حتى اختيار مزود وميزانية.

الأوامر:

```bash
npm run check                    # typecheck + lint + named unit tests
npm run test:ui                  # واجهة تعمل على 3000؛ Chromium محلي
UI_RENDER_TEST=1 npm run test:ui # تشمل اختبار تصدير حقيقي وإعادة إنتاج وتعديل نص
REMOTION_BROWSER=/usr/bin/chromium RENDER_CONCURRENCY=2 npm run e2e
```

الخطوة التالية بعد مراجعة المالك: المرحلة الثالثة، تبدأ باستيراد تعليق صوتي مسجّل. لم يبدأ تنفيذها.

---

## سجل التسليم الأصلي (المرحلة الأولى)

Snapshot of commit `52cdbc7` on branch `claude/ad-factory-phase-0-1-y0h3ve` of
github.com/bvcdyfyufdyxgfugi8y-netizen/Motion (folder `ad-factory/`), packaged 2026-10-10.
Excluded: node_modules, .git, .env, out/, cache/. No secrets exist in the project (`.env.example` holds empty placeholders).
`samples/phase-1/` holds the delivered demo render for reference (it is regenerable; not part of the source).

## Read first
1. `CLAUDE.md` — standing rules (the same rules apply to any agent; `AGENTS.md` points to it)
2. `PROGRESS.md` — status and next step · `ROADMAP.md` — phases · `DECISIONS.md` — why things are the way they are
3. `ARCHITECTURE.md` — pipeline and modules · `COSTS.md` · `docs/reports/phase-1-results.md`

## Run it
Requirements: Node ≥ 20, npm, ffmpeg + ffprobe on PATH. Chrome is downloaded by Remotion on the first render; if
downloads are blocked, set `REMOTION_BROWSER` to a local Chromium/headless shell.
```bash
npm ci                                              # exact versions from package-lock.json
npm run check                                       # typecheck + lint + 25 unit tests
npm run produce -- briefs/demo-nafas/brief.json     # → out/demo-nafas-cold-brew/delivery/
npm run e2e                                         # render, cached re-run, text edit → re-export
npm run preview -- briefs/demo-nafas/brief.json     # 540×960 draft
npm run studio                                      # Remotion Studio (live preview)
```

## What works (verified by running it, Linux container, Node 22, ffmpeg 6.1)
- Brief validation incl. bad-input and unsafe-asset rejection (unit tests)
- Storyboard: 3 hooks, strategy choice, beat-aligned timing, every on-screen line traced to a brief field
- Real export 1080×1920 / 30 fps / H.264 yuv420p BT.709 / AAC 48 kHz; QC PASS (600 frames, −14 LUFS, true peak −1.2 dBFS)
- Separate picture/audio caches: unchanged re-export 6.5 s; text edit re-renders picture only (`npm run e2e` → E2E PASS)
- Preview mode, Remotion Studio (served HTTP 200), delivery package (mp4, cover, caption, QC report)

## Not tested / not built
- Not run on macOS or Windows; README steps not tried on a fresh machine
- Voice-over mixing/ducking: ffmpeg graph is unit-tested only; no real voice file mixed yet
- No UI, no database, no job queue (Phase 2)
- No ElevenLabs, no publishing, no analytics (Phases 3, 6, 7); only one template (Bold Commercial)
- Safe area and Arabic shaping are enforced/checked visually, not detected automatically
- Remotion licence fit for a future SaaS must be confirmed by the owner (DECISIONS D-003)

## Original next step
Phase 2 was approved by the owner and built in this handoff; see the update above and current `PROGRESS.md`.

## Product-independent creative learning (2026-10-10, review branch only)

Extended the existing ad-render skill as the Video Motion Intelligence entry point and linked it from Codex instructions. Added canonical technique lifecycle/aliases/evidence and feedback to the existing memory, validated target profiles and 14-domain coverage, explicit reference/product routing, seven-factor adaptive selection, and shared CLI/server planning. New UI projects opt in; saved legacy projects remain on their prior path. See `docs/product-independent-learning.md` and `docs/reports/product-independent-learning-results.md` for contracts, evidence and limitations.

62 tests/typecheck/lint and the Arabic editing/approval/mobile browser test pass. Four legacy PNG frames exactly match the previous review commit; two adaptive target inputs have deterministic selected-frame PNGs. No new video was exported under the images-only instruction; whole-video/audio export equivalence is unverified. One template and rule-based selection remain; observed reference recipes are not auto-approved. Main is unchanged; no merges without explicit owner approval.
