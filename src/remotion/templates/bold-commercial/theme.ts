// Layout and type rules of the Bold Commercial template. Every text block lives inside SAFE, which keeps
// it clear of the platform UI on Reels / TikTok / Shorts (profile bar at the top, caption and buttons at the bottom).
export const SAFE = { top: 230, bottom: 430, side: 90 } as const;
export const FONT = '"Alexandria Variable", "Alexandria", sans-serif';

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Mix a #RRGGBB colour with an alpha (0..1). */
export function alpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/** Relative luminance contrast ratio (WCAG) between two #RRGGBB colours. */
export function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    const [r, g, bl] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!;
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
}
