# 🧠 SOFIA — Your Personal AI Agent for the Web

> **SOFIA** is an AI-powered Chrome extension designed as a smart personal agent.

---

## ✨ Overview

**SOFIA** assists you during your web browsing, capturing your interests and transforming them into a **living digital memory**, **secure**, and **verifiable via blockchain**.

But it's more than just an assistant:
- It **structures, contextualizes, and certifies** your digital identity.
- Thanks to the decentralized infrastructure of [Intuition.systems](https://www.intuition.systems/), every interaction can become an **atom**, a unit of knowledge.
- You decide whether this data remains **private**, **shared**, or **anchored on-chain**.

🧭 **SOFIA** acts as:
- An **assisted journal**
- A **living personal graph**
- An **intelligent planner**
- A **cognitive filter**
- An **ethical accomplice** to your digital memory

---

## 🧰 Tech Stack

| Component        | Version       |
|------------------|---------------|
| Node.js          | v20.19.3      |
| pnpm             | v10.8.2       |
| Vite             | v7.0.0        |
| UI Framework     | [Chakra UI](https://chakra-ui.com/) / [Shadcn UI](https://ui.shadcn.com/) |
| Auth             | MetaMask / Wagmi |
| APIs             | Google Maps, Intuition.systems |
| Extension        | Chrome |
| Web3             | On-chain integration via signals/atoms/triplets |
| Language         | TypeScript    |

---

## 🗂️ Recommended Repo Structure

```bash
sofia/
├── main             # Production branch (stable)
├── develop          # Development branch
├── feature/         # Feature branches
│   ├── feature/chatbot
│   ├── feature/onboarding
├── bugfix/          # Bug fix branches
├── hotfix/          # Urgent production fixes
├── README.md        # Project overview
├── docs/            # Additional documentation
├── .github/         # CI/CD workflows, issue/PR templates
└── LICENSE          # Open source license

##🌳 Git Convention

###🛠 Branches
main: production-ready version

develop: continuous development (tested but not production)

feature/xxx: new features

bugfix/xxx: bug fixes

hotfix/xxx: urgent production fixes

###🔄 Git Workflow
Develop in feature/xxx

Merge into develop after testing

Merge into main for release

hotfix/xxx branches from main and merges back into both main and develop

##🔐 Branch Protection
GitHub → Settings → Branches → Protection rules

🔒 No direct pushes to main and develop

✅ Mandatory code reviews via Pull Requests

✅ (Optional) CI checks required for PR approval

##🤝 Contributing
Before contributing:

Fork the repository

Create a branch from develop:

bash
Copier
Modifier
git checkout -b feature/your-feature-name
Push your branch:

bash
Copier
Modifier
git push origin feature/your-feature-name
Open a Pull Request to develop

Please follow:

Commit message convention (feat:, fix:, docs:, etc.)

Accessibility and readability best practices

TypeScript / Vite standards

##📌 TODO (Initial Roadmap)
 Full integration with Intuition.systems (atoms/triplets/signals)

 Interface to visualize interests

 Assisted journal feature with automatic classification

 Automatic detection of actions/contexts in the browser

 Private/public mode for each interaction

 Onboarding UX with personalized AI agent setup

 Detection of "memorable moments"

 Google Maps integration (local activity insights)

 Voting or reaction mechanism on triplets (signals)

 Web3 interface / Wallet / ETH staking on signals

 Decentralized version of bookmarks, goals, reminders

##🔗 External Resources
Intuition System: intuition-ts

Eliza OS: GitHub – Website

Chrome Extension: Intuition Extension

Metamask Auth: wagmi.sh

##⚖️ License
This project is licensed under the MIT License. See LICENSE for details.
