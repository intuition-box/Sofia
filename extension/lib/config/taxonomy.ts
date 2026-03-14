/**
 * Sofia Taxonomy — 14 Domains x 88 Categories x 300+ Niches
 * Source: docs/prompt/sofia_taxonomy.xlsx
 * Single source of truth for behavioral reputation domains
 */

import type { Domain } from "~/types/reputation"

export const SOFIA_DOMAINS: Domain[] = [
  // =========================================================================
  // 1. TECHNOLOGIE & DEV
  // =========================================================================
  {
    id: "tech-dev",
    label: "Technologie & Dev",
    icon: "keyboard",
    color: "#4472C4",
    primaryPlatforms: [
      "github",
      "stackoverflow",
      "huggingface",
      "leetcode",
      "npm",
    ],
    categories: [
      {
        id: "web-development",
        label: "Web Development",
        niches: [
          {
            id: "frontend",
            label: "Frontend (React, Vue, Svelte)",
            disambiguationSignal:
              "Commit pattern quotidien (GitHub streak)",
            disambiguationResult: "Dev actif vs hobbyiste",
          },
          {
            id: "backend",
            label: "Backend (Node, Python, Go)",
          },
          {
            id: "fullstack",
            label: "Fullstack & Architecture",
          },
          {
            id: "web-performance",
            label: "Web Performance & SEO",
          },
        ],
      },
      {
        id: "mobile-dev",
        label: "Mobile Dev",
        niches: [
          { id: "ios-swift", label: "iOS / Swift" },
          { id: "android-kotlin", label: "Android / Kotlin" },
          {
            id: "react-native-flutter",
            label: "React Native / Flutter",
          },
          { id: "pwa", label: "Progressive Web Apps" },
        ],
      },
      {
        id: "ai-ml",
        label: "AI / Machine Learning",
        niches: [
          {
            id: "ai-research",
            label: "Research & Papers (LLMs)",
            disambiguationSignal:
              "Hugging Face modeles publies",
            disambiguationResult:
              "AI/ML vs dev web classique",
          },
          {
            id: "applied-ai",
            label: "Applied AI (fine-tuning, RAG)",
          },
          { id: "prompt-engineering", label: "Prompt Engineering" },
          { id: "mlops", label: "MLOps & Infra" },
        ],
      },
      {
        id: "devops-cloud",
        label: "DevOps & Cloud",
        niches: [
          {
            id: "kubernetes-docker",
            label: "Kubernetes & Docker",
            disambiguationSignal:
              "Stack Overflow tags dominants",
            disambiguationResult:
              "Langage / ecosysteme exact",
          },
          { id: "cicd-gitops", label: "CI/CD & GitOps" },
          { id: "aws-gcp-azure", label: "AWS / GCP / Azure" },
          { id: "serverless-edge", label: "Serverless & Edge" },
        ],
      },
      {
        id: "cybersecurity",
        label: "Cybersecurite",
        niches: [
          {
            id: "ethical-hacking",
            label: "Ethical hacking & CTF",
          },
          { id: "privacy-opsec", label: "Privacy & OPSEC" },
          { id: "cryptography", label: "Cryptographie" },
          { id: "bug-bounty", label: "Bug bounty" },
        ],
      },
      {
        id: "open-source",
        label: "Open Source",
        niches: [
          {
            id: "oss-contributor",
            label: "Contributeur actif",
            disambiguationSignal:
              "Repos dominants : frontend vs backend vs infra",
            disambiguationResult:
              "Specialisation tech precise",
          },
          { id: "oss-maintainer", label: "Mainteneur de projet" },
          { id: "oss-docs", label: "Documentation" },
          {
            id: "oss-business",
            label: "OSS Business model",
          },
        ],
      },
      {
        id: "hardware-iot",
        label: "Hardware & IoT",
        niches: [
          {
            id: "arduino-rpi",
            label: "Arduino / Raspberry Pi",
          },
          { id: "embedded", label: "Embedded systems" },
          { id: "domotique", label: "Domotique" },
          { id: "robotique", label: "Robotique" },
        ],
      },
      {
        id: "lowcode-nocode",
        label: "Low-code / No-code",
        niches: [
          { id: "bubble-webflow", label: "Bubble, Webflow" },
          {
            id: "airtable-automation",
            label: "Airtable & Automation",
          },
          { id: "zapier-make", label: "Zapier / Make" },
          { id: "internal-tools", label: "Internal tools" },
        ],
      },
    ],
  },

  // =========================================================================
  // 2. DESIGN & CREATIVITE VISUELLE
  // =========================================================================
  {
    id: "design-creative",
    label: "Design & Creativite Visuelle",
    icon: "palette",
    color: "#E06C75",
    primaryPlatforms: [
      "figma",
      "behance",
      "dribbble",
      "sketchfab",
      "flickr",
    ],
    categories: [
      {
        id: "ui-ux-design",
        label: "UI/UX Design",
        niches: [
          {
            id: "product-design",
            label: "Product design",
            disambiguationSignal:
              "Figma : wireframe vs illustrations vs prototypes",
            disambiguationResult:
              "UX designer vs illustrateur vs product",
          },
          { id: "design-system", label: "Design system" },
          { id: "prototyping", label: "Prototypage (Figma)" },
          { id: "user-research", label: "User research" },
        ],
      },
      {
        id: "illustration",
        label: "Illustration & Art numerique",
        niches: [
          {
            id: "concept-art",
            label: "Concept art",
            disambiguationSignal:
              "Behance : categories des projets publies",
            disambiguationResult: "Specialisation exacte",
          },
          { id: "character-design", label: "Character design" },
          { id: "pixel-art", label: "Pixel art" },
          { id: "generative-art", label: "Art generatif" },
        ],
      },
      {
        id: "motion-design",
        label: "Motion Design",
        niches: [
          {
            id: "after-effects",
            label: "After Effects",
            disambiguationSignal:
              "Adobe CC : apps dominantes (Ps vs Ai vs Pr vs Ae)",
            disambiguationResult:
              "Photo vs illustration vs video vs motion",
          },
          {
            id: "lottie-web-animation",
            label: "Lottie / Web animation",
          },
          { id: "3d-motion", label: "3D motion" },
          { id: "vfx", label: "VFX" },
        ],
      },
      {
        id: "graphic-design",
        label: "Graphic Design",
        niches: [
          {
            id: "branding",
            label: "Branding & identite",
            disambiguationSignal:
              "ArtStation + Steam actif simultanement",
            disambiguationResult:
              "Tres probable concept artist gaming",
          },
          { id: "typography", label: "Typography" },
          { id: "print-edition", label: "Print & edition" },
          { id: "packaging", label: "Packaging" },
        ],
      },
      {
        id: "3d-modeling",
        label: "3D & Modelisation",
        niches: [
          { id: "blender", label: "Blender" },
          { id: "cinema4d-maya", label: "Cinema 4D / Maya" },
          { id: "game-assets", label: "Game assets" },
          { id: "architecture-3d", label: "Architecture 3D" },
        ],
      },
      {
        id: "photography",
        label: "Photographie",
        niches: [
          { id: "portrait-photo", label: "Portrait" },
          { id: "landscape-photo", label: "Paysage & nature" },
          { id: "street-photo", label: "Street photography" },
          { id: "studio-product", label: "Studio & produit" },
        ],
      },
      {
        id: "fashion-textile",
        label: "Mode & Textile",
        niches: [
          { id: "fashion-design", label: "Fashion design" },
          {
            id: "embroidery-sewing",
            label: "Broderie & couture",
          },
          { id: "streetwear-design", label: "Streetwear" },
          {
            id: "vintage-upcycling",
            label: "Vintage & upcycling",
          },
        ],
      },
    ],
  },

  // =========================================================================
  // 3. MUSIQUE & AUDIO
  // =========================================================================
  {
    id: "music-audio",
    label: "Musique & Audio",
    icon: "music",
    color: "#61AFEF",
    primaryPlatforms: [
      "soundcloud",
      "mixcloud",
      "discogs",
      "lastfm",
      "listenbrainz",
    ],
    categories: [
      {
        id: "music-production",
        label: "Production musicale",
        niches: [
          {
            id: "beatmaking",
            label: "Beatmaking (hip-hop, trap)",
            disambiguationSignal:
              "SoundCloud tracks uploadees + genre des tags",
            disambiguationResult:
              "Genre de production exact",
          },
          {
            id: "electronic-production",
            label: "Electronic (techno, house, ambient)",
          },
          {
            id: "sampling-crates",
            label: "Sampling & crates",
          },
          {
            id: "orchestral-composition",
            label: "Composition orchestrale",
          },
        ],
      },
      {
        id: "djing",
        label: "DJing",
        niches: [
          {
            id: "psytrance-goa",
            label: "Psytrance / Goa",
            disambiguationSignal:
              "Mixcloud sets uploades + duree moyenne (1h+)",
            disambiguationResult:
              "DJ vs beatmaker vs auditeur passif",
          },
          {
            id: "techno-industrial",
            label: "Techno & Industrial",
          },
          { id: "house-disco", label: "House & Disco" },
          { id: "dnb-jungle", label: "Drum & Bass / Jungle" },
          {
            id: "hiphop-turntablism",
            label: "Hip-hop & Turntablism",
          },
        ],
      },
      {
        id: "instrumentist",
        label: "Musicien instrumentiste",
        niches: [
          {
            id: "guitar",
            label: "Guitare (rock, jazz, classique)",
            disambiguationSignal:
              "Beatport achats par genre sur 6 mois glissants",
            disambiguationResult:
              "Specialisation DJ ultra-precise",
          },
          { id: "piano-keys", label: "Piano & claviers" },
          { id: "bass", label: "Basse" },
          {
            id: "drums-percussion",
            label: "Percussions & batterie",
          },
        ],
      },
      {
        id: "vocals",
        label: "Chant & Voix",
        niches: [
          {
            id: "classical-vocal",
            label: "Chant classique / lyrique",
            disambiguationSignal:
              "Last.fm artistes top + tags = passion vs curiosite ponctuelle",
            disambiguationResult:
              "Passion durable vs exploration",
          },
          { id: "pop-rnb-vocal", label: "Pop & R&B" },
          { id: "rap-spoken-word", label: "Rap & spoken word" },
          { id: "acapella-chorale", label: "A cappella & chorale" },
        ],
      },
      {
        id: "sound-design",
        label: "Sound Design & Audio Eng.",
        niches: [
          { id: "mixing-mastering", label: "Mixage & mastering" },
          { id: "foley-sfx", label: "Foley & SFX" },
          { id: "field-recording", label: "Prise de son" },
          {
            id: "game-film-music",
            label: "Musique pour jeux/films",
          },
        ],
      },
      {
        id: "music-theory",
        label: "Theorie musicale",
        niches: [
          {
            id: "harmony-counterpoint",
            label: "Harmonie & contrepoint",
          },
          {
            id: "contemporary-composition",
            label: "Composition contemporaine",
          },
          { id: "jazz-theory", label: "Jazz theory" },
          { id: "microtonality", label: "Microtonalite" },
        ],
      },
      {
        id: "music-collecting",
        label: "Collecting",
        niches: [
          { id: "vinyl-collecting", label: "Vinyles" },
          { id: "cassette-collecting", label: "Cassettes & K7" },
          {
            id: "limited-editions",
            label: "Editions limitees",
          },
          {
            id: "vintage-instruments",
            label: "Instruments vintage",
          },
        ],
      },
      {
        id: "music-culture",
        label: "Critique & Culture musicale",
        niches: [
          {
            id: "music-journalism",
            label: "Journalisme musical",
          },
          {
            id: "curation-playlisting",
            label: "Curation & playlisting",
          },
          { id: "music-blogging", label: "Blogging" },
          { id: "genre-history", label: "History of genres" },
        ],
      },
    ],
  },

  // =========================================================================
  // 4. GAMING & JEUX
  // =========================================================================
  {
    id: "gaming",
    label: "Gaming & Jeux",
    icon: "gamepad",
    color: "#C678DD",
    primaryPlatforms: [
      "chess-com",
      "lichess",
      "riot-games",
      "steam",
      "opendota",
    ],
    categories: [
      {
        id: "strategy-puzzle",
        label: "Jeux de reflexion & Strategie",
        niches: [
          {
            id: "chess",
            label: "Echecs (classement Elo)",
            disambiguationSignal:
              "Chess.com Elo > 1500 + streak quotidien",
            disambiguationResult:
              "Intellectuel strategique ≠ gamer classique",
          },
          { id: "go-shogi", label: "Go / Shogi" },
          { id: "board-games", label: "Jeux de plateau" },
          { id: "puzzles", label: "Puzzles & Casse-tetes" },
        ],
      },
      {
        id: "fps-competitive",
        label: "FPS / TPS Competitif",
        niches: [
          {
            id: "valorant-csgo",
            label: "Valorant / CSGO",
            disambiguationSignal:
              "Steam : 80% heures sur 1 genre = specialiste",
            disambiguationResult:
              "Hardcore vs casual gamer",
          },
          {
            id: "apex-warzone",
            label: "Apex Legends / Warzone",
          },
          { id: "rainbow-six", label: "Rainbow Six Siege" },
          { id: "overwatch", label: "Overwatch" },
        ],
      },
      {
        id: "rpg-narrative",
        label: "RPG & Narrative",
        niches: [
          {
            id: "action-rpg",
            label: "Action-RPG (Elden Ring, Zelda)",
            disambiguationSignal:
              "Twitch streams : jeux par categorie dominante",
            disambiguationResult: "Genre dominant exact",
          },
          {
            id: "jrpg",
            label: "JRPG (Final Fantasy)",
          },
          { id: "story-games", label: "Story games" },
          { id: "metroidvania", label: "Metroidvania" },
        ],
      },
      {
        id: "strategy-4x",
        label: "Strategie & 4X",
        niches: [
          {
            id: "civilization",
            label: "Civilization",
            disambiguationSignal:
              "Subreddit r/chess vs r/patientgamers vs r/VALORANT",
            disambiguationResult:
              "Sous-culture gaming precise",
          },
          { id: "rts-starcraft", label: "StarCraft / RTS" },
          { id: "total-war", label: "Total War" },
          {
            id: "grand-strategy",
            label: "Grand strategy (CK3, EU4)",
          },
        ],
      },
      {
        id: "sports-games",
        label: "Sports virtuels",
        niches: [
          { id: "fifa-fc", label: "Football (FIFA / FC)" },
          { id: "f1-racing", label: "F1 & Racing sims" },
          { id: "nba2k", label: "Basketball (NBA2K)" },
          { id: "golf-tennis-games", label: "Golf / Tennis" },
        ],
      },
      {
        id: "indie-art-games",
        label: "Indie & Art games",
        niches: [
          { id: "auteur-games", label: "Jeux d'auteur" },
          { id: "pixel-indie", label: "Pixel art indie" },
          {
            id: "narrative-experiences",
            label: "Experiences narratives",
          },
          { id: "game-jams", label: "Game jams" },
        ],
      },
      {
        id: "mmo-social",
        label: "MMO & Social gaming",
        niches: [
          { id: "wow", label: "World of Warcraft" },
          { id: "ffxiv", label: "Final Fantasy XIV" },
          {
            id: "guild-community",
            label: "Guild & communaute",
          },
          { id: "ingame-economy", label: "Economie in-game" },
        ],
      },
      {
        id: "retro-collecting",
        label: "Retro & Collecting",
        niches: [
          { id: "emulation", label: "Emulation" },
          { id: "speedrunning", label: "Speedrunning" },
          {
            id: "physical-collecting",
            label: "Collections physiques",
          },
          { id: "arcade", label: "Arcade & bornes" },
        ],
      },
    ],
  },

  // =========================================================================
  // 5. WEB3 & CRYPTO
  // =========================================================================
  {
    id: "web3-crypto",
    label: "Web3 & Crypto",
    icon: "link",
    color: "#627EEA",
    primaryPlatforms: [
      "wallet-siwe",
      "the-graph",
      "lens",
      "farcaster",
      "snapshot",
    ],
    categories: [
      {
        id: "defi",
        label: "DeFi",
        niches: [
          {
            id: "yield-farming",
            label: "Yield farming & liquidity",
            disambiguationSignal:
              "On-chain : protocoles interagis (Aave vs OpenSea vs Uniswap)",
            disambiguationResult:
              "DeFi vs NFT collector vs DEX trader",
          },
          {
            id: "lending",
            label: "Lending (Aave, Compound)",
          },
          { id: "dex-amm", label: "DEX & AMM (Uniswap)" },
          { id: "lsd-restaking", label: "LSD & restaking" },
        ],
      },
      {
        id: "nft-art",
        label: "NFT & Art digital",
        niches: [
          {
            id: "nft-collecting",
            label: "Collecting",
            disambiguationSignal:
              "Tokens detenus : ETH heavy vs BTC only vs altcoin diversifie",
            disambiguationResult:
              "Profil ideologique exact",
          },
          { id: "nft-creation", label: "Creation / minting" },
          {
            id: "generative-nft",
            label: "Generatif (Art Blocks)",
          },
          { id: "pfp-communities", label: "PFP communities" },
        ],
      },
      {
        id: "trading-speculation",
        label: "Trading & Speculation",
        niches: [
          {
            id: "altcoins-gems",
            label: "Altcoins & gems",
            disambiguationSignal:
              "Lens/Farcaster activite vs wallet DeFi seul",
            disambiguationResult:
              "Web3 social vs finance only",
          },
          { id: "memecoins", label: "Memecoins" },
          {
            id: "onchain-analysis",
            label: "On-chain analysis",
          },
          { id: "futures-perps", label: "Futures & perps" },
        ],
      },
      {
        id: "btc-maximalism",
        label: "Bitcoin maximalisme",
        niches: [
          {
            id: "lightning-network",
            label: "Lightning Network",
            disambiguationSignal:
              "ENS + Lens + Farcaster vs wallet dormant",
            disambiguationResult:
              "OG engage vs speculateur passif",
          },
          { id: "self-custody", label: "Self-custody" },
          {
            id: "austrian-economics",
            label: "Austrian economics",
          },
          { id: "btc-only", label: "BTC only philosophy" },
        ],
      },
      {
        id: "web3-infra-dev",
        label: "Infrastructure & Dev",
        niches: [
          {
            id: "smart-contracts",
            label: "Smart contracts (Solidity)",
          },
          {
            id: "nodes-validators",
            label: "Nodes & validators",
          },
          { id: "zk-proofs", label: "ZK proofs" },
          { id: "protocol-design", label: "Protocol design" },
        ],
      },
      {
        id: "dao-governance",
        label: "DAO & Gouvernance",
        niches: [
          { id: "dao-voting", label: "Participation aux votes" },
          { id: "contributor-dao", label: "Contributor DAO" },
          { id: "grants-funding", label: "Grants & funding" },
          { id: "token-politics", label: "Token politics" },
        ],
      },
      {
        id: "web3-social",
        label: "Web3 Social",
        niches: [
          { id: "lens-protocol", label: "Lens Protocol" },
          {
            id: "farcaster-warpcast",
            label: "Farcaster / Warpcast",
          },
          { id: "deso", label: "DeSo" },
          { id: "socialfi", label: "SocialFi" },
        ],
      },
      {
        id: "gamefi-metaverse",
        label: "GameFi & Metaverse",
        niches: [
          { id: "play-to-earn", label: "Play-to-earn" },
          { id: "virtual-lands", label: "Virtual lands" },
          {
            id: "interoperable-assets",
            label: "Interoperable assets",
          },
          { id: "vr-ar-web3", label: "VR/AR Web3" },
        ],
      },
    ],
  },

  // =========================================================================
  // 6. SCIENCE & SAVOIR
  // =========================================================================
  {
    id: "science",
    label: "Science & Savoir",
    icon: "microscope",
    color: "#98C379",
    primaryPlatforms: [
      "orcid",
      "arxiv",
      "pubmed",
      "wikipedia",
      "duolingo",
    ],
    categories: [
      {
        id: "mathematics",
        label: "Mathematiques & Logique",
        niches: [
          {
            id: "pure-math",
            label: "Maths pures (topologie, algebre)",
            disambiguationSignal:
              "ORCID publications + domaine de recherche",
            disambiguationResult:
              "Scientifique actif vs passionne amateur",
          },
          {
            id: "applied-math",
            label: "Maths appliquees & stats",
          },
          {
            id: "math-olympiads",
            label: "Olympiades & Puzzles",
          },
          {
            id: "philosophy-of-math",
            label: "Philosophie des maths",
          },
        ],
      },
      {
        id: "physics-cosmology",
        label: "Physique & Cosmologie",
        niches: [
          {
            id: "theoretical-physics",
            label: "Physique theorique",
            disambiguationSignal:
              "Duolingo + LeetCode + Kaggle combines",
            disambiguationResult:
              "Langues vs logique vs data science",
          },
          { id: "astrophysics", label: "Astrophysique" },
          { id: "quantum-physics", label: "Physique quantique" },
          {
            id: "pop-science-physics",
            label: "Science popularisee",
          },
        ],
      },
      {
        id: "biology-neuro",
        label: "Biologie & Neurosciences",
        niches: [
          {
            id: "molecular-biology",
            label: "Biologie moleculaire",
            disambiguationSignal:
              "Subreddits : r/math vs r/physics vs r/askscience",
            disambiguationResult: "Discipline exacte",
          },
          {
            id: "cognitive-neuro",
            label: "Neurosciences cognitives",
          },
          { id: "genetics-crispr", label: "Genetique & CRISPR" },
          { id: "biohacking", label: "Biohacking" },
        ],
      },
      {
        id: "psychology",
        label: "Psychologie & Comportement",
        niches: [
          {
            id: "cognitive-psych",
            label: "Psychologie cognitive",
            disambiguationSignal:
              "YouTube : Kurzgesagt vs 3Blue1Brown vs SciShow",
            disambiguationResult:
              "Vulgarisation vs profondeur academique",
          },
          { id: "social-psych", label: "Psychologie sociale" },
          { id: "therapy-cbt", label: "Therapies & TCC" },
          {
            id: "behavioral-economics",
            label: "Behaviour economics",
          },
        ],
      },
      {
        id: "history-archaeology",
        label: "Histoire & Archeologie",
        niches: [
          { id: "ancient-history", label: "Histoire ancienne" },
          {
            id: "modern-history",
            label: "Histoire contemporaine",
          },
          {
            id: "archaeology",
            label: "Archeologie & artefacts",
          },
          { id: "counter-history", label: "Contre-histoire" },
        ],
      },
      {
        id: "philosophy",
        label: "Philosophie",
        niches: [
          {
            id: "analytic-philosophy",
            label: "Philosophie analytique",
          },
          {
            id: "continental-philosophy",
            label: "Philosophie continentale",
          },
          {
            id: "ethics-metaethics",
            label: "Ethique & Meta-ethique",
          },
          {
            id: "philosophy-of-mind",
            label: "Philosophie de l'esprit",
          },
        ],
      },
      {
        id: "linguistics",
        label: "Linguistique & Langues",
        niches: [
          {
            id: "language-learning",
            label: "Apprentissage de langues",
          },
          {
            id: "structural-linguistics",
            label: "Linguistique structurale",
          },
          {
            id: "constructed-languages",
            label: "Langues construites",
          },
          { id: "etymology", label: "Etymologie" },
        ],
      },
    ],
  },

  // =========================================================================
  // 7. SPORT & SANTE
  // =========================================================================
  {
    id: "sport-health",
    label: "Sport & Sante",
    icon: "running",
    color: "#E5C07B",
    primaryPlatforms: [
      "strava",
      "garmin",
      "komoot",
      "inaturalist",
      "ebird",
    ],
    categories: [
      {
        id: "team-sports",
        label: "Sports collectifs",
        niches: [
          {
            id: "football-player",
            label: "Football (joueur vs supporter)",
            disambiguationSignal:
              "Strava activite dominante (run vs velo vs swim)",
            disambiguationResult: "Sport pratique precis",
          },
          { id: "basketball", label: "Basketball" },
          { id: "rugby", label: "Rugby" },
          {
            id: "us-sports",
            label: "Sports US (NFL, NBA)",
          },
        ],
      },
      {
        id: "individual-sports",
        label: "Sports individuels",
        niches: [
          {
            id: "tennis-padel",
            label: "Tennis & Padel",
            disambiguationSignal:
              "Garmin VO2max + HRV trends",
            disambiguationResult:
              "Amateur vs semi-pro vs sante casual",
          },
          { id: "swimming", label: "Natation" },
          {
            id: "cycling-triathlon",
            label: "Cyclisme & Triathlon",
          },
          { id: "athletics", label: "Athletisme" },
        ],
      },
      {
        id: "fitness",
        label: "Fitness & Musculation",
        niches: [
          {
            id: "powerlifting",
            label: "Powerlifting & Force",
            disambiguationSignal:
              "Subreddits r/running vs r/powerlifting vs r/MMA",
            disambiguationResult: "Discipline exacte",
          },
          {
            id: "bodybuilding",
            label: "Bodybuilding & Esthetique",
          },
          {
            id: "crossfit",
            label: "CrossFit & Fonctionnel",
          },
          { id: "calisthenics", label: "Calisthenics" },
        ],
      },
      {
        id: "extreme-sports",
        label: "Sports extremes",
        niches: [
          {
            id: "climbing-boulder",
            label: "Escalade & Boulder",
            disambiguationSignal:
              "Twitch sport streams vs ESPN = joueur vs supporter",
            disambiguationResult: "Acteur vs spectateur",
          },
          { id: "surf-kite", label: "Surf & Kite" },
          {
            id: "snowboard-freeride",
            label: "Snowboard freeride",
          },
          { id: "parkour", label: "Parkour & Freerun" },
        ],
      },
      {
        id: "running-trail",
        label: "Running & Trail",
        niches: [
          { id: "urban-running", label: "Running urbain" },
          {
            id: "short-trail",
            label: "Trail courte distance",
          },
          { id: "ultra-trail", label: "Ultra-trail" },
          {
            id: "running-data",
            label: "Running data & perf",
          },
        ],
      },
      {
        id: "combat-sports",
        label: "Sports de combat",
        niches: [
          { id: "mma-grappling", label: "MMA & Grappling" },
          {
            id: "boxing-muay-thai",
            label: "Boxe anglaise & Muay Thai",
          },
          { id: "judo-bjj", label: "Judo & Jiu-Jitsu" },
          {
            id: "martial-arts",
            label: "Arts martiaux",
          },
        ],
      },
      {
        id: "health-wellness",
        label: "Sante & Bien-etre",
        niches: [
          {
            id: "nutrition",
            label: "Nutrition & Dietetique",
          },
          { id: "yoga-pilates", label: "Yoga & Pilates" },
          {
            id: "meditation-mindfulness",
            label: "Meditation & Mindfulness",
          },
          {
            id: "biohacking-longevity",
            label: "Biohacking & Longevite",
          },
        ],
      },
    ],
  },

  // =========================================================================
  // 8. VIDEO & CINEMA
  // =========================================================================
  {
    id: "video-cinema",
    label: "Video & Cinema",
    icon: "film",
    color: "#E06C75",
    primaryPlatforms: [
      "twitch",
      "youtube",
      "vimeo",
      "trakt",
      "dailymotion",
    ],
    categories: [
      {
        id: "cinephilia",
        label: "Cinephilie",
        niches: [
          {
            id: "arthouse",
            label: "Cinema d'auteur & Arthouse",
            disambiguationSignal:
              "Letterboxd genres dominants + frequence notation",
            disambiguationResult:
              "Cinephile vs consommateur casual",
          },
          { id: "scifi-fantasy-film", label: "Science-fiction & Fantastique" },
          {
            id: "horror-thriller",
            label: "Horreur & Thriller",
          },
          { id: "documentary-film", label: "Documentaire" },
        ],
      },
      {
        id: "filmmaking",
        label: "Realisation & Montage",
        niches: [
          {
            id: "indie-cinema",
            label: "Cinema independant",
            disambiguationSignal:
              "YouTube chaines abonnees : genre de contenu dominant",
            disambiguationResult:
              "Creation vs consommation",
          },
          { id: "short-film", label: "Court-metrage" },
          {
            id: "premiere-davinci",
            label: "Premiere / DaVinci Resolve",
          },
          { id: "color-grading", label: "Color grading" },
        ],
      },
      {
        id: "streaming-series",
        label: "Streaming & Series",
        niches: [
          {
            id: "prestige-tv",
            label: "Drama & Prestige TV",
            disambiguationSignal:
              "Vimeo portfolio vs YouTube upload",
            disambiguationResult: "Pro video vs amateur",
          },
          { id: "anime", label: "Anime" },
          {
            id: "reality-entertainment",
            label: "Reality TV & Entertainment",
          },
          { id: "true-crime", label: "True crime" },
        ],
      },
      {
        id: "youtube-content",
        label: "YouTube & Content",
        niches: [
          {
            id: "vlogging",
            label: "Vlogging & Lifestyle",
            disambiguationSignal:
              "Twitch heures vs contenu uploade",
            disambiguationResult:
              "Createur vs spectateur passif",
          },
          {
            id: "edu-vulgarisation",
            label: "Educatif / Vulgarisation",
          },
          {
            id: "lets-play",
            label: "Let's Play & Gaming",
          },
          { id: "tech-reviews", label: "Tech reviews" },
        ],
      },
      {
        id: "animation",
        label: "Animation",
        niches: [
          { id: "2d-animation", label: "2D frame by frame" },
          {
            id: "3d-animation",
            label: "3D animation (Blender)",
          },
          {
            id: "motion-graphics",
            label: "Motion graphics",
          },
          { id: "stop-motion", label: "Stop motion" },
        ],
      },
      {
        id: "film-criticism",
        label: "Critique & Analyse",
        niches: [
          { id: "film-critic", label: "Critique de films" },
          { id: "video-essays", label: "Video essays" },
          { id: "cinema-podcasts", label: "Podcasts cinema" },
          {
            id: "cultural-journalism",
            label: "Journalisme culturel",
          },
        ],
      },
    ],
  },

  // =========================================================================
  // 9. ENTREPRENEURIAT & BUSINESS
  // =========================================================================
  {
    id: "entrepreneurship",
    label: "Entrepreneuriat & Business",
    icon: "rocket",
    color: "#D19A66",
    primaryPlatforms: [
      "producthunt",
      "linear",
      "github",
      "hacker-news",
    ],
    categories: [
      {
        id: "startup-saas",
        label: "Startup & SaaS",
        niches: [
          {
            id: "indie-hacking",
            label: "Indie hacking & bootstrapping",
            disambiguationSignal:
              "Product Hunt launches + upvotes recus",
            disambiguationResult:
              "Builder actif vs observateur",
          },
          { id: "vc-startup", label: "VC-backed startup" },
          { id: "saas-b2b", label: "SaaS B2B" },
          { id: "consumer-apps", label: "Consumer apps" },
        ],
      },
      {
        id: "freelance-consulting",
        label: "Freelance & Consulting",
        niches: [
          {
            id: "dev-freelance",
            label: "Dev freelance",
            disambiguationSignal:
              "GitHub repos avec landing pages = indie hacker",
            disambiguationResult:
              "Maker concret vs theoricien business",
          },
          {
            id: "design-freelance",
            label: "Design freelance",
          },
          {
            id: "strategy-consulting",
            label: "Conseil strategique",
          },
          { id: "portage", label: "Portage salarial" },
        ],
      },
      {
        id: "ecommerce",
        label: "E-commerce",
        niches: [
          {
            id: "dropshipping",
            label: "Dropshipping",
            disambiguationSignal:
              "LinkedIn role Founder vs Employee vs Freelance",
            disambiguationResult:
              "Statut entrepreneurial exact",
          },
          { id: "d2c-brand", label: "Marque propre & D2C" },
          { id: "amazon-fba", label: "Amazon FBA" },
          {
            id: "marketplace-etsy",
            label: "Marketplace & Etsy",
          },
        ],
      },
      {
        id: "marketing-growth",
        label: "Marketing & Growth",
        niches: [
          {
            id: "seo-content",
            label: "SEO & Content marketing",
            disambiguationSignal:
              "r/entrepreneur vs r/wallstreetbets vs r/fire",
            disambiguationResult:
              "Type d'ambition financiere",
          },
          {
            id: "paid-ads",
            label: "Paid ads (Meta, Google)",
          },
          { id: "growth-hacking", label: "Growth hacking" },
          {
            id: "community-building",
            label: "Community building",
          },
        ],
      },
      {
        id: "finance-investing",
        label: "Finance & Investissement",
        niches: [
          { id: "stock-etf", label: "Bourse & ETF" },
          { id: "angel-investing", label: "Angel investing" },
          { id: "vc-dealflow", label: "VC & Deal flow" },
          {
            id: "real-estate-investing",
            label: "Immobilier",
          },
        ],
      },
      {
        id: "personal-branding",
        label: "Personal branding",
        niches: [
          { id: "newsletter", label: "Newsletter" },
          {
            id: "linkedin-thought-leader",
            label: "LinkedIn thought leader",
          },
          { id: "podcast-host", label: "Podcast" },
          {
            id: "speaking-keynotes",
            label: "Speaking & keynotes",
          },
        ],
      },
      {
        id: "productivity-systems",
        label: "Productivite & Systemes",
        niches: [
          { id: "gtd-agile", label: "GTD & Methodes Agile" },
          {
            id: "second-brain",
            label: "Second brain (Notion, Obsidian)",
          },
          { id: "time-blocking", label: "Time blocking" },
          { id: "deep-work", label: "Deep work" },
        ],
      },
    ],
  },

  // =========================================================================
  // 10. ARTS VIVANTS & SPECTACLE
  // =========================================================================
  {
    id: "performing-arts",
    label: "Arts Vivants & Spectacle",
    icon: "theater",
    color: "#E06C75",
    primaryPlatforms: ["twitch", "youtube", "discord"],
    categories: [
      {
        id: "theater",
        label: "Theatre",
        niches: [
          {
            id: "classical-theater",
            label: "Theatre classique & contemporain",
            disambiguationSignal:
              "Twitch categorie 'Performing Arts'",
            disambiguationResult:
              "Artiste live vs spectateur",
          },
          { id: "improv", label: "Improvisation" },
          { id: "physical-theater", label: "Theatre physique" },
          { id: "mise-en-scene", label: "Mise en scene" },
        ],
      },
      {
        id: "dance",
        label: "Danse",
        niches: [
          {
            id: "classical-dance",
            label: "Danse classique & contemporaine",
            disambiguationSignal:
              "YouTube abonnements : chaines de danse vs culture",
            disambiguationResult:
              "Praticien vs amateur culturel",
          },
          {
            id: "hiphop-breakdance",
            label: "Hip-hop & Breakdance",
          },
          {
            id: "latin-dance",
            label: "Danses latines (salsa, tango)",
          },
          {
            id: "traditional-dance",
            label: "Danse traditionnelle",
          },
        ],
      },
      {
        id: "circus-performance",
        label: "Cirque & Performance",
        niches: [
          {
            id: "circus-acrobatics",
            label: "Arts du cirque (acrobatie)",
            disambiguationSignal:
              "Discord : serveurs d'impro / theatre / collectifs",
            disambiguationResult: "Communaute specifique",
          },
          { id: "performance-art", label: "Performance art" },
          {
            id: "street-art-graffiti",
            label: "Street art & Graffiti",
          },
          { id: "installation-art", label: "Installation" },
        ],
      },
      {
        id: "comedy",
        label: "Humour & Stand-up",
        niches: [
          {
            id: "standup",
            label: "Stand-up comedy",
            disambiguationSignal:
              "Billeterie frequente (si partenariat)",
            disambiguationResult:
              "Spectateur regulier vs artiste",
          },
          {
            id: "sketch-improv-comedy",
            label: "Sketch & Impro comique",
          },
          {
            id: "comedy-podcasts",
            label: "Podcasts humour",
          },
          {
            id: "comedy-writing",
            label: "Ecriture comique",
          },
        ],
      },
      {
        id: "magic",
        label: "Magie & Prestidigitation",
        niches: [
          { id: "close-up-magic", label: "Close-up magic" },
          { id: "stage-illusion", label: "Scene & Illusion" },
          { id: "mentalism", label: "Mentalisme" },
          {
            id: "card-manipulation",
            label: "Manipulation cartes",
          },
        ],
      },
    ],
  },

  // =========================================================================
  // 11. NATURE & ENVIRONNEMENT
  // =========================================================================
  {
    id: "nature-environment",
    label: "Nature & Environnement",
    icon: "leaf",
    color: "#98C379",
    primaryPlatforms: [
      "inaturalist",
      "ebird",
      "komoot",
      "alltrails",
      "wikiloc",
    ],
    categories: [
      {
        id: "ecology-activism",
        label: "Ecologie & Activisme",
        niches: [
          {
            id: "climate-activism",
            label: "Militantisme climatique",
            disambiguationSignal:
              "Strava segments outdoor vs salle de sport",
            disambiguationResult:
              "Nature practitioner vs urbain",
          },
          {
            id: "zero-waste",
            label: "Zero waste & Minimalisme",
          },
          { id: "permaculture", label: "Permaculture" },
          {
            id: "environmental-politics",
            label: "Politique environnementale",
          },
        ],
      },
      {
        id: "outdoor-adventure",
        label: "Plein air & Aventure",
        niches: [
          {
            id: "hiking-trek",
            label: "Randonnee & Trek",
            disambiguationSignal:
              "iNaturalist / eBird activite active",
            disambiguationResult:
              "Observateur scientifique vs randonneur loisir",
          },
          {
            id: "camping-survival",
            label: "Camping & Survivalisme",
          },
          {
            id: "outdoor-climbing",
            label: "Escalade outdoor",
          },
          { id: "kayak-canoe", label: "Kayak & Canoe" },
        ],
      },
      {
        id: "astronomy",
        label: "Astronomie",
        niches: [
          {
            id: "amateur-astronomy",
            label: "Observation amateur (telescope)",
            disambiguationSignal:
              "r/gardening vs r/preppers vs r/environment",
            disambiguationResult:
              "Orientation exacte dans la nature",
          },
          {
            id: "astrophotography",
            label: "Astrophotographie",
          },
          {
            id: "cosmology-vulg",
            label: "Cosmologie & vulgarisation",
          },
          {
            id: "space-exploration",
            label: "Space exploration",
          },
        ],
      },
      {
        id: "gardening",
        label: "Jardinage & Agriculture",
        niches: [
          { id: "vegetable-garden", label: "Jardinage potager" },
          {
            id: "indoor-plants",
            label: "Plantes d'interieur",
          },
          { id: "urban-farming", label: "Agriculture urbaine" },
          {
            id: "medicinal-garden",
            label: "Jardinage medicinal",
          },
        ],
      },
      {
        id: "zoology-fauna",
        label: "Zoologie & Faune",
        niches: [
          {
            id: "birdwatching",
            label: "Ornithologie & Bird watching",
          },
          { id: "aquarium", label: "Aquariophilie" },
          { id: "animal-breeding", label: "Elevage & animaux" },
          {
            id: "wildlife-protection",
            label: "Protection faune sauvage",
          },
        ],
      },
    ],
  },

  // =========================================================================
  // 12. FOOD, MODE & LIFESTYLE
  // =========================================================================
  {
    id: "food-lifestyle",
    label: "Food, Mode & Lifestyle",
    icon: "utensils",
    color: "#E5C07B",
    primaryPlatforms: [
      "untappd",
      "vivino",
      "discogs",
      "pinterest",
    ],
    categories: [
      {
        id: "gastronomy",
        label: "Gastronomie & Cuisine",
        niches: [
          {
            id: "world-cuisine",
            label: "Cuisine du monde",
            disambiguationSignal:
              "r/coffee vs r/tea vs r/cocktails = boisson dominante",
            disambiguationResult:
              "Niche exacte dans les boissons",
          },
          {
            id: "pastry-baking",
            label: "Patisserie & Boulangerie",
          },
          { id: "bbq-smoking", label: "BBQ & Fumage" },
          {
            id: "molecular-cuisine",
            label: "Cuisine moleculaire",
          },
        ],
      },
      {
        id: "beverages",
        label: "Cafe & Boissons",
        niches: [
          {
            id: "specialty-coffee",
            label: "Specialty coffee (barista)",
            disambiguationSignal:
              "StockX / GOAT activite = sneaker culture active",
            disambiguationResult:
              "Collectionneur vs reseller vs casual",
          },
          { id: "tea-ceremony", label: "The & ceremonie" },
          {
            id: "mixology-cocktails",
            label: "Mixologie & cocktails",
          },
          { id: "craft-beer", label: "Bieres artisanales" },
        ],
      },
      {
        id: "fashion-streetwear",
        label: "Mode & Streetwear",
        niches: [
          {
            id: "high-fashion",
            label: "High fashion & Luxe",
            disambiguationSignal:
              "Etsy vendeur vs acheteur",
            disambiguationResult:
              "Maker actif vs lifestyle consumer",
          },
          {
            id: "streetwear-hype",
            label: "Streetwear & Hype (Jordan, Supreme)",
          },
          { id: "vintage-thrift", label: "Vintage & Thrift" },
          { id: "ethical-fashion", label: "Mode ethique" },
        ],
      },
      {
        id: "collectibles",
        label: "Collectibles & Sneakers",
        niches: [
          {
            id: "sneaker-collecting",
            label: "Sneaker collecting",
          },
          {
            id: "trading-cards",
            label: "Trading cards & Pokemon",
          },
          {
            id: "figurines-pop",
            label: "Figurines & Pop culture",
          },
          { id: "watches", label: "Montres" },
        ],
      },
      {
        id: "diy-making",
        label: "DIY & Making",
        niches: [
          { id: "woodworking", label: "Menuiserie & Bois" },
          { id: "3d-printing-hobby", label: "Impression 3D" },
          {
            id: "electronics-hobby",
            label: "Electronique hobby",
          },
          {
            id: "sewing-knitting",
            label: "Couture & Tricot",
          },
        ],
      },
      {
        id: "home-decor",
        label: "Deco & Interieur",
        niches: [
          { id: "interior-design", label: "Design interieur" },
          {
            id: "minimalism-fengshui",
            label: "Minimalisme & Feng shui",
          },
          {
            id: "interior-architecture",
            label: "Architecture interieure",
          },
          {
            id: "biophilic-plants",
            label: "Plantes & Biophilic",
          },
        ],
      },
    ],
  },

  // =========================================================================
  // 13. LITTERATURE & ECRITURE
  // =========================================================================
  {
    id: "literature",
    label: "Litterature & Ecriture",
    icon: "book",
    color: "#ABB2BF",
    primaryPlatforms: [
      "openlibrary",
      "librarything",
      "pocket",
      "feedly",
    ],
    categories: [
      {
        id: "fiction",
        label: "Fiction",
        niches: [
          {
            id: "scifi-dystopia",
            label: "Science-fiction & Dystopie",
            disambiguationSignal:
              "Goodreads genres dominants + vitesse de lecture",
            disambiguationResult:
              "Lecteur casual vs vorace vs critique",
          },
          {
            id: "fantasy-epic",
            label: "Fantasy & Epic fantasy",
          },
          {
            id: "thriller-detective",
            label: "Thriller & Policier",
          },
          { id: "manga-comics", label: "Manga & Comics" },
        ],
      },
      {
        id: "nonfiction",
        label: "Non-fiction & Essais",
        niches: [
          {
            id: "political-essays",
            label: "Essais politiques & Philo",
            disambiguationSignal:
              "Propre newsletter Substack + abonnements actifs",
            disambiguationResult:
              "Ecrivain vs lecteur passionne",
          },
          {
            id: "biographies",
            label: "Biographies & Memoires",
          },
          {
            id: "business-selfhelp",
            label: "Business & Self-help",
          },
          {
            id: "pop-science-books",
            label: "Science popularisee",
          },
        ],
      },
      {
        id: "creative-writing",
        label: "Ecriture creative",
        niches: [
          {
            id: "novel-short-story",
            label: "Roman & Nouvelle",
            disambiguationSignal:
              "r/scifi vs r/fantasy vs r/books",
            disambiguationResult:
              "Niche litteraire precise",
          },
          { id: "screenplay", label: "Scenario & Script" },
          { id: "poetry", label: "Poesie" },
          { id: "worldbuilding", label: "World-building" },
        ],
      },
      {
        id: "journalism",
        label: "Journalisme",
        niches: [
          {
            id: "investigative",
            label: "Journalisme d'investigation",
          },
          { id: "field-reporting", label: "Reportage & Terrain" },
          { id: "data-journalism", label: "Data journalism" },
          {
            id: "documentary-podcast",
            label: "Podcast documentaire",
          },
        ],
      },
      {
        id: "blogging-content",
        label: "Blogging & Content",
        niches: [
          {
            id: "substack-newsletter",
            label: "Newsletter (Substack)",
          },
          { id: "thematic-blog", label: "Blog thematique" },
          { id: "ghostwriting", label: "Ghostwriting" },
          { id: "copywriting", label: "Copywriting" },
        ],
      },
      {
        id: "literary-criticism",
        label: "Critique litteraire",
        niches: [
          { id: "book-reviews", label: "Book clubs & Reviews" },
          { id: "translation", label: "Traduction" },
          {
            id: "editing-curation",
            label: "Edition & Curation",
          },
          {
            id: "comparative-lit",
            label: "Litterature comparee",
          },
        ],
      },
    ],
  },

  // =========================================================================
  // 14. DEVELOPPEMENT PERSONNEL
  // =========================================================================
  {
    id: "personal-dev",
    label: "Developpement Personnel",
    icon: "lotus",
    color: "#C678DD",
    primaryPlatforms: ["duolingo", "todoist", "reddit"],
    categories: [
      {
        id: "mindfulness-spirituality",
        label: "Mindfulness & Spiritualite",
        niches: [
          {
            id: "meditation-vipassana",
            label: "Meditation (Vipassana, Zen)",
            disambiguationSignal:
              "Headspace / Calm abonnement actif",
            disambiguationResult:
              "Praticien regulier vs curieux ponctuel",
          },
          {
            id: "new-age-spirituality",
            label: "Spiritualite nouvelle-age",
          },
          {
            id: "stoicism",
            label: "Stoicisme & Philo pratique",
          },
          { id: "shamanism", label: "Chamanisme" },
        ],
      },
      {
        id: "coaching-leadership",
        label: "Coaching & Leadership",
        niches: [
          {
            id: "executive-coaching",
            label: "Executive coaching",
            disambiguationSignal:
              "Duolingo streak + GTD tools + Notion combines",
            disambiguationResult:
              "Optimiseur obsede vs equilibre",
          },
          { id: "life-coaching", label: "Coaching de vie" },
          {
            id: "leadership-management",
            label: "Leadership & Management",
          },
          { id: "nvc", label: "Communication non-violente" },
        ],
      },
      {
        id: "relationships",
        label: "Relations & Social",
        niches: [
          {
            id: "dating-relationships",
            label: "Relations amoureuses & Dating",
            disambiguationSignal:
              "r/financepersonnelle vs r/fire vs r/selfimprovement",
            disambiguationResult:
              "Axe dominant dans le dev perso",
          },
          {
            id: "interpersonal-comm",
            label: "Communication interpersonnelle",
          },
          {
            id: "conscious-parenting",
            label: "Parentalite consciente",
          },
          {
            id: "community-building-perso",
            label: "Communaute",
          },
        ],
      },
      {
        id: "personal-finance",
        label: "Finance personnelle",
        niches: [
          { id: "fire", label: "FIRE (Financial Independence)" },
          {
            id: "passive-investing",
            label: "Investissement passif (ETF)",
          },
          { id: "budgeting", label: "Budget & Frugalite" },
          {
            id: "rental-real-estate",
            label: "Immobilier locatif",
          },
        ],
      },
      {
        id: "neurodiversity",
        label: "Neurodiversite & Sante mentale",
        niches: [
          { id: "adhd-autism", label: "TDAH & Autisme" },
          {
            id: "anxiety-depression",
            label: "Anxiete & Depression",
          },
          { id: "therapy-cbt-emdr", label: "Therapies (TCC, EMDR)" },
          {
            id: "psychedelics-therapy",
            label: "Psychedeliques & therapie",
          },
        ],
      },
    ],
  },
]

// =============================================================================
// HELPERS DERIVES
// =============================================================================

export const DOMAIN_BY_ID = new Map(
  SOFIA_DOMAINS.map((d) => [d.id, d])
)

export const ALL_CATEGORIES = SOFIA_DOMAINS.flatMap((d) =>
  d.categories.map((c) => ({ ...c, domainId: d.id }))
)

export const ALL_NICHES = SOFIA_DOMAINS.flatMap((d) =>
  d.categories.flatMap((c) =>
    c.niches.map((n) => ({
      ...n,
      categoryId: c.id,
      domainId: d.id,
    }))
  )
)

export const NICHE_BY_ID = new Map(
  ALL_NICHES.map((n) => [n.id, n])
)

export function getNichesForDomain(
  domainId: string
): typeof ALL_NICHES {
  return ALL_NICHES.filter((n) => n.domainId === domainId)
}

export function getCategoriesForDomain(
  domainId: string
): typeof ALL_CATEGORIES {
  return ALL_CATEGORIES.filter((c) => c.domainId === domainId)
}

export function getDomainForNiche(
  nicheId: string
): Domain | undefined {
  const niche = NICHE_BY_ID.get(nicheId)
  return niche ? DOMAIN_BY_ID.get(niche.domainId) : undefined
}

export function getSuggestedPlatforms(
  nicheIds: string[]
): string[] {
  const domainIds = new Set(
    nicheIds
      .map((id) => NICHE_BY_ID.get(id)?.domainId)
      .filter(Boolean)
  )
  return SOFIA_DOMAINS.filter((d) => domainIds.has(d.id))
    .flatMap((d) => d.primaryPlatforms)
    .filter((v, i, a) => a.indexOf(v) === i)
}
