#!/usr/bin/env node
/**
 * commitpilot - CLI para generar mensajes de commit, changelogs y PRs con IA.
 *
 * BYOK: usa la variable de entorno OPENROUTER_API_KEY (o COMMITPILOT_API_KEY).
 */

import { readFile } from "node:fs/promises";
import process from "node:process";
import {
  generateCommitMessages,
  generateChangelog,
  generatePullRequest,
  git as gitLib,
  DEFAULT_MODEL,
} from "../src/index.js";

const { git, getBranch, getCommitLog } = gitLib;

const VERSION = "0.1.0";

const HELP = `commitpilot v${VERSION} — IA para tus commits (open-source, BYOK)

USO:
  commitpilot commit [opciones]        Genera mensajes de commit desde el diff staged
  commitpilot changelog [opciones]     Genera un changelog desde el historial
  commitpilot pr [opciones]            Genera la descripción de un Pull Request
  commitpilot install-hook             Instala un git hook prepare-commit-msg
  commitpilot help                     Muestra esta ayuda

OPCIONES COMUNES:
  --model <id>        Modelo de OpenRouter (por defecto: ${DEFAULT_MODEL})
  --lang <es|en>      Idioma de salida (por defecto: es)
  --no-conventional   Sin prefijos tipo feat/fix
  --hint "..."        Contexto extra para la IA
  --range <a..b>      Rango de commits para changelog (por defecto: últimos 50)
  --json              Salida JSON (para scripts)
  --apply             (commit) Hace el commit con el primer mensaje generado
  --yes               No pedir confirmación con --apply

ENTORNO:
  OPENROUTER_API_KEY   Tu clave de OpenRouter (obligatoria)
  COMMITPILOT_MODEL    Modelo por defecto (opcional)

EJEMPLOS:
  git add .
  commitpilot commit
  commitpilot commit --apply --yes
  commitpilot changelog --range v0.1.0..HEAD > CHANGELOG.md
  commitpilot pr > pr.md
`;

/**
 * Parser mínimo de argumentos (sin dependencias).
 * @param {string[]} argv
 */
function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--no-conventional") {
      out.conventional = false;
    } else if (a === "--json") {
      out.json = true;
    } else if (a === "--apply") {
      out.apply = true;
    } else if (a === "--yes" || a === "-y") {
      out.yes = true;
    } else if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1];
      if (val === undefined || val.startsWith("--")) {
        out[key] = true;
      } else {
        out[key] = val;
        i++;
      }
    } else {
      out._.push(a);
    }
  }
  return out;
}

function readStdin() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) return resolve("");
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", () => resolve(data));
  });
}

function fmtUsage(usage) {
  if (!usage || (!usage.total_tokens && !usage.prompt_tokens)) return "";
  return ` [tokens: ${usage.total_tokens ?? "?"}]`;
}

async function cmdCommit(args) {
  let diff = await readStdin();

  if (!diff.trim()) {
    diff = await git(["diff", "--staged"]).catch(() => "");
    if (!diff.trim()) diff = await git(["diff"]).catch(() => "");
  }

  if (!diff.trim()) {
    console.error("No hay cambios que analizar. Usa `git add` o pasa un diff por stdin.");
    process.exit(1);
  }

  const res = await generateCommitMessages(diff, {
    model: args.model || process.env.COMMITPILOT_MODEL,
    locale: args.lang === "en" ? "en" : "es",
    conventional: args.conventional !== false,
    hint: typeof args.hint === "string" ? args.hint : "",
  });

  if (args.json) {
    console.log(JSON.stringify(res, null, 2));
    return;
  }

  console.log(`\nPropuestas de mensaje de commit (${res.model}${fmtUsage(res.usage)}):\n`);
  res.messages.forEach((m, i) => console.log(`  ${i + 1}. ${m}`));

  if (args.apply && res.messages.length) {
    const msg = res.messages[0];
    if (!args.yes && process.stdin.isTTY) {
      // sin confirmación interactiva compleja: avisa
      console.log(`\nUsa --yes para confirmar: se hará commit con: "${msg}"`);
      return;
    }
    await git(["commit", "-m", msg]);
    console.log(`\n✅ Commit creado: ${msg}`);
  }
}

async function cmdChangelog(args) {
  const commits = await getCommitLog({
    range: typeof args.range === "string" ? args.range : undefined,
    limit: 50,
  }).catch(() => []);

  if (!commits.length) {
    console.error("No hay commits en el rango indicado.");
    process.exit(1);
  }

  const res = await generateChangelog(commits, {
    model: args.model || process.env.COMMITPILOT_MODEL,
    locale: args.lang === "en" ? "en" : "es",
    version: typeof args.version === "string" ? args.version : "unreleased",
  });

  if (args.json) {
    console.log(JSON.stringify(res, null, 2));
    return;
  }
  console.log(res.content);
}

async function cmdPr(args) {
  const branch = await getBranch().catch(() => "");
  const base = typeof args.base === "string" ? args.base : "main";
  const diff = await git(["diff", `${base}...HEAD`]).catch(() => "");
  const finalDiff = diff.trim() ? diff : await git(["diff"]).catch(() => "");

  if (!finalDiff.trim()) {
    console.error(`No hay diff contra '${base}'.`);
    process.exit(1);
  }

  const res = await generatePullRequest(finalDiff, {
    model: args.model || process.env.COMMITPILOT_MODEL,
    locale: args.lang === "en" ? "en" : "es",
    branch,
  });

  if (args.json) {
    console.log(JSON.stringify(res, null, 2));
    return;
  }
  console.log(res.content);
}

async function cmdInstallHook() {
  const hookPath = ".git/hooks/prepare-commit-msg";
  const script = `#!/bin/sh
# Instalado por commitpilot. Genera un mensaje de commit con IA si está vacío.
if [ -z "$2" ]; then
  msg=$(git diff --cached | commitpilot commit --json 2>/dev/null | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const j=JSON.parse(d);console.log(j.messages[0]||'')}catch(e){}})")
  if [ -n "$msg" ]; then echo "$msg" > "$1"; fi
fi
`;
  const { writeFile, chmod } = await import("node:fs/promises");
  await writeFile(hookPath, script, "utf8");
  await chmod(hookPath, 0o755);
  console.log(`✅ Hook instalado en ${hookPath}`);
}

async function main() {
  const [, , cmd, ...rest] = process.argv;
  const args = parseArgs(rest);

  try {
    switch (cmd) {
      case "commit":
        return await cmdCommit(args);
      case "changelog":
        return await cmdChangelog(args);
      case "pr":
        return await cmdPr(args);
      case "install-hook":
        return await cmdInstallHook();
      case "version":
      case "--version":
      case "-v":
        console.log(VERSION);
        return;
      case undefined:
      case "help":
      case "--help":
      case "-h":
        console.log(HELP);
        return;
      default:
        console.error(`Comando desconocido: ${cmd}\n`);
        console.log(HELP);
        process.exit(1);
    }
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}`);
    process.exit(1);
  }
}

main();
