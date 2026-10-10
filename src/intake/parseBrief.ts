// Pure brief validation (no file system), shared by the CLI and the browser bundle.
import { BriefSchema, type Brief } from "../core/schema.ts";

export class BriefError extends Error {
  constructor(public readonly issues: string[]) {
    super(`brief is invalid:\n  - ${issues.join("\n  - ")}`);
  }
}

export function parseBrief(json: unknown): Brief {
  const r = BriefSchema.safeParse(json);
  if (!r.success) throw new BriefError(r.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`));
  return r.data;
}
