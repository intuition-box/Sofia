---
sidebar_position: 2
title: Echoes
description: Your browsing history, intelligently grouped by domain
---

# Echoes

**Echoes** are your browsing history, intelligently grouped by domain. Instead of a linear list of URLs, Sofia clusters all your visits to the same website together.

## How Echoes Work

<img src={require('./img/how-echoes-work.png').default} alt="How Echoes Work" style={{maxWidth: '80%'}} />

## Echo Properties

| Property | Description |
|----------|-------------|
| **Domain** | The website (e.g., github.com) |
| **Pages** | Individual URLs visited |
| **Level** | Your progression with this domain (1-10) |
| **Certifications** | Number of certified pages |
| **Last Visit** | When you last visited |

## Page States

Every page in Sofia has a state:

| State | Description | Visual |
|-------|-------------|--------|
| **Visited** | In your Echoes, not certified | White |
| **Certified** | On-chain with [intention](./intentions.md) | A dots of color related to the intention + Green border |

## Domain Normalization

Sofia normalizes domains for cleaner grouping:
- `www.github.com` → `github.com`
- `m.facebook.com` → `facebook.com`
- `app.slack.com` → `slack.com`

## Echo Actions

| Action | Description |
|--------|-------------|
| **Sort** | By level, URL count, alphabetical, or recent visit |
| **Filter** | By intention type (Work, Learning, Fun, etc.) |
| **Open** | View all URLs in a domain |
| **Level Up** | Spend [Gold](../gamification/currencies-levels.md) to level up (AI generates new [predicate](../core-concepts/predicates.md)) |
| **Amplify** | Publish on-chain: "I [predicate] [domain]" |
| **Delete** | Remove domain from local view (on-chain certs remain) |
| **Remove URL** | Remove a URL; if certified, reclaim your stake |

## Amplify a Domain

When you **Amplify** a domain, you publish an on-chain identity statement:

![How Echoes Work](./img/amplify.png)

This costs 0.01 TRUST (+ fees) and creates a permanent on-chain record of your relationship with that domain.
