/**
 * All atom descriptions for Sofia Knowledge Graph.
 * Review this file, then run the scripts to create atoms on-chain.
 *
 * Export: TOPIC_DESCRIPTIONS, CATEGORY_DESCRIPTIONS, PLATFORM_DESCRIPTIONS
 */

// =============================================================================
// TOPICS (14)
// =============================================================================

export const TOPIC_DESCRIPTIONS = {
  'tech-dev': 'Everything related to software, code, and technology.',
  'design-creative': 'Visual creation, design, and digital arts.',
  'music-audio': 'Music, sound, and audio culture.',
  'gaming': 'Video games, esports, and gaming culture.',
  'web3-crypto': 'Blockchain, crypto, and the decentralized web.',
  'science': 'Science, research, and academic knowledge.',
  'sport-health': 'Sports, fitness, and well-being.',
  'video-cinema': 'Film, video, streaming, and visual storytelling.',
  'entrepreneurship': 'Business, startups, and professional growth.',
  'performing-arts': 'Live performance, theater, and stage arts.',
  'nature-environment': 'Nature, ecology, and the outdoors.',
  'food-lifestyle': 'Food, fashion, and everyday lifestyle.',
  'literature': 'Reading, writing, and literature.',
  'personal-dev': 'Self-improvement, mindset, and personal growth.',
}

// =============================================================================
// CATEGORIES (88)
// =============================================================================

export const CATEGORY_DESCRIPTIONS = {
  // ── Tech & Dev (13) ──
  'web-development': 'Building websites and web applications — frontend, backend, fullstack, and performance optimization.',
  'mobile-dev': 'Native and cross-platform mobile app development for iOS and Android.',
  'ai-ml': 'Artificial intelligence and machine learning — research, applied AI, prompt engineering, and MLOps.',
  'devops-cloud': 'Cloud infrastructure, containers, CI/CD pipelines, and serverless computing.',
  'cybersecurity': 'Ethical hacking, privacy, cryptography, and bug bounty hunting.',
  'open-source': 'Contributing to, maintaining, and building businesses around open-source software.',
  'hardware-iot': 'Embedded systems, Arduino, Raspberry Pi, home automation, and robotics.',
  'lowcode-nocode': 'Building applications with visual tools like Bubble, Webflow, Airtable, and Zapier.',
  'game-dev': 'Game engine programming — Unity, Unreal, Godot, indie game dev, and game jams.',
  'data-engineering': 'Data pipelines, warehouses, stream processing — Spark, dbt, Airflow, and analytics engineering.',
  'system-design': 'Distributed systems, scalability patterns, software architecture, and engineering best practices.',
  'dev-tools': 'CLIs, IDEs, debugging tools, developer productivity, and developer experience tooling.',
  'technical-writing': 'API documentation, developer guides, technical tutorials, and knowledge base authoring.',

  // ── Design & Visual Arts (11) ──
  'ui-ux-design': 'User interface and experience design — product design, design systems, and prototyping.',
  'illustration': 'Digital illustration — concept art, character design, pixel art, and generative art.',
  'motion-design': 'Animation and motion graphics — After Effects, Lottie, 3D motion, and VFX.',
  'graphic-design': 'Visual communication — branding, typography, print design, and packaging.',
  '3d-modeling': '3D creation — Blender, Cinema 4D, game assets, and architectural visualization.',
  'photography': 'Photography — portrait, landscape, street, and studio product photography.',
  'fashion-textile': 'Fashion design, embroidery, streetwear, and vintage upcycling.',
  'type-design': 'Typeface design, lettering, calligraphy, custom typography, and type systems.',
  'creative-direction': 'Art direction, campaign design, editorial design, and brand identity.',
  'ar-vr-spatial': 'Augmented reality, virtual reality, spatial interfaces, and immersive experience design.',
  'generative-art': 'Creative coding — p5.js, Processing, TouchDesigner, and algorithmic aesthetics.',

  // ── Music & Audio (12) ──
  'music-production': 'Creating and producing music — beatmaking, electronic, sampling, and orchestral composition.',
  'djing': 'DJ culture — psytrance, techno, house, drum & bass, and hip-hop turntablism.',
  'instrumentist': 'Playing musical instruments — guitar, piano, bass, and drums.',
  'vocals': 'Singing and voice — classical, pop, rap, and a cappella.',
  'sound-design': 'Audio engineering — mixing, mastering, foley, field recording, and game/film music.',
  'music-theory': 'Music theory — harmony, counterpoint, jazz theory, and microtonality.',
  'music-collecting': 'Collecting music — vinyl records, cassettes, limited editions, and vintage instruments.',
  'music-culture': 'Music criticism, curation, playlisting, blogging, and genre history.',
  'music-business': 'Labels, sync licensing, royalties, publishing, music distribution, and artist management.',
  'live-performance': 'Concert production, live sets, touring logistics, booking, and stage management.',
  'music-therapy': 'Sound healing, music therapy, binaural beats, frequency work, and therapeutic listening.',
  'beatboxing': 'Human beatbox, vocal percussion, loop stations, a cappella groups, and vocal production.',

  // ── Gaming (11) ──
  'strategy-puzzle': 'Puzzle and strategy games — chess, Go, board games, and brain teasers.',
  'fps-competitive': 'Competitive shooters — Valorant, CS, Apex Legends, Rainbow Six, and Overwatch.',
  'rpg-narrative': 'Role-playing and narrative games — action RPGs, JRPGs, story games, and metroidvanias.',
  'strategy-4x': 'Strategy and 4X games — Civilization, StarCraft, Total War, and grand strategy.',
  'sports-games': 'Virtual sports — FIFA/FC, F1 racing sims, NBA2K, and golf/tennis games.',
  'indie-art-games': 'Indie and art games — auteur games, pixel art, narrative experiences, and game jams.',
  'mmo-social': 'Massively multiplayer online games — WoW, FFXIV, guilds, and in-game economies.',
  'retro-collecting': 'Retro gaming — emulation, speedrunning, physical collections, and arcade cabinets.',
  'tabletop-rpg': 'Dungeons & Dragons, Pathfinder, TTRPG design, worldbuilding, and tabletop storytelling.',
  'speedrunning': 'Any%, glitch hunting, world records, routing, and speedrun communities.',
  'game-design': 'Game design theory, level design, narrative design, game writing, and game studies.',

  // ── Web3 & Crypto (18) ──
  'defi': 'Decentralized finance — yield farming, lending, DEX trading, and liquid staking.',
  'nft-art': 'NFTs and digital art — collecting, minting, generative art, and PFP communities.',
  'trading-speculation': 'Crypto trading — altcoins, memecoins, on-chain analysis, and perpetual futures.',
  'btc-maximalism': 'Bitcoin maximalism — Lightning Network, self-custody, and BTC-only philosophy.',
  'web3-infra-dev': 'Web3 infrastructure — smart contracts, nodes, ZK proofs, and protocol design.',
  'dao-governance': 'DAOs and governance — voting, contributor DAOs, grants, and token politics.',
  'web3-social': 'Decentralized social — Lens Protocol, Farcaster, DeSo, and SocialFi.',
  'gamefi-metaverse': 'GameFi and metaverse — play-to-earn, virtual lands, and interoperable assets.',
  'rwa-tokenisation': 'Real-world asset tokenization — real estate, commodities, and compliance.',
  'stablecoins-payments': 'Stablecoins and payments — stablecoin design, cross-border payments, and CBDCs.',
  'cypherpunk-privacy': 'Cypherpunk and privacy — privacy protocols, mixers, ZK privacy, and encrypted communications.',
  'layer-2s': 'Layer 2 scaling — optimistic rollups, ZK rollups, and bridges.',
  'security-web3': 'Web3 security — smart contract audits, bug bounties, and security tooling.',
  'applied-cryptography': 'Applied cryptography — MPC, fully homomorphic encryption, and post-quantum crypto.',
  'zk-tee': 'Zero knowledge and TEE — ZK circuits, secure enclaves, and ZK identity.',
  'ai-agents-web3': 'AI agents in Web3 — on-chain AI, AI-powered DeFi, and decentralized AI networks.',
  'ethstaker': 'Ethereum staking — solo staking, liquid staking, and distributed validators.',
  'web3-research': 'Web3 research — mechanism design, token economics, and consensus research.',
  'built-on-ethereum': 'Built on Ethereum — EVM ecosystem, Ethereum tooling, and EIP standards.',

  // ── Science & Knowledge (11) ──
  'mathematics': 'Mathematics — pure math, applied statistics, olympiads, and philosophy of math.',
  'physics-cosmology': 'Physics and cosmology — theoretical physics, astrophysics, quantum mechanics, and popular science.',
  'biology-neuro': 'Biology and neuroscience — molecular biology, cognitive neuroscience, genetics, and biohacking.',
  'psychology': 'Psychology — cognitive, social, behavioral economics, and therapy.',
  'history-archaeology': 'History and archaeology — ancient and modern history, artifacts, and counter-history.',
  'philosophy': 'Philosophy — analytic, continental, ethics, and philosophy of mind.',
  'linguistics': 'Linguistics — language learning, structural linguistics, constructed languages, and etymology.',
  'economics': 'Macroeconomics, political economy, sociology, anthropology, and social theory.',
  'data-science': 'Statistical analysis, data visualization, machine learning applications, and scientific computing.',
  'chemistry': 'Organic chemistry, materials science, experimental sciences, and applied chemistry.',
  'cognitive-science': 'Consciousness studies, embodied cognition, HCI, philosophy of mind, and cognitive psychology.',

  // ── Sport & Health (11) ──
  'team-sports': 'Team sports — football, basketball, rugby, and American sports.',
  'individual-sports': 'Individual sports — tennis, swimming, cycling, triathlon, and athletics.',
  'fitness': 'Fitness and strength — powerlifting, bodybuilding, CrossFit, and calisthenics.',
  'extreme-sports': 'Extreme sports — climbing, surfing, snowboarding, and parkour.',
  'running-trail': 'Running and trail — urban running, short trail, ultra-trail, and performance data.',
  'combat-sports': 'Combat sports — MMA, boxing, Muay Thai, judo, and jiu-jitsu.',
  'health-wellness': 'Health and wellness — nutrition, yoga, meditation, and biohacking.',
  'water-sports': 'Swimming, surfing, diving, sailing, kayaking, paddleboarding, and open water sports.',
  'winter-sports': 'Skiing, snowboarding, ice skating, biathlon, and alpine sports.',
  'racket-sports': 'Tennis, padel, badminton, squash, and table tennis — competitive and recreational.',
  'sports-science': 'Biomechanics, sports nutrition, recovery protocols, HRV tracking, and performance analytics.',

  // ── Video & Cinema (10) ──
  'cinephilia': 'Cinephilia — arthouse cinema, sci-fi, horror, thriller, and documentary.',
  'filmmaking': 'Filmmaking — independent cinema, short films, editing, and color grading.',
  'streaming-series': 'Streaming and TV — prestige drama, anime, reality TV, and true crime.',
  'youtube-content': 'YouTube and content creation — vlogging, educational content, let\'s plays, and tech reviews.',
  'animation': 'Animation — 2D, 3D, motion graphics, and stop motion.',
  'film-criticism': 'Film criticism — reviews, video essays, cinema podcasts, and cultural journalism.',
  'documentary': 'Documentary filmmaking, investigative journalism on screen, docuseries, and faction content.',
  'screenwriting': 'Screenwriting, story structure, narrative craft, script development, and writing for screen.',
  'vfx-postprod': 'Visual effects, compositing, color science, post-production workflows, and motion tracking.',
  'podcast-audio': 'Narrative podcasts, audio drama, sound storytelling, and podcast production.',

  // ── Entrepreneurship & Business (11) ──
  'startup-saas': 'Startups and SaaS — indie hacking, VC-backed startups, B2B SaaS, and consumer apps.',
  'freelance-consulting': 'Freelancing and consulting — dev, design, strategy consulting, and umbrella companies.',
  'ecommerce': 'E-commerce — D2C brands, Amazon FBA, and marketplaces.',
  'marketing-growth': 'Marketing and growth — SEO, paid ads, growth hacking, and community building.',
  'finance-investing': 'Finance and investing — stock market, angel investing, VC, and real estate.',
  'personal-branding': 'Personal branding — newsletters, LinkedIn thought leadership, podcasts, and speaking.',
  'productivity-systems': 'Productivity systems — GTD, Agile, second brain, time blocking, and deep work.',
  'legal-ip': 'Startup law, intellectual property, contracts, regulatory compliance, and business formation.',
  'hr-talent': 'Recruiting, team building, organizational culture, people management, and employer branding.',
  'operations': 'Supply chain, process optimization, operational efficiency, and business systems.',
  'impact-social': 'Social entrepreneurship, B-corps, ESG investing, and purpose-driven business models.',

  // ── Performing Arts (11) ──
  'theater': 'Classical and contemporary theater — improvisation, physical theater, and directing.',
  'dance': 'Dance — classical, contemporary, hip-hop, breakdance, latin, and traditional dance.',
  'circus-performance': 'Circus and performance — acrobatics, performance art, street art, and installations.',
  'comedy': 'Comedy — stand-up, sketch, improv, comedy podcasts, and comedy writing.',
  'magic': 'Magic and conjuring — close-up, stage illusion, mentalism, and card manipulation.',
  'musical-opera': 'Musical theater and opera — Broadway, West End, operetta, lyrical singing, and classical voice.',
  'spoken-word': 'Spoken word — slam poetry, oral storytelling, spoken word performance, and poetry in public.',
  'stagecraft': 'Live production — sound and lighting engineering, scenography, and technical show production.',
  'puppetry': 'Puppetry and object theater — marionettes, shadow puppetry, bunraku, and object performance.',
  'folk-performance': 'Cultural performance — traditional dances, carnival, folklore, and popular festivals.',
  'drag-cabaret': 'Drag and cabaret — drag performance, burlesque, cabaret, and variety shows.',

  // ── Nature & Environment (10) ──
  'ecology-activism': 'Ecology and activism — climate activism, zero waste, permaculture, and environmental politics.',
  'outdoor-adventure': 'Outdoor adventure — hiking, trekking, camping, survivalism, and kayaking.',
  'astronomy': 'Astronomy — amateur observation, astrophotography, cosmology, and space exploration.',
  'gardening': 'Gardening — vegetable gardening, indoor plants, urban farming, and medicinal plants.',
  'zoology-fauna': 'Zoology and wildlife — bird watching, aquariums, animal breeding, and wildlife protection.',
  'marine': 'Ocean exploration, marine biology, scuba diving, ocean conservation, and coastal ecosystems.',
  'geology': 'Geology, mineralogy, volcanology, paleontology, and earth system science.',
  'meteorology': 'Weather observation, climate modeling, atmospheric science, and amateur meteorology.',
  'urban-nature': 'Urban ecology, rewilding projects, biophilic cities, green spaces, and urban biodiversity.',
  'foraging': 'Wild plant identification, foraging, ethnobotany, herbalism, and plant-based knowledge.',

  // ── Food, Fashion & Lifestyle (11) ──
  'gastronomy': 'Gastronomy and cooking — world cuisine, pastry, BBQ, and molecular cuisine.',
  'beverages': 'Beverages — specialty coffee, tea ceremonies, cocktails, and craft beer.',
  'fashion-streetwear': 'Fashion — high fashion, streetwear, vintage thrift, and ethical fashion.',
  'collectibles': 'Collectibles — sneakers, trading cards, figurines, and watches.',
  'diy-making': 'DIY and making — woodworking, 3D printing, electronics, and sewing.',
  'home-decor': 'Home decor — interior design, minimalism, architecture, and biophilic design.',
  'wine-spirits': 'Wine tasting, natural wine, whisky, spirits, sommellerie, and fine beverages.',
  'travel': 'Slow travel, digital nomadism, van life, cultural exploration, and mindful wandering.',
  'beauty': 'Skincare, natural cosmetics, hair care, wellness rituals, and clean beauty.',
  'sustainable-living': 'Ethical consumption, zero waste, slow fashion, circular economy, and conscious lifestyle.',
  'thrift-vintage': 'Thrift shopping, vintage hunting, flea markets, upcycling, and secondhand culture.',

  // ── Literature & Writing (10) ──
  'fiction': 'Fiction — science fiction, fantasy, thriller, detective, manga, and comics.',
  'nonfiction': 'Non-fiction — political essays, biographies, business books, and popular science.',
  'creative-writing': 'Creative writing — novels, short stories, screenplays, poetry, and world-building.',
  'journalism': 'Journalism — investigative, field reporting, data journalism, and documentary podcasts.',
  'blogging-content': 'Blogging and content — newsletters, thematic blogs, ghostwriting, and copywriting.',
  'literary-criticism': 'Literary criticism — book reviews, translation, editing, and comparative literature.',
  'comics': 'Comics, graphic novels, manga creation, visual storytelling, and sequential art.',
  'translation': 'Literary translation, localization, subtitling, multilingual writing, and intercultural adaptation.',
  'audiobooks': 'Audiobook narration, literary podcasts, audio storytelling, and voice acting for literature.',
  'zines': 'Zines, self-publishing, small press, independent distribution, and DIY editorial.',

  // ── Personal Development (10) ──
  'mindfulness-spirituality': 'Mindfulness and spirituality — meditation, stoicism, and contemplative practice.',
  'coaching-leadership': 'Coaching and leadership — executive coaching, life coaching, and management.',
  'relationships': 'Relationships — dating, interpersonal communication, parenting, and community.',
  'personal-finance': 'Personal finance — FIRE, passive investing, budgeting, and rental real estate.',
  'neurodiversity': 'Neurodiversity and mental health — ADHD, autism, anxiety, therapy, and psychedelics.',
  'learning': 'Self-directed learning, speed reading, memory techniques, Zettelkasten, and knowledge management.',
  'career': 'Career transitions, skill building, professional development, job search, and career design.',
  'somatic': 'Breathwork, somatic therapy, body awareness, nervous system regulation, and embodied healing.',
  'emotional-intelligence': 'Empathy, emotional regulation, self-awareness, nonviolent communication, and interpersonal skills.',
  'habits': 'Habit formation, behavior design, atomic habits, willpower, and lifestyle optimization.',
}

// =============================================================================
// PLATFORMS (142)
// =============================================================================

export const PLATFORM_DESCRIPTIONS = {
  // ── Development ──
  'github': 'The world\'s largest platform for code hosting, version control, and open-source collaboration.',
  'gitlab': 'DevOps platform for source code management, CI/CD pipelines, and project collaboration.',
  'bitbucket': 'Git repository hosting by Atlassian with built-in CI/CD and Jira integration.',
  'stackoverflow': 'Q&A community for developers — reputation, badges, and expertise in programming topics.',
  'huggingface': 'Open platform for sharing machine learning models, datasets, and AI demos.',
  'kaggle': 'Data science competition platform with notebooks, datasets, and community rankings.',
  'npm': 'The default package registry for JavaScript and Node.js libraries.',
  'pypi': 'The official package repository for Python libraries and tools.',
  'replit': 'Browser-based IDE for coding, collaborating, and deploying projects instantly.',
  'devto': 'Community platform for developers to share articles, tutorials, and discussions.',
  'hashnode': 'Blogging platform for developers with custom domains and built-in community.',
  'hacker-news': 'Tech news aggregator and discussion forum by Y Combinator.',
  'leetcode': 'Coding challenge platform for practicing algorithms and preparing technical interviews.',
  'hackerrank': 'Developer skills platform with coding challenges, certifications, and interview prep.',
  'vercel': 'Frontend deployment platform optimized for Next.js and modern web frameworks.',
  'netlify': 'Web hosting and automation platform for modern static sites and serverless functions.',
  'codepen': 'Online code editor and community for frontend experiments — HTML, CSS, and JavaScript.',

  // ── Design ──
  'figma': 'Collaborative design tool for UI/UX — wireframes, prototypes, and design systems.',
  'behance': 'Adobe\'s portfolio platform for showcasing creative work across design disciplines.',
  'dribbble': 'Community for designers to share shots, find work, and get inspired.',
  'deviantart': 'Online art community for sharing digital art, illustrations, and photography.',
  'sketchfab': 'Platform for publishing, sharing, and discovering 3D models.',
  'unsplash': 'Free high-resolution photography platform powered by a community of photographers.',
  'flickr': 'Photo hosting and sharing platform with community groups and EXIF data.',
  '500px': 'Photography community for discovering and licensing professional photos.',
  'itchio': 'Indie game marketplace for publishing, selling, and discovering games.',
  'wattpad': 'Social storytelling platform for reading and publishing original fiction.',

  // ── Music ──
  'spotify': 'Music streaming service — playlists, artist discovery, and listening analytics.',
  'lastfm': 'Music tracking service that scrobbles listening history and builds taste profiles.',
  'soundcloud': 'Audio platform for uploading, sharing, and discovering independent music.',
  'mixcloud': 'Streaming platform for DJs and radio shows — long-form mixes and sets.',
  'deezer': 'Music streaming service with curated playlists and high-fidelity audio.',
  'discogs': 'Music database and marketplace for vinyl records, CDs, and physical media.',
  'listenbrainz': 'Open-source music listening tracker — community-driven alternative to Last.fm.',
  'musicbrainz': 'Open music encyclopedia — community-maintained database of music metadata.',
  'bandcamp': 'Independent music platform where artists sell directly to fans.',
  'genius': 'Music knowledge platform for song lyrics, annotations, and artist insights.',
  'apple-music': 'Apple\'s music streaming service with curated playlists and spatial audio.',
  'tidal': 'High-fidelity music streaming service with artist-centric royalty model.',

  // ── Gaming ──
  'steam': 'The largest PC gaming platform — game library, achievements, community, and marketplace.',
  'chess-com': 'Online chess platform with Elo ratings, puzzles, tournaments, and lessons.',
  'lichess': 'Free, open-source chess server with tournaments, puzzles, and analysis tools.',
  'riot-games': 'Publisher of League of Legends and Valorant — competitive gaming stats and rankings.',
  'blizzard': 'Publisher of World of Warcraft, Overwatch, and Diablo — characters, achievements, and rankings.',
  'opendota': 'Open-source Dota 2 statistics platform — hero stats, win rates, and match analysis.',
  'tracker-gg': 'Multi-game stats tracker for Valorant, Fortnite, Apex Legends, and more.',
  'boardgamegeek': 'The largest database and community for board games — collections, ratings, and forums.',
  'myanimelist': 'Anime and manga database — tracking, ratings, reviews, and community discussions.',
  'anilist': 'Modern anime and manga tracking platform with social features and activity feeds.',
  'trakt': 'Automatic TV show and movie tracking — watch history, ratings, and recommendations.',
  'rawg': 'Video game database — library tracking, ratings, and cross-platform game data.',
  'epic-games': 'PC gaming store and launcher by Epic Games — free games, achievements, and playtime.',
  'gog': 'DRM-free PC gaming platform with classic and indie games.',
  'playstation': 'Sony\'s gaming platform — trophies, play history, and online multiplayer stats.',
  'xbox': 'Microsoft\'s gaming platform — gamerscore, achievements, and cross-platform play.',
  'nintendo': 'Nintendo\'s gaming ecosystem — Switch playtime, online activity, and game library.',

  // ── Web3 ──
  'wallet-siwe': 'Ethereum wallet — on-chain transactions, protocol interactions, NFTs, and token holdings.',
  'lens': 'Decentralized social graph protocol — posts, follows, mirrors, and on-chain social identity.',
  'farcaster': 'Decentralized social network — casts, channels, and community built on Ethereum.',
  'ens': 'Ethereum Name Service — human-readable names for wallets, websites, and on-chain identity.',
  'the-graph': 'Indexing protocol for querying blockchain data — DeFi positions, swaps, and governance.',
  'opensea': 'The largest NFT marketplace — buying, selling, and creating digital collectibles.',
  'zora': 'Decentralized NFT marketplace and minting platform for digital creators.',
  'mirror': 'Web3 publishing platform — on-chain articles, crowdfunding, and tokenized editions.',
  'coinbase': 'Major cryptocurrency exchange — trading, staking, and educational content.',
  'snapshot': 'Off-chain governance platform for DAO voting and community proposals.',
  'rarible': 'Multi-chain NFT marketplace for creating, selling, and collecting digital art.',
  'uniswap': 'Leading decentralized exchange for token swaps and liquidity provision on Ethereum.',
  'aave': 'Decentralized lending and borrowing protocol — deposits, loans, and interest rates.',
  'lido': 'Liquid staking protocol for Ethereum — stake ETH while maintaining liquidity.',

  // ── Sport ──
  'strava': 'Fitness tracking app for runners and cyclists — GPS activities, segments, and challenges.',
  'garmin': 'Fitness and health platform — activity tracking, VO2 max, sleep, and HRV analysis.',
  'polar': 'Sports and fitness platform — heart rate training, recovery tracking, and workout planning.',
  'wahoo': 'Cycling-focused fitness platform — power data, indoor training, and performance metrics.',
  'komoot': 'Outdoor navigation app for hiking, cycling, and trail planning with route highlights.',
  'fitbit': 'Health and wellness tracker — steps, calories, sleep quality, and heart rate monitoring.',
  'nike-run-club': 'Nike\'s running app — guided runs, distance tracking, streaks, and achievements.',
  'myfitnesspal': 'Nutrition and calorie tracking app — meal logging, macros, and diet planning.',

  // ── Social ──
  'reddit': 'Community forum platform organized by topics — karma, subreddits, and discussions.',
  'discord': 'Communication platform for communities — servers, voice channels, and roles.',
  'mastodon': 'Decentralized social network — federated microblogging across independent instances.',
  'bluesky': 'Decentralized social network built on the AT Protocol — posts, feeds, and starter packs.',
  'tumblr': 'Microblogging and social platform for creative communities — posts, reblogs, and tags.',
  'pinterest': 'Visual discovery platform — boards, pins, and inspiration across creative categories.',
  'x-twitter': 'Microblogging platform — tweets, threads, spaces, and real-time conversations.',
  'instagram': 'Photo and video sharing platform — posts, reels, stories, and visual storytelling.',
  'tiktok': 'Short-form video platform — viral content, trends, and creator community.',
  'facebook': 'Social networking platform — pages, groups, events, and community engagement.',
  'linkedin': 'Professional networking platform — career profiles, posts, articles, and endorsements.',
  'snapchat': 'Ephemeral messaging and social platform — snaps, stories, and augmented reality.',
  'telegram': 'Messaging platform — channels, groups, bots, and encrypted communication.',

  // ── Video ──
  'youtube': 'The world\'s largest video platform — uploads, subscriptions, and content creation.',
  'twitch': 'Live streaming platform — gaming, creative content, and community interaction.',
  'vimeo': 'Professional video hosting — high-quality uploads, portfolios, and filmmaker tools.',
  'dailymotion': 'Video sharing platform — user uploads, publisher content, and video discovery.',
  'netflix': 'Streaming service for movies and TV series — watch history and personalized recommendations.',
  'disneyplus': 'Disney\'s streaming service — Marvel, Star Wars, Pixar, and original content.',
  'crunchyroll': 'Anime streaming platform — simulcasts, manga, and Japanese pop culture.',
  'letterboxd': 'Social platform for film lovers — ratings, reviews, lists, and film discovery.',
  'imdb': 'The world\'s most popular database for movies, TV shows, and entertainment industry info.',
  'rotten-tomatoes': 'Movie and TV review aggregator — critic scores, audience ratings, and reviews.',

  // ── Science & Education ──
  'orcid': 'Persistent digital identifier for researchers — publications, citations, and affiliations.',
  'arxiv': 'Open-access preprint repository for scientific papers in physics, math, CS, and more.',
  'semantic-scholar': 'AI-powered academic search engine — publications, citations, and research influence.',
  'pubmed': 'Biomedical literature database — medical publications, citations, and MeSH terms.',
  'openlibrary': 'Open-source library catalog — book tracking, reading lists, and community reviews.',
  'wikipedia': 'Free encyclopedia — community-edited articles, discussions, and knowledge contributions.',
  'duolingo': 'Language learning app — daily streaks, XP, leagues, and gamified lessons.',
  'khan-academy': 'Free online education platform — courses, exercises, and learning progression.',
  'google-scholar': 'Academic search engine — citations, h-index, and publication tracking.',
  'researchgate': 'Academic social network — publications, citations, RG Score, and research reads.',
  'coursera': 'Online learning platform — university courses, certificates, and specializations.',
  'udemy': 'Online course marketplace — thousands of courses across all skills and topics.',
  'goodreads': 'Book discovery and tracking platform — reading lists, ratings, reviews, and shelves.',

  // ── Business ──
  'producthunt': 'Platform for launching and discovering new tech products — upvotes, comments, and maker badges.',
  'notion': 'All-in-one workspace for notes, docs, wikis, and project management.',
  'todoist': 'Task management app — to-do lists, projects, labels, and productivity streaks.',
  'linear': 'Project management tool for software teams — issues, cycles, and roadmaps.',
  'medium': 'Publishing platform for long-form articles — claps, followers, and publications.',
  'substack': 'Newsletter platform for independent writers — subscribers, posts, and paid subscriptions.',
  'slack': 'Team communication platform — workspaces, channels, and integrations.',

  // ── Lifestyle ──
  'untappd': 'Beer discovery and check-in app — brewery tracking, ratings, and badges.',
  'vivino': 'Wine discovery app — scanning labels, ratings, reviews, and cellar management.',
  'openfoodfacts': 'Open database of food products — crowdsourced nutritional data and ingredient scanning.',
  'yelp': 'Local business reviews — restaurants, services, check-ins, and community ratings.',
  'etsy': 'Marketplace for handmade, vintage, and unique goods — shops, listings, and reviews.',
  'amazon': 'Global e-commerce platform — purchase history, reviews, and wishlists.',
  'shopify': 'E-commerce platform for building online stores — products, orders, and analytics.',

  // ── Nature ──
  'inaturalist': 'Citizen science platform for biodiversity — species observations and identification.',
  'alltrails': 'Trail discovery app — hiking routes, reviews, photos, and outdoor navigation.',
  'openstreetmap': 'Collaborative open-source map — community contributions, changesets, and geographic data.',
  'wikiloc': 'GPS trail sharing platform — hiking, cycling, and outdoor route recordings.',
  'ebird': 'Citizen science platform for bird observation — checklists, species data, and hotspots.',

  // ── Culture ──
  'librarything': 'Book cataloging and social platform — personal library, tags, and group discussions.',
  'pocket': 'Read-it-later app — saving articles, tags, and curated reading lists.',
  'feedly': 'RSS feed reader — follow publications, organize by topic, and track reading.',

  // ── Events ──
  'meetup': 'Platform for organizing and attending local events and community groups.',
  'eventbrite': 'Event management platform — creating, promoting, and ticketing events.',

  // ── Misc ──
  'zoom': 'Video conferencing platform for meetings, webinars, and virtual events.',
}
