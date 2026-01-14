/**
 * Blockchain constants for Human Attestor workflow
 */

// MultiVault address on mainnet (direct calls, no proxy)
export const MULTIVAULT_ADDRESS = '0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e' as const;

// Pre-existing Term IDs for the triple [user] [is_human] [verified]
export const TERM_ID_SOCIALS_PLATFORM ='0x321744544c49d5f58f7f48319b850d790a3f4341be4cadfd96c34f70598fa5d1' as const;
export const TERM_ID_IS_HUMAN = '0x004614d581d091be4b93f4a56321f00b7e187190011b6683b955dcd43a611248' as const;
export const TERM_ID_VERIFIED = '0xcdffac0eb431ba084e18d5af7c55b4414c153f5c0df693c2d1454079186f975c' as const;

// Minimum deposit for triple creation (0.01 TRUST in wei)
export const MIN_DEPOSIT = 10000000000000000n; // 0.01 TRUST
