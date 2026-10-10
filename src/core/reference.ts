import { z } from "zod";

import { AnalysisDomains } from "../creative/contracts.ts";

const hash = z.string().regex(/^[a-f0-9]{64}$/, "full SHA-256 required");
const relativeFile = z.string().min(1).refine(p => !p.startsWith("/") && !p.includes("\\") && !p.split("/").some(s => s === ".." || s === ".") && !p.includes(":"), "local reference path required");
export const ReferenceSchema = z.object({
  version: z.literal(1),
  id: z.string().regex(/^reference-[0-9]{3}$/),
  source: z.object({
    filename: z.string().min(1), sha256: hash,
    availability: z.enum(["missing", "local", "local-untracked"]),
    hashVerification: z.enum(["reported-only", "verified"]),
    file: relativeFile.optional(),
    verificationReport: relativeFile.optional(),
    measuredDurationSeconds: z.number().positive().optional(),
    measuredVideoDurationSeconds: z.number().positive().optional(),
    measuredWidth: z.number().int().positive().optional(), measuredHeight: z.number().int().positive().optional(), measuredFps: z.number().positive().optional(),
    reportedDurationSeconds: z.number().positive(),
    reportedWidth: z.number().int().positive(), reportedHeight: z.number().int().positive(), reportedFps: z.number().positive(),
  }).strict(),
  license: z.object({ status: z.enum(["unknown", "owned", "licensed"]), usage: z.literal("reference-only"), attribution: z.string().min(1), evidence: z.string().min(1).optional() }).strict(),
  provenance: z.object({ archiveFilename: z.string().min(1), archiveSha256: hash, importedOn: z.iso.date(), repository: z.literal("bvcdyfyufdyxgfugi8y-netizen/ad-fectory") }).strict(),
  artifacts: z.array(z.object({ role: z.enum(["analysis", "contact-sheet", "index", "task", "verification", "frame-sample"]), file: relativeFile, sha256: hash }).strict()).min(1),
  analysis: z.object({
    domains: z.array(z.object({ domain: z.enum(AnalysisDomains), observationIndices: z.array(z.number().int().nonnegative()), status: z.enum(["observed", "hypothesized", "unverified"]), note: z.string().min(1) }).strict()).optional(),
    status: z.enum(["reviewed", "conflicting-evidence"]), confidence: z.number().min(0).max(1),
    observations: z.array(z.object({ startSeconds: z.number().nonnegative(), endSeconds: z.number().positive(), statement: z.string().min(1), status: z.enum(["observed", "hypothesized", "unverified", "conflicting"]), confidence: z.number().min(0).max(1), evidence: z.enum(["contact-sheet", "source-video", "supplied-analysis", "none"]) }).strict().refine(o => o.endSeconds > o.startSeconds, "observation end must follow start")),
    proposedPresets: z.array(z.enum(["editorial-type-focus", "poster-stack-depth", "grid-to-hero", "collage-mask-reveal", "contrast-cut-reset", "headline-card-occlusion", "impact-word-switch", "single-to-many-grid", "palette-hard-reset", "asymmetric-product-grid", "tile-content-loop", "flavor-color-swap"])),
    warnings: z.array(z.string().min(1)),
  }).strict(),
}).strict().superRefine((r, ctx) => {
  if (r.source.availability === "missing" && (r.source.hashVerification === "verified" || r.source.file)) ctx.addIssue({ code: "custom", path: ["source"], message: "missing source cannot be verified or have a local file" });
  if (r.source.availability === "local" && !r.source.file) ctx.addIssue({ code: "custom", path: ["source", "file"], message: "local source needs a file" });
  if (r.source.availability === "local-untracked" && (r.source.file || r.source.hashVerification !== "verified" || !r.source.verificationReport || !r.artifacts.some(a => a.role === "verification" && a.file === r.source.verificationReport))) ctx.addIssue({ code: "custom", path: ["source"], message: "untracked source needs verified import evidence, not a distributed media path" });
  if (r.license.status === "licensed" && !r.license.evidence) ctx.addIssue({ code: "custom", path: ["license"], message: "licensed source needs evidence" });
  if (new Set(r.artifacts.map(a => a.file)).size !== r.artifacts.length) ctx.addIssue({ code: "custom", path: ["artifacts"], message: "duplicate artifact path" });
  if (r.analysis.domains) {
    if (new Set(r.analysis.domains.map(d => d.domain)).size !== r.analysis.domains.length) ctx.addIssue({ code: "custom", message: "duplicate analysis domain" });
    for (const d of r.analysis.domains) {
      if (d.status === "observed" && (!d.observationIndices.length || d.observationIndices.some(i => r.analysis.observations[i]?.status !== "observed"))) ctx.addIssue({ code: "custom", message: "domain observation lacks evidence" });
      if (d.observationIndices.some(i => !r.analysis.observations[i])) ctx.addIssue({ code: "custom", message: "unknown domain evidence" });
    }
  }
  for (const [i, o] of r.analysis.observations.entries()) {
    if (o.endSeconds > r.source.reportedDurationSeconds) ctx.addIssue({ code: "custom", path: ["analysis", "observations", i], message: "observation outside reported duration" });
    if (o.evidence === "source-video" && r.source.availability === "missing") ctx.addIssue({ code: "custom", path: ["analysis", "observations", i], message: "source-video evidence unavailable" });
    if (o.status === "observed" && !["contact-sheet", "source-video"].includes(o.evidence)) ctx.addIssue({ code: "custom", path: ["analysis", "observations", i], message: "observed claims need visual evidence" });
  }
});
export type Reference = z.infer<typeof ReferenceSchema>;
