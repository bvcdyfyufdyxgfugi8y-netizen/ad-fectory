import React from "react";
import type { Storyboard } from "../../core/schema.ts";
import { templateDefinition } from "../../engine/templates.ts";
import { BoldCommercial } from "./bold-commercial/BoldCommercial.tsx";
export type TemplateProps = { storyboard: Storyboard; assetBase?: string };
export const templateComponents: Record<string, React.FC<TemplateProps>> = { "bold-commercial": BoldCommercial };
export const AdComposition: React.FC<TemplateProps> = props => {
  templateDefinition(props.storyboard.template);
  const Template = templateComponents[props.storyboard.template];
  if (!Template) throw new Error(`Template component missing: ${props.storyboard.template}`);
  return <Template {...props} />;
};
