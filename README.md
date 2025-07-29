This is a [Plasmo extension](https://docs.plasmo.com/) project bootstrapped with [`plasmo init`](https://www.npmjs.com/package/plasmo).

# 🚀 Eliza OS Agent Initialization

This README guides you step-by-step to install, configure, and run your **Eliza OS** agent with the **Intuition MCP Server** and its plugin.

Figma : [Mockup](https://www.figma.com/design/UnJdCYeVVmA4WVzFVRb5x6/SofIA-final?m=auto&t=HaHvGlczPhbXmKwU-6)

Website : [SofIA](https://sofia.intuition.box)

Spline : [Animation](https://app.spline.design/file/36ec7513-df36-4e36-854b-56f87834778e)

Whimsical : [BrainStroming](https://whimsical.com/mockup-SURS8uWMVKKPDyG3YpDyXM)

Excalidraw : [Architecture Diagram](https://excalidraw.com/#json=tG7xgP3exjVuxdaJa7LIc,0JtKsBw_ULTjjwv_ORmaCA)


---

# 🧠 SofIA Installation Guide

## 📥 1️⃣ Download and Install Dependencies

1. Clone and install **Intuition MCP Server** in the same folder as `core`:
   ```bash
   git clone https://github.com/THP-Lab/intuition-mcp-server

   cd intuition-mcp-server

   pnpm install
   ```

---

## ⚙️ 2️⃣ Start the **Intuition MCP Server**

Inside the `intuition-mcp-server` directory, run:
```bash
SERVER_MODE=http pnpm run start:http
```

---

## 🔌 3️⃣ Download and Install the **MCP Plugin** for **Eliza OS**

👉 Plugin repository: [plugin-mcp](https://github.com/elizaos-plugins/plugin-mcp)

Follow the installation instructions provided in the repository.

---

## 🗝️ 4️⃣ Configure the **.env** File

Place your `.env` file inside your `/my-agent` directory (where your Eliza OS agent is located).  
Ensure the following:

- Your **OpenAI API key** is correctly set  
- 👉 **Never share your OpenAI key publicly!**

---

## ✅ Final Checks

In your **SofIA1** agent settings:

- ✅ Ensure the **OPENAI** key is correctly configured  
- ✅ Make sure both **MCP plugin** and **OpenAI plugin** are enabled  

---

## 🚀 How to Launch SofIA

Once everything is installed, start the full SofIA application from the `core` directory:

```bash
./sofia start
```

This script will automatically launch all components in the correct order:

1. 🛜 **MCP Server** – Starts the Intuition MCP server for external integrations  
2. 💁 **ElizaOS** – Launches the core ElizaOS runtime  
3. 🤖 **Agent Activation** – Activates the SofIA agent with its configuration  
4. 📱 **Extension Build** – Builds the browser extension (with visible progress)

---



