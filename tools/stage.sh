#!/bin/zsh
# stage.sh — copy chapters/hub that pass a smoke test into .snap/stable (the publish source).
# Files that fail keep their previous stable copy. Usage: tools/stage.sh [files...]  (default: all)
cd "${0:a:h}/.."
mkdir -p .snap/stable
files=("$@"); (( ${#files} )) || files=(index.html ch[0-9][0-9]-*.html)
for f in $files; do
  out=$(node tools/snap.mjs $f --shots 1 --wait 4000 --quiet --out .snap/stageshots/${f%.html} 2>&1)
  errs=$(echo "$out" | grep -o '"errors": [0-9]*' | grep -o '[0-9]*$')
  real=$(echo "$out" | grep -E 'UNCAUGHT|console.error|log.error' | grep -v 'thumbs/ch' | wc -l | tr -d ' ')
  if [[ -n $errs && $real == 0 ]]; then cp $f .snap/stable/$f; echo "OK    $f (errors=$errs, non-thumb=$real)"; else echo "FAIL  $f (errors=$errs, non-thumb=$real) — keeping previous stable copy"; echo "$out" | grep -E 'UNCAUGHT|error' | head -3; fi
done
