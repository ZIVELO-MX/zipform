#!/usr/bin/env node

import { readFileSync } from "node:fs";

export const PRODUCTION_ORIGIN = "https://zipform.zivelo.dev";
const ALLOWED_METHODS = new Set(["GET", "POST", "PATCH", "PUT", "DELETE"]);

export function parseArgs(args) {
  if (args.includes("--help") || args.includes("-h")) return { help: true };
  const path = args[0];
  const method = (args[1] ?? "GET").toUpperCase();
  const dataIndex = args.indexOf("--data-file");
  const dataFile = dataIndex === -1 ? null : args[dataIndex + 1];
  if (!path || !path.startsWith("/api/") || !ALLOWED_METHODS.has(method) || (dataIndex !== -1 && !dataFile)) {
    throw new Error("Uso: tloz-api /api/v1/projects [GET] [--data-file payload.json]");
  }
  return { path, method, dataFile };
}

export function help() {
  return "Uso: tloz-api /api/v1/projects [GET] [--data-file payload.json]";
}

export async function run(args, { token = process.env.ZIPFORM_TOKEN, fetchImpl = fetch, readFile = readFileSync, write = console.log, error = console.error } = {}) {
  let options;
  try {
    options = parseArgs(args);
  } catch (cause) {
    error(cause.message);
    return 2;
  }
  if (options.help) {
    write(help());
    return 0;
  }
  if (!token) {
    error("ZIPFORM_TOKEN no está configurado; no se imprimirá ni se solicitará el token.");
    return 2;
  }

  let body;
  if (options.dataFile) {
    try {
      body = readFile(options.dataFile, "utf8");
      JSON.parse(body);
    } catch (cause) {
      error(`Payload JSON inválido o ilegible: ${options.dataFile}`, cause instanceof Error ? cause.message : cause);
      return 2;
    }
  }

  const url = new URL(options.path, PRODUCTION_ORIGIN);
  try {
    const response = await fetchImpl(url, {
      method: options.method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body } : {}),
    });
    const responseBody = await response.text();
    if (!response.ok) {
      error(`API respondió HTTP ${response.status}: ${responseBody.slice(0, 500)}`);
      return 1;
    }
    write(responseBody);
    return 0;
  } catch (cause) {
    error(`No se pudo consultar ${url}:`, cause instanceof Error ? cause.message : cause);
    return 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = await run(process.argv.slice(2));
}
