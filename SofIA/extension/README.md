This is a [Plasmo extension](https://docs.plasmo.com/) project bootstrapped with [`plasmo init`](https://www.npmjs.com/package/plasmo).

## Structure du projet

Ce projet contient deux `node_modules` distincts :

1. **SofIA/ (racine)** : Projet parent avec des dépendances basiques (metamask-extension-provider et vite)
2. **SofIA/extension/** : Sous-projet d'extension browser avec Plasmo, React et d'autres dépendances spécifiques

Chaque `package.json` génère son propre `node_modules` lors de l'installation des dépendances. C'est normal dans une architecture avec plusieurs projets imbriqués.

## Getting Started

First, run the development server:

```bash
pnpm dev
# or
npm run dev
```

Open your browser and load the appropriate development build. For example, if you are developing for the chrome browser, using manifest v3, use: `build/chrome-mv3-dev`.

You can start editing the popup by modifying `popup.tsx`. It should auto-update as you make changes. To add an options page, simply add a `options.tsx` file to the root of the project, with a react component default exported. Likewise to add a content page, add a `content.ts` file to the root of the project, importing some module and do some logic, then reload the extension on your browser.

For further guidance, [visit our Documentation](https://docs.plasmo.com/)

## Making production build

Run the following:

```bash
pnpm build
# or
npm run build
```

This should create a production bundle for your extension, ready to be zipped and published to the stores.


# 🚀 Eliza OS Agent Initialization

This README guides you step-by-step to install, configure, and run your **Eliza OS** agent with the **Intuition MCP Server** and its plugin.

---

## 📥 1️⃣ Download and Install Dependencies

1. Clone and install **Intuition MCP Server**  
   ```bash
   git clone https://github.com/THP-Lab/intuition-mcp-server
   cd intuition-mcp-server
   pnpm install

   pnpm add -D ts-node typescript @types/node @types/express
   ```

---

## ⚙️ 2️⃣ Start the **Intuition MCP Server**

Inside the `intuition-mcp-server` directory:
```bash
SERVER_MODE=http pnpm run start:http
```

---

## 🔌 3️⃣ Download and Install the **MCP Plugin** for **Eliza OS**

 https://github.com/elizaos-plugins/plugin-mcp
   ```

 Follow the installation instructions provided in the plugin repository.

---

## 🗝️ 4️⃣ Configure the **.env** File

1. Place your `.env` file inside your `/my-agent` directory (where your Eliza OS agent is located).  
   👉 **Do not share your OpenAI key publicly!**

2. Create a `.gitignore` file in `/my-agent` and add:
   ```
   .env
   ```

   This ensures your OpenAI API key won’t be pushed to GitHub.

---

## 🚦 5️⃣ Start **Eliza OS**

Inside the `/my-agent` directory:
```bash
elizaos start
```
<<<<<<< HEAD

---

## 🤖 6️⃣ Start Your Agent **SofIA**

Again inside `/my-agent`:
```bash
elizaos agent start --path SofIA.json
```

---
## 🤖 7️⃣ Start the proxy server 
    
    pnpm run build 

## ✅  Final Checks

In your **SofIA1** settings:
- Ensure the **OPENAI** key is correctly set.
- Make sure the **MCP plugin** and **OpenAI plugin** are both enabled.

## 🗂️ Happy exploring with **Eliza OS**!


