import fs from "node:fs";
import path from "node:path";
import { ROOT } from "../src/core/exec.ts";

export const demoBriefFile = path.join(ROOT, "briefs/demo-nafas/brief.json");
export const demoBriefJson = () => JSON.parse(fs.readFileSync(demoBriefFile, "utf8"));
