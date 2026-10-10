import fs from "node:fs";
import path from "node:path";
import { creativeMode } from "../intake/creative-mode.ts";
import { loadBrief } from "../intake/loadBrief.ts";
import { loadReference } from "../references/load.ts";
import { BriefSchema } from "../core/schema.ts";
import { planProduction } from "../creative/plan.ts";
import { analysisCoverage } from "../creative/reference-memory.ts";

// Validated reference manifests are produced by the existing reference review/import workflow.
// Raw video needs that review first: do not fabricate vision or audio analysis from its filename.
const file = process.argv[2];
if (!file) throw new Error("Usage: npm run creative:intake -- request.json");
const base = path.dirname(path.resolve(file));
const { mode, request } = creativeMode(JSON.parse(fs.readFileSync(file, "utf8")));
const references = request.references.map(f => loadReference(path.resolve(base, f)));
let result: unknown;
if (mode === "video-reference") {
  result = { mode, targetProduct: null, productionTriggered: false, references: references.map(r => ({ id: r.id, coverage: analysisCoverage(r) })) };
} else {
  const { brief, dir } = loadBrief(path.resolve(base, request.productBrief!));
  const adaptive = BriefSchema.parse({ ...brief, creative: { ...brief.creative, mode: "adaptive", ...(references.length ? { referenceIds: references.map(r => r.id) } : {}) } });
  result = { mode, storyboard: planProduction(adaptive, dir) };
}
console.log(JSON.stringify(result, null, 2));
