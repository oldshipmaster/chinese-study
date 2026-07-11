import assert from "node:assert/strict";

const baseUrl = process.env.CHINESE_STUDY_URL ?? "https://oldshipmaster.github.io/chinese-study/";
const fetchWithRetry = async (url, attempts = 3) => {
  let error;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try { return await fetch(url); } catch (caught) {
      error = caught;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 350));
    }
  }
  throw error;
};

const htmlResponse = await fetchWithRetry(baseUrl);
assert.equal(htmlResponse.status, 200, `首页状态异常：${htmlResponse.status}`);
const html = await htmlResponse.text();
const assetPath = html.match(/src="([^"]+\.js)"/)?.[1];
assert.ok(assetPath, "首页没有找到 JavaScript 入口");

const assetUrl = new URL(assetPath, baseUrl).href;
const assetResponse = await fetchWithRetry(assetUrl);
assert.equal(assetResponse.status, 200, `课堂脚本状态异常：${assetResponse.status}`);
const bundle = await assetResponse.text();
for (const feature of ["八站自学小径", "发音动作镜", "语文概念词典", "我预测仍然成立", "跨学科连接", "30 秒复述卡", "只重做错过的题", "继续第 "]) {
  assert.ok(bundle.includes(feature), `线上课堂缺少功能：${feature}`);
}

const audioTokens = ["a", "o", "e", "i", "u", "v", "y", "w", "b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "j", "q", "x", "z", "c", "s", "zh", "ch", "sh", "r", "ai", "ei", "ui", "ao", "ou", "iu", "ie", "ve", "er", "an", "en", "in", "un", "vn", "ang", "eng", "ing", "ong"];
let nextAudioIndex = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (nextAudioIndex < audioTokens.length) {
    const token = audioTokens[nextAudioIndex];
    nextAudioIndex += 1;
    const response = await fetchWithRetry(new URL(`audio/pinyin-${token}.wav`, baseUrl));
    assert.equal(response.status, 200, `${token} 线上音频状态异常：${response.status}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    assert.equal(new TextDecoder("ascii").decode(bytes.slice(0, 4)), "RIFF", `${token} 缺少 RIFF 文件头`);
    assert.equal(new TextDecoder("ascii").decode(bytes.slice(8, 12)), "WAVE", `${token} 缺少 WAVE 文件头`);
  }
}));

console.log(`GitHub Pages 验证通过：${baseUrl}`);
console.log(`入口脚本：${assetUrl}`);
console.log(`丰富课堂功能 8 项、拼音音频 ${audioTokens.length} 个均在线可用。`);
