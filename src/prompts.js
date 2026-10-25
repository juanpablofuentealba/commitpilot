/**
 * prompts.js - Construcción de prompts para las distintas tareas.
 * Separado a propósito para poder testear sin red.
 */

/** Limita el tamaño del diff para no gastar tokens de más. */
export const MAX_DIFF_CHARS = 12000;

/**
 * Recorta un diff largo conservando el inicio (donde suele estar el contexto).
 * @param {string} diff
 * @param {number} [max]
 * @returns {string}
 */
export function truncateDiff(diff, max = MAX_DIFF_CHARS) {
  if (typeof diff !== "string") return "";
  if (diff.length <= max) return diff;
  const head = diff.slice(0, max);
  return `${head}\n\n... [diff truncado: ${diff.length - max} caracteres omitidos] ...`;
}

/**
 * Prompt para un mensaje de commit (Conventional Commits).
 * @param {string} diff
 * @param {object} [opts]
 * @param {boolean} [opts.conventional]
 * @param {string} [opts.locale] "es" | "en"
 * @param {string} [opts.hint]
 * @returns {Array<{role:string,content:string}>}
 */
export function buildCommitMessages(diff, opts = {}) {
  const { conventional = true, locale = "es", hint = "" } = opts;
  const style = conventional
    ? "Usa el formato Conventional Commits: tipo(scope): descripción (feat, fix, docs, refactor, test, chore, perf, build, ci)."
    : "Usa un estilo claro y conciso, sin prefijos de tipo.";

  const lang = locale === "en" ? "inglés" : "español";

  const system = [
    "Eres un experto en control de versiones y buenas prácticas de commits.",
    "A partir de un diff de git, escribes mensajes de commit precisos y útiles.",
    style,
    `Escribe en ${lang}.`,
    "Devuelve SOLO un objeto JSON con esta forma exacta:",
    '{"messages":["primer mensaje","alternativa 2","alternativa 3"]}',
    "Sin markdown, sin explicaciones, sin texto fuera del JSON.",
  ].join(" ");

  const user = [
    hint ? `Contexto adicional del desarrollador: ${hint}` : "",
    "Diff:",
    "```diff",
    truncateDiff(diff),
    "```",
  ]
    .filter(Boolean)
    .join("\n");

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

/**
 * Prompt para changelog a partir de una lista de mensajes de commit.
 * @param {string[]} commits
 * @param {object} [opts]
 * @param {string} [opts.version]
 * @param {string} [opts.locale]
 * @returns {Array<{role:string,content:string}>}
 */
export function buildChangelog(commits = [], opts = {}) {
  const { version = "unreleased", locale = "es" } = opts;
  const lang = locale === "en" ? "English" : "español";

  const system = [
    "Eres un experto redactando changelogs siguiendo Keep a Changelog.",
    "Agrupa los cambios en: Añadido, Cambiado, Corregido, Eliminado.",
    `Escribe en ${lang}. Devuelve SOLO el markdown del changelog, sin texto extra.`,
  ].join(" ");

  const user = [
    `Versión: ${version}`,
    "Mensajes de commit:",
    ...commits.map((c) => `- ${c}`),
  ].join("\n");

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

/**
 * Prompt para descripción de Pull Request.
 * @param {string} diff
 * @param {object} [opts]
 * @param {string} [opts.branch]
 * @param {string} [opts.locale]
 * @returns {Array<{role:string,content:string}>}
 */
export function buildPullRequest(diff, opts = {}) {
  const { branch = "", locale = "es" } = opts;
  const lang = locale === "en" ? "English" : "español";

  const system = [
    "Eres un ingeniero de software senior que redacta descripciones de Pull Request.",
    "Incluye: Resumen, Cambios principales, Cómo probar, Notas.",
    `Escribe en ${lang}. Devuelve SOLO markdown.`,
  ].join(" ");

  const user = [
    branch ? `Rama: ${branch}` : "",
    "Diff:",
    "```diff",
    truncateDiff(diff),
    "```",
  ]
    .filter(Boolean)
    .join("\n");

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

/**
 * Extrae un array de mensajes desde la respuesta del modelo.
 * Tolerante a JSON imperfecto (code fences, texto alrededor).
 * @param {string} content
 * @returns {string[]}
 */
export function parseCommitMessages(content) {
  let text = String(content || "").trim();
  // Quita code fences si los hubiera
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  try {
    const data = JSON.parse(text);
    const arr = Array.isArray(data) ? data : data?.messages;
    if (Array.isArray(arr)) {
      return arr.map((s) => String(s).trim()).filter(Boolean);
    }
  } catch {
    /* fallback abajo */
  }

  // Fallback: buscar el primer bloque JSON en el texto
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const data = JSON.parse(match[0]);
      const arr = Array.isArray(data) ? data : data?.messages;
      if (Array.isArray(arr)) {
        return arr.map((s) => String(s).trim()).filter(Boolean);
      }
    } catch {
      /* ignora */
    }
  }

  // Último recurso: líneas no vacías
  return text
    .split("\n")
    .map((l) => l.replace(/^[-*\d.]+\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 3);
}
