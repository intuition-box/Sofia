#!/usr/bin/env bash
# Wrapper around `tsc --noEmit` that drops noisy upstream errors from
# @mastra/core's generated provider-types.d.ts.
#
# Why: @mastra/core@0.24.9's `provider-types.generated.d.ts` contains
# property names that start with digits (e.g. `302ai`) without quoting,
# producing invalid TypeScript syntax. skipLibCheck doesn't help — it
# skips type checking on .d.ts files but the parser still trips before
# that. The bug is upstream and unactionable here.
#
# We strip lines under `node_modules/.bun/@mastra+core`, then exit
# non-zero only if a real `error TS` remains in the filtered output.
#
# Tracked: remove this wrapper once @mastra/core ships a fixed
# generated d.ts (https://github.com/mastra-ai/mastra/issues — search
# for "302ai" / "provider-types").

set -uo pipefail

raw=$(tsc --noEmit --pretty false 2>&1 || true)
filtered=$(echo "$raw" | awk '
  /^[^[:space:]]/ { skip = ($0 ~ /node_modules\/\.bun\/@mastra\+core/) ? 1 : 0 }
  !skip { print }
')

# Always show the filtered output so real errors stay visible.
echo "$filtered"

if echo "$filtered" | grep -q 'error TS'; then
  exit 1
fi
exit 0
