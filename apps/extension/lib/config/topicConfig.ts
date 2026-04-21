/**
 * Topic Config — On-chain topic atom IDs from Sofia Explorer
 * Maps topic slugs to their Intuition atom term_ids.
 * Source: sofia-explorer/src/config/atomIds.ts
 */

// 14 topic atoms
export const TOPIC_ATOM_IDS: Record<string, string> = {
  "tech-dev": "0x61524d6e0b5632736b5dc1cd5f77d3a87eb67f6f36824eaad3410feba9004c56",
  "design-creative": "0x420ea4d0eba3364dbca6e84f6ed7f27c8fc4c197a0b4fcf8954e93a017a51f11",
  "music-audio": "0x3416b9be13730261f12433b29adc7634e47e58c85814e418061a063d91ea645a",
  "gaming": "0x9fbc9108b7d8127642cd5eccd1334b4258d9e4529e8ed788b618016487d65f96",
  "web3-crypto": "0xb155d936c6cbe66b55f870d9bbf256509c5cf5289d8d8837232f65ad84a4451a",
  "science": "0x323137957c96dd40718aa8592c1a2dd7964c0d5aa0c2ea39311d66524236fea9",
  "sport-health": "0xedcba0b4443fd76ecacd5048533d60c987b973ed58a0d19d69d8dc2766a932c9",
  "video-cinema": "0x56c5988f2489e6557a8abfa03e1a9bbe5aee7332587c15a6f4fe3ce51738938b",
  "entrepreneurship": "0xcce17461209093770314177674fd5d63d876112a94295db79c82cb978280886d",
  "performing-arts": "0xecfd93a579bf98bb1d9e7737b333805367bb2b66e434c03aa7ec3bb16be35dbe",
  "nature-environment": "0x001a3f804ac76ccc90f80a96c5d60eb21b0fe9f6da424de427192e7ff29a58ff",
  "food-lifestyle": "0x38173dfb0b4aef222fa0aa354d2437b35b703d766a2aa6ee374299b218807202",
  "literature": "0x98e0dac5206f5e089f25057cb2feec9d35d89ba6e765f60db8e5e093ec8ff166",
  "personal-dev": "0x36e25f1b36a2597e093feeb7b59357d06c318fc88c1452faffe9ef5ee6d001c1",
}

// All topic term_ids as array (for GraphQL batch queries)
export const TOPIC_TERM_IDS = Object.values(TOPIC_ATOM_IDS)

// Display labels
export const TOPIC_LABELS: Record<string, string> = {
  "tech-dev": "Tech & Dev",
  "design-creative": "Design",
  "music-audio": "Music",
  "gaming": "Gaming",
  "web3-crypto": "Web3",
  "science": "Science",
  "sport-health": "Sport",
  "video-cinema": "Video",
  "entrepreneurship": "Business",
  "performing-arts": "Arts",
  "nature-environment": "Nature",
  "food-lifestyle": "Food",
  "literature": "Literature",
  "personal-dev": "Growth",
}

// Topic colors (from sofia-explorer taxonomy)
export const TOPIC_COLORS: Record<string, string> = {
  "tech-dev": "#4472C4",
  "design-creative": "#E06C75",
  "music-audio": "#61AFEF",
  "gaming": "#C678DD",
  "web3-crypto": "#627EEA",
  "science": "#98C379",
  "sport-health": "#E5C07B",
  "video-cinema": "#E06C75",
  "entrepreneurship": "#D19A66",
  "performing-arts": "#E06C75",
  "nature-environment": "#98C379",
  "food-lifestyle": "#E5C07B",
  "literature": "#ABB2BF",
  "personal-dev": "#C678DD",
}

// Reverse lookup: atom term_id → topic slug
export const ATOM_ID_TO_TOPIC = new Map(
  Object.entries(TOPIC_ATOM_IDS).map(([slug, id]) => [id, slug])
)
