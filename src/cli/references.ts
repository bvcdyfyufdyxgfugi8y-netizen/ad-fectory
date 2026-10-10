import fs from "node:fs";
import { openReferenceMemory, recordCreativeFeedback } from "../creative/reference-memory.ts";
if (process.argv[2] === "--feedback") {
  if (!process.argv[3]) throw new Error("--feedback requires a JSON file");
  console.log(JSON.stringify(recordCreativeFeedback(JSON.parse(fs.readFileSync(process.argv[3], "utf8"))), null, 2));
} else {
  const memory = openReferenceMemory();
  console.log(JSON.stringify({ lessons: memory.listLessons(), techniques: memory.listTechniques() }, null, 2));
}
