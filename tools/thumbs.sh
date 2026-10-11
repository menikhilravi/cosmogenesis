#!/bin/zsh
# thumbs.sh — capture hub thumbnails for chapters (UI hidden with "h").
# Usage: tools/thumbs.sh 04 05 07 ...   (no args = every chapter file present)
cd "${0:a:h}/.."
mkdir -p thumbs
nums=("$@")
if (( ${#nums} == 0 )); then nums=($(ls ch[0-9][0-9]-*.html | cut -c3-4)); fi
for n in $nums; do
  f=$(ls ch${n}-*.html 2>/dev/null | head -1)
  [[ -z $f ]] && { echo "ch$n: missing"; continue; }
  node tools/snap.mjs $f --shots 1 --wait 5500 --quiet --out .snap/thumbsrc/ch$n --actions '[{"key":"h"},{"wait":1200}]' > .snap/thumbsrc/ch$n.log 2>&1
  errs=$(grep -o '"errors": [0-9]*' .snap/thumbsrc/ch$n.log | grep -o '[0-9]*$')
  sips -s format jpeg -s formatOptions 74 -Z 720 .snap/thumbsrc/ch$n/t0.png --out thumbs/ch$n.jpg >/dev/null 2>&1
  echo "ch$n: $f errors=$errs thumb=$(stat -f%z thumbs/ch$n.jpg 2>/dev/null)"
done
