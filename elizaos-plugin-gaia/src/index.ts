import type {
  IAgentRuntime,
  Plugin,
  GenerateTextParams,
  TextEmbeddingParams
} from "@elizaos/core";
import { ModelType, logger } from "@elizaos/core";
import axios, { AxiosError } from "axios";

/* ----------------------- Settings helpers ----------------------- */
function getSetting(rt: IAgentRuntime, k: string, def?: string) {
  return rt.getSetting(k) ?? process.env[k] ?? def;
}
function getBaseURL(rt: IAgentRuntime) {
  return getSetting(rt, "GAIA_API_BASE") ?? getSetting(rt, "OPENAI_BASE_URL") ?? "";
}
function getApiKey(rt: IAgentRuntime) {
  return getSetting(rt, "GAIA_API_KEY") ?? getSetting(rt, "OPENAI_API_KEY");
}
function getChatModel(rt: IAgentRuntime) {
  return getSetting(rt, "GAIA_MODEL", "Qwen3-235B-A22B-Q4_K_M")!;
}
function getEmbModel(rt: IAgentRuntime) {
  return getSetting(rt, "GAIA_EMBEDDING_MODEL", "nomic-embed-text-v1.5")!;
}
function embeddingsDisabled(rt: IAgentRuntime) {
  const v =
    getSetting(rt, "DISABLE_EMBEDDINGS") ??
    getSetting(rt, "ELIZA_DISABLE_EMBEDDINGS") ??
    getSetting(rt, "NO_EMBEDDINGS") ??
    "false";
  return String(v).toLowerCase() === "true";
}
function zeroVector(dims: number) {
  const v = Array(dims).fill(0);
  v[0] = 0.1;
  return v;
}
function sliceJSON(x: any, n = 400) {
  try {
    const s = typeof x === "string" ? x : JSON.stringify(x);
    return s.slice(0, n);
  } catch {
    return String(x).slice(0, n);
  }
}

/* --------------------------- Axios client --------------------------- */
function makeClient(rt: IAgentRuntime) {
  const baseURL = getBaseURL(rt);
  const apiKey = getApiKey(rt);
  if (!baseURL || !apiKey) throw new Error("GAIA_API_BASE / GAIA_API_KEY manquants");
  return axios.create({
    baseURL,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    // pas de timeout custom: on laisse l'API gérer
    timeout: 0
  });
}

/* ----------------------------- Chat ----------------------------- */
async function gaiaChat(rt: IAgentRuntime, p: GenerateTextParams): Promise<string> {
  const client = makeClient(rt);
  const model = getChatModel(rt);

  // Trim pour éviter gros payloads
  const sysRaw = rt.character?.system ?? "";
  const usrRaw = String(p.prompt ?? "");
  const sys = sysRaw.slice(0, 4000);
  const usr = usrRaw.slice(0, 8000);

  const body = {
    model,
    messages: [
      ...(sys ? [{ role: "system", content: sys }] : []),
      { role: "user", content: usr }
    ],
    temperature: p.temperature ?? 0.7,
    max_tokens: Math.min(p.maxTokens ?? 256, 512),
    top_p: 1,
    stream: false
  };

  const payloadSize = JSON.stringify(body).length;
  logger.log(
    { url: "/chat/completions", model, sysLen: sys.length, userLen: usr.length, payloadSize },
    "[GAIA] chat request"
  );

  try {
    const r = await client.post("/chat/completions", body);
    const data = r.data;
    const text =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.delta?.content ??
      "";
    logger.log({ length: (text ?? "").length }, "[GAIA] chat response");
    return String(text ?? "");
  } catch (e) {
    const err = e as AxiosError;
    const status = err.response?.status ?? "network";
    const bodyPreview = sliceJSON(err.response?.data);
    logger.error({ status, body: bodyPreview }, "[GAIA] chat error");
    throw new Error(`Gaia chat failed (${status})`);
  }
}

/* --------------------------- Embeddings -------------------------- */
async function gaiaEmbed(
  rt: IAgentRuntime,
  text: string,
  dims: number
): Promise<number[]> {
  if (embeddingsDisabled(rt)) {
    logger.log({ dims }, "[GAIA] embeddings disabled -> returning zero vector");
    return zeroVector(dims);
  }
  const client = makeClient(rt);
  const model = getEmbModel(rt);
  if (!text?.trim()) return zeroVector(dims);

  logger.log({ url: "/embeddings", model, textLen: text.length }, "[GAIA] embedding request");
  try {
    const r = await client.post("/embeddings", {
      model,
      input: text,
      encoding_format: "float"
    });
    const vec: number[] = r.data?.data?.[0]?.embedding ?? [];
    logger.log({ length: vec.length }, "[GAIA] embedding response");
    return Array.isArray(vec) && vec.length ? vec : zeroVector(dims);
  } catch (e) {
    const err = e as AxiosError;
    const status = err.response?.status ?? "network";
    const bodyPreview = sliceJSON(err.response?.data);
    logger.error({ status, body: bodyPreview }, "[GAIA] embedding error");
    return zeroVector(dims);
  }
}

/* ----------------------------- Plugin ---------------------------- */
export const gaiaPlugin: Plugin = {
  name: "gaia",
  description: "GaiaNet plugin (OpenAI-compatible, minimal, axios)",
  config: {
    GAIA_API_KEY: process.env.GAIA_API_KEY,
    GAIA_API_BASE: process.env.GAIA_API_BASE,
    GAIA_MODEL: process.env.GAIA_MODEL,
    GAIA_EMBEDDING_MODEL: process.env.GAIA_EMBEDDING_MODEL,
    DISABLE_EMBEDDINGS: process.env.DISABLE_EMBEDDINGS
  },

  async init(_config, runtime) {
    const base = getBaseURL(runtime);
    const key = getApiKey(runtime);
    const model = getChatModel(runtime);

    logger.log({ base, keySet: !!key, model }, "[GAIA] models-style plugin active (axios)");

    if (!base || !key) {
      logger.warn("GAIA_API_BASE/GAIA_API_KEY absents — les modèles ne seront pas utilisables");
      return;
    }
    try {
      const client = makeClient(runtime);
      const r = await client.get("/models");
      if (!r || r.status < 200 || r.status >= 300) {
        logger.warn(`Gaia validation failed: ${r?.status}`);
      } else {
        logger.log("[GAIA] API key validated");
      }
    } catch (e) {
      const err = e as AxiosError;
      logger.warn(`[GAIA] Validation request error: ${err.message}`);
    }
  },

  models: {
    [ModelType.TEXT_SMALL]: async (runtime, p: GenerateTextParams) => gaiaChat(runtime, p),
    [ModelType.TEXT_LARGE]: async (runtime, p: GenerateTextParams) => gaiaChat(runtime, p),
    [ModelType.TEXT_EMBEDDING]: async (runtime, params: TextEmbeddingParams | string | null) => {
      const rawDims =
        runtime.getSetting("OPENAI_EMBEDDING_DIMENSIONS") ??
        process.env.OPENAI_EMBEDDING_DIMENSIONS ??
        "1536";
      const parsed = Number.parseInt(String(rawDims), 10);
      const dims = Number.isFinite(parsed) && parsed > 0 ? parsed : 1536;

      const text = typeof params === "string" ? params : (params?.text ?? "");
      return gaiaEmbed(runtime, text, dims);
    }
  }
};

export default gaiaPlugin;
