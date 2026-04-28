#!/usr/bin/env bash
# Wrapper around `tsc --noEmit` that drops noisy transitive errors from `ox`.
#
# Why: ox (viem 2.x's underlying primitive lib) ships its source as .ts files,
# not pre-built .d.ts. tsc's `skipLibCheck` only skips .d.ts, so ox's internal
# generics — which require an unreleased TS variance fix — leak into every
# downstream typecheck. The errors are upstream and unactionable here.
#
# We strip lines under `node_modules/.bun/ox`, then exit non-zero if any real
# `error TS` remains in the filtered output. CI gets meaningful failures only.
#
# Tracked: remove this wrapper once viem 3.x lands and we can bump.

set -uo pipefail

# tsc emits one error as a header line (file:line:col, starts at column 0)
# followed by N indented continuation lines that explain the type. To drop a
# noisy ox error cleanly we have to drop the whole block, not just the header.
# awk: when we hit a non-indented line, decide whether the *next block* is
# muted based on its file path. Indented continuation lines inherit that
# decision until the next header.
raw=$(tsc --noEmit --pretty false 2>&1 || true)
filtered=$(echo "$raw" | awk '
  /^[^[:space:]]/ { skip = ($0 ~ /node_modules\/\.bun\/ox/) ? 1 : 0 }
  !skip { print }
')

# Always show the filtered output so real errors stay visible.
echo "$filtered"

if echo "$filtered" | grep -q 'error TS'; then
  exit 1
fi
exit 0
