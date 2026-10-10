import { BriefSchema } from "../core/schema.ts";
import { assetAspect } from "../intake/asset-profile.ts";
import type { Brief } from "../core/schema.ts";
import { adaptStoryboard } from "./adaptation.ts";
import { openReferenceMemory } from "./reference-memory.ts";

/** Server/CLI boundary; the Remotion bundle keeps filesystem access out of the browser. */
export function planProduction(brief: Brief, briefDir?: string) {
  if (!brief.creative) return adaptStoryboard(brief, []);
  if (briefDir && brief.creative.profile.assetAspect === undefined) {
    const ratio = assetAspect(brief, briefDir);
    if (ratio) brief = BriefSchema.parse({ ...brief, creative: { ...brief.creative, profile: { ...brief.creative.profile, assetAspect: ratio } } });
  }
  const memory = openReferenceMemory();
  const lessons = memory.listLessons();
  const known = new Set(lessons.map(l => l.referenceId));
  for (const id of brief.creative?.referenceIds ?? []) if (!known.has(id)) throw new Error(`Unknown reference: ${id}`);
  const techniques = memory.listTechniques().filter(t => !t.lessons.length || !brief.creative?.referenceIds?.length || t.lessons.some(id => lessons.some(l => l.id === id && brief.creative?.referenceIds?.includes(l.referenceId))));
  return adaptStoryboard(brief, techniques);
}
