---
sidebar_position: 4
title: Intuition
---

# Intuition - On-Chain Knowledge Graph

Intuition is the backbone of Sofia's verifiable knowledge system. It provides the infrastructure for creating, storing, and querying knowledge triples on-chain.

## The Intuition System

### Knowledge Triples

Information is stored as subject-predicate-object triples (e.g., "Alice - knows - Web3 Development"), creating a semantic graph of verified knowledge.

### Attestations

Other users can attest to your signals, strengthening their credibility through community validation.

### Identity Atoms

Each entity (person, skill, interest) is represented as an "atom" with a unique on-chain identifier, enabling precise connections.

### Staking Mechanism

Users can stake tokens on signals, creating economic alignment around truth and accuracy.

### Composability

Your knowledge graph is composable with other applications, enabling a new generation of trust-based dApps.

## How Sofia Uses Intuition

When Sofia's agents process your activity in the TEE, they generate anonymized signals that get submitted to the Intuition protocol. These signals become part of your on-chain identity:

- **Your interests** - e.g., "User X - interested_in - Machine Learning"
- **Your skills** - e.g., "User X - proficient_in - Solidity"
- **Your network** - e.g., "User X - follows - Project Y"
- **Your contributions** - e.g., "User X - contributed_to - OpenSource Project Z"

This creates a verifiable, decentralized reputation system where your digital identity is based on proof, not claims. Other users and applications can query your public signals to understand your verified interests and expertise.

## Smart Contract Integration

Sofia's smart contracts interact with Intuition's protocol to:

- Create new atoms and triples representing your knowledge
- Manage your subscription and signal creation fees
- Enable you to attest to others' signals
- Query aggregated insights about users, topics, or connections
- Provide access control for your private signals

Your UserWallet (ERC-4337) automatically handles these interactions, making the process seamless while you retain full control.

## Privacy & Control

While Intuition enables public verification, you maintain control over:

- **What gets published** - Choose which signals are public vs private

This gives you the best of both worlds: verifiable public reputation and private personal data.
