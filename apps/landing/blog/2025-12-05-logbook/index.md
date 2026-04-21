---

slug: logbook-05-12

title: Logbook 05/12

authors: [Samuel, Maxime]

---

This week, we achieved a major milestone by deploying the **Sofia Fee Proxy Contract** on Intuition Mainnet, enabling Sofia to collect transaction fees while maintaining full protocol compatibility. We enhanced user features with improved SignalTab functionality, image support for triples, and better transaction feedback. Multiple bug fixes improved the stability of the orb visualization, chat, activity feed, and follow system.

<!-- truncate -->

## Smart Contract Development

### Sofia Fee Proxy Contract
- Developed and deployed a custom proxy contract on Intuition Mainnet ([0x26F81d723Ad1648194FAA4b7E235105Fd1212c6c](https://basescan.org/address/0x26F81d723Ad1648194FAA4b7E235105Fd1212c6c)) that wraps the MultiVault protocol
- Enables Sofia to collect transaction fees while maintaining full compatibility with Intuition's core functions
- Published the contract architecture as a reusable open-source template for other developers in the Intuition ecosystem

### Fee Structure Implementation
- Designed a deposit-based fee model charging **0.1 TRUST fixed fee + 5%** on each deposit
- No fees on atom/triple creation itself, ensuring fair pricing for users
- Fee collection mechanism seamlessly integrated with existing MultiVault operations

### Hardhat Test Suite
- Built comprehensive test coverage for all contract functions
- Tests include fee calculations, admin permissions, and edge cases
- 100% tests passing with full validation of contract behavior

## Blockchain Integration

### ABI Integration
- Fully integrated the Sofia Fee Proxy ABI into the extension
- Enables direct contract interaction from the frontend
- Seamless transaction flow between UI and smart contracts

## User Features

### SignalTab Enhancement
- Upgraded the SignalTab to display users' share holdings across vaults
- New modal for investing directly in signals
- Improved visibility of user positions and investment opportunities

### Image Support for Triples
- Added the ability to attach images when creating triples
- Enriches semantic data with visual content
- Better context and representation for knowledge claims

### Modal UX Improvements
- Enhanced transaction modals to clearly show the action type on success
- Distinct feedback for create, deposit, and follow actions
- Improved user understanding of transaction outcomes

## Fixes & Improvements

### Orb Visualization
- Fixed rendering issues in the 3D orb component
- Improved stability and performance

### Chat Functionality
- Resolved message delivery and display bugs
- Better real-time communication experience

### Activity Feed
- Fixed data fetching and sorting issues
- More reliable activity stream updates

### Follow System
- Corrected follow/unfollow state management
- Improved UI updates for follow actions

### Privacy Policy
- Updated legal documentation to reflect new data handling practices
- Compliance with current privacy standards

---

## Key Achievement

**Sofia Fee Proxy Contract** ([0x26F81d723Ad1648194FAA4b7E235105Fd1212c6c](https://basescan.org/address/0x26F81d723Ad1648194FAA4b7E235105Fd1212c6c))

A custom smart contract deployed on Intuition Mainnet that collects a **0.1 TRUST + 5%** fee on deposits, seamlessly integrated with the MultiVault protocol. The contract architecture has been open-sourced as a reusable template for developers to build their own fee-based applications on Intuition.

---

## Grant Application

### Intuition Grant
- Successfully submitted our grant application to Intuition
- Application document available at: [Intuition Grant Application (PDF)](https://salmon-petite-pinniped-299.mypinata.cloud/ipfs/bafybeidfqmvs2e5ln77syka67lopyhfpoofpcruxtcicn6qzva5ylejroa)
- Awaiting final validation
