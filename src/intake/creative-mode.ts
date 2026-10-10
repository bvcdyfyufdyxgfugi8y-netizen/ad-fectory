import { z } from "zod";
export const CreativeRequestSchema = z.object({
  references: z.array(z.string().min(1)).default([]),
  productBrief: z.string().min(1).optional(),
  advertise: z.boolean().default(false),
}).strict();
/** The presence of a reference never identifies the target product. */
export function creativeMode(input: unknown) {
  const request = CreativeRequestSchema.parse(input);
  if (request.productBrief && request.advertise) return { mode: "product-production" as const, request };
  if (!request.productBrief && request.references.length && !request.advertise) return { mode: "video-reference" as const, request };
  throw new Error("Provide references for learning, or a target product brief with advertise=true; a reference alone is not a production request");
}
