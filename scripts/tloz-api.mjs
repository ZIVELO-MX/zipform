import { readFileSync } from "node:fs";

const PRODUCTION_ORIGIN = "https://zipform.zivelo.dev";
const args = process.argv.slice(2);
const path = args[0];
const method = (args[1] ?? "GET").toUpperCase();
const dataIndex = args.indexOf("--data-file");
const dataFile = dataIndex === -1 ? null : args[dataIndex + 1];
const allowedMethods = new Set(["GET", "POST", "PATCH", "PUT", "DELETE"]);

if (!path || !path.startsWith("/api/") || !allowedMethods.has(method) || (dataIndex !== -1 && !dataFile)) {
  console.error("Uso: pnpm tloz:api /api/v1/projects [GET] [--data-file payload.json]");
  process.exitCode = 2;
} else if (!process.env.ZIPFORM_TOKEN) {
  console.error("ZIPFORM_TOKEN no está configurado; no se imprimirá ni se solicitará el token.");
  process.exitCode = 2;
} else {
  const url = new URL(path, PRODUCTION_ORIGIN);
  let body;
  if (dataFile) {
    try {
      body = readFileSync(dataFile, "utf8");
      JSON.parse(body);
    } catch (cause) {
      console.error(`Payload JSON inválido o ilegible: ${dataFile}`, cause instanceof Error ? cause.message : cause);
      process.exitCode = 2;
    }
  }
  if (process.exitCode !== 2) {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${process.env.ZIPFORM_TOKEN}`,
          Accept: "application/json",
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { body } : {}),
      });
      const responseBody = await response.text();
      if (!response.ok) {
        console.error(`API respondió HTTP ${response.status}: ${responseBody.slice(0, 500)}`);
        process.exitCode = 1;
      } else {
        console.log(responseBody);
      }
    } catch (cause) {
      console.error(`No se pudo consultar ${url}:`, cause instanceof Error ? cause.message : cause);
      process.exitCode = 1;
    }
  }
}
