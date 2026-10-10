import { z } from "zod";

const frame = z.number().int().nonnegative();
const size = z.number().min(16).max(300);
export const SpringSchema = z.object({ damping: z.number().positive().max(100), stiffness: z.number().positive().max(1000), mass: z.number().positive().max(10) }).strict();
export const LayoutSchema = z.object({
  safe: z.object({ top: frame.max(500).default(230), bottom: frame.max(600).default(430), side: frame.max(200).default(90) }).strict().default({ top: 230, bottom: 430, side: 90 }),
  type: z.object({ hook: size.default(128), reveal: size.default(104), benefit: size.default(78), offer: size.default(210), cta: size.default(82) }).strict().default({ hook: 128, reveal: 104, benefit: 78, offer: 210, cta: 82 }),
  product: z.object({ reveal: z.number().min(100).max(1000).default(900), benefit: z.number().min(100).max(1000).default(760), cta: z.number().min(100).max(1000).default(700) }).strict().default({ reveal: 900, benefit: 760, cta: 700 }),
}).strict();
export const AnimationSchema = z.object({
  transitionFrames: z.number().int().min(1).max(30).default(10),
  kineticSpring: SpringSchema.default({ damping: 14, stiffness: 170, mass: 0.7 }),
  floatAmplitude: z.number().min(0).max(60).default(10),
  floatPeriod: z.number().positive().max(120).default(18),
}).strict();
export const CameraPointSchema = z.object({ x: z.number().min(-1000).max(1000).default(0), y: z.number().min(-1000).max(1000).default(0), scale: z.number().min(0.2).max(4).default(1), rotateX: z.number().min(-60).max(60).default(0), rotateY: z.number().min(-60).max(60).default(0), rotateZ: z.number().min(-180).max(180).default(0) }).strict();
export const CameraSchema = z.object({ from: CameraPointSchema, to: CameraPointSchema, startFrame: frame.default(0), endFrame: z.number().int().positive(), easing: z.enum(["linear", "cubic-out", "cubic-in-out"]).default("linear"), perspective: z.number().min(300).max(5000).default(1200) }).strict().refine(c => c.endFrame > c.startFrame, "camera end must follow start");
export const AudioSettingsSchema = z.object({ musicGainDb: z.number().min(-40).max(0).default(0), sfxGainDb: z.number().min(-40).max(0).default(0), targetLufs: z.number().min(-20).max(-12).default(-14), truePeakDb: z.number().min(-6).max(-1).default(-1.5) }).strict();
export const ExportSchema = z.object({ codec: z.literal("h264").default("h264"), pixelFormat: z.literal("yuv420p").default("yuv420p"), colorSpace: z.literal("bt709").default("bt709"), crf: z.number().int().min(10).max(35).default(18), jpegQuality: z.number().int().min(50).max(100).default(92), audioBitrateK: z.number().int().min(128).max(320).default(192), sampleRate: z.literal(48000).default(48000) }).strict();
export const MotionPresetSchema = z.object({
  name: z.literal("poster-stack-depth"),
  applyTo: z.array(z.enum(["reveal", "benefit"])).min(1).max(2).default(["reveal", "benefit"]),
  settleFrames: z.number().int().min(8).max(60).default(24),
  offset: z.number().min(12).max(48).default(36),
  tiltDegrees: z.number().min(0).max(6).default(4),
}).strict().refine(p => new Set(p.applyTo).size === p.applyTo.length, "duplicate preset scene kind");
export type MotionPreset = z.infer<typeof MotionPresetSchema>;
export const EngineConfigSchema = z.object({
  template: z.string().regex(/^[a-z][a-z0-9-]+$/).default("bold-commercial"),
  motionPreset: MotionPresetSchema.optional(),
  cameras: z.partialRecord(z.enum(["hook", "problem", "reveal", "benefit", "offer", "cta"]), CameraSchema).optional(),
  bpm: z.number().min(60).max(180).default(120),
  layout: LayoutSchema.default(LayoutSchema.parse({})),
  animation: AnimationSchema.default(AnimationSchema.parse({})),
  audio: AudioSettingsSchema.default(AudioSettingsSchema.parse({})),
  export: ExportSchema.default(ExportSchema.parse({})),
}).strict();
export type EngineConfig = z.infer<typeof EngineConfigSchema>;
export type Camera = z.infer<typeof CameraSchema>;
export const settings = (value?: unknown): EngineConfig => EngineConfigSchema.parse(value ?? {});
