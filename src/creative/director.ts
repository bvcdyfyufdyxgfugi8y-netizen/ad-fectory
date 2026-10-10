// Creative Director: brief → strategy, three hooks and an ordered scene plan (no timing yet).
// Phase 1 ships a deterministic, rule-based director. An LLM-backed director (Phase 2) implements the same
// interface; whichever runs, every on-screen line must trace back to a brief field (scene.source).
import type { Brief, Scene, Storyboard } from "../core/schema.ts";
import { COPY, formatPrice } from "./copy.ts";

export type DraftScene = Omit<Scene, "durationInFrames" | "id">;
export interface CreativeDraft {
  strategy: Storyboard["strategy"];
  hooks: [string, string, string];
  selectedHook: number;
  scenes: DraftScene[];
}

export interface CreativeDirector {
  readonly name: string;
  draft(brief: Brief): CreativeDraft;
}

export function pickStrategy(b: Brief): Storyboard["strategy"] {
  if (b.product.offer && (b.goal === "sell" || b.goal === "engagement")) return "offer-first";
  if (b.product.problem) return "problem-solution";
  return "product-reveal";
}

export const ruleBasedDirector: CreativeDirector = {
  name: "rule-based@1",
  draft(b) {
    const c = COPY[b.language];
    // The product name never breaks across lines: its words are joined with no-break spaces, so the
    // kinetic text animates (and highlights) it as one unit.
    const p = { ...b.product, name: b.product.name.trim().split(/\s+/).join("\u00A0") };
    const strategy = pickStrategy(b);

    // Three different hook angles: question/problem, reveal, offer/brand.
    const hooks: [string, string, string] = [
      p.problem ? `${p.problem}${b.language === "ar" ? "؟" : "?"}` : c.lookingFor(p.category),
      c.meet(p.name),
      p.offer ? c.offerOn(p.offer, p.name) : c.brandPresents(b.client.brand, p.name),
    ];
    const selectedHook = strategy === "problem-solution" ? 0 : strategy === "offer-first" ? 2 : 1;
    const hookSource = [
      [p.problem ? "product.problem" : "product.category", "template"],
      ["product.name", "template"],
      [p.offer ? "product.offer" : "client.brand", "product.name", "template"],
    ][selectedHook]!;

    const scenes: DraftScene[] = [];
    scenes.push({ kind: "hook", headline: hooks[selectedHook]!, source: hookSource, motion: "kinetic-pop", transition: "none", emphasis: [] });

    scenes.push({
      kind: "reveal",
      headline: p.name,
      sub: strategy === "problem-solution" ? c.theAnswer : p.category,
      source: ["product.name", strategy === "problem-solution" ? "template" : "product.category"],
      image: p.images[0],
      motion: "mask-reveal",
      transition: "wipe",
      emphasis: [],
    });

    p.features.slice(0, 3).forEach((f, i) => {
      scenes.push({
        kind: "benefit",
        headline: f,
        sub: `0${i + 1}`,
        source: [`product.features[${i}]`],
        image: p.images[(i + 1) % p.images.length],
        motion: "slide-card",
        transition: i === 0 ? "slide-up" : "fade",
        emphasis: [],
      });
    });

    if (p.price !== undefined && p.currency) {
      const sub = p.oldPrice !== undefined ? `${c.insteadOf} ${formatPrice(b.language, p.oldPrice, p.currency)}` : p.offer;
      scenes.push({
        kind: "offer",
        headline: formatPrice(b.language, p.price, p.currency),
        sub,
        source: ["product.price", "product.currency", ...(p.oldPrice !== undefined ? ["product.oldPrice", "template"] : p.offer ? ["product.offer"] : [])],
        motion: "stamp",
        transition: "zoom",
        emphasis: [],
      });
    } else if (p.offer) {
      scenes.push({ kind: "offer", headline: p.offer, source: ["product.offer"], motion: "stamp", transition: "zoom", emphasis: [] });
    }

    scenes.push({
      kind: "cta",
      headline: b.cta,
      sub: b.client.handle ?? b.client.brand,
      source: ["cta", b.client.handle ? "client.handle" : "client.brand"],
      image: p.images[0],
      motion: "pulse",
      transition: "wipe",
      emphasis: [],
    });

    return { strategy, hooks, selectedHook, scenes };
  },
};
