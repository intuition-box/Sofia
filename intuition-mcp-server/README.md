# Intuition MCP Server

The Intuition MCP Server is an HTTP stream server designed to interact with the Intuition knowledge graph, enabling users to query and manage data through a set of powerful tools. It provides a robust API for extracting triples, searching for entities (atoms), retrieving account information, and exploring relationships such as followers and following. This README outlines the steps to get started, the available tools, their functionalities, and instructions for running a client using the [Model Context Protocol (MCP) SDK](https://modelcontextprotocol.io).

This repository represents the evolution of our Intuition MCP Server, which we are pleased to be open sourcing for our ecosystem. This is built upon the foundation and testing we've done. There are several contributors who helped get to this point, including [francoispqt](https://github.com/francoispqt), [jonathanprozzi](https://github.com/jonathanprozzi), and [simonas-notcat](https://github.com/simonas-notcat).

## Table of Contents

- [Intuition MCP Server](#intuition-mcp-server)
  - [Table of Contents](#table-of-contents)
  - [Get Started](#get-started)
  - [Overview](#overview)
  - [Tools](#tools)
    - [extract_triples](#extract_triples)
    - [search_atoms](#search_atoms)
    - [get_account_info](#get_account_info)
    - [search_lists](#search_lists)
    - [get_following](#get_following)
    - [get_followers](#get_followers)
    - [search_account_ids](#search_account_ids)
  - [Running a Client](#running-a-client)
    - [Prerequisites](#prerequisites)
  - [Installation](#installation)
    - [Example Client Setup](#example-client-setup)
  - [Making API Requests](#making-api-requests)
    - [Notes](#notes)
  - [Deployment](#deployment)
  - [Contributing](#contributing)
  - [License](#license)

## Get Started

To run the Intuition MCP Server locally, follow these steps:

Clone the Repository:
Clone the project repository to your local machine:

```bash
git clone <repository-url>
cd intuition-mcp-server
```

Install Dependencies:
Install the required dependencies using pnpm:

```bash
pnpm install
```

**Start the Server:**
Launch the server using the HTTP transport (recommended):

```bash
pnpm run start:http
```

This will start the Intuition MCP Server, making it available at the configured host and port (e.g., http://localhost:3001). Check the server configuration for the exact URL.

**Verify the Server:**
Once the server is running, you can test it by sending a request to the `/mcp` endpoint (for Streamable HTTP clients) or `/sse` endpoint (for legacy SSE clients). See the Running a Client (#running-a-client) section for details on connecting a client. We follow the most recent recommendations from the MCP SDK and recommend using the Streamable HTTP endpoint (`/mcp`) over SSE as it is in the process of being deprecated.

**Note**: Ensure you have pnpm installed globally (`npm install -g pnpm`) before running the above commands. If you encounter issues, verify that your Node.js version is 14 or higher.

## Overview

The Intuition MCP Server is built to facilitate interactions with the Intuition knowledge graph, a decentralized data structure for storing and querying relationships between entities (atoms) such as accounts, concepts, and objects. The server operates as an HTTP stream server, leveraging the Model Context Protocol (MCP) to handle streaming requests and responses, making it ideal for real-time applications and large-scale data queries.

The server exposes a set of tools via API endpoints, each designed for specific tasks like extracting structured data (triples), searching for entities, retrieving account details, and exploring social connections (e.g., followers or recommendations). These tools are accessible using the MCP SDK, which supports both modern Streamable HTTP and legacy Server-Sent Events (SSE) transports for client-server communication. While we provide support for SSE, it is in the process of being deprecated in the MCP SDK, so we recommend using the Stremable HTTP endpoint.

## Tools

The Intuition MCP Server provides the following tools, each with a specific purpose and input schema. All tools return responses sorted by relevance (e.g., position descending) and include detailed information, such as atom IDs and connections, to ensure comprehensive results.

Tools are registered and made available in the `index.ts` file.

### extract_triples

Description: Extracts triples (subject-predicate-object) from user input text, enabling structured data extraction from natural language.

Input Schema:

```json
{
  "type": "object",
  "properties": {
    "input": {
      "type": "string",
      "description": "Input from the user to extract triples from"
    }
  },
  "required": ["input"],
  "additionalProperties": false
}
```

Example:

Input: `{"input": "Alice knows Bob"}`

Usage: Extract structured triples like (Alice, knows, Bob).

### search_atoms

Description: Searches for entities (accounts, things, people, concepts) by name, description, URL, or ENS domain (e.g., john.eth). Supports synonyms and keyword breakdown for flexible querying.

Input Schema:

```json
{
  "type": "object",
  "properties": {
    "queries": {
      "type": "array",
      "items": { "type": "string", "minLength": 1 },
      "minItems": 1
    }
  },
  "required": ["queries"],
  "additionalProperties": false
}
```

Example:

Input: `{"queries": ["ethereum", "eth"]}`

Usage: Search for atoms related to Ethereum, returning at least 10 connections sorted by position, with atom IDs and detailed information.

### get_account_info

Description: Retrieves detailed information about an account using its address or identifier. Falls back to search_atoms if the identifier is not a hex address.

Input Schema:

```json
{
  "type": "object",
  "properties": {
    "address": { "type": "string" },
    "identifier": { "type": "string" }
  },
  "additionalProperties": false
}
```

Example:

Input: `{"identifier": "0x1234567890123456789012345678901234567890"}`

Usage: Fetch account details, including at least 10 connections, sorted by position, with atom IDs.

### search_lists

Description: Searches for lists of entities (e.g., blockchains, crypto CEOs) by name or description, supporting complex queries broken down into simpler terms.

Input Schema:

json

{
"type": "object",
"properties": {
"query": { "type": "string", "minLength": 1 }
},
"required": ["query"],
"additionalProperties": false
}

Example:

Input: `{"query": "defi protocols"}`

Usage: Retrieve a list of DeFi protocols, returning at least 10 items sorted by position, with atom IDs and details.

### get_following

Description: Retrieves atom IDs that an account follows, optionally filtered by a predicate (e.g., follow, recommend).

Input Schema:

```json
{
  "type": "object",
  "properties": {
    "account_id": { "type": "string", "minLength": 1 },
    "predicate": { "type": "string", "minLength": 1 }
  },
  "required": ["account_id"],
  "additionalProperties": false
}
```

Example:

Input: `{"account_id": "0x3e2178cf851a0e5cbf84c0ff53f820ad7ead703b", "predicate": "recommend"}`

Usage: List atoms recommended by the specified account.

### get_followers

Description: Retrieves followers of an account, optionally filtered by a predicate (e.g., follow, recommend).

Input Schema:

```json
{
  "type": "object",
  "properties": {
    "account_id": { "type": "string", "minLength": 1 },
    "predicate": { "type": "string", "minLength": 1 }
  },
  "required": ["account_id"],
  "additionalProperties": false
}
```

Example:

Input: `{"account_id": "0x3e2178cf851a0e5cbf84c0ff53f820ad7ead703b", "predicate": "follow"}`

Usage: List accounts following the specified account.

### search_account_ids

Description: Searches for an account address using an identifier, typically an ENS address (e.g., intuitionbilly.eth).

Input Schema:

```json
{
  "type": "object",
  "properties": {
    "identifier": { "type": "string", "minLength": 1 }
  },
  "required": ["identifier"],
  "additionalProperties": false
}
```

Example:

Input: `{"identifier": "vitalik.eth"}`

Usage: Resolve the ENS address to its corresponding account address.

## Running a Client

The Intuition MCP Server uses the Model Context Protocol (MCP) SDK for client interactions, supporting both modern Streamable HTTP and legacy Server-Sent Events (SSE) transports. Below are the steps to set up and run a client to communicate with the server.

### Prerequisites

Node.js (version 14 or higher).

MCP SDK: Install the @modelcontextprotocol/sdk package.

Access to the server URL (e.g., http://your-mcp-server:port/mcp).

## Installation

Set up a project:
Create a new project directory and initialize it with Node.js:

```bash
mkdir intuition-mcp-client
cd intuition-mcp-client
npm init -y
npm install @modelcontextprotocol/sdk
```

Install dependencies:
The @modelcontextprotocol/sdk package includes the necessary modules for both Streamable HTTP and SSE transports.

### Example Client Setup

Below is an example of a Node.js client using the MCP SDK to connect to the Intuition MCP Server and interact with its tools.

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

async function connectToMcpServer(url) {
  let client;
  const baseUrl = new URL(url);

  try {
    // Attempt to connect using Streamable HTTP transport
    client = new Client({
      name: 'streamable-http-client',
      version: '1.0.0',
    });
    const transport = new StreamableHTTPClientTransport(baseUrl);
    await client.connect(transport);
    console.log('Connected using Streamable HTTP transport');
    return client;
  } catch (error) {
    console.log(
      'Streamable HTTP connection failed, falling back to SSE transport:',
      error.message
    );
    // Fallback to SSE transport for legacy compatibility
    client = new Client({
      name: 'sse-client',
      version: '1.0.0',
    });
    const sseTransport = new SSEClientTransport(baseUrl);
    await client.connect(sseTransport);
    console.log('Connected using SSE transport');
    return client;
  }
}

async function callMcpTool(client, toolName, payload) {
  try {
    // Send a request to the specified tool
    const response = await client.callTool(toolName, payload);

    // Handle streaming response
    response.on('data', (data) => {
      console.log('Received data:', data);
    });

    response.on('end', () => {
      console.log('Stream ended');
    });
  } catch (error) {
    console.error('Error calling MCP tool:', error.message);
  }
}

// Example usage
async function main() {
  const serverUrl = 'http://your-mcp-server'; // Replace with your server URL
  const client = await connectToMcpServer(serverUrl);

  // Example: Search for atoms related to Ethereum
  await callMcpTool(client, 'search_atoms', { queries: ['ethereum', 'eth'] });

  // Example: Extract triples
  await callMcpTool(client, 'extract_triples', { input: 'Alice knows Bob' });
}

main().catch(console.error);
```

## Making API Requests

**Initialize the client:**

Create an MCP Client instance and connect it to the server using either `StreamableHTTPClientTransport` or `SSEClientTransport`.

The client automatically handles transport negotiation and fallback to SSE if Streamable HTTP fails.

**Construct the payload:**

Use the input schema for the desired tool (e.g., {"queries": ["ethereum"]} for search_atoms).

Ensure the payload matches the tool’s JSON schema to avoid errors.

**Send the request:**

Use the client.callTool method to invoke a tool with the specified payload.

The client handles the underlying HTTP or SSE communication, including streaming responses.

**Handle the response:**

Responses are streamed and can be processed using event listeners (e.g., response.on('data', ...)).

Parse each chunk as JSON if the response is structured data.

Handle the end event to detect when the stream is complete.

**Example Payloads:**

For search_atoms:

```javascript
await client.callTool('search_atoms', { queries: ['blockchain'] });
```

For get_account_info:

```javascript
await client.callTool('get_account_info', {
  identifier: '0x1234567890123456789012345678901234567890',
});
```

### Notes

**Server URL**: Replace http://your-mcp-server with the actual server address.

**Authentication**: If the server requires an API key, configure it in the transport options (consult the MCP SDK documentation for details).

**Error Handling**: The client automatically retries with SSE transport if Streamable HTTP fails (e.g., due to a 4xx error).

**Streaming**: Ensure your application can handle streaming responses, as large datasets are returned incrementally.

**Legacy Support**: The server supports both Streamable HTTP and SSE transports for backwards compatibility with older clients.

## Deployment

This repository contains a sample `Dockerfile` that you can use to deploy to services such as [Render](https://render.com/) or any other host provider that supports Docker. The `Dockerfile` is already configured to work for deploying the project structure as is. If you make any changes to the repo structure after cloning you'll want to be sure to update this file.

We've included a `render.yaml` file for the public deployment. We invite you to create your own deployment. You can utilize our existing `render.yaml` file to deploy your own Render project.

## Contributing

Contributions to the Intuition MCP Server are welcome! To contribute:

- Fork the repository.

- Create a feature branch (`git checkout -b feature/your-feature`).

- Commit your changes (`git commit -m "Add your feature"`).

- Push to the branch (git push origin feature/your-feature).

- Open a pull request.

Please ensure your code follows the project's coding standards and includes tests.

## License

The Intuition MCP Server is licensed under the MIT License (LICENSE). See the LICENSE file for details.
