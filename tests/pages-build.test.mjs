import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("Pages build uses the repository base path", async () => {
  const [config, packageJson, entry] = await Promise.all([
    readFile("vite.pages.config.ts", "utf8"),
    readFile("package.json", "utf8"),
    readFile("pages/main.tsx", "utf8"),
  ]);
  assert.match(config, /base:\s*["']\/chinese-study\/["']/);
  assert.match(config, /outDir:.*pages-dist/);
  assert.match(packageJson, /"build:pages"/);
  assert.match(entry, /CourseApp/);
});

test("Pages output is deployable without Jekyll", async () => {
  await access("pages-dist/index.html");
  await access("pages-dist/.nojekyll");
  const html = await readFile("pages-dist/index.html", "utf8");
  assert.match(html, /\/chinese-study\/assets\//);
  assert.match(html, /字里少年宫/);
});
