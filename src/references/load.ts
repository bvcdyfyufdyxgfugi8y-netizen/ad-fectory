import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { ReferenceSchema } from "../core/reference.ts";

/** Reference metadata is isolated from production briefs; imagery is never an ad asset. */
export function loadReference(file: string) {
  const reference = ReferenceSchema.parse(JSON.parse(fs.readFileSync(file, "utf8")));
  const dir = fs.realpathSync(path.dirname(file));
  const resolveLocal = (relative: string) => {
    const actualFile = fs.realpathSync(path.resolve(dir, relative));
    const location = path.relative(dir, actualFile);
    if (location.startsWith("../") || path.isAbsolute(location)) throw new Error(`Reference file escapes its folder: ${relative}`);
    if (!fs.statSync(actualFile).isFile()) throw new Error(`Reference is not a file: ${relative}`);
    return actualFile;
  };
  const verify = (relative: string, expected: string) => {
    const actual = createHash("sha256").update(fs.readFileSync(resolveLocal(relative))).digest("hex");
    if (actual !== expected) throw new Error(`Reference SHA-256 mismatch: ${relative}`);
  };
  for (const artifact of reference.artifacts) verify(artifact.file, artifact.sha256);
  if (reference.source.availability === "local-untracked") {
    const proof = JSON.parse(fs.readFileSync(resolveLocal(reference.source.verificationReport!), "utf8")) as { sourceSha256?: string; verifiedAtImport?: boolean };
    if (proof.sourceSha256 !== reference.source.sha256 || proof.verifiedAtImport !== true) throw new Error("Untracked source verification record mismatch");
  }
  if (reference.source.file) resolveLocal(reference.source.file);
  if (reference.source.hashVerification === "verified" && reference.source.file) verify(reference.source.file, reference.source.sha256);
  return reference;
}
