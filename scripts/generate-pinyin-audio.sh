#!/usr/bin/env bash
set -euo pipefail

output_dir="static-site/public/audio"
mkdir -p "$output_dir"

tokens=(a o e i u v y w b p m f d t n l g k h j q x z c s zh ch sh r ai ei ui ao ou iu ie ve er an en in un vn ang eng ing ong)
prompts=(啊 喔 鹅 衣 乌 迂 衣 乌 玻 坡 摸 佛 得 特 讷 勒 哥 科 喝 基 欺 希 资 刺 思 知 吃 师 日 哀 诶 威 凹 欧 优 耶 约 儿 安 恩 因 温 晕 昂 亨 英 翁)

for index in "${!tokens[@]}"; do
  say -v Tingting -r 135 -o "$output_dir/pinyin-${tokens[$index]}.wav" --file-format=WAVE --data-format=LEI16@22050 "${prompts[$index]}"
done

echo "Generated ${#tokens[@]} click-only pinyin WAV files in $output_dir"
