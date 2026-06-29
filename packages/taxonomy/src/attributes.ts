/**
 * Skill / Tool attribute taxonomy — ported from the Atlas community platform
 * (intuition-box/Atlas, src/lib/attestations/definitions.ts) so Sofia and Atlas
 * share one reference for the same Intuition ecosystem atoms.
 *
 * - `ATTRIBUTES` — skills + tools, each `{ id, label, category, atomData }`.
 * - `ATTESTATION_TYPES` — the endorsement predicates (`is_skilled_in` /
 *   `uses_tool`) with their on-chain `termId`, plus the social signals.
 * - `getAttributeThingData` — the EXACT JSON-LD Atlas pins to IPFS for a
 *   skill/tool atom. Kept byte-identical (incl. `ATLAS_BASE_URL`) so Sofia
 *   mints the SAME object atom termId and the triples interoperate with Atlas.
 *
 * Must stay in sync with intuition-box/Atlas src/lib/attestations/definitions.ts.
 */

/** Base URL Atlas bakes into each attribute Thing — do NOT change (it feeds
 *  the IPFS CID, hence the atom termId). */
const ATLAS_BASE_URL = 'https://atlas.box'

/** Schema.org Thing metadata for an Intuition atom (name/description/url). */
export interface ThingData {
  name: string
  description?: string
  image?: string
  url?: string
}

/* ────────────────────────────
   Attestation Types
──────────────────────────── */

export const ATTESTATION_TYPES = {
  FOLLOW: {
    id: 'FOLLOW',
    label: 'I Follow',
    emoji: '👀',
    description: 'Get notifications and updates about this user',
    predicate: 'FOLLOW',
    /** Reuses Intuition ecosystem atom "follows". */
    termId:
      '0xffd07650dc7ab341184362461ebf52144bf8bcac5a19ef714571de15f1319260' as const,
    thing: {
      name: 'Follow',
      description:
        'A follow relationship — get notifications and updates about this user',
    },
  },
  TRUST: {
    id: 'TRUST',
    label: 'I Trust',
    emoji: '🤝',
    description: 'The trust signal',
    predicate: 'TRUST',
    /** Reuses Intuition ecosystem atom "trusts". */
    termId:
      '0x3a73f3b1613d166eea141a25a2adc70db9304ab3c4e90daecad05f86487c3ee9' as const,
    thing: {
      name: 'Trust',
      description: 'A trust signal that influences reputation',
    },
  },
  INTERACTED: {
    id: 'INTERACTED',
    label: 'I Interacted With',
    emoji: '🤙',
    description: 'Calls, meetings, DMs, or in-person meetups',
    predicate: 'INTERACTED',
    /** Reuses Intuition ecosystem atom "interacted with". */
    termId:
      '0x6e4659631eae2d115a8d2a557a1705dead1b0d8e8987b5f7a0f567d8cc676b8a' as const,
    thing: {
      name: 'Interacted With',
      description: 'Shows engagement or communication between entities.',
    },
  },
  COLLAB_WITH: {
    id: 'COLLAB_WITH',
    label: 'I Collaborate With',
    emoji: '💼',
    description: 'Collaborate and work together',
    predicate: 'COLLAB_WITH',
    /** Reuses Intuition ecosystem atom "collaborates with". */
    termId:
      '0x314e6d36910ee516b9fc5f20470b0bca0e36137f5dbcb38e30356fc5396cccdc' as const,
    thing: {
      name: 'Collaborates With',
      description: 'A working relationship — collaborate and work together',
    },
  },
  SKILL_ENDORSE: {
    id: 'SKILL_ENDORSE',
    label: 'Endorsed skill',
    emoji: '🎯',
    description: "Endorse this user's skill",
    predicate: 'is_skilled_in',
    termId:
      '0xe332e7d663cda20970d2e9a9278b6a5be9575c0514379e8574aa61203c549103' as const,
    thing: {
      name: 'is skilled in',
      description: 'An endorsement that a user is skilled in a particular area',
    },
  },
  TOOL_ENDORSE: {
    id: 'TOOL_ENDORSE',
    label: 'Endorsed tool',
    emoji: '⚡',
    description: "Endorse this user's tool proficiency",
    predicate: 'uses_tool',
    /** Reuses Intuition ecosystem atom "uses". */
    termId:
      '0x5c0bde1cc696456c0268248c4656acdf9621fdb39e605bc99b0a83dc8ff6e800' as const,
    thing: {
      name: 'Uses Tool',
      description:
        'An endorsement that a user is proficient with a specific tool',
    },
  },
} as const

export type AttestationType = keyof typeof ATTESTATION_TYPES

export const ATTESTATION_TYPE_LIST = Object.values(ATTESTATION_TYPES)

/** Set of attestation types that are endorsements (require attributeId). */
export const ENDORSEMENT_TYPES = new Set<AttestationType>([
  'SKILL_ENDORSE',
  'TOOL_ENDORSE',
])

/** Check if an attestation type is an endorsement type. */
export function isEndorsementType(type: string): boolean {
  return type === 'SKILL_ENDORSE' || type === 'TOOL_ENDORSE'
}

/** Get the correct endorsement attestation type for an attribute category. */
export function endorsementTypeForCategory(
  category: AttributeCategory,
): AttestationType {
  return category === 'skill' ? 'SKILL_ENDORSE' : 'TOOL_ENDORSE'
}

/**
 * Get the hardcoded term_id for an attestation type, if available.
 * Returns null for Atlas-specific predicates that are created dynamically.
 */
export function getHardcodedTermId(
  type: AttestationType,
): `0x${string}` | null {
  return (ATTESTATION_TYPES[type].termId ?? null) as `0x${string}` | null
}

/**
 * Get the legacy blockchain predicate string for an attestation type.
 * @deprecated Use getPredicateThingData for beautiful atoms.
 */
export function getPredicateForType(type: AttestationType): string {
  return ATTESTATION_TYPES[type].predicate
}

/* ────────────────────────────
   Attributes (Skills + Tools)
──────────────────────────── */

/**
 * User Attributes Configuration
 *
 * Attributes are things users can have/claim (skills, tools).
 * These are object atoms in Intuition - can be used in triples like:
 *   [User] → [has_attribute] → [Attribute]
 *
 * Future: Other users can endorse these attributes.
 */

export const ATTRIBUTES = {
  // Skills
  engineering: {
    id: 'engineering',
    label: 'Engineering',
    category: 'skill',
    atomData: 'engineering',
  },
  design: {
    id: 'design',
    label: 'Design',
    category: 'skill',
    atomData: 'design',
  },
  product: {
    id: 'product',
    label: 'Product',
    category: 'skill',
    atomData: 'product',
  },
  marketing: {
    id: 'marketing',
    label: 'Marketing',
    category: 'skill',
    atomData: 'marketing',
  },
  community: {
    id: 'community',
    label: 'Community',
    category: 'skill',
    atomData: 'community',
  },
  research: {
    id: 'research',
    label: 'Research',
    category: 'skill',
    atomData: 'research',
  },
  writing: {
    id: 'writing',
    label: 'Writing',
    category: 'skill',
    atomData: 'writing',
  },
  dataScience: {
    id: 'dataScience',
    label: 'Data Science',
    category: 'skill',
    atomData: 'data_science',
  },
  security: {
    id: 'security',
    label: 'Security',
    category: 'skill',
    atomData: 'security',
  },
  devrel: {
    id: 'devrel',
    label: 'DevRel',
    category: 'skill',
    atomData: 'devrel',
  },
  projectManagement: {
    id: 'projectManagement',
    label: 'Project Management',
    category: 'skill',
    atomData: 'project_management',
  },
  smartContracts: {
    id: 'smartContracts',
    label: 'Smart Contracts',
    category: 'skill',
    atomData: 'smart_contracts',
  },
  trading: {
    id: 'trading',
    label: 'Trading',
    category: 'skill',
    atomData: 'trading',
  },
  governance: {
    id: 'governance',
    label: 'Governance',
    category: 'skill',
    atomData: 'governance',
  },
  tokenomics: {
    id: 'tokenomics',
    label: 'Tokenomics',
    category: 'skill',
    atomData: 'tokenomics',
  },
  defi: {
    id: 'defi',
    label: 'DeFi',
    category: 'skill',
    atomData: 'defi',
  },
  devops: {
    id: 'devops',
    label: 'DevOps',
    category: 'skill',
    atomData: 'devops',
  },
  contentCreation: {
    id: 'contentCreation',
    label: 'Content Creation',
    category: 'skill',
    atomData: 'content_creation',
  },
  analytics: {
    id: 'analytics',
    label: 'Analytics',
    category: 'skill',
    atomData: 'analytics',
  },
  ux: {
    id: 'ux',
    label: 'UX',
    category: 'skill',
    atomData: 'ux',
  },
  qa: {
    id: 'qa',
    label: 'QA',
    category: 'skill',
    atomData: 'qa',
  },
  bizdev: {
    id: 'bizdev',
    label: 'BizDev',
    category: 'skill',
    atomData: 'bizdev',
  },
  education: {
    id: 'education',
    label: 'Education',
    category: 'skill',
    atomData: 'education',
  },
  illustration: {
    id: 'illustration',
    label: 'Illustration',
    category: 'skill',
    atomData: 'illustration',
  },
  animation: {
    id: 'animation',
    label: 'Animation',
    category: 'skill',
    atomData: 'animation',
  },
  photography: {
    id: 'photography',
    label: 'Photography',
    category: 'skill',
    atomData: 'photography',
  },
  videography: {
    id: 'videography',
    label: 'Videography',
    category: 'skill',
    atomData: 'videography',
  },
  videoEditing: {
    id: 'videoEditing',
    label: 'Video Editing',
    category: 'skill',
    atomData: 'video_editing',
  },
  soundDesign: {
    id: 'soundDesign',
    label: 'Sound Design',
    category: 'skill',
    atomData: 'sound_design',
  },
  musicProduction: {
    id: 'musicProduction',
    label: 'Music Production',
    category: 'skill',
    atomData: 'music_production',
  },
  threeDModeling: {
    id: 'threeDModeling',
    label: '3D Modeling',
    category: 'skill',
    atomData: '3d_modeling',
  },
  copywriting: {
    id: 'copywriting',
    label: 'Copywriting',
    category: 'skill',
    atomData: 'copywriting',
  },
  socialMedia: {
    id: 'socialMedia',
    label: 'Social Media',
    category: 'skill',
    atomData: 'social_media',
  },
  streaming: {
    id: 'streaming',
    label: 'Streaming',
    category: 'skill',
    atomData: 'streaming',
  },
  podcasting: {
    id: 'podcasting',
    label: 'Podcasting',
    category: 'skill',
    atomData: 'podcasting',
  },
  storytelling: {
    id: 'storytelling',
    label: 'Storytelling',
    category: 'skill',
    atomData: 'storytelling',
  },
  nftStrategy: {
    id: 'nftStrategy',
    label: 'NFT Strategy',
    category: 'skill',
    atomData: 'nft_strategy',
  },
  curation: {
    id: 'curation',
    label: 'Curation',
    category: 'skill',
    atomData: 'curation',
  },
  moderation: {
    id: 'moderation',
    label: 'Moderation',
    category: 'skill',
    atomData: 'moderation',
  },
  eventPlanning: {
    id: 'eventPlanning',
    label: 'Event Planning',
    category: 'skill',
    atomData: 'event_planning',
  },
  fundraising: {
    id: 'fundraising',
    label: 'Fundraising',
    category: 'skill',
    atomData: 'fundraising',
  },
  hr: {
    id: 'hr',
    label: 'HR',
    category: 'skill',
    atomData: 'hr',
  },
  operations: {
    id: 'operations',
    label: 'Operations',
    category: 'skill',
    atomData: 'operations',
  },
  legal: {
    id: 'legal',
    label: 'Legal',
    category: 'skill',
    atomData: 'legal',
  },
  accounting: {
    id: 'accounting',
    label: 'Accounting',
    category: 'skill',
    atomData: 'accounting',
  },
  partnerships: {
    id: 'partnerships',
    label: 'Partnerships',
    category: 'skill',
    atomData: 'partnerships',
  },
  growth: {
    id: 'growth',
    label: 'Growth',
    category: 'skill',
    atomData: 'growth',
  },
  brandDesign: {
    id: 'brandDesign',
    label: 'Brand Design',
    category: 'skill',
    atomData: 'brand_design',
  },

  // Tools
  vscode: {
    id: 'vscode',
    label: 'VS Code',
    category: 'tool',
    atomData: 'vscode',
  },
  cursor: {
    id: 'cursor',
    label: 'Cursor',
    category: 'tool',
    atomData: 'cursor',
  },
  claude: {
    id: 'claude',
    label: 'Claude',
    category: 'tool',
    atomData: 'claude',
  },
  notion: {
    id: 'notion',
    label: 'Notion',
    category: 'tool',
    atomData: 'notion',
  },
  chatgpt: {
    id: 'chatgpt',
    label: 'ChatGPT',
    category: 'tool',
    atomData: 'chatgpt',
  },
  figma: {
    id: 'figma',
    label: 'Figma',
    category: 'tool',
    atomData: 'figma',
  },
  github: {
    id: 'github',
    label: 'GitHub',
    category: 'tool',
    atomData: 'github',
  },
  davinci: {
    id: 'davinci',
    label: 'DaVinci Resolve',
    category: 'tool',
    atomData: 'davinci',
  },
  linear: {
    id: 'linear',
    label: 'Linear',
    category: 'tool',
    atomData: 'linear',
  },
  discord: {
    id: 'discord',
    label: 'Discord',
    category: 'tool',
    atomData: 'discord',
  },
  telegram: {
    id: 'telegram',
    label: 'Telegram',
    category: 'tool',
    atomData: 'telegram',
  },
  dune: {
    id: 'dune',
    label: 'Dune',
    category: 'tool',
    atomData: 'dune',
  },
  remix: {
    id: 'remix',
    label: 'Remix IDE',
    category: 'tool',
    atomData: 'remix',
  },
  hardhat: {
    id: 'hardhat',
    label: 'Hardhat',
    category: 'tool',
    atomData: 'hardhat',
  },
  foundry: {
    id: 'foundry',
    label: 'Foundry',
    category: 'tool',
    atomData: 'foundry',
  },
  vercel: {
    id: 'vercel',
    label: 'Vercel',
    category: 'tool',
    atomData: 'vercel',
  },
  arc: {
    id: 'arc',
    label: 'Arc',
    category: 'tool',
    atomData: 'arc',
  },
  obsidian: {
    id: 'obsidian',
    label: 'Obsidian',
    category: 'tool',
    atomData: 'obsidian',
  },
  blender: {
    id: 'blender',
    label: 'Blender',
    category: 'tool',
    atomData: 'blender',
  },
  photoshop: {
    id: 'photoshop',
    label: 'Photoshop',
    category: 'tool',
    atomData: 'photoshop',
  },
  canva: {
    id: 'canva',
    label: 'Canva',
    category: 'tool',
    atomData: 'canva',
  },
  slack: {
    id: 'slack',
    label: 'Slack',
    category: 'tool',
    atomData: 'slack',
  },
  miro: {
    id: 'miro',
    label: 'Miro',
    category: 'tool',
    atomData: 'miro',
  },
  windsurf: {
    id: 'windsurf',
    label: 'Windsurf',
    category: 'tool',
    atomData: 'windsurf',
  },
  copilot: {
    id: 'copilot',
    label: 'GitHub Copilot',
    category: 'tool',
    atomData: 'copilot',
  },
  v0: {
    id: 'v0',
    label: 'v0',
    category: 'tool',
    atomData: 'v0',
  },
  bolt: {
    id: 'bolt',
    label: 'Bolt',
    category: 'tool',
    atomData: 'bolt',
  },
  replit: {
    id: 'replit',
    label: 'Replit',
    category: 'tool',
    atomData: 'replit',
  },
  railway: {
    id: 'railway',
    label: 'Railway',
    category: 'tool',
    atomData: 'railway',
  },
  supabase: {
    id: 'supabase',
    label: 'Supabase',
    category: 'tool',
    atomData: 'supabase',
  },
  firebase: {
    id: 'firebase',
    label: 'Firebase',
    category: 'tool',
    atomData: 'firebase',
  },
  docker: {
    id: 'docker',
    label: 'Docker',
    category: 'tool',
    atomData: 'docker',
  },
  terraform: {
    id: 'terraform',
    label: 'Terraform',
    category: 'tool',
    atomData: 'terraform',
  },
  etherscan: {
    id: 'etherscan',
    label: 'Etherscan',
    category: 'tool',
    atomData: 'etherscan',
  },
  safe: {
    id: 'safe',
    label: 'Safe',
    category: 'tool',
    atomData: 'safe',
  },
  metamask: {
    id: 'metamask',
    label: 'MetaMask',
    category: 'tool',
    atomData: 'metamask',
  },
  rainbow: {
    id: 'rainbow',
    label: 'Rainbow',
    category: 'tool',
    atomData: 'rainbow',
  },
  tenderly: {
    id: 'tenderly',
    label: 'Tenderly',
    category: 'tool',
    atomData: 'tenderly',
  },
  alchemy: {
    id: 'alchemy',
    label: 'Alchemy',
    category: 'tool',
    atomData: 'alchemy',
  },
  infura: {
    id: 'infura',
    label: 'Infura',
    category: 'tool',
    atomData: 'infura',
  },
  excalidraw: {
    id: 'excalidraw',
    label: 'Excalidraw',
    category: 'tool',
    atomData: 'excalidraw',
  },
  loom: {
    id: 'loom',
    label: 'Loom',
    category: 'tool',
    atomData: 'loom',
  },
  afterEffects: {
    id: 'afterEffects',
    label: 'After Effects',
    category: 'tool',
    atomData: 'after_effects',
  },
  premiere: {
    id: 'premiere',
    label: 'Premiere Pro',
    category: 'tool',
    atomData: 'premiere',
  },
  midjourney: {
    id: 'midjourney',
    label: 'Midjourney',
    category: 'tool',
    atomData: 'midjourney',
  },
  framer: {
    id: 'framer',
    label: 'Framer',
    category: 'tool',
    atomData: 'framer',
  },
  webstorm: {
    id: 'webstorm',
    label: 'WebStorm',
    category: 'tool',
    atomData: 'webstorm',
  },
  warp: {
    id: 'warp',
    label: 'Warp',
    category: 'tool',
    atomData: 'warp',
  },
  iterm: {
    id: 'iterm',
    label: 'iTerm2',
    category: 'tool',
    atomData: 'iterm',
  },
  postman: {
    id: 'postman',
    label: 'Postman',
    category: 'tool',
    atomData: 'postman',
  },
  procreate: {
    id: 'procreate',
    label: 'Procreate',
    category: 'tool',
    atomData: 'procreate',
  },
  illustrator: {
    id: 'illustrator',
    label: 'Illustrator',
    category: 'tool',
    atomData: 'illustrator',
  },
  cinema4d: {
    id: 'cinema4d',
    label: 'Cinema 4D',
    category: 'tool',
    atomData: 'cinema4d',
  },
  unrealEngine: {
    id: 'unrealEngine',
    label: 'Unreal Engine',
    category: 'tool',
    atomData: 'unreal_engine',
  },
  unity: {
    id: 'unity',
    label: 'Unity',
    category: 'tool',
    atomData: 'unity',
  },
  touchDesigner: {
    id: 'touchDesigner',
    label: 'TouchDesigner',
    category: 'tool',
    atomData: 'touch_designer',
  },
  ableton: {
    id: 'ableton',
    label: 'Ableton Live',
    category: 'tool',
    atomData: 'ableton',
  },
  logicPro: {
    id: 'logicPro',
    label: 'Logic Pro',
    category: 'tool',
    atomData: 'logic_pro',
  },
  obs: {
    id: 'obs',
    label: 'OBS',
    category: 'tool',
    atomData: 'obs',
  },
  streamyard: {
    id: 'streamyard',
    label: 'StreamYard',
    category: 'tool',
    atomData: 'streamyard',
  },
  riverside: {
    id: 'riverside',
    label: 'Riverside',
    category: 'tool',
    atomData: 'riverside',
  },
  descript: {
    id: 'descript',
    label: 'Descript',
    category: 'tool',
    atomData: 'descript',
  },
  capcut: {
    id: 'capcut',
    label: 'CapCut',
    category: 'tool',
    atomData: 'capcut',
  },
  finalCutPro: {
    id: 'finalCutPro',
    label: 'Final Cut Pro',
    category: 'tool',
    atomData: 'final_cut_pro',
  },
  opensea: {
    id: 'opensea',
    label: 'OpenSea',
    category: 'tool',
    atomData: 'opensea',
  },
  zora: {
    id: 'zora',
    label: 'Zora',
    category: 'tool',
    atomData: 'zora',
  },
  manifold: {
    id: 'manifold',
    label: 'Manifold',
    category: 'tool',
    atomData: 'manifold',
  },
  snapshot: {
    id: 'snapshot',
    label: 'Snapshot',
    category: 'tool',
    atomData: 'snapshot',
  },
  tally: {
    id: 'tally',
    label: 'Tally',
    category: 'tool',
    atomData: 'tally',
  },
  coordinape: {
    id: 'coordinape',
    label: 'Coordinape',
    category: 'tool',
    atomData: 'coordinape',
  },
  guild: {
    id: 'guild',
    label: 'Guild.xyz',
    category: 'tool',
    atomData: 'guild',
  },
  combot: {
    id: 'combot',
    label: 'Combot',
    category: 'tool',
    atomData: 'combot',
  },
  sproutSocial: {
    id: 'sproutSocial',
    label: 'Sprout Social',
    category: 'tool',
    atomData: 'sprout_social',
  },
  buffer: {
    id: 'buffer',
    label: 'Buffer',
    category: 'tool',
    atomData: 'buffer',
  },
  typefully: {
    id: 'typefully',
    label: 'Typefully',
    category: 'tool',
    atomData: 'typefully',
  },
  superfluid: {
    id: 'superfluid',
    label: 'Superfluid',
    category: 'tool',
    atomData: 'superfluid',
  },
  juicebox: {
    id: 'juicebox',
    label: 'Juicebox',
    category: 'tool',
    atomData: 'juicebox',
  },
  airtable: {
    id: 'airtable',
    label: 'Airtable',
    category: 'tool',
    atomData: 'airtable',
  },
  clickup: {
    id: 'clickup',
    label: 'ClickUp',
    category: 'tool',
    atomData: 'clickup',
  },
  asana: {
    id: 'asana',
    label: 'Asana',
    category: 'tool',
    atomData: 'asana',
  },
  whimsical: {
    id: 'whimsical',
    label: 'Whimsical',
    category: 'tool',
    atomData: 'whimsical',
  },
} as const

export type AttributeId = keyof typeof ATTRIBUTES
export type AttributeCategory = 'skill' | 'tool'
export type Attribute = (typeof ATTRIBUTES)[AttributeId]

// Filtered lists for UI
export const SKILLS = Object.values(ATTRIBUTES).filter(
  (a): a is Attribute & { category: 'skill' } => a.category === 'skill',
)
export const TOOLS = Object.values(ATTRIBUTES).filter(
  (a): a is Attribute & { category: 'tool' } => a.category === 'tool',
)

// String arrays for backward compatibility with existing UI
export const SKILL_LIST = SKILLS.map((s) => s.label)
export const TOOL_LIST = TOOLS.map((t) => t.label)

// Legacy type exports for backward compatibility
export type Skill = string
export type Tool = string

/** Reverse lookup: find an attribute by its display label (case-insensitive). */
export function getAttributeByLabel(label: string): Attribute | undefined {
  return Object.values(ATTRIBUTES).find(
    (a) => a.label.toLowerCase() === label.toLowerCase(),
  )
}

/** Lookup an attribute by its ID. */
export function getAttributeById(id: string): Attribute | undefined {
  return ATTRIBUTES[id as AttributeId]
}

/**
 * The schema.org Thing pinned to IPFS for an attribute's object atom.
 * Deterministic: identical JSON-LD → identical IPFS CID → identical atom
 * termId. MUST match Atlas byte-for-byte so the triples interoperate.
 */
export function getAttributeThingData(id: AttributeId): ThingData {
  const attr = ATTRIBUTES[id]
  const categoryLabel = attr.category === 'skill' ? 'skill' : 'tool'
  return {
    name: attr.label,
    description: `${attr.label} — a ${categoryLabel} on Atlas`,
    url: `${ATLAS_BASE_URL}/${attr.category}s/${attr.id}`,
  }
}

/** Endorsement predicate term_id for an attribute category. */
export function endorsePredicateTermId(category: AttributeCategory): string {
  return category === 'skill'
    ? ATTESTATION_TYPES.SKILL_ENDORSE.termId
    : ATTESTATION_TYPES.TOOL_ENDORSE.termId
}
