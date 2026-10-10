import { BriefSchema, StoryboardSchema, type Brief, type Storyboard } from "../core/schema.ts";
import { buildStoryboard, readingSeconds } from "../storyboard/build.ts";
import { settings } from "../engine/config.ts";
import { soundCues } from "../engine/timeline.ts";
import { ruleBasedDirector } from "../creative/director.ts";

export function plan(brief: Brief) { return buildStoryboard(brief, ruleBasedDirector.draft(brief)); }

/** Accept only editor-owned fields. Geometry, audio seed, brand identity and scene types remain canonical. */
export function editStoryboard(brief: Brief, current: Storyboard, input: unknown): { brief: Brief; storyboard: Storyboard } {
  const edited = StoryboardSchema.parse(input);
  const sb = structuredClone(current);
  const b = structuredClone(brief);
  sb.approved = false;
  sb.selectedHook = edited.selectedHook;
  sb.brand.colors = edited.brand.colors;
  b.brand.colors = edited.brand.colors;
  if (edited.scenes.length !== sb.scenes.length || new Set(edited.scenes.map(s => s.id)).size !== sb.scenes.length) throw new Error("يجب الحفاظ على مشاهد المشروع");
  const originals = new Map(sb.scenes.map(s => [s.id, s]));
  sb.scenes = edited.scenes.map(s => {
    const original = originals.get(s.id);
    if (!original) throw new Error("مشهد غير معروف");
    const scene = { ...original, headline: s.headline.trim(), sub: s.sub?.trim(), durationInFrames: s.durationInFrames, image: s.image, emphasis: s.emphasis };
    if (!scene.headline || scene.headline.length > 120 || (scene.sub?.length ?? 0) > 120) throw new Error("نص المشهد مطلوب وبحد أقصى 120 حرفًا");
    if (scene.kind === "hook" && edited.selectedHook !== current.selectedHook) {
      scene.headline = sb.hooks[sb.selectedHook]!;
      scene.source = sb.selectedHook === 0 ? [b.product.problem ? "product.problem" : "product.category", "template"] : sb.selectedHook === 1 ? ["product.name", "template"] : [b.product.offer ? "product.offer" : "client.brand", "product.name", "template"];
    }
    if (scene.headline !== original.headline || scene.sub !== original.sub) {
      b.approvedCopy = { ...b.approvedCopy, [scene.id]: { headline: scene.headline, sub: scene.sub } };
      scene.source = [`approvedCopy.${scene.id}.headline`, ...(scene.sub ? [`approvedCopy.${scene.id}.sub`] : [])];
    }
    if (scene.image && !b.product.images.includes(scene.image)) throw new Error("اختر صورة من صور هذا المنتج");
    if (scene.durationInFrames % (sb.fps * 60 / sb.bpm) || scene.durationInFrames < Math.ceil(readingSeconds(`${scene.headline} ${scene.sub ?? ""}`, sb.language) * sb.bpm / 60) * (sb.fps * 60 / sb.bpm)) throw new Error("مدة المشهد قصيرة لقراءة النص؛ زد عدد الإيقاعات");
    const words = scene.headline.split(/[ \t\n]+/).filter(Boolean).length;
    if (scene.emphasis.some(i => i >= words)) throw new Error("رقم الكلمة المميزة خارج النص");
    return scene;
  });
  if (sb.scenes[0]?.kind !== "hook" || sb.scenes.at(-1)?.kind !== "cta") throw new Error("يجب أن يبدأ الإعلان بالافتتاحية وينتهي بالدعوة للإجراء");
  sb.durationInFrames = sb.scenes.reduce((n, s) => n + s.durationInFrames, 0);
  if (sb.durationInFrames < 300 || sb.durationInFrames > 900) throw new Error("المدة الكلية يجب أن تكون بين 10 و30 ثانية");
  b.durationSec = sb.durationInFrames / sb.fps;
  sb.audio.sfx = soundCues(sb.scenes, sb.fps, sb.bpm, settings(sb.engine).animation.transitionFrames);
  return { brief: BriefSchema.parse(b), storyboard: StoryboardSchema.parse(sb) };
}
