import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

test("approved UI project exports, unchanged re-export caches, text edit rerenders picture", async ({ page, request }) => {
  test.skip(!process.env.UI_RENDER_TEST, "Set UI_RENDER_TEST=1 for real renders (several minutes)");
  test.setTimeout(1_200_000);
  const initial = await (await request.post("/api/projects", { data: {} })).json();
  const brief = { ...initial.brief, durationSec: 10, product: { ...initial.brief.product, name: "نَفَس", category: "قهوة باردة", features: ["بدون سكر مضاف"], price: undefined, oldPrice: undefined, currency: undefined }, cta: "اطلب الآن" };
  const saved = await request.patch(`/api/projects/${initial.id}`, { data: { revision: initial.revision, brief } });
  expect(saved.status()).toBe(200);
  await page.goto("/");
  await page.getByRole("button", { name: /المشاهد والإبداع/ }).click();
  await page.getByRole("button", { name: "اعتماد المشاهد", exact: true }).click();
  async function exportJob() {
    const [response] = await Promise.all([
      page.waitForResponse(r => r.url().endsWith(`/projects/${initial.id}/jobs`) && r.request().method() === "POST"),
      page.getByRole("button", { name: "إنتاج الإعلان", exact: true }).click(),
    ]);
    expect(response.status()).toBe(201);
    const job = await response.json();
    await expect.poll(async () => {
      const jobs = await (await request.get(`/api/projects/${initial.id}/jobs`)).json();
      const current = jobs.find((j: { id: string }) => j.id === job.id);
      if (current?.status === "failed") throw new Error(current.log);
      return current?.status;
    }, { timeout: 600_000, intervals: [2500] }).toBe("succeeded");
    const run = JSON.parse(fs.readFileSync(path.resolve(`out/render-${job.id}/run.json`), "utf8"));
    console.log(`UI job ${job.id}: ${run.timings.total}s, caches ${JSON.stringify(run.cached)}`);
    await expect(page.getByRole("button", { name: "إنتاج الإعلان", exact: true })).toBeEnabled({ timeout: 10_000 });
    return { job, run };
  }
  const first = await exportJob();
  const download = await request.get(`/api/jobs/${first.job.id}/delivery/video`);
  expect(download.status()).toBe(200);
  const folder = path.resolve("out/phase-2-acceptance"); fs.mkdirSync(folder, { recursive: true });
  const file = path.join(folder, "ui-ad.mp4"); fs.writeFileSync(file, await download.body());
  const info = JSON.parse(execFileSync("ffprobe", ["-v", "quiet", "-show_streams", "-of", "json", file], { encoding: "utf8" }));
  const video = info.streams.find((s: { codec_type: string }) => s.codec_type === "video");
  expect([video.width, video.height, video.r_frame_rate, video.codec_name]).toEqual([1080, 1920, "30/1", "h264"]);
  for (const kind of ["cover", "caption", "report"]) expect((await request.get(`/api/jobs/${first.job.id}/delivery/${kind}`)).status()).toBe(200);
  const cached = await exportJob();
  expect(cached.run.cached).toEqual({ audio: true, video: true });
  await page.getByRole("button", { name: /المشاهد والإبداع/ }).click();
  await page.getByRole("button", { name: /04 الدعوة للإجراء/ }).click();
  await page.getByLabel("النص الرئيسي", { exact: true }).fill("اطلب اليوم");
  await page.getByRole("button", { name: "حفظ المشاهد", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("حُفظت المشاهد");
  await page.getByRole("button", { name: "اعتماد المشاهد", exact: true }).click();
  const edited = await exportJob();
  expect(edited.run.cached).toEqual({ audio: true, video: false });
  expect(await (await request.get(`/api/jobs/${edited.job.id}/delivery/caption`)).text()).toContain("اطلب اليوم");
  fs.writeFileSync(path.join(folder, "results.json"), JSON.stringify({ first: first.run, cached: cached.run, edited: edited.run }, null, 2));
});
