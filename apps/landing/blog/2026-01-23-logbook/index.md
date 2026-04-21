---

slug: logbook-23-01

title: Logbook 23/01

authors: [Samuel, Maxime]

---

<!-- truncate -->

## Discovery System and Profiles
- Complete implementation of a "Discovery" system with discovery score based on position-based ranking
- Creation of dedicated user profile page with intention statistics
- Added discovery metrics for "learning" with opportunity badge system
- Trust/distrust counter with person icons to visualize progression

## Quest and Rewards System
- Implementation of complete daily quest system
- Integration of discovery rewards for trust/distrust actions
- Quest cache system with "claimable_xp" state
- On-chain badge verification for quest validation
- TSX initialization when claiming XP after quest completion

## Intention Groups System (Echoes)
- Complete intention groups system with XP and level progression
- Merge of on-chain certifications with local groups
- Unified XP progress bar with level-up button
- Gold glow effect for level-up ready cards
- Level badge colors added for better UX
- Strict URL matching for on-chain badges with multi-certification support
- Integration with WeightModal for predicate creation and upgrades

## Mastra Architecture Migration
- Complete migration from ElizaOS to Mastra (v0.1.2)
- MCP connection for skills analysis with persistent cache
- New "askills" page merging AI and cache data
- New skills analysis agent in Mastra workflow
- Phala deployment with new docker-compose integrating MCP tools
- Gaianet plugin successfully implemented in framework

## Social Verification and Humanity
- Functional social verification system (Discord, Twitch)
- Twitch OAuth migration from implicit flow to external OAuth via landing page
- Complete "Proof of Humanity" implementation with on-chain attestation
- Bot verifier for filtering social link quests
- Golden border with glow animation for verified human avatars
- Mastra "human-attestor" workflow with bot wallet to pay fees

## Activity Feed and Refactoring
- Complete refactoring of Activity Feed page
- Added get_account_activity operation for analytics
- GraphQL pagination implemented
- Improved feed styling with links to atom objects
- GraphQL package added to workspace

## Cleanup and Optimization
- Removal of all legacy behavioral analysis code
- Removal of page duration and attention score systems
- Renamed all "elizaos" stores and functions
- New buffer system to send URLs after timeout or stack
- Removed AGENT_CHANNELS, added INTENTION_GROUPS and USER_XP stores
- Added SessionTracker service and GroupManager

## UI/UX Improvements
- Min-height added in Core Page
- Improved CSS tab organization for better comprehension
- Loader in TX state for weight modal
- Various interface improvements for proofs
- Multiple UI fixes

## Infrastructure and DevOps
- Webstore configuration
- Updated installation and development setup instructions
- Added .github and .git to .gitignore
- Fixed viem TypeScript errors
- Updated README documentation
