// src/index.ts
import { type IAgentRuntime, type Project, type ProjectAgent, logger } from '@elizaos/core';
import gaiaPlugin from './plugin.gaia.ts';
import { character } from './character.ts';

import dotenv from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

// -------------------- ENV LOADED FIRST --------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
// .env at the root of the agent folder (one level above /src)
const envPath = resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

console.log('[ENV] CWD =', process.cwd());
console.log('[ENV] .env path =', envPath, 'exists =', fs.existsSync(envPath));
console.log('[ENV] OPENAI_BASE_URL =', process.env.OPENAI_BASE_URL);
console.log('[ENV] OPENAI_API_BASE =', process.env.OPENAI_API_BASE);
console.log('[ENV] OPENAI_API_KEY length =', (process.env.OPENAI_API_KEY || '').length);

// -------------------- HEALTHCHECK GAIA --------------------
async function gaiaHealthcheck() {
  const key = process.env.OPENAI_API_KEY ?? '';
  const base = process.env.OPENAI_API_BASE ?? process.env.OPENAI_BASE_URL ?? '';
  console.log('[HC] KEY LEN =', key.length, 'BASE =', base);

  if (!key || !base) {
    console.warn('[HC] Missing OPENAI_API_KEY or BASE URL');
    return;
  }

  try {
    const r = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'qwen72b',
        messages: [{ role: 'user', content: 'ping' }],
      }),
    });
    const text = await r.text();
    console.log('[HC] status =', r.status, 'body =', text.slice(0, 200));
  } catch (e) {
    console.error('[HC] fetch error:', e);
  }
}
await gaiaHealthcheck();

// -------------------- ELIZA PROJECT --------------------
const initCharacter = ({ runtime }: { runtime: IAgentRuntime }) => {
  logger.info('Initializing character');
  logger.info('Name: ' + character.name);
};

export const projectAgent: ProjectAgent = {
  character,
  init: async (runtime: IAgentRuntime) => await initCharacter({ runtime }),
  // connect the GAIA plugin here
  plugins: [gaiaPlugin],
};

const project: Project = {
  agents: [projectAgent],
};

export { testSuites } from './__tests__/e2e';
export { character } from './character.ts';
export default project;
