// Browser-safe capabilities. Add a definition here and a matching component in the render registry.
export const templateDefinitions = {
  "bold-commercial": {
    compositionId: "BoldCommercial", width: 1080, height: 1920, fps: 30,
    motions: { hook: ["kinetic-pop", "push-in"], problem: ["kinetic-pop", "push-in"], reveal: ["mask-reveal"], benefit: ["slide-card"], offer: ["stamp"], cta: ["pulse"] },
    capabilities: ["kinetic-type", "transitions", "pan-zoom", "parallax", "2d", "css-perspective"],
  },
  "toon-commercial": {
    compositionId: "ToonCommercial", width: 1080, height: 1920, fps: 30,
    motions: { hook: ["kinetic-pop", "push-in"], problem: ["kinetic-pop", "push-in"], reveal: ["mask-reveal"], benefit: ["slide-card"], offer: ["stamp"], cta: ["pulse"] },
    capabilities: ["kinetic-type", "transitions", "pan-zoom", "parallax", "2d", "illustrated-depth"],
  },
} as const;
export function templateDefinition(id: string) {
  const definition = templateDefinitions[id as keyof typeof templateDefinitions];
  if (!definition) throw new Error(`Unsupported template: ${id}. Register its capabilities and component first.`);
  return definition;
}
