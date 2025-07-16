# Project Starter

This is the starter template for ElizaOS projects.

## Features

- Pre-configured project structure for ElizaOS development
- Comprehensive testing setup with component and e2e tests
- Default character configuration with plugin integration
- Example service, action, and provider implementations
- TypeScript configuration for optimal developer experience
- Built-in documentation and examples

## Getting Started

```bash
# Create a new project
elizaos create -t project my-project
# Dependencies are automatically installed and built

# Navigate to the project directory
cd my-project

# Start development immediately
elizaos dev
```

## Development

```bash
# Start development with hot-reloading (recommended)
elizaos dev

# OR start without hot-reloading
elizaos start
# Note: When using 'start', you need to rebuild after changes:
# bun run build

# Test the project
elizaos test
```

## Testing

ElizaOS provides a comprehensive testing structure for projects:

### Test Structure

- **Component Tests** (`__tests__/` directory):

  - **Unit Tests**: Test individual functions and components in isolation
  - **Integration Tests**: Test how components work together
  - Run with: `elizaos test component`

- **End-to-End Tests** (`e2e/` directory):

  - Test the project within a full ElizaOS runtime
  - Run with: `elizaos test e2e`

- **Running All Tests**:
  - `elizaos test` runs both component and e2e tests

### Writing Tests

Component tests use Vitest:

```typescript
// Unit test example (__tests__/config.test.ts)
describe('Configuration', () => {
  it('should load configuration correctly', () => {
    expect(config.debug).toBeDefined();
  });
});

// Integration test example (__tests__/integration.test.ts)
describe('Integration: Plugin with Character', () => {
  it('should initialize character with plugins', async () => {
    // Test interactions between components
  });
});
```

E2E tests use ElizaOS test interface:

```typescript
// E2E test example (e2e/project.test.ts)
export class ProjectTestSuite implements TestSuite {
  name = 'project_test_suite';
  tests = [
    {
      name: 'project_initialization',
      fn: async (runtime) => {
        // Test project in a real runtime
      },
    },
  ];
}

export default new ProjectTestSuite();
```

The test utilities in `__tests__/utils/` provide helper functions to simplify writing tests.

## Configuration

Customize your project by modifying:

- `src/index.ts` - Main entry point
- `src/character.ts` - Character definition


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



