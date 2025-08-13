# ElizaOS Plugin Gaia

A plugin for ElizaOS that integrates with Gaia Network's OpenAI-compatible API, providing text generation and embedding capabilities.

## Features

- 🤖 Text generation using Gaia Network LLM models
- 📊 Text embeddings with nomic-embed support
- 🔧 OpenAI-compatible API interface
- 🎯 High priority model registration
- 📝 XML-formatted responses for ElizaOS Bootstrap compatibility
- 🛡️ Robust error handling and fallbacks

## Installation

### As an npm package (recommended)

```bash
npm install elizaos-plugin-gaia
```

### Local development

1. Clone this repository
2. Build the plugin:
   ```bash
   npm install
   npm run build
   ```

## Configuration

Set the following environment variables:

### Required
- `GAIA_API_BASE` or `OPENAI_API_BASE`: Your Gaia node API endpoint (e.g., `https://qwen72b.gaia.domains/v1`)
- `GAIA_API_KEY` or `OPENAI_API_KEY`: Your Gaia API key

### Optional
- `GAIA_MODEL` or `OPENAI_MODEL`: Model name (default: `qwen72b`)
- `GAIA_EMBEDDING_MODEL` or `OPENAI_EMBEDDING_MODEL`: Embedding model (default: `nomic-embed-text-v1.5`)
- `DISABLE_EMBEDDINGS`: Set to `true` to disable embeddings (default: `false`)

## Usage

### In your ElizaOS character configuration

```typescript
import gaiaPlugin from 'elizaos-plugin-gaia';

export const character = {
  name: 'Your Agent',
  plugins: [
    gaiaPlugin,
    // other plugins...
  ],
  // rest of your character config
};
```

### Environment Variables Example

```bash
# .env
GAIA_API_BASE=https://qwen72b.gaia.domains/v1
GAIA_API_KEY=gaia-your-api-key-here
GAIA_MODEL=qwen72b
GAIA_EMBEDDING_MODEL=nomic-embed-text-v1.5
```

## How it Works

1. **Text Generation**: Uses Gaia Network's OpenAI-compatible `/chat/completions` endpoint
2. **Embeddings**: Supports embedding generation via `/embeddings` endpoint (when available)
3. **XML Formatting**: Automatically formats responses for ElizaOS Bootstrap plugin compatibility
4. **Fallbacks**: Provides graceful fallbacks for missing embeddings or API errors

## Model Registration

The plugin registers the following models with high priority (100):
- `TEXT_LARGE`: For complex text generation tasks
- `TEXT_SMALL`: For simpler text generation tasks  
- `TEXT_EMBEDDING`: For text embeddings (if enabled)

## API Compatibility

This plugin is designed to work with Gaia Network nodes that provide OpenAI-compatible APIs. It has been tested with:
- Qwen models on Gaia Network
- Standard OpenAI-compatible endpoints

## Troubleshooting

### Common Issues

1. **No response from agent**: Check that your `GAIA_API_BASE` and `GAIA_API_KEY` are correctly set
2. **Embedding errors**: If your Gaia node doesn't support embeddings, set `DISABLE_EMBEDDINGS=true`
3. **Model not found**: Verify your `GAIA_MODEL` matches what's available on your Gaia node

### Debug Logs

The plugin provides detailed console logs prefixed with `[GAIA]` for debugging:
- API calls and responses
- Model registration status
- Error details
- Configuration validation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.
