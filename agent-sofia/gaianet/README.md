# @elizaos/plugin-gaianet

A GaiaNet model provider plugin for ElizaOS that enables text generation and embeddings using the decentralized GaiaNet network.

## Features

- **Text Generation**: Small and large language models for text generation
- **Object Generation**: Structured JSON output with small and large models
- **Embeddings**: Text embeddings for semantic search and similarity
- **OpenAI Compatible**: Uses OpenAI-compatible API endpoints
- **Decentralized**: Leverage GaiaNet's decentralized AI infrastructure

## Installation

```bash
npm install @elizaos/plugin-gaianet
```

## Configuration

The plugin requires the following environment variables:

```env
# Optional: GaiaNet API key (if required by your node)
GAIANET_API_KEY=your_api_key_here

# Optional: GaiaNet node URL (defaults to https://llama.us.gaianet.network)
GAIANET_NODE_URL=https://your-node.gaia.domains

# Optional: Model names
GAIANET_TEXT_MODEL_SMALL=llama
GAIANET_TEXT_MODEL_LARGE=llama
GAIANET_EMBEDDINGS_MODEL=nomic-embed-text-v1.5.f16
```

## Usage

### Register the Plugin

```typescript
import { gaianetPlugin } from '@elizaos/plugin-gaianet';

// Register with your ElizaOS runtime
runtime.registerPlugin(gaianetPlugin);
```

### Available Models

The plugin provides the following model types:

- `TEXT_SMALL`: Fast text generation for simple tasks
- `TEXT_LARGE`: Advanced text generation for complex tasks
- `OBJECT_SMALL`: JSON generation for structured data (small)
- `OBJECT_LARGE`: JSON generation for structured data (large)
- `TEXT_EMBEDDING`: Text embeddings for semantic operations

### Example Usage

```typescript
// Text generation
const response = await runtime.generateText({
    prompt: "Explain quantum computing",
    modelType: ModelType.TEXT_LARGE
});

// Object generation
const structured = await runtime.generateObject({
    prompt: "Create a user profile for John Doe",
    modelType: ModelType.OBJECT_SMALL
});

// Embeddings
const embedding = await runtime.embed({
    text: "This is a sample text to embed"
});
```

## GaiaNet Nodes

GaiaNet provides decentralized AI inference through various nodes. Each node may offer different models and capabilities. You can:

1. Use the default public node: `https://llama.us.gaianet.network`
2. Deploy your own GaiaNet node
3. Use any compatible GaiaNet node URL

Learn more about GaiaNet at [https://www.gaianet.ai/](https://www.gaianet.ai/)

## Development

### Building

```bash
bun install
bun run build
```

### Testing

```bash
bun test
```

## License

MIT