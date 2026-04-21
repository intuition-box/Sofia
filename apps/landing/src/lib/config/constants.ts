/**
 * Stake amount: 10 TRUST in wei
 */
export const STAKE_AMOUNT = BigInt('10000000000000000000'); // 10 TRUST

/**
 * Curve ID: 1 (Linear/default bonding curve)
 */
export const CURVE_ID = 1n;

/**
 * Sofia Values data with pre-computed triple IDs
 */
export const VALUES_DATA = [
  {
    id: 1,
    name: 'Digital Sovereignty',
    description: 'The user writes and certifies their own digital history on the blockchain. We value online activity to transform a passive trace into a strategic asset.',
    tripleId: '0xf1b04a678cf6b6bb9150357e6d1a96a83ec45016d542f4201564deed37dbc363' as `0x${string}`,
  },
  {
    id: 2,
    name: 'Transparent Integrity',
    description: 'We replace "blind trust" with "verifiable truth." By utilizing local data processing and auditable open-source infrastructure, Sofia eliminates the "black box" of modern tech. We ensure that your digital life is protected by math and code, not just corporate promises.',
    tripleId: '0x89b8575460750b55e0706eb391bcbc3f89b7cba2f2d6d9f839b6e3c25c1a872f' as `0x${string}`,
  },
  {
    id: 3,
    name: 'Identity Through Action',
    description: 'Who we are is defined by what we do. We believe in a "show, don\'t tell" philosophy, ensuring that every customer experience is backed by real-world action and consistent values.',
    tripleId: '0xee59085abd8f08d5e5eaf2ea763f9f3b0fb0daf7fce77114abb46be340fb7dc8' as `0x${string}`,
  },
  {
    id: 4,
    name: 'Contribution-Based Power',
    description: 'Sofia is a community where influence is earned, not bought. Our decentralized governance ensures that value flows to those who contribute, participate, and build. We are creating an ecosystem that rewards meaningful engagement over financial extraction.',
    tripleId: '0x9c113944ab2d277c651f3816a02f45d25157566a52176a88ac3f50169827ac97' as `0x${string}`,
  },
  {
    id: 5,
    name: 'Collective Narrative',
    description: 'Sofia is built in public and open-source by design, embracing transparency at every level. Regular quarterly reports ensure accountability, while the community retains real control over the direction and evolution of the protocol.',
    tripleId: '0x4190a5bf28eb7608c9ee34d50a66733cc55bac461f09b9ca8adcc03572f612ec' as `0x${string}`,
  },
] as const;
