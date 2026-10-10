import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { BriefError, checkAssets, loadBrief, parseBrief } from "../src/intake/loadBrief.ts";
import { demoBriefFile, demoBriefJson } from "./fixtures.ts";

test("demo brief loads with all assets valid", () => {
  const { brief } = loadBrief(demoBriefFile);
  assert.equal(brief.language, "ar");
});

const bad: [string, (b: ReturnType<typeof demoBriefJson>) => void, RegExp][] = [
  ["missing product name", (b) => delete b.product.name, /product\.name/],
  ["bad colour", (b) => (b.brand.colors.primary = "gold"), /#RRGGBB/],
  ["duration too long", (b) => (b.durationSec = 90), /durationSec/],
  ["absolute asset path", (b) => (b.product.images = ["/etc/passwd.png"]), /relative/],
  ["path escape", (b) => (b.product.images = ["../../x.png"]), /relative/],
  ["unsupported asset type", (b) => (b.product.images = ["a.gif"]), /png, jpg/],
  ["old price below price", (b) => (b.product.oldPrice = 5), /higher than price/],
  ["price without currency", (b) => delete b.product.currency, /go together/],
  ["no features", (b) => (b.product.features = []), /features/],
  ["voice file mode without file", (b) => (b.voiceover = { mode: "file" }), /voiceover\.file/],
];
for (const [name, mutate, expect] of bad) {
  test(`rejects: ${name}`, () => {
    const b = demoBriefJson();
    mutate(b);
    assert.throws(() => parseBrief(b), (e: unknown) => e instanceof BriefError && expect.test(e.message));
  });
}

test("asset checks catch missing, mislabelled and scripted files", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "adf-"));
  fs.writeFileSync(path.join(dir, "fake.png"), "not a png");
  fs.writeFileSync(path.join(dir, "evil.svg"), '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  const b = parseBrief({ ...demoBriefJson(), product: { ...demoBriefJson().product, images: ["fake.png", "evil.svg", "gone.jpg"] }, brand: { ...demoBriefJson().brand, logo: undefined } });
  const issues = checkAssets(b, dir).join("\n");
  assert.match(issues, /fake\.png: content does not match/);
  assert.match(issues, /evil\.svg: SVG contains scripts/);
  assert.match(issues, /gone\.jpg: file not found/);
});
