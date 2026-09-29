#!/usr/bin/env sh
# ============================================================
# check_secrets.sh — run this BEFORE every push.
#
# It proves, rather than assumes, that .gitignore is doing its job:
#   1. asks Git exactly which files WOULD be committed (dry run),
#   2. fails if any of them has a secret-shaped NAME,
#   3. fails if any of them has secret-shaped CONTENT,
#   4. warns about files large enough to be build output.
#
# It never commits, never pushes, never deletes. Safe to re-run.
#
# Usage:   sh check_secrets.sh            (from the project root)
#          sh check_secrets.sh /path/to/SpeakSarthi
# ============================================================
set -u

ROOT="${1:-.}"
cd "$ROOT" || { echo "FAIL: cannot enter $ROOT"; exit 2; }
ROOT_ABS=$(pwd)

echo "=============================================="
echo " Pre-push secret check"
echo " Project: $ROOT_ABS"
echo "=============================================="
echo

if [ ! -f .gitignore ]; then
  echo "FAIL: there is no .gitignore in this folder."
  echo "      Copy the one from the github-ready pack in first."
  exit 1
fi
echo "[ok] .gitignore present ($(wc -l < .gitignore | tr -d ' ') lines)"

if [ ! -d .git ]; then
  echo "[..] no git repo here yet — creating one (this is harmless)"
  git init -q || { echo "FAIL: git init failed. Is git installed?"; exit 2; }
fi

# What would actually be committed, according to Git itself.
LIST=$(mktemp)
git add -A --dry-run 2>/dev/null | sed -e "s/^add '//" -e "s/'$//" > "$LIST"
COUNT=$(wc -l < "$LIST" | tr -d ' ')
echo "[ok] git would stage $COUNT files"
echo

FAILED=0

# ---------- 1. secret-shaped filenames ----------
echo "--- checking filenames ---"
BADNAMES=$(grep -Ei '(^|/)\.env($|\.)|\.jks$|\.keystore$|\.p12$|\.pfx$|keystore\.properties$|service.?account.*\.json$|google-services\.json$|\.dev\.vars$|secrets?\.(json|properties|env)$|local\.properties$|id_rsa|\.pem$' "$LIST" || true)
if [ -n "$BADNAMES" ]; then
  echo "FAIL: these would be committed and must not be:"
  echo "$BADNAMES" | sed 's/^/      /'
  FAILED=1
else
  echo "[ok] no secret-shaped filenames staged"
fi
echo

# ---------- 2. secret-shaped content ----------
echo "--- checking file contents ---"
HITS=$(mktemp)
while IFS= read -r f; do
  [ -f "$f" ] || continue
  case "$f" in
    *.jar|*.png|*.jpg|*.jpeg|*.webp|*.gif|*.ico|*.ttf|*.otf|*.zip|*.apk|*.aab|*.wav|*.mp3|*.pdf) continue ;;
  esac
  # Skip anything over 2 MB — the seed JSON is large and is not a secret.
  SZ=$(wc -c < "$f" 2>/dev/null | tr -d ' ')
  [ "${SZ:-0}" -gt 2000000 ] && continue
  grep -nEI \
    -e 'BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY' \
    -e 'AZURE_SPEECH_KEY[[:space:]]*=[[:space:]]*"[A-Za-z0-9]{20,}"' \
    -e '"private_key"[[:space:]]*:' \
    -e 'AKIA[0-9A-Z]{16}' \
    -e 'ghp_[A-Za-z0-9]{30,}' \
    -e 'sk-[A-Za-z0-9]{32,}' \
    -e 'storePassword[[:space:]]*=[[:space:]]*["'"'"']..' \
    -e 'keyPassword[[:space:]]*=[[:space:]]*["'"'"']..' \
    "$f" 2>/dev/null | sed "s|^|$f:|" >> "$HITS" || true
done < "$LIST"

# worker/src/play.ts legitimately *parses* PEM — it contains no key.
grep -v '^worker/src/play\.ts' "$HITS" > "$HITS.f" 2>/dev/null || true
mv "$HITS.f" "$HITS" 2>/dev/null || true

if [ -s "$HITS" ]; then
  echo "FAIL: key-shaped content found in staged files:"
  sed 's/^/      /' "$HITS"
  FAILED=1
else
  echo "[ok] no key-shaped content in staged files"
  echo "     (worker/src/play.ts is excluded on purpose: it parses PEM,"
  echo "      it does not contain a key — this was confirmed in the audit)"
fi
echo

# ---------- 3. release build must blank the Azure key ----------
echo "--- checking the release build blanks the Azure key ---"
if [ -f app/build.gradle.kts ]; then
  if grep -A12 -E '^[[:space:]]*release[[:space:]]*\{' app/build.gradle.kts \
     | grep -q 'AZURE_SPEECH_KEY", "\\"\\""'; then
    echo "[ok] release buildType overrides AZURE_SPEECH_KEY to empty"
  else
    echo "WARN: could not confirm the release buildType blanks AZURE_SPEECH_KEY."
    echo "      The release block must contain, verbatim:"
    echo '        buildConfigField("String", "AZURE_SPEECH_KEY", "\"\"")'
    echo "      Without it the key ships inside the APK and is extractable."
    FAILED=1
  fi
else
  echo "WARN: app/build.gradle.kts not found — skipped this check"
fi
echo

# ---------- 4. accidental build output ----------
echo "--- checking for build output / oversized files ---"
BIG=$(while IFS= read -r f; do
        [ -f "$f" ] || continue
        SZ=$(wc -c < "$f" 2>/dev/null | tr -d ' ')
        [ "${SZ:-0}" -gt 5000000 ] && echo "      $((SZ/1048576)) MB  $f"
      done < "$LIST")
if [ -n "$BIG" ]; then
  echo "WARN: files over 5 MB would be committed:"
  echo "$BIG"
  echo "      GitHub warns over 50 MB and refuses over 100 MB per file."
else
  echo "[ok] nothing over 5 MB staged"
fi

OUTPUT=$(grep -E '(^|/)(build|node_modules|\.gradle|\.wrangler|dist)/' "$LIST" || true)
if [ -n "$OUTPUT" ]; then
  echo "WARN: build output appears to be staged (should be ignored):"
  echo "$OUTPUT" | head -10 | sed 's/^/      /'
  FAILED=1
else
  echo "[ok] no build output staged"
fi

rm -f "$LIST" "$HITS"
echo
echo "=============================================="
if [ "$FAILED" -eq 0 ]; then
  echo " RESULT: PASS — safe to commit and push."
else
  echo " RESULT: FAIL — fix the items above before pushing."
fi
echo "=============================================="
exit "$FAILED"
