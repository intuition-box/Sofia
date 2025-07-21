This is a [Plasmo extension](https://docs.plasmo.com/) project bootstrapped with [`plasmo init`](https://www.npmjs.com/package/plasmo).

# 🚀 Eliza OS Agent Initialization

This README guides you step-by-step to install, configure, and run your **Eliza OS** agent with the **Intuition MCP Server** and its plugin.

---

## 📥 1️⃣ Download and Install Dependencies

1. Clone and install **Intuition MCP Server**  
   ```bash
   git clone https://github.com/THP-Lab/intuition-mcp-server
   
   cd intuition-mcp-server
   
   pnpm install

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

Inside the `/agent1` directory:
```bash
elizaos start
```
<<<<<<< HEAD

---

## 🤖 6️⃣ Start Your Agent **SofIA**

Again inside `/agent1`:
```bash
elizaos agent start --path SofIA/agent1/SofIA.json
```

---
## 🤖 7️⃣ Start the proxy server 

    inside /extension 
    
    pnpm run proxy

## ✅  Final Checks

In your **SofIA1** settings:
- Ensure the **OPENAI** key is correctly set.
- Make sure the **MCP plugin** and **OpenAI plugin** are both enabled.

## 🗂️ Happy exploring with **Eliza OS**!


