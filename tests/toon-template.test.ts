import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { ROOT } from '../src/core/exec.ts';
import { loadBrief } from '../src/intake/loadBrief.ts';
import { planProduction } from '../src/creative/plan.ts';
import { settings, CameraSchema } from '../src/engine/config.ts';
import { validatePlan } from '../src/engine/validate.ts';
import { storyboardTimeline } from '../src/engine/timeline.ts';
import { templateDefinition } from '../src/engine/templates.ts';

test('toon template accepts independent product inputs and preserves beat-grid duration and asset ownership', () => {
 for (const name of ['demo-nafas', 'demo-mint']) {
  const {brief,dir}=loadBrief(path.join(ROOT,'briefs',name,'brief.json'));
  brief.engine=settings({...brief.engine,template:'toon-commercial',cameras:undefined,motionPreset:undefined});
  const sb=planProduction(brief,dir);
  validatePlan(sb,brief);
  assert.equal(sb.template,'toon-commercial');
  assert.equal(sb.durationInFrames,brief.durationSec*30);
  assert.ok(sb.scenes.every(s=>!s.image || brief.product.images.includes(s.image)));
  assert.ok(storyboardTimeline(sb).every(s=>s.from>=0 && s.from+s.duration<=sb.durationInFrames));
  assert.ok(!templateDefinition(sb.template).capabilities.some(c=>c==='css-perspective'));
 }
});
test('toon template rejects perspective recipes and out-of-plane camera rotation instead of silently ignoring them',()=>{
 const {brief,dir}=loadBrief(path.join(ROOT,'briefs/demo-nafas/brief.json'));
 brief.engine=settings({template:'toon-commercial'});
 const sb=planProduction(brief,dir);
 sb.scenes[1]!.camera=CameraSchema.parse({from:{},to:{rotateY:15},endFrame:30});
 assert.throws(()=>validatePlan(sb,brief),/2D only/);
 delete sb.scenes[1]!.camera;
 sb.engine!.motionPreset={name:'poster-stack-depth',applyTo:['reveal'],settleFrames:24,offset:36,tiltDegrees:4};
 assert.throws(()=>validatePlan(sb,brief),/perspective presets/);
});

test('continuous toon staging settles every slice, clamps outside the timeline and stays planar/finite across cuts',async()=>{
 const {toonStage}=await import('../src/remotion/motion/toon-stage.ts');
 const options={assemblyBeats:3,orbitTurns:1,burstIntensity:0.7};
 assert.deepEqual(toonStage(-20,300,75,180,15,options),toonStage(0,300,75,180,15,options));
 assert.deepEqual(toonStage(400,300,75,180,15,options),toonStage(299,300,75,180,15,options));
 for(let frame=0;frame<300;frame++){
  const state=toonStage(frame,300,75,180,15,options);
  for(const key of ['x','y','scale','rotation','burst','orbit','wave'] as const) assert.ok(Number.isFinite(state[key]));
  assert.ok(state.scale>=0.9 && state.scale<=1.2);
  assert.ok(state.burst>=0 && state.burst<=1 && state.wave>=0 && state.wave<=1);
  if(frame>=60) assert.ok(state.pieces.every(p=>p.x===0 && p.y===0 && p.rotation===0 && p.opacity===1));
 }
 for(const cut of [75,180]){
  const before=toonStage(cut-1,300,75,180,15,options),after=toonStage(cut,300,75,180,15,options);
  assert.ok(Math.abs(before.x-after.x)<4 && Math.abs(before.y-after.y)<4,'persistent product must not re-enter at a text cut');
 }
});
test('toon staging parameters are validated and rejected by templates that cannot execute them',()=>{
 const {brief,dir}=loadBrief(path.join(ROOT,'briefs/demo-nafas/brief.json'));
 brief.engine=settings({animation:{toon:{assemblyBeats:3}}});
 assert.throws(()=>validatePlan(planProduction(brief,dir),brief),/toon staging requires/);
 assert.throws(()=>settings({animation:{toon:{orbitTurns:99}}}));
 brief.engine=settings({template:'toon-commercial',animation:{toon:{assemblyBeats:4}}});
 const sb=planProduction(brief,dir);
 const oldDuration=sb.scenes[0]!.durationInFrames;
 sb.scenes[0]!.durationInFrames=30;sb.scenes.at(-1)!.durationInFrames+=oldDuration-30;
 assert.throws(()=>validatePlan(sb,brief),/assembly must settle/);
});
