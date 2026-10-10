// Delivery package for the client (manual hand-off; nothing is published anywhere).
import type { Brief, Storyboard } from "../core/schema.ts";

/** Caption built only from the brief: hook, stated features, price, CTA, and the client's own hashtags. */
export function caption(brief: Brief, sb: Storyboard): string {
  const hook = sb.scenes.find(s => s.kind === "hook")?.headline ?? sb.hooks[sb.selectedHook]!;
  const cta = sb.scenes.find(s => s.kind === "cta")?.headline ?? brief.cta;
  const bullets = brief.product.features.map((f) => `• ${f}`);
  const price = sb.scenes.find((s) => s.kind === "offer");
  const tags = brief.hashtags.slice(0, 5).map((t) => (t.startsWith("#") ? t : `#${t}`));
  return [hook, "", ...bullets, ...(price ? ["", price.sub ? `${price.headline} (${price.sub})` : price.headline] : []), "", `${cta} ${brief.client.handle ?? ""}`.trim(), "", tags.join(" ")]
    .join("\n").trim() + "\n";
}

/** Frame used for the cover image: middle of the reveal scene (product + name on screen). */
export function coverFrame(sb: Storyboard): number {
  let start = 0;
  for (const s of sb.scenes) {
    if (s.kind === "reveal") return start + Math.round(s.durationInFrames * 0.6);
    start += s.durationInFrames;
  }
  return Math.round(sb.durationInFrames / 3);
}

/** Midpoint frame of every scene, for the review contact sheet. */
export function sceneMidpoints(sb: Storyboard): number[] {
  let start = 0;
  return sb.scenes.map((s) => { const m = start + Math.round(s.durationInFrames / 2); start += s.durationInFrames; return m; });
}
