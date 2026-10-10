import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { ROOT } from "../core/exec.ts";
import { loadReference } from "../references/load.ts";

import { TechniqueSchema, FeedbackSchema } from "./contracts.ts";
import { AnalysisDomains } from "./contracts.ts";
import type { Reference } from "../core/reference.ts";
import type { Technique } from "./contracts.ts";

const identifier = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const CreativeMemorySchema = z.object({
  version: z.literal(1),
  techniques: z.array(TechniqueSchema).default([]),
  feedback: z.array(FeedbackSchema).default([]),
  references: z.array(z.object({ id: z.string().regex(/^reference-\d{3}$/), manifest: z.string().regex(/^reference-\d{3}\/ingestion\.json$/) }).strict()).min(1),
  lessons: z.array(z.object({
    id: identifier, referenceId: z.string().regex(/^reference-\d{3}$/), observationIndices: z.array(z.number().int().nonnegative()).min(1), technique: identifier,
    confidence: z.number().min(0.8).max(1), sourceAspect: z.enum(["9:16", "16:9"]),
    guidance: z.array(z.string().min(1)).min(1), limits: z.array(z.string().min(1)).min(1),
  }).strict()).min(1),
}).strict().superRefine((m, ctx) => {
  if (new Set(m.references.map(r => r.id)).size !== m.references.length || new Set(m.lessons.map(l => l.id)).size !== m.lessons.length) ctx.addIssue({ code: "custom", message: "duplicate memory IDs" });
  const names = m.techniques.flatMap(t => [t.id, ...t.aliases]);
  if (new Set(names).size !== names.length) ctx.addIssue({ code: "custom", message: "duplicate canonical technique or alias" });
  for (const t of m.techniques) for (const lesson of t.lessons) if (!m.lessons.some(l => l.id === lesson)) ctx.addIssue({ code: "custom", message: "unknown technique lesson" });
  if (new Set(m.feedback.map(f => f.id)).size !== m.feedback.length) ctx.addIssue({ code: "custom", message: "duplicate feedback ID" });
  for (const f of m.feedback) for (const id of f.techniqueIds) if (!m.techniques.some(t => t.id === id)) ctx.addIssue({ code: "custom", message: "unknown feedback technique" });
  for (const r of m.references) if (r.manifest !== `${r.id}/ingestion.json`) ctx.addIssue({ code: "custom", message: "reference ID/path mismatch" });
  for (const lesson of m.lessons) if (!m.references.some(r => r.id === lesson.referenceId)) ctx.addIssue({ code: "custom", message: "lesson refers to unknown reference" });
});
export type CreativeLesson = z.infer<typeof CreativeMemorySchema>["lessons"][number];
export interface ReferenceMemory { listLessons(): CreativeLesson[]; listTechniques(): Technique[] }

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
  for (const technique of memory.techniques) for (const file of technique.testEvidence) {
    if (!/^tests\/[a-z0-9-]+\.test\.ts$/.test(file) || !fs.existsSync(path.join(ROOT, file))) throw new Error(`Missing technique test evidence: ${technique.id}`);
  }
  return { listLessons: () => structuredClone(memory.lessons), listTechniques: () => structuredClone(memory.techniques) };
}

/** Always expose all domains; absent measurements stay unknown rather than inheriting supplied claims. */
export function analysisCoverage(reference: Reference) {
  return AnalysisDomains.map(domain => reference.analysis.domains?.find(d => d.domain === domain) ?? { domain, status: "unverified" as const, observationIndices: [], note: "No reviewed evidence or measurement for this domain" });
}

/** Feedback records evidence only. Promotion or changes to defaults require a separate reviewed code change. */
export function recordCreativeFeedback(input: unknown, folder = path.join(ROOT, "references")) {
  const feedback = FeedbackSchema.parse(input);
  const file = path.join(folder, "creative-memory.json");
  const memory = CreativeMemorySchema.parse(JSON.parse(fs.readFileSync(file, "utf8")));
  const next = CreativeMemorySchema.parse({ ...memory, feedback: [...memory.feedback, feedback] });
  fs.writeFileSync(file, JSON.stringify(next, null, 2) + "\n");
  return feedback;
}
