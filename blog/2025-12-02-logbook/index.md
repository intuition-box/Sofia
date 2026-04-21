---

slug: logbook-02-12

title: Logbook 02-12

authors: [Samuel, Maxime]

---

This week, we successfully completed a major Curve System Upgrade, separating support (Curve 1) from financial investment (Curve 2) and implementing new logic for triples creation, including automatic deposit for existing signals. We introduced the dedicated Shares Modal and dynamic success messaging, alongside key social features like extended activity tracking, on-chain Follow functionality, and ENS resolution. 
Furthermore, we completed the full deployment of our Gaianet node, enabling the Qwen 2.5 14B model to seamlessly power our 5Agent within a secure TEE (Trusted Execution Environment) on Phala Cloud. We also finalized a stable, end-to-end data pipeline supporting our AI agent ecosystem. Lastly, the Intuition grant application was successfully completed.

<!-- truncate -->

## Curve System Upgrade

### Curve Separation
- **Curve 1 (Support/Upvotes)**: Used for support votes on triples. This curve represents social engagement and community validation.
- **Curve 2 (Shares/Deposits)**: Used for financial investments in triples. This curve allows users to acquire shares and participate economically in signals.

### New Triples Creation Logic
- **Minimum Required**: Each triples creation now requires a minimum deposit of 0.01 TRUST plus creation fees.
- **Automatic Conversion to Shares**: If a user wants to invest more than the minimum, the system first creates the triples with the minimum amount, then automatically performs a second deposit on Curve 2 to convert the excess into shares.
- **Example**: If a user wants to create a triples with 0.1 TRUST, the system uses 0.01 TRUST + fees for creation, then deposits the remaining 0.09 TRUST on Curve 2 as an investment.

### Existing triples Handling
- **Previous Behavior**: When a triples already existed, the system simply returned "triple already exists" without any action.
- **New Behavior**: The system automatically detects if the triples exists and performs a deposit on Curve 2 instead of failing. This allows users to reinforce their existing signals.


### Atom URI Calculation
- Implemented atom URI calculation directly via the contract to obtain the correct.
- Support for batch creation with automatic fallback to deposit if the triples already exists.

---

## Shares Modal Implementation

### SharesModal
- New dedicated modal allowing users to invest in shares of an existing triples.
- Interface displaying the triples's object name in the title for better clarity.
- Predefined amount options (Minimum, Default, Strong) plus a Custom option.

### Dynamic Messaging
- **Added operationType**: The useTrustPage and useTrustAccount hooks now return the type of operation performed ('created' or 'deposit').
- **Contextual Success Messages**:
  - Creation: "Your signal has been amplified!"
  - Deposit on existing: "Your signal has been reinforced!"
  - Mixed (batch): "X signals created, Y existing signals reinforced!"
- **createdCount` and depositCount Props**: Passed to WeightModal to display the appropriate message.

### SignalsTab Improvements
- Added sorting by shares (Curve 2) separate from sorting by support (Curve 1).
- Display of user positions on each curve.

---

## Social Features

### Activity Tracking
- Extended activity tracking system to trace user interactions.
- Integration with ActivityTab to display action history.

### Follow Functionality
- useCreateFollowTriples hook to create "I follow [user]" triples.
- Uses the existing on-chain PREDICATE_IDS.FOLLOW predicate.
- Same curve logic: creation on Curve 1 with option to deposit on Curve 2.
- Custom amount support: creation fees are added on top of the user's desired amount (if user wants 0.01 TRUST in shares, total cost = 0.01 + 0.003 fees).

### ENS Integration
- ENS name resolution for user accounts.

---

## Infrastructure & Model Deployment

### Qwen 2.5 14B Deployment
- Qwen 2.5 14B model deployed on a dedicated Hetzner server.
- Configuration optimized for inference performance.

### Gaianet Node
- Gaianet node opened and configured.
- Powers the Sofia extension's AI agents via Mastra framework
- Enables decentralized model execution.

### TEE Architecture (Trusted Execution Environment)
- Agents hosted on Phala Cloud TEE machine to ensure computation confidentiality and integrity.
- Full connectivity established between all components:
  - Sofia Extension ↔ Phala TEE ↔  Gaianet Node
  - End-to-end data pipeline fully operational.

### Stability
- Infrastructure tested and validated.
- Complete pipeline functional from end to end.

---

## Grant Application

### Intuition Grant
- Intuition grant application document completed.
- Awaiting final validation.
