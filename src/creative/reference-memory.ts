import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { ROOT } from "../core/exec.ts";
import { loadReference } from "../references/load.ts";

const identifier = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const CreativeMemorySchema = z.object({
  version: z.literal(1),
  references: z.array(z.object({ id: z.string().regex(/^reference-\d{3}$/), manifest: z.string().regex(/^reference-\d{3}\/ingestion\.json$/) }).strict()).min(1),
  lessons: z.array(z.object({
    id: identifier, referenceId: z.string().regex(/^reference-\d{3}$/), observationIndices: z.array(z.number().int().nonnegative()).min(1), technique: identifier,
    confidence: z.number().min(0.8).max(1), sourceAspect: z.enum(["9:16", "16:9"]),
    guidance: z.array(z.string().min(1)).min(1), limits: z.array(z.string().min(1)).min(1),
  }).strict()).min(1),
}).strict().superRefine((m, ctx) => {
  if (new Set(m.references.map(r => r.id)).size !== m.references.length || new Set(m.lessons.map(l => l.id)).size !== m.lessons.length) ctx.addIssue({ code: "custom", message: "duplicate memory IDs" });
  for (const r of m.references) if (r.manifest !== `${r.id}/ingestion.json`) ctx.addIssue({ code: "custom", message: "reference ID/path mismatch" });
  for (const lesson of m.lessons) if (!m.references.some(r => r.id === lesson.referenceId)) ctx.addIssue({ code: "custom", message: "lesson refers to unknown reference" });
});
export type CreativeLesson = z.infer<typeof CreativeMemorySchema>["lessons"][number];
export interface ReferenceMemory { listLessons(): CreativeLesson[] }

/** Explicit retrieval, no external model training and no changes to the default ad director. */
export function openReferenceMemory(folder = path.join(ROOT, "references")): ReferenceMemory {
  const memory = CreativeMemorySchema.parse(JSON.parse(fs.readFileSync(path.join(folder, "creative-memory.json"), "utf8")));
  const references = new Map(memory.references.map(r => [r.id, loadReference(path.join(folder, r.manifest))]));
  for (const lesson of memory.lessons) {
    const reference = references.get(lesson.referenceId)!;
    for (const index of lesson.observationIndices) {
      const observation = reference.analysis.observations[index];
      if (!observation || observation.status !== "observed" || observation.confidence < lesson.confidence) throw new Error(`Unsupported memory lesson evidence: ${lesson.id}`);
    }
  }
  return { listLessons: () => structuredClone(memory.lessons) };
}
