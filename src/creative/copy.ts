// Fixed template copy per language. Everything else on screen comes from the brief.
import type { Brief } from "../core/schema.ts";

type Lang = Brief["language"];

export const COPY: Record<Lang, {
  lookingFor: (category: string) => string;
  meet: (product: string) => string;
  brandPresents: (brand: string, product: string) => string;
  offerOn: (offer: string, product: string) => string;
  theAnswer: string;
  priceLabel: string;
  insteadOf: string;
}> = {
  ar: {
    lookingFor: (c) => `تدور على ${c}؟`,
    meet: (p) => `تعرّف على ${p}`,
    brandPresents: (b, p) => `${b} تقدّم ${p}`,
    offerOn: (o, p) => `${o} على ${p}`,
    theAnswer: "الحل",
    priceLabel: "السعر",
    insteadOf: "بدل",
  },
  en: {
    lookingFor: (c) => `Looking for ${c}?`,
    meet: (p) => `Meet ${p}`,
    brandPresents: (b, p) => `${b} presents ${p}`,
    offerOn: (o, p) => `${o} on ${p}`,
    theAnswer: "The answer",
    priceLabel: "Price",
    insteadOf: "instead of",
  },
};

export function formatPrice(lang: Lang, value: number, currency: string): string {
  const n = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return lang === "ar" ? `${n} ${currency}` : `${currency} ${n}`;
}
