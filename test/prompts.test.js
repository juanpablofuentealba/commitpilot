/**
 * Tests sin red para prompts y parser.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildCommitMessages,
  buildChangelog,
  buildPullRequest,
  parseCommitMessages,
  truncateDiff,
  MAX_DIFF_CHARS,
} from "../src/prompts.js";

test("buildCommitMessages devuelve system+user", () => {
  const msgs = buildCommitMessages("diff --git a/x b/x", {});
  assert.equal(msgs.length, 2);
  assert.equal(msgs[0].role, "system");
  assert.equal(msgs[1].role, "user");
  assert.match(msgs[1].content, /diff --git/);
});

test("buildCommitMessages usa ingles con locale=en", () => {
  const msgs = buildCommitMessages("x", { locale: "en" });
  assert.match(msgs[0].content, /inglés/);
});

test("buildChangelog incluye commits", () => {
  const msgs = buildChangelog(["feat: a", "fix: b"], { version: "1.2.0" });
  assert.match(msgs[1].content, /feat: a/);
  assert.match(msgs[1].content, /1\.2\.0/);
});

test("buildPullRequest incluye la rama", () => {
  const msgs = buildPullRequest("diff", { branch: "feature/x" });
  assert.match(msgs[1].content, /feature\/x/);
});

test("truncateDiff no toca diffs cortos", () => {
  assert.equal(truncateDiff("abc"), "abc");
});

test("truncateDiff recorta diffs largos", () => {
  const long = "a".repeat(MAX_DIFF_CHARS + 500);
  const out = truncateDiff(long);
  assert.ok(out.length < long.length);
  assert.match(out, /truncado/);
});

test("parseCommitMessages parsea JSON limpio", () => {
  const out = parseCommitMessages('{"messages":["feat: uno","fix: dos"]}');
  assert.deepEqual(out, ["feat: uno", "fix: dos"]);
});

test("parseCommitMessages tolera code fences", () => {
  const out = parseCommitMessages('```json\n{"messages":["chore: x"]}\n```');
  assert.deepEqual(out, ["chore: x"]);
});

test("parseCommitMessages tolera array directo", () => {
  const out = parseCommitMessages('["a","b"]');
  assert.deepEqual(out, ["a", "b"]);
});

test("parseCommitMessages fallback a lineas", () => {
  const out = parseCommitMessages("1. feat: uno\n2. fix: dos");
  assert.equal(out.length >= 2, true);
});

test("parseCommitMessages no explota con vacio", () => {
  assert.deepEqual(parseCommitMessages(""), []);
});
