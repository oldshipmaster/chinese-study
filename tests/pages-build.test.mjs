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
});
