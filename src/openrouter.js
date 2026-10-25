/**
 * openrouter.js - Cliente mínimo para OpenRouter (BYOK).
 *
 * No incluye claves. Lee la API key del entorno.
 * Sin dependencias externas: usa fetch nativo de Node >=18.
 */

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
export const DEFAULT_MODEL = "deepseek/deepseek-chat-v3-0324";

/**
 * Resuelve la API key desde el entorno.
 * @param {string} [explicit] opcional: clave pasada explícitamente
 * @returns {string}
 */
export function resolveApiKey(explicit) {
  const key =
    explicit ||
    process.env.COMMITPILOT_API_KEY ||
    process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error(
      "Falta la API key de OpenRouter.\n" +
        "Configúrala con:  export OPENROUTER_API_KEY=\"sk-or-...\"\n" +
        "Obtén una gratis en https://openrouter.ai/keys"
    );
  }
  return key;
}

/**
 * Llama a OpenRouter chat/completions.
 * @param {object} opts
 * @param {string} opts.apiKey
 * @param {string} [opts.model]
 * @param {Array<{role:string,content:string}>} opts.messages
 * @param {number} [opts.temperature]
 * @param {number} [opts.maxTokens]
 * @param {string} [opts.baseUrl]
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<{content:string, model:string, usage:object}>}
 */
export async function chat({
  apiKey,
  model = DEFAULT_MODEL,
  messages,
  temperature = 0.2,
  maxTokens = 400,
  baseUrl = DEFAULT_BASE_URL,
  signal,
}) {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // Identificación recomendada por OpenRouter (opcional)
      "HTTP-Referer": "https://github.com/juanpablofuentealba/commitpilot",
      "X-Title": "CommitPilot",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `OpenRouter respondió ${res.status} ${res.statusText}: ${text.slice(0, 500)}`
    );
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error(
      "Respuesta vacía o inesperada de OpenRouter: " +
        JSON.stringify(data).slice(0, 500)
    );
  }

  return {
    content: content.trim(),
    model: data?.model || model,
    usage: data?.usage || {},
  };
}
