import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ROOT } from "../../../core/exec.ts";
import { BriefSchema } from "../../../core/schema.ts";
import { loadBrief, checkAssets, MAX_ASSET_BYTES } from "../../../intake/loadBrief.ts";
import { Store } from "../../../server/store.ts";
import { editStoryboard, plan } from "../../../server/editor.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
type Context = { params: Promise<{ route: string[] }> };
const revisionSchema = z.number().int().positive();
const json = (value: unknown, status = 200) => NextResponse.json(value, { status });
function validAssets(brief: z.infer<typeof BriefSchema>, dir: string) {
  const issues = checkAssets(brief, dir);
  if (issues.length) throw new Error(issues.map(issue => `${issue.split(":")[0]}: ${issue.includes("not found") ? "الملف غير موجود" : issue.includes("SVG contains") ? "صورة SVG تتضمن محتوى أو مراجع غير آمنة" : issue.includes("content does not match") ? "محتوى الملف لا يطابق صيغة الصورة" : "ملف فارغ أو يتجاوز الحجم المسموح"}`).join("\n"));
}
function validationError(error: z.ZodError): string {
  const names: Record<string, string> = { id: "معرّف الإعلان", client: "العميل", name: "الاسم", brand: "العلامة", handle: "الحساب", product: "المنتج", category: "الفئة", features: "المميزات", images: "الصور", price: "السعر", oldPrice: "السعر السابق", currency: "العملة", offer: "العرض", colors: "الألوان", primary: "الأساسي", secondary: "الثانوي", accent: "التفاصيل", background: "الخلفية", text: "النص", audience: "الجمهور", language: "اللغة", durationSec: "المدة", cta: "الدعوة للإجراء", hashtags: "الوسوم", revision: "النسخة" };
  const custom: Record<string, string> = { "oldPrice needs price": "أدخل السعر الحالي قبل السعر السابق", "oldPrice must be higher than price": "السعر السابق يجب أن يكون أعلى من السعر الحالي", "price and currency go together": "أدخل السعر والعملة معًا", "asset path must be relative, inside the brief folder": "اختر صورة داخل مجلد المشروع" };
  return error.issues.map(issue => {
    const field = issue.path.map(p => typeof p === "number" ? String(p + 1) : names[String(p)] ?? String(p)).join(" / ");
    const message = custom[issue.message] ?? (issue.code === "too_small" ? `القيمة أقل من الحد المسموح (${issue.minimum})` : issue.code === "too_big" ? `القيمة تتجاوز الحد المسموح (${issue.maximum})` : issue.code === "invalid_format" ? "صيغة غير صحيحة؛ راجع اللون أو المعرّف أو الوسم" : "قيمة مطلوبة أو غير صالحة");
    return `${field}: ${message}`;
  }).join("\n");
}

async function handle(req: NextRequest, context: Context) {
  const { route } = await context.params;
  if (req.method !== "GET") {
    const origin = req.headers.get("origin");
    if ((origin && new URL(origin).host !== req.headers.get("host")) || req.headers.get("sec-fetch-site") === "cross-site") return json({ error: "طلب من مصدر غير مسموح" }, 403);
    if (Number(req.headers.get("content-length") ?? 0) > MAX_ASSET_BYTES + 1024 * 1024) return json({ error: "الملف أكبر من الحد المسموح" }, 413);
  }
  const store = new Store();
  try {
    if (route[0] === "projects" && route.length === 1) {
      if (req.method === "GET") return json(store.list());
      if (req.method === "POST") {
        const { brief: demo } = loadBrief(path.join(ROOT, "briefs/demo-nafas/brief.json"));
        const brief = BriefSchema.parse({ ...demo, id: `project-${randomUUID()}`, creative: { mode: "adaptive" } });
        const p = store.create(brief, plan(brief, path.join(ROOT, "briefs/demo-nafas")));
        fs.cpSync(path.join(ROOT, "briefs/demo-nafas/assets"), path.join(store.projectDir(p.id), "assets"), { recursive: true });
        return json(p, 201);
      }
    }
    if (route[0] === "projects" && uuid.test(route[1] ?? "")) {
      const id = route[1]!;
      const p = store.get(id);
      const dir = store.projectDir(id);
      if (route.length === 2 && req.method === "GET") return json(p);
      if (route.length === 2 && req.method === "PATCH") {
        const body = await req.json();
        const revision = revisionSchema.parse(body.revision);
        if (body.brief) {
          const brief = BriefSchema.parse(body.brief);
          if (brief.voiceover.mode !== "none") throw new Error("استيراد التعليق الصوتي متاح في المرحلة الثالثة");
          // Only project-owned asset files can become inputs to a local render.
          if (![...brief.product.images, ...(brief.brand.logo ? [brief.brand.logo] : [])].every(a => /^assets\/[a-zA-Z0-9._-]+$/.test(a))) throw new Error("مسار صورة غير صالح");
          brief.approvedCopy = undefined;
          validAssets(brief, dir);
          return json(store.save(id, revision, brief, plan(brief, dir)));
        }
        const result = editStoryboard(p.brief, p.storyboard, body.storyboard);
        validAssets(result.brief, dir);
        return json(store.save(id, revision, result.brief, result.storyboard));
      }
      if (route[2] === "approve" && route.length === 3 && req.method === "POST") {
        const body = await req.json();
        const validated = editStoryboard(p.brief, p.storyboard, p.storyboard);
        return json(store.save(id, revisionSchema.parse(body.revision), validated.brief, { ...validated.storyboard, approved: true }));
      }
      if (route[2] === "jobs" && route.length === 3) {
        if (req.method === "GET") return json(store.jobs(id));
        if (req.method === "POST") {
          const body = await req.json();
          validAssets(p.brief, dir);
          return json(store.enqueue(id, revisionSchema.parse(body.revision)), 201);
        }
      }
      if (route[2] === "assets" && route.length === 3 && req.method === "POST") {
        const data = await req.formData();
        const file = data.get("file");
        if (!(file instanceof File) || file.size > MAX_ASSET_BYTES || !file.size) throw new Error("اختر صورة لا تتجاوز 15 ميغابايت");
        const ext = path.extname(file.name).toLowerCase();
        if (!/\.(png|jpe?g|webp|svg)$/.test(ext)) throw new Error("الصيغ المدعومة: PNG، JPG، WebP، SVG");
        const rel = `assets/${randomUUID()}${ext}`;
        const abs = path.join(dir, rel);
        fs.writeFileSync(abs, Buffer.from(await file.arrayBuffer()));
        try { validAssets({ ...p.brief, product: { ...p.brief.product, images: [rel] }, brand: { ...p.brief.brand, logo: undefined } }, dir); }
        catch (e) { fs.unlinkSync(abs); throw e; }
        return json({ path: rel }, 201);
      }
      if (route[2] === "assets" && route.length === 4 && req.method === "GET" && /^[a-zA-Z0-9._-]+\.(png|jpe?g|webp|svg)$/.test(route[3]!)) {
        const file = path.join(dir, "assets", route[3]!);
        if (!fs.existsSync(file)) return json({ error: "الصورة غير موجودة" }, 404);
        const mime: Record<string, string> = { ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };
        return new NextResponse(fs.readFileSync(file), { headers: { "Content-Type": mime[path.extname(file)]!, "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox", "Cache-Control": "private, max-age=3600" } });
      }
    }
    if (route[0] === "jobs" && uuid.test(route[1] ?? "") && route[2] === "delivery" && route.length === 4 && req.method === "GET") {
      const job = store.job(route[1]!);
      if (!job || job.status !== "succeeded") return json({ error: "التصدير غير جاهز" }, 404);
      const allowed: Record<string, [string, string]> = { video: [`render-${job.id}.mp4`, "video/mp4"], cover: ["cover.jpg", "image/jpeg"], caption: ["caption.txt", "text/plain; charset=utf-8"], report: ["qc-report.md", "text/markdown; charset=utf-8"] };
      const target = allowed[route[3]!];
      if (!target) return json({ error: "الملف غير موجود" }, 404);
      const file = path.join(ROOT, "out", `render-${job.id}`, "delivery", target[0]);
      return new NextResponse(fs.readFileSync(file), { headers: { "Content-Type": target[1], "Content-Disposition": `attachment; filename="${target[0]}"`, "Cache-Control": "no-store" } });
    }
    return json({ error: "المسار غير موجود" }, 404);
  } catch (e) {
    const error = e instanceof z.ZodError ? validationError(e) : (e as Error).message;
    return json({ error }, error.includes("غير موجود") ? 404 : error.includes("تغيّر") || error.includes("تغيّرت") ? 409 : 400);
  } finally { store.close(); }
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
