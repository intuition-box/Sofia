#!/usr/bin/env bash
# Seed a Pro test circle end-to-end: two ACTIVE memberships (group-api) + two
# profiles (circle-pro-api) so you + Sam can test the members-only flow without
# the explorer / on-chain group / indexer.
#
# Usage:
#   ./seed-pro-test.sh <circleId> <ownerWallet> <ownerHandle> <memberWallet> <memberHandle>
#
# Example (circleId can be any group atom term_id — here a made-up one):
#   ./seed-pro-test.sh 0xpro-acme 0xYourWallet you 0xSamWallet sam
#
# Env overrides (defaults match local dev):
#   GROUP_API_URL=http://localhost:8788   GROUP_DEV_TOKEN=dev-secret-123
#   CPA_URL=http://localhost:8789         CPA_DEV_TOKEN=dev-local-secret
set -euo pipefail

CIRCLE="${1:?circleId required}"
OWNER_WALLET="${2:?ownerWallet required}"
OWNER_HANDLE="${3:?ownerHandle required}"
MEMBER_WALLET="${4:?memberWallet required}"
MEMBER_HANDLE="${5:?memberHandle required}"

GROUP_API_URL="${GROUP_API_URL:-http://localhost:8788}"
GROUP_DEV_TOKEN="${GROUP_DEV_TOKEN:-dev-secret-123}"
CPA_URL="${CPA_URL:-http://localhost:8789}"
CPA_DEV_TOKEN="${CPA_DEV_TOKEN:-dev-local-secret}"

seed_member() {
  local wallet="$1" role="$2"
  echo "→ group-api membership: $wallet ($role) in $CIRCLE"
  curl -fsS -X POST "$GROUP_API_URL/dev/seed-owner" \
    -H "x-dev-token: $GROUP_DEV_TOKEN" -H 'Content-Type: application/json' \
    -d "{\"groupTermId\":\"$CIRCLE\",\"wallet\":\"$wallet\",\"role\":\"$role\"}" >/dev/null
}

seed_profile() {
  local wallet="$1" handle="$2"
  echo "→ circle-pro-api profile: $wallet (@$handle)"
  curl -fsS -X POST "$CPA_URL/dev/seed-profile" \
    -H "x-dev-token: $CPA_DEV_TOKEN" -H 'Content-Type: application/json' \
    -d "{\"wallet\":\"$wallet\",\"handle\":\"$handle\"}" >/dev/null
}

seed_member  "$OWNER_WALLET"  OWNER
seed_member  "$MEMBER_WALLET" MEMBER
seed_profile "$OWNER_WALLET"  "$OWNER_HANDLE"
seed_profile "$MEMBER_WALLET" "$MEMBER_HANDLE"

echo
echo "✓ Seeded circle '$CIRCLE' with owner ($OWNER_HANDLE) + member ($MEMBER_HANDLE)."
echo "  Set MEMBERSHIP_ENFORCED=true on circle-pro-api, then both wallets can"
echo "  write to this circle; any other wallet gets 403."
