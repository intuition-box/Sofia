/**
 * Blockchain constants for Human Attestor workflow
 */

// MultiVault address on mainnet (direct calls, no proxy)
export const MULTIVAULT_ADDRESS = '0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e' as const;

// Sofia Proxy address for fee-less operations
export const SOFIA_PROXY_ADDRESS = '0x26F81d723Ad1648194FAA4b7E235105Fd1212c6c' as const;

// Pre-existing Term IDs for the triple [user] [is_human] [verified]
export const TERM_ID_SOCIALS_PLATFORM ='0x321744544c49d5f58f7f48319b850d790a3f4341be4cadfd96c34f70598fa5d1' as const;
export const TERM_ID_IS_HUMAN = '0x004614d581d091be4b93f4a56321f00b7e187190011b6683b955dcd43a611248' as const;
export const TERM_ID_VERIFIED = '0xcdffac0eb431ba084e18d5af7c55b4414c153f5c0df693c2d1454079186f975c' as const;

// Platform-specific verification predicates
export const TERM_ID_HAS_VERIFIED_YOUTUBE = '0x794e6a94558ea348a8ac2c35d899766e10c258dd6f2292b90c51121f468364ee' as const;
export const TERM_ID_HAS_VERIFIED_DISCORD = '0x4396ab6d63164f33ae0ad2dd1ea6efea6971869cbca74df8fc2db694e887f6d8' as const;
export const TERM_ID_HAS_VERIFIED_SPOTIFY = '0x9694be4b632180e633dbe81be990a1b73f12b1aa353035455be87bb695e2c94e' as const;
export const TERM_ID_HAS_VERIFIED_TWITCH = '0x59f2249db8da5148f7ba6d8f90cb40a6de2ada2988b10d3110f6362c101f5552' as const;
export const TERM_ID_HAS_VERIFIED_TWITTER = '0x98b027471ab0a05b75d433acc9ffa4d5ea75180b961acf0b0e0ba56cde60375b' as const;

// Minimum deposit for triple creation (0.01 TRUST in wei)
export const MIN_DEPOSIT = 10000000000000000n; // 0.01 TRUST
