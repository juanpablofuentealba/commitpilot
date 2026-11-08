/**
 * Tests sin red para la resolución de la URL base.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveBaseUrl } from "../src/openrouter.js";

test("resolveBaseUrl usa OpenRouter por defecto", () => {
  const prev = process.env.COMMITPILOT_BASE_URL;
  delete process.env.COMMITPILOT_BASE_URL;
  assert.equal(resolveBaseUrl(), "https://openrouter.ai/api/v1");
  if (prev !== undefined) process.env.COMMITPILOT_BASE_URL = prev;
});

test("resolveBaseUrl respeta COMMITPILOT_BASE_URL y quita la barra final", () => {
  const prev = process.env.COMMITPILOT_BASE_URL;
  process.env.COMMITPILOT_BASE_URL = "https://api.demonroute.com/v1/";
  assert.equal(resolveBaseUrl(), "https://api.demonroute.com/v1");
  if (prev === undefined) delete process.env.COMMITPILOT_BASE_URL;
  else process.env.COMMITPILOT_BASE_URL = prev;
});

test("resolveBaseUrl prioriza el valor explícito", () => {
  assert.equal(
    resolveBaseUrl("http://localhost:4000/v1"),
    "http://localhost:4000/v1"
  );
});
