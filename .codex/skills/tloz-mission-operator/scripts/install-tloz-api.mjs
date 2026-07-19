#!/usr/bin/env node

import { chmod, copyFile, mkdir, readFile, rename } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const skillDir = dirname(fileURLToPath(import.meta.url));
const source = join(skillDir, "tloz-api.mjs");
const defaultBinDir = join(process.env.HOME ?? process.env.USERPROFILE ?? ".", ".local", "bin");

function binDir(args) {
  const index = args.indexOf("--bin-dir");
  if (index === -1) return defaultBinDir;
  if (!args[index + 1]) throw new Error("Uso: install-tloz-api [--bin-dir directorio]");
  return resolve(args[index + 1]);
}

export async function install(args = process.argv.slice(2)) {
  const target = join(binDir(args), "tloz-api");
  await mkdir(dirname(target), { recursive: true });
  try {
    const existing = await readFile(target, "utf8");
    const bundled = await readFile(source, "utf8");
    if (!existing.startsWith("#!/usr/bin/env node\n") || !existing.includes('PRODUCTION_ORIGIN = "https://zipform.zivelo.dev"')) {
      throw new Error(`El destino ya existe y no parece ser tloz-api: ${target}`);
    }
    if (existing === bundled) return target;
  } catch (cause) {
    if (cause?.code !== "ENOENT") throw cause;
  }
  const temporary = `${target}.tmp-${process.pid}`;
  await copyFile(source, temporary);
  await chmod(temporary, 0o755);
  await rename(temporary, target);
  return target;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const target = await install();
    console.log(`Instalado tloz-api en ${target}`);
  } catch (cause) {
    console.error(`No se pudo instalar tloz-api: ${cause instanceof Error ? cause.message : cause}`);
    process.exitCode = 1;
  }
}
