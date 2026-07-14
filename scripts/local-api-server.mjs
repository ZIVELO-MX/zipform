import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const production = args.includes("--production");
const port = process.env.PORT ?? args.find((arg) => /^\d+$/.test(arg)) ?? "3100";
const localKey = process.env.ZIPFORM_LOCAL_API_KEY ?? "zaf_local_development_only";

const child = spawn(
  "pnpm",
  ["--filter", "@zipform/dashboard", production ? "start" : "dev", "--hostname", "127.0.0.1", "--port", String(port)],
  {
    env: {
      ...process.env,
      NODE_ENV: production ? "production" : "development",
      ZIPFORM_DATA_DRIVER: "mock",
      ZIPFORM_LOCAL_API_MODE: "1",
      ZIPFORM_LOCAL_API_KEY: localKey,
      ZIPFORM_LOCAL_API_USER_ID: process.env.ZIPFORM_LOCAL_API_USER_ID ?? "owner",
    },
    stdio: "inherit",
  },
);

let stopping = false;
function stop(signal) {
  if (stopping) return;
  stopping = true;
  child.kill(signal);
}

process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));
child.on("error", (cause) => {
  console.error(`No se pudo iniciar la API local en el puerto ${port}:`, cause);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  if (!stopping && code) console.error(`La API local terminó con código ${code}${signal ? ` (${signal})` : ""}.`);
  process.exitCode = code ?? (signal ? 1 : 0);
});

console.log(`API local: http://127.0.0.1:${port}`);
console.log(`API key local: ${localKey}`);
