#!/usr/bin/env sh
# ============================================================
# make_github_zip.sh — build a GitHub-ready archive of the project.
#
# WHY THIS EXISTS, AND WHAT IT FIXES
# ----------------------------------
# Every zip delivered earlier in this project was built with
#     zip -rq out.zip proj -x "*.git*"
# The intent was "leave out the .git folder". But "*.git*" also
# matches ".gitignore", ".gitattributes" and ".github/", so those
# were silently stripped from every archive. The .gitignore is the
# one file that stops .env, the upload keystore and the Play service
# account JSON from being committed, so its absence is exactly the
# thing you do not want missing from a GitHub upload.
#
# This script does not hand-maintain exclusion patterns at all.
# It asks Git which files it would actually track
#     git ls-files --cached --others --exclude-standard
# and zips precisely that set. The archive therefore matches the
# repository by construction: .gitignore decides, once, and the
# zip cannot disagree with it.
#
# Usage:  sh make_github_zip.sh /path/to/SpeakSarthi
#         sh make_github_zip.sh /path/to/SpeakSarthi my-name.zip
# ============================================================
set -u

ROOT="${1:-.}"
OUT="${2:-SpeakSarthi-github.zip}"
HERE=$(cd "$(dirname "$0")" && pwd)

cd "$ROOT" || { echo "FAIL: cannot enter $ROOT"; exit 2; }
PROJ=$(pwd)
case "$OUT" in /*) OUTABS="$OUT" ;; *) OUTABS="$PROJ/../$OUT" ;; esac

echo "=============================================="
echo " Building a GitHub-ready archive"
echo " Project: $PROJ"
echo "=============================================="
echo

command -v git >/dev/null 2>&1 || { echo "FAIL: git is not installed."; exit 2; }
command -v zip >/dev/null 2>&1 || { echo "FAIL: zip is not installed."; exit 2; }

# ---------- 1. make sure the repo-hygiene files are present ----------
for f in .gitignore .gitattributes LICENSE; do
  if [ -f "$f" ]; then
    echo "[ok] $f already present — left untouched"
  elif [ -f "$HERE/$f" ]; then
    cp "$HERE/$f" "./$f"
    echo "[++] $f was MISSING — copied in from the pack"
  else
    echo "WARN: $f missing and not found in $HERE"
  fi
done
echo

# ---------- 2. a repo, so Git can answer what it would track ----------
if [ ! -d .git ]; then
  echo "[..] no git repo here — running git init (harmless, nothing is committed)"
  git init -q || exit 2
fi

# ---------- 3. prove nothing sensitive is in the set ----------
if [ -f "$HERE/check_secrets.sh" ]; then
  echo "--- running the pre-push secret check ---"
  if sh "$HERE/check_secrets.sh" "$PROJ"; then
    echo
  else
    echo
    echo "STOPPED: the secret check failed. Nothing was zipped."
    echo "Fix the items above and run this again."
    exit 1
  fi
fi

# ---------- 4. let Git decide the file list ----------
LIST=$(mktemp)
git ls-files --cached --others --exclude-standard -z > "$LIST"
N=$(tr '\0' '\n' < "$LIST" | grep -c .)
echo "[ok] git would track $N files — that is exactly what goes in the zip"

# Everything goes in under one top-level folder, so that extracting the
# archive gives a clean project directory instead of ~200 loose files in
# whatever folder happened to be open.
TOP=$(basename "$PROJ")
PARENT=$(dirname "$PROJ")

rm -f "$OUTABS"
# -@ reads names from stdin; NUL-separated names are converted to lines.
# Filenames with newlines would break this; there are none in this project
# and the count is re-verified below, so a mismatch cannot pass silently.
( cd "$PARENT" && tr '\0' '\n' < "$LIST" | sed "s|^|$TOP/|" | zip -q -X -@ "$OUTABS" )
rm -f "$LIST"

ZN=$(unzip -Z1 "$OUTABS" | grep -c .)
SIZE=$(du -h "$OUTABS" | cut -f1)

echo
echo "--- verifying the archive ---"
echo "[ok] $ZN entries under $TOP/, $SIZE  ->  $OUTABS"
if [ "$ZN" -ne "$N" ]; then
  echo "FAIL: archive has $ZN entries but git tracks $N. Do not upload this."
  exit 1
fi

# The three files that the old broken pattern used to eat.
for f in .gitignore .gitattributes LICENSE; do
  if unzip -Z1 "$OUTABS" | grep -qx "$TOP/$f"; then
    echo "[ok] $f is inside the archive"
  else
    echo "FAIL: $f is NOT in the archive"
    exit 1
  fi
done

# And the ones that must never be.
LEAK=$(unzip -Z1 "$OUTABS" | grep -Ei '(^|/)\.env($|\.)|\.jks$|\.keystore$|service.?account.*\.json$|google-services\.json$|\.dev\.vars$|(^|/)local\.properties$|(^|/)\.git/' || true)
if [ -n "$LEAK" ]; then
  echo "FAIL: the archive contains files it must not:"
  echo "$LEAK" | sed 's/^/      /'
  exit 1
fi
echo "[ok] no secrets, no local.properties, no .git/ inside the archive"

echo
echo "=============================================="
echo " DONE — $OUTABS is ready to upload to GitHub."
echo "=============================================="
