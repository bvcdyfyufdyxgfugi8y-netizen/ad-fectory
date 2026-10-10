import "@fontsource-variable/alexandria";
import React from "react";
import { Composition, continueRender, delayRender } from "remotion";
import { StoryboardSchema, type Storyboard } from "../core/schema.ts";
import { AdComposition } from "./templates/registry.tsx";
import { templateDefinitions } from "../engine/templates.ts";
import { validatePlan } from "../engine/validate.ts";
import { ruleBasedDirector } from "../creative/director.ts";
import { parseBrief } from "../intake/parseBrief.ts";
import { buildStoryboard } from "../storyboard/build.ts";
import demoBrief from "../../briefs/demo-nafas/brief.json";

// Studio preview default: the demo brief, planned on the fly (renders always pass their own storyboard).
const demoBriefParsed = parseBrief(demoBrief);
const demo = buildStoryboard(demoBriefParsed, ruleBasedDirector.draft(demoBriefParsed));

// Nothing renders before the fonts exist: Arabic joins and line breaks must be measured with the real font.
const fonts = delayRender("AD Factory fonts");
Promise.all([
  document.fonts.load('800 120px "Alexandria Variable"', "قهوة باردة"),
  document.fonts.load('600 48px "Alexandria Variable"', "Price 12"),
]).then(() => continueRender(fonts), () => continueRender(fonts));

export const Root: React.FC = () => <>
  {Object.values(templateDefinitions).map(template => (
  <Composition
    key={template.compositionId}
    id={template.compositionId}
    component={AdComposition}
    defaultProps={{ storyboard: demo as Storyboard }}
    calculateMetadata={({ props }) => {
      const sb = StoryboardSchema.parse(props.storyboard);
      validatePlan(sb);
      return { durationInFrames: sb.durationInFrames, fps: sb.fps, width: sb.width, height: sb.height, props: { storyboard: sb } };
    }}
    durationInFrames={600}
    fps={30}
    width={1080}
    height={1920}
  />
  ))}
</>;
