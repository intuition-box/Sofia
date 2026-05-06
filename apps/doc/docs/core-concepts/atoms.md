---
sidebar_position: 1
title: Atoms
description: The fundamental unit of data in Intuition
---

# Atoms

Sofia is built on the **Intuition Protocol**, a decentralized knowledge graph. Understanding these core concepts will help you make the most of the platform.

An **Atom** is the fundamental unit of data in Intuition. Think of it as a unique identifier for any entity — a URL, a user, a concept, or an idea.

## What can be an Atom?

| Type | Example | Description |
|------|---------|-------------|
| **User** | `0x1234...abcd` | Your wallet address |
| **URL** | `https://github.com` | A webpage you visited |
| **Predicate** | `visits for work, trust, distrust` | A relationship type |

## How Atoms are created

When you [certify](../features/certifications.md) a page for the first time, Sofia automatically creates:
1. An Atom for the URL (if it doesn't exist)
2. An Atom for the [predicate](./predicates.md) (intention type)
3. Links them in a [Triple](./triples.md)

Each Atom has its own **vault** where users can deposit TRUST tokens.
