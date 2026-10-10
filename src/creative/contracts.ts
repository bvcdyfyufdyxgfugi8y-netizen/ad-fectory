import { z } from "zod";

export const AnalysisDomains = ["camera", "composition", "reveal", "transitions", "typography", "easing", "dimensionality", "lighting-color", "music-sync", "sound-design", "storytelling", "attention-persuasion", "emotional-pacing", "commercial-impact"] as const;
const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const ProductProfileSchema = z.object({
  shape: z.enum(["tall", "wide", "square", "irregular", "unknown"]).default("unknown"),
  // Physical measurements are supplied facts, never inferred from pixels or the reference product.
  dimensions: z.object({ width: z.number().positive(), height: z.number().positive(), depth: z.number().positive().optional(), unit: z.enum(["mm", "cm", "m"]) }).strict().optional(),
  assetAspect: z.number().positive().max(100).optional(),
  material: z.enum(["opaque", "reflective", "transparent", "digital", "unknown"]).default("unknown"),
}).strict();
export const CreativeOptionsSchema = z.object({
  mode: z.literal("adaptive"),
  profile: ProductProfileSchema.default(ProductProfileSchema.parse({})),
  intensity: z.number().min(0).max(1).optional(),
  cameraDirection: z.enum(["push-in", "pull-out", "left", "right", "still"]).optional(),
  lightingStyle: z.enum(["template", "soft", "dramatic"]).default("template"),
  typography: z.literal("alexandria").default("alexandria"),
  transition: z.enum(["wipe", "slide-up", "zoom", "fade"]).optional(),
  referenceIds: z.array(z.string().regex(/^reference-\d{3}$/)).optional(),
  audio: z.enum(["engine-cues", "quiet"]).default("engine-cues"),
}).strict();
export const TechniqueSchema = z.object({
  id, aliases: z.array(id).default([]), domain: z.enum(AnalysisDomains),
  family: z.enum(["camera", "type", "transition", "composition", "lighting", "depth"]),
  status: z.enum(["observed", "experimental", "approved"]),
  executor: z.enum(["camera", "kinetic", "transition", "poster-stack"]).optional(),
  lessons: z.array(id), testEvidence: z.array(z.string()).default([]),
  requires: z.array(z.enum(["physical-depth", "multiple-assets", "reflective-material", "true-3d"])).default([]),
  tones: z.array(z.enum(["cinematic", "fast", "funny", "luxury", "informative"])).min(1),
  guidance: z.string().min(1),
}).strict().superRefine((t, ctx) => {
  if (t.status === "approved" && (!t.executor || !t.testEvidence.length)) ctx.addIssue({ code: "custom", message: "approval requires executor and test evidence" });
});
export const FeedbackSchema = z.object({
  id, productionId: id, techniqueIds: z.array(id).min(1), comparedWith: id.optional(),
  outcome: z.enum(["improved", "mixed", "regressed", "unverified"]),
  succeeded: z.array(z.string()), needsImprovement: z.array(z.string()),
  evidence: z.array(z.string().min(1)).min(1), tested: z.boolean(),
}).strict();
export type Technique = z.infer<typeof TechniqueSchema>;
export type CreativeOptions = z.infer<typeof CreativeOptionsSchema>;

export const ScoreNames = ["productCompatibility", "brandIdentity", "visualClarity", "marketingObjective", "technicalFeasibility", "audienceAppeal", "motionAudioHarmony"] as const;
export const DirectionReportSchema = z.object({
  version: z.literal(1), targetProduct: z.string(), category: z.string(), audience: z.string(), goal: z.string(),
  profile: ProductProfileSchema, primaryFeature: z.string(), intensity: z.number(),
  decisions: z.array(z.object({ techniqueId: id, score: z.number(), scores: z.record(z.enum(ScoreNames), z.number().min(0).max(100)), selected: z.boolean(), reasons: z.array(z.string()) })),
  bindings: z.array(z.object({ sceneId: z.string(), techniqueIds: z.array(id), asset: z.string().optional(), category: z.string(), dimensions: ProductProfileSchema.shape.dimensions, assetAspect: z.number().optional(), brandColors: z.record(z.string(), z.string()), typography: z.literal("alexandria"), durationInFrames: z.number().int().positive(), intensity: z.number(), cameraDirection: z.string(), lightingStyle: z.literal("template"), audioCues: z.array(z.object({ frame: z.number().int(), sound: z.string() })), transition: z.string() })),
  limitations: z.array(z.string()),
}).strict();
export type DirectionReport = z.infer<typeof DirectionReportSchema>;
