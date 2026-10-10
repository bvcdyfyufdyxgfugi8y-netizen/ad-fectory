# AD Factory

A production engine for short vertical commercials (9:16, 1080×1920, 30 fps, H.264 + AAC).
It turns a client **brief** into a reviewed **storyboard**, renders it with **Remotion**, builds and mixes the
audio with **ffmpeg**, checks the result with an automated **QC** pass, and writes a **delivery package**
(MP4, cover, caption, QC report).

> Status: **Phase 2 (local studio + reusable advertisement engine)**. Arabic control UI, SQLite projects and jobs, scene editor,
> live Remotion preview, render worker and delivery downloads. One template and rule-based creative director;
> synthesised music and SFX, no voice-over generation yet. See `PROGRESS.md` and `ROADMAP.md`.
> AD Factory is independent of Toon Studio: it shares no code, config or dependencies with the rest of this repository.

## Requirements

- Node.js ≥ 22.13 and npm (SQLite is built into Node; this handoff tested on Node 24.19)
- ffmpeg + ffprobe on `PATH` (tested on 6.1.1)
- Chrome/Chromium: Remotion downloads its own headless shell on first render. In a locked-down
  machine, point `REMOTION_BROWSER` at a local one (see `.env.example`).

## Quick start

### تشغيل الواجهة العربية

```bash
cd ad-factory
npm ci --include=dev
npm run dev
```

افتح **http://127.0.0.1:3000**. الأمر يشغّل الواجهة وعامل الإنتاج معًا.
ابدأ بمشروع جديد؛ يتضمن بيانات وصور نَفَس التجريبية لتجربة المسار، ثم استبدلها ببيانات منتجك.

1. أدخل حقائق المنتج وارفع الصور والشعار، ثم اضغط **حفظ وبناء المشاهد**.
2. اختر الافتتاحية وعدّل نصوص المشاهد ومددها وترتيبها وصورها وتمييز الكلمات، ثم **حفظ المشاهد**.
3. راجع المعاينة واضغط **اعتماد المشاهد**، ثم **إنتاج الإعلان**.
4. تابع سجل المهمة وحمّل الفيديو والغلاف ونص المنشور وتقرير الجودة عند نجاح التصدير.

أي تعديل يلغي الاعتماد السابق. تعديل بيانات المنتج يعيد تخطيط المشاهد؛ النص المكتوب يدويًا في محرّر
المشاهد يُحفظ في `brief.approvedCopy` مع مصدره. المعاينة تعرض الحركة؛ الموسيقى والمؤثرات تُضاف في التصدير.
تبقى الافتتاحية أول مشهد والدعوة للإجراء آخر مشهد. لا يتغير أسلوب القالب حسب النبرة بعد.

بياناتك المحلية في `data/` (قاعدة SQLite والصور ونسخ المهام). احفظ هذا المجلد مع `out/` للاحتفاظ بالمشاريع
والتسليمات؛ كلاهما مستبعد من Git. كل مهمة لها تسليم مستقل، ولا تتأثر بتعديل المشروع أثناء الإنتاج.
المشروع أداة محلية لمستخدم واحد؛ لا يتضمن حسابات أو نشرًا عامًا. المنفذ قابل للتغيير بواسطة `PORT`.

```bash
npm run build
npm start                      # نسخة الإنتاج المحلية + العامل
npm run check                  # الأنواع + lint + الاختبارات
npm run test:ui                # اختبار المتصفح؛ يتطلب واجهة تعمل على المنفذ 3000
UI_RENDER_TEST=1 npm run test:ui # يشمل تصديرًا فعليًا وإعادة تصدير وتعديلًا (عدة دقائق)
```

اختبارات المتصفح تستخدم `/usr/bin/chromium` افتراضيًا. حدّد `REMOTION_BROWSER` لمسار المتصفح على جهازك.
لتشغيل الإنتاج دون واجهة، تبقى أوامر CLI التالية متاحة.

```bash
cd ad-factory
npm ci --include=dev
npm run check                                         # typecheck + lint + unit tests
npm run produce -- briefs/demo-nafas/brief.json       # full production of the demo ad
```

Output lands in `out/<brief-id>/`:

```
out/demo-nafas-cold-brew/
├── storyboard.json        the plan that was rendered (editable)
├── qc-report.md / .json   automated checks + human review list
├── contact-sheet.jpg      one frame per scene
├── run.json               timings, cache hits, paid calls (0), cost ($0)
└── delivery/              what the client receives
    ├── demo-nafas-cold-brew.mp4
    ├── cover.jpg
    ├── caption.txt
    └── qc-report.md
```

## Everyday commands

| Command | What it does |
|---|---|
| `npm run storyboard -- <brief.json>` | Plan only: writes `out/<id>/storyboard.json` for review |
| `npm run preview -- <brief.json>` | Cheap draft at 540×960 for timing review → `out/<id>/preview/preview.mp4` |
| `npm run produce -- <brief.json>` | Full render + QC + delivery package |
| `npm run produce -- <brief.json> --storyboard <edited.json>` | Re-export an edited storyboard |
| `npm run studio` | Remotion Studio with the demo ad (live preview, scrubbing) |
| `npm run e2e` | Acceptance test: render, cached re-run, text edit → re-export |
| `npm run check` | typecheck + lint + unit tests |

## Editing and re-exporting

1. `npm run storyboard -- briefs/x/brief.json`
2. Copy `out/<id>/storyboard.json`, change a headline, a scene length (keep it a multiple of 15 frames to stay on
   the beat, and keep `durationInFrames` equal to the sum), a colour, or the selected hook.
3. `npm run produce -- briefs/x/brief.json --storyboard my-edit.json`

Picture and audio are cached separately (`cache/`, keyed by content hash): editing text re-renders the picture
only; an unchanged storyboard re-exports in seconds.

## Writing a brief

Copy `briefs/demo-nafas/` and edit `brief.json`. The schema is in `src/core/schema.ts`; invalid briefs fail with
a list of every problem. Assets (png/jpg/webp/svg, ≤ 15 MB) must sit inside the brief folder. Only facts the client
states in `product.features` / `price` / `offer` appear on screen.

## Licences

- **Remotion** is free for individuals, non-profits and companies with up to 3 employees; larger companies need a
  Company License. Building a paid product that resells Remotion itself is not allowed. Read `DECISIONS.md` (D-003)
  before any SaaS step.
- Font: Alexandria (SIL OFL 1.1) via `@fontsource-variable/alexandria`.
- Demo product art, logo, music and SFX are original and generated in this repository; no third-party media.

## Scalable engine (Phase 2 extension)

Optional validated `brief.engine` controls layout, typography, transition timing, kinetic springs, camera presets,
audio gains/loudness and export quality. Old briefs use the original defaults. CLI, Studio and Player share a
registered template; unknown templates fail explicitly. See [input and extension guide](docs/engine-inputs.md)
and [architecture audit/plan](docs/engine-audit-plan.md).

```bash
npm run produce -- briefs/demo-nafas/brief.json
npm run produce -- briefs/demo-mint/brief.json
```

Two fictional products, one engine, no animation source edits. Full decoded regression evidence lives in
`samples/engine-regression/`; the historical handoff remains untouched in `samples/phase-1/`.
