// On-chain predicate IDs used to resolve a circle's HUMAN owner from the
// indexer. The atom's `creator` field cannot be used — it is always the
// SofiaFeeProxy (for cart-minted circles) or a deployer wallet (for
// foundational atoms), never the user who created the circle.
//
// Owner resolution order (see `fetchGroupOwner`):
//   1. The dedicated owner triple `{owner} | circle_owner | {circle}`, minted
//      alongside the circle at creation. Deterministic and immune to later
//      joiners — but only present once the `circle_owner` predicate atom has
//      been minted and its term_id wired via `CIRCLE_OWNER_PREDICATE_ID`.
//   2. Fallback: the EARLIEST `MEMBER_OF` triple `{owner} | is member of |
//      {circle}`. The creator's membership is minted in the same batch as the
//      circle atom, so the oldest membership is the creator.

// Explorer circle-membership predicate (config.ts `PREDICATE_IDS.MEMBER_OF`)
// plus the legacy "is a member of" Thing still present on older circles. Both
// must be considered when finding the earliest member.
export const MEMBER_OF_PREDICATE_IDS = [
  "0xe489948c4bd4fa6f50f402434996b90942ab67585a71c71d81dff8e624f661d4",
  "0x72b43d4202fe2070725a41e4ff1c83def872b3befadc0627edcc23ffa11b1c66",
] as const
