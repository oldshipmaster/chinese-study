#!/usr/bin/env bash
set -euo pipefail

output_dir="static-site/public/audio"
mkdir -p "$output_dir"

tokens=(a o e i u v y w b p m f d t n l g k h j q x z c s zh ch sh r ai ei ui ao ou iu ie ve er an en in un vn ang eng ing ong)
prompts=(啊 喔 鹅 衣 乌 迂 衣 乌 玻 坡 摸 佛 得 特 讷 勒 哥 科 喝 基 欺 希 资 刺 思 知 吃 师 日 哀 诶 威 凹 欧 优 耶 约 儿 安 恩 因 温 晕 昂 亨 英 翁)

for index in "${!tokens[@]}"; do
  [[ -s "$output_dir/pinyin-${tokens[$index]}.wav" ]] && continue
  say -v Tingting -r 135 -o "$output_dir/pinyin-${tokens[$index]}.wav" --file-format=WAVE --data-format=LEI16@22050 "${prompts[$index]}"
done

tone_tokens=(a1 a2 a3 a4 o1 o2 o3 o4 e1 e2 e3 e4 i1 i2 i3 i4 u1 u2 u3 u4 v1 v2 v3 v4)
tone_prompts=(妈 麻 马 骂 波 婆 簸 破 喝 河 渴 课 衣 姨 椅 意 屋 无 五 雾 迂 鱼 雨 玉)
for index in "${!tone_tokens[@]}"; do
  [[ -s "$output_dir/pinyin-tone-${tone_tokens[$index]}.wav" ]] && continue
  say -v Tingting -r 125 -o "$output_dir/pinyin-tone-${tone_tokens[$index]}.wav" --file-format=WAVE --data-format=LEI16@22050 "${tone_prompts[$index]}"
done

echo "Generated ${#tokens[@]} base sounds and ${#tone_tokens[@]} tone examples in $output_dir"
