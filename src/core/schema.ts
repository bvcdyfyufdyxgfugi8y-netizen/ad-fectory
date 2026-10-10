// The two contracts every module speaks: the client Brief (input) and the Storyboard (the plan a render follows).
// Both are plain JSON so a brief can be written by hand, by a form, or by an API, and a storyboard can be
// reviewed and edited before rendering.
import { z } from "zod";
import { EngineConfigSchema, CameraSchema } from "../engine/config.ts";

import { CreativeOptionsSchema, DirectionReportSchema } from "../creative/contracts.ts";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "colour must be #RRGGBB");
// Asset paths are relative to the brief file. No URLs, no absolute paths, no "..": the job folder is the sandbox.
const assetPath = z
  .string()
  .min(1)
  .refine((p) => !p.startsWith("/") && !p.includes("..") && !/^[a-z]+:/i.test(p), "asset path must be relative, inside the brief folder")
  .refine((p) => /\.(png|jpe?g|webp|svg)$/i.test(p), "asset must be png, jpg, webp or svg");

export const BrandColors = z.object({
  primary: hexColor,
  secondary: hexColor,
  accent: hexColor,
  background: hexColor,
  text: hexColor,
});
export type BrandColors = z.infer<typeof BrandColors>;

export const AdGoal = z.enum(["sell", "awareness", "launch", "engagement"]);
export const AdTone = z.enum(["cinematic", "fast", "funny", "luxury", "informative"]);
export const Language = z.enum(["ar", "en"]);

export const ProductSchema = z.object({
    name: z.string().min(1).max(40),
    category: z.string().min(1).max(40),
    // Facts the client stated. The creative engine may only rephrase these, never add new ones.
    features: z.array(z.string().min(2).max(60)).min(1).max(5),
    // Optional pain the product addresses, stated by the client (enables the problem-solution strategy).
    problem: z.string().max(70).optional(),
    images: z.array(assetPath).min(1).max(6),
    price: z.number().positive().optional(),
    oldPrice: z.number().positive().optional(),
    currency: z.string().max(8).optional(),
    offer: z.string().max(40).optional(),
  });
export type Product = z.infer<typeof ProductSchema>;
export const VisualAssetSchema = assetPath;
export const TextSchema = z.string().min(1).max(120);

export const BriefSchema = z.object({
  creative: CreativeOptionsSchema.optional(),
  engine: EngineConfigSchema.optional(),
  id: z.string().regex(/^[a-z0-9-]{3,48}$/, "id: 3-48 chars, lowercase letters, digits, dashes"),
  client: z.object({
    name: z.string().min(1).max(80),
    brand: z.string().min(1).max(40),
    handle: z.string().max(40).optional(),
  }),
  product: ProductSchema,
  brand: z.object({
    logo: assetPath.optional(),
    colors: BrandColors,
  }),
  audience: z.string().min(2).max(120),
  language: Language,
  dialect: z.string().max(30).optional(),
  goal: AdGoal,
  tone: AdTone,
  durationSec: z.number().min(10).max(30),
  cta: z.string().min(2).max(30),
  hashtags: z.array(z.string().regex(/^#?[\p{L}\p{N}_]{2,30}$/u)).max(8).default([]),
  // Copy explicitly supplied by the owner in the scene editor is part of the brief, not an AI claim.
  approvedCopy: z.record(z.string(), z.object({ headline: z.string().max(120), sub: z.string().max(120).optional() })).optional(),
  // Phase 1: none or a pre-recorded file. Generated voice (ElevenLabs) arrives in Phase 3.
  voiceover: z
    .object({ mode: z.enum(["none", "file"]), file: z.string().optional() })
    .default({ mode: "none" }),
}).superRefine((b, ctx) => {
  if (b.product.oldPrice !== undefined && b.product.price === undefined)
    ctx.addIssue({ code: "custom", path: ["product", "oldPrice"], message: "oldPrice needs price" });
  if (b.product.oldPrice !== undefined && b.product.price !== undefined && b.product.oldPrice <= b.product.price)
    ctx.addIssue({ code: "custom", path: ["product", "oldPrice"], message: "oldPrice must be higher than price" });
  if ((b.product.price !== undefined) !== (b.product.currency !== undefined))
    ctx.addIssue({ code: "custom", path: ["product", "currency"], message: "price and currency go together" });
  if (b.voiceover.mode === "file" && !b.voiceover.file)
    ctx.addIssue({ code: "custom", path: ["voiceover", "file"], message: "voiceover.file is required when mode is file" });
});
export type Brief = z.infer<typeof BriefSchema>;

export const SceneKind = z.enum(["hook", "problem", "reveal", "benefit", "offer", "cta"]);
export const Motion = z.enum(["kinetic-pop", "mask-reveal", "push-in", "slide-card", "stamp", "pulse"]);
export const Transition = z.enum(["none", "wipe", "slide-up", "zoom", "fade"]);

export const SceneSchema = z.object({
  id: z.string(),
  kind: SceneKind,
  durationInFrames: z.number().int().positive(),
  headline: TextSchema,
  sub: z.string().optional(),
  // Which brief field the words came from: proof that no claim was invented.
  source: z.array(z.string()),
  image: z.string().optional(),
  camera: CameraSchema.optional(),
  motion: Motion,
  // Transition INTO this scene (the first scene's is ignored).
  transition: Transition,
  emphasis: z.array(z.number().int().nonnegative()).default([]),
});
export type Scene = z.infer<typeof SceneSchema>;

export const SfxCue = z.object({
  frame: z.number().int().nonnegative(),
  sound: z.enum(["whoosh", "impact", "pop", "riser", "tick"]),
  gainDb: z.number().max(0).default(-6),
});

export const StoryboardSchema = z.object({
  creativeDirection: DirectionReportSchema.optional(),
  id: z.string(),
  briefId: z.string(),
  template: z.string().regex(/^[a-z][a-z0-9-]+$/),
  engine: EngineConfigSchema.optional(),
  strategy: z.enum(["product-reveal", "problem-solution", "offer-first"]),
  language: Language,
  direction: z.enum(["rtl", "ltr"]),
  fps: z.number().int().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  bpm: z.number().positive(),
  durationInFrames: z.number().int().positive(),
  hooks: z.array(z.string()).length(3),
  selectedHook: z.number().int().min(0).max(2),
  brand: z.object({
    name: z.string(),
    handle: z.string().optional(),
    logo: z.string().optional(),
    colors: BrandColors,
  }),
  scenes: z.array(SceneSchema).min(3),
  audio: z.object({
    musicSeed: z.number().int(),
    sfx: z.array(SfxCue),
    voiceover: z.string().optional(),
  }),
  approved: z.boolean().default(false),
});
export type Storyboard = z.infer<typeof StoryboardSchema>;
export type StoryboardInput = z.input<typeof StoryboardSchema>;
