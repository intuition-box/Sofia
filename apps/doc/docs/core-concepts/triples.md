---
sidebar_position: 2
title: Triples & Vaults
description: How Atoms connect through Triples with depositing and redeeming
---

# Triples & Vaults

## Anatomy of a Triple

<img src={require('./img/Anatomy of triple.png').default} alt="Anatomy of a Triple" style={{maxWidth: '80%'}} />

## Example Triples in Sofia

| Subject | Predicate | Object |
|---------|-----------|--------|
| alice.eth | visits for learning | docs.python.org |
| bob.eth | visits for work | github.com/project |
| carol.eth | visits for inspiration | dribbble.com |

## Triple Properties

Each Triple has:
- **Vault ID**: Unique identifier on the blockchain
- **Creator**: The wallet that created it
- **Deposits**: Total TRUST tokens staked
- **Shares**: Proportional ownership of the vault

---

## Depositing & Redeeming

When you [certify](../features/certifications.md) a page:
1. You **deposit** TRUST tokens into the Triple's vault
2. You receive **shares** proportional to your deposit
3. Early depositors get more shares (bonding curve advantage)

You can later **redeem** your shares for TRUST tokens, potentially at a profit if more users deposited after you.

---

## Putting It Together

Here's how these concepts connect when you certify a page:

```
1. You visit github.com/awesome-project

2. You click "Learning" to certify

3. Sofia creates/finds Atoms:
   - Atom A: Your wallet address
   - Atom B: "visits for learning" predicate
   - Atom C: github.com/awesome-project URL

4. Sofia creates Triple:
   A → B → C

5. You deposit 0.1 TRUST into the Triple's vault

6. You receive shares in that vault

7. The certification is permanently on-chain
```

:::tip Understanding Value
The more users certify a page, the more valuable its vault becomes. Being an early "Pioneer" means you get more shares for the same TRUST deposit. See [Discovery Rewards](../gamification/quests-discovery.md) for Pioneer bonuses.
:::
