/**
 * index.js - API pública de CommitPilot (BYOK).
 *
 * Uso:
 *   import { generateCommitMessages } from "commitpilot";
 *   const msgs = await generateCommitMessages(diff, { apiKey, model });
 */

import {
  chat,
  resolveApiKey,
  DEFAULT_MODEL,
} from "./openrouter.js";
import {
  buildCommitMessages,
  buildChangelog,
  buildPullRequest,
  parseCommitMessages,
} from "./prompts.js";

export { DEFAULT_MODEL, resolveApiKey } from "./openrouter.js";
export { parseCommitMessages } from "./prompts.js";
export * as git from "./git.js";

/**
 * Genera alternativas de mensaje de commit.
 * @param {string} diff
 * @param {object} [opts]
 * @returns {Promise<{messages:string[], model:string, usage:object}>}
 */
export async function generateCommitMessages(diff, opts = {}) {
  const apiKey = resolveApiKey(opts.apiKey);
  const messages = buildCommitMessages(diff, opts);
  const res = await chat({
    apiKey,
    model: opts.model || DEFAULT_MODEL,
    messages,
    temperature: opts.temperature ?? 0.2,
    maxTokens: opts.maxTokens ?? 300,
    signal: opts.signal,
  });
  return {
    messages: parseCommitMessages(res.content),
    model: res.model,
    usage: res.usage,
  };
}

/**
 * Genera un changelog en markdown.
 * @param {string[]} commits
 * @param {object} [opts]
 * @returns {Promise<{content:string, model:string, usage:object}>}
 */
export async function generateChangelog(commits, opts = {}) {
  const apiKey = resolveApiKey(opts.apiKey);
  const messages = buildChangelog(commits, opts);
  const res = await chat({
    apiKey,
    model: opts.model || DEFAULT_MODEL,
    messages,
    temperature: opts.temperature ?? 0.3,
    maxTokens: opts.maxTokens ?? 1200,
    signal: opts.signal,
  });
  return { content: res.content, model: res.model, usage: res.usage };
}

/**
 * Genera una descripción de Pull Request.
 * @param {string} diff
 * @param {object} [opts]
 * @returns {Promise<{content:string, model:string, usage:object}>}
 */
export async function generatePullRequest(diff, opts = {}) {
  const apiKey = resolveApiKey(opts.apiKey);
  const messages = buildPullRequest(diff, opts);
  const res = await chat({
    apiKey,
    model: opts.model || DEFAULT_MODEL,
    messages,
    temperature: opts.temperature ?? 0.3,
    maxTokens: opts.maxTokens ?? 1000,
    signal: opts.signal,
  });
  return { content: res.content, model: res.model, usage: res.usage };
}
