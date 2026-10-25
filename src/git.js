/**
 * git.js - Lectura de información de git usando child_process (sin dependencias).
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * Ejecuta un comando git y devuelve stdout.
 * @param {string[]} args
 * @param {object} [opts]
 * @param {string} [opts.cwd]
 * @returns {Promise<string>}
 */
export async function git(args, opts = {}) {
  const { stdout } = await execFileAsync("git", args, {
    cwd: opts.cwd,
    maxBuffer: 32 * 1024 * 1024,
  });
  return stdout;
}

/** Comprueba si estamos dentro de un repo git. */
export async function isRepo(cwd) {
  try {
    const out = await git(["rev-parse", "--is-inside-work-tree"], { cwd });
    return out.trim() === "true";
  } catch {
    return false;
  }
}

/**
 * Diff de cambios (staged por defecto).
 * @param {object} [opts]
 * @param {boolean} [opts.staged]
 * @param {string} [opts.cwd]
 * @returns {Promise<string>}
 */
export async function getDiff(opts = {}) {
  const { staged = true, cwd } = opts;
  const args = staged
    ? ["diff", "--staged"]
    : ["diff"];
  let diff = await git(args, { cwd });

  // Si no hay nada staged, prueba con unstaged
  if (!diff.trim() && staged) {
    diff = await git(["diff"], { cwd });
  }
  return diff;
}

/** Lista de archivos con cambios staged. */
export async function getStagedFiles(cwd) {
  const out = await git(["diff", "--staged", "--name-only"], { cwd });
  return out.split("\n").map((s) => s.trim()).filter(Boolean);
}

/** Rama actual. */
export async function getBranch(cwd) {
  try {
    const out = await git(["rev-parse", "--abbrev-ref", "HEAD"], { cwd });
    return out.trim();
  } catch {
    return "";
  }
}

/**
 * Lista los últimos mensajes de commit (para changelog).
 * @param {object} [opts]
 * @param {string} [opts.range] ej: "v1.0.0..HEAD"
 * @param {number} [opts.limit]
 * @param {string} [opts.cwd]
 * @returns {Promise<string[]>}
 */
export async function getCommitLog(opts = {}) {
  const { range, limit = 50, cwd } = opts;
  const args = ["log", "--pretty=format:%s", `-n`, String(limit)];
  if (range) args.push(range);
  const out = await git(args, { cwd });
  return out.split("\n").map((s) => s.trim()).filter(Boolean);
}
