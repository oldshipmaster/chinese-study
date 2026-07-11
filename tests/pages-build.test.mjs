import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("Pages build uses the repository base path", async () => {
  const [config, packageJson, entry] = await Promise.all([
    readFile("vite.pages.config.ts", "utf8"),
    readFile("package.json", "utf8"),
    readFile("static-site/main.tsx", "utf8"),
  ]);
  assert.match(config, /base:\s*["']\/chinese-study\/["']/);
  assert.match(config, /outDir:.*pages-dist/);
  assert.match(packageJson, /"build:pages"/);
  assert.match(entry, /CourseApp/);
  await assert.rejects(access("pages/main.tsx"));
});

test("Pages output is deployable without Jekyll", async () => {
  await access("pages-dist/index.html");
  await access("pages-dist/.nojekyll");
  const html = await readFile("pages-dist/index.html", "utf8");
  assert.match(html, /\/chinese-study\/assets\//);
  assert.match(html, /字里少年宫/);
});

test("Pages workflow uses official deployment actions and permissions", async () => {
  const workflow = await readFile(".github/workflows/pages.yml", "utf8");
  assert.match(workflow, /pages:\s*write/);
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /actions\/configure-pages@v5/);
  assert.match(workflow, /actions\/upload-pages-artifact@v3/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /npm run build:pages/);
  assert.match(workflow, /npm run build\n/);
  assert.match(workflow, /npm run audit:lessons/);
  assert.match(workflow, /node --test tests\/\*\.test\.mjs/);
  assert.match(workflow, /needs: deploy/);
  assert.match(workflow, /npm run verify:pages/);
});

test("bundles playable WAV pronunciations for the complete pinyin course", async () => {
  const tokens = ["a", "o", "e", "i", "u", "v", "y", "w", "b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "j", "q", "x", "z", "c", "s", "zh", "ch", "sh", "r", "ai", "ei", "ui", "ao", "ou", "iu", "ie", "ve", "er", "an", "en", "in", "un", "vn", "ang", "eng", "ing", "ong"];
  for (const letter of tokens) {
    const audio = await readFile(`static-site/public/audio/pinyin-${letter}.wav`);
    assert.equal(audio.subarray(0, 4).toString("ascii"), "RIFF");
    assert.equal(audio.subarray(8, 12).toString("ascii"), "WAVE");
    assert.ok(audio.byteLength > 5_000 && audio.byteLength < 100_000, `${letter} audio size is suspicious: ${audio.byteLength}`);
  }
  assert.equal(tokens.length, 47);
  for (const token of ["a", "o", "e", "i", "u", "v"]) {
    for (const tone of [1, 2, 3, 4]) {
      const audio = await readFile(`static-site/public/audio/pinyin-tone-${token}${tone}.wav`);
      assert.equal(audio.subarray(0, 4).toString("ascii"), "RIFF");
      assert.ok(audio.byteLength > 5_000 && audio.byteLength < 100_000);
    }
  }
});
