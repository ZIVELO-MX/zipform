import { performance } from "node:perf_hooks";

const DEFAULT_BASE_URL = "http://127.0.0.1:3100";
const DEFAULT_SAMPLES = 30;
const DEFAULT_CONCURRENCY = 8;

export class ApiLoadError extends Error {
  constructor(message, { cause, url, status } = {}) {
    super(message, { cause });
    this.name = "ApiLoadError";
    this.url = url;
    this.status = status;
  }
}

export function percentile(values, rank = 0.95) {
  if (!values.length) throw new ApiLoadError("No se recopilaron muestras de latencia");
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * rank) - 1)];
}

function headers(token) {
  return token ? { Authorization: `Bearer ${token}`, Accept: "application/json" } : { Accept: "application/json" };
}

async function request(baseUrl, path, token, fetchImpl = fetch) {
  const url = new URL(path, baseUrl).toString();
  const started = performance.now();
  let response;
  try {
    response = await fetchImpl(url, { headers: headers(token) });
  } catch (cause) {
    throw new ApiLoadError(`Falló la red al consultar ${url}`, { cause, url });
  }
  const body = await response.text();
  const duration = performance.now() - started;
  if (!response.ok) {
    throw new ApiLoadError(`La API respondió HTTP ${response.status} en ${url}: ${body.slice(0, 200)}`, { url, status: response.status });
  }
  return { duration, bytes: Buffer.byteLength(body), body };
}

async function jsonRequest(baseUrl, path, token, fetchImpl) {
  const result = await request(baseUrl, path, token, fetchImpl);
  try {
    return { ...result, json: JSON.parse(result.body) };
  } catch (cause) {
    throw new ApiLoadError(`La API devolvió JSON inválido en ${new URL(path, baseUrl)}`, { cause, url: new URL(path, baseUrl).toString() });
  }
}

async function discoverWorkload(baseUrl, token, fetchImpl) {
  const projects = await jsonRequest(baseUrl, "/api/v1/projects?limit=100", token, fetchImpl);
  const missions = await jsonRequest(baseUrl, "/api/v1/missions?limit=100", token, fetchImpl);
  const projectId = projects.json?.data?.[0]?.id;
  const missionId = missions.json?.data?.[0]?.id;
  if (!projectId || !missionId) throw new ApiLoadError("El dataset no contiene un proyecto y una misión para el benchmark");
  return [
    { name: "openapi", path: "/api/openapi" },
    { name: "users-me", path: "/api/v1/users/me" },
    { name: "projects", path: "/api/v1/projects?limit=100" },
    { name: "missions", path: "/api/v1/missions?limit=100" },
    { name: "missions-by-project", path: `/api/v1/missions?projectId=${encodeURIComponent(projectId)}&limit=100` },
    { name: "mission-detail", path: `/api/v1/missions/${encodeURIComponent(missionId)}` },
  ];
}

async function collectEndpoint(baseUrl, endpoint, token, { samples, concurrency, fetchImpl }) {
  const durations = [];
  let bytes = 0;
  let errors = 0;
  let firstError = null;
  await request(baseUrl, endpoint.path, token, fetchImpl);
  let next = 0;
  const started = performance.now();
  async function worker() {
    while (true) {
      const index = next++;
      if (index >= samples) return;
      try {
        const result = await request(baseUrl, endpoint.path, token, fetchImpl);
        durations.push(result.duration);
        bytes += result.bytes;
      } catch (error) {
        errors += 1;
        firstError ??= error instanceof Error ? error.message : String(error);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, samples) }, () => worker()));
  return {
    name: endpoint.name,
    samples,
    concurrency,
    bytes,
    p50: percentile(durations, 0.5),
    p95: percentile(durations, 0.95),
    p99: percentile(durations, 0.99),
    requestsPerSecond: durations.length / ((performance.now() - started) / 1000),
    errors,
    firstError,
  };
}

export async function benchmarkApi({
  baseUrl = DEFAULT_BASE_URL,
  token = process.env.ZIPFORM_LOCAL_API_KEY,
  samples = DEFAULT_SAMPLES,
  concurrency = DEFAULT_CONCURRENCY,
  fetchImpl = fetch,
} = {}) {
  const endpoints = await discoverWorkload(baseUrl, token, fetchImpl);
  const results = [];
  for (const endpoint of endpoints) {
    results.push(await collectEndpoint(baseUrl, endpoint, token, { samples, concurrency, fetchImpl }));
  }
  return { baseUrl, samples, concurrency, endpoints: results };
}

export function compareBenchmarks(baseline, candidate) {
  const baselineByName = new Map(baseline.endpoints.map((item) => [item.name, item]));
  const endpointComparisons = candidate.endpoints.map((item) => {
    const before = baselineByName.get(item.name);
    if (!before) throw new ApiLoadError(`Falta el endpoint ${item.name} en el baseline`);
    return {
      name: item.name,
      p95Change: (item.p95 - before.p95) / before.p95,
      throughputChange: (item.requestsPerSecond - before.requestsPerSecond) / before.requestsPerSecond,
    };
  });
  const candidateHasErrors = candidate.endpoints.some((item) => item.errors > 0);
  const improved = endpointComparisons.some((item) => item.p95Change <= -0.1 || item.throughputChange >= 0.1);
  const regression = candidateHasErrors || endpointComparisons.some((item) => item.p95Change >= 0.15 && item.p95Change * (baselineByName.get(item.name)?.p95 ?? 0) >= 5);
  return { endpointComparisons, verdict: regression ? "regression" : improved ? "improvement" : "inconclusive" };
}

async function main() {
  const args = process.argv.slice(2);
  const compareIndex = args.indexOf("--compare");
  const samples = Number(process.env.API_LOAD_SAMPLES ?? DEFAULT_SAMPLES);
  const concurrency = Number(process.env.API_LOAD_CONCURRENCY ?? DEFAULT_CONCURRENCY);
  if (compareIndex !== -1) {
    const baselineUrl = args[compareIndex + 1];
    const candidateUrl = args[compareIndex + 2];
    if (!baselineUrl || !candidateUrl) throw new ApiLoadError("Uso: pnpm perf:api --compare <baseline-url> <candidate-url>");
    const [baseline, candidate] = await Promise.all([
      benchmarkApi({ baseUrl: baselineUrl, samples, concurrency }),
      benchmarkApi({ baseUrl: candidateUrl, samples, concurrency }),
    ]);
    console.log(JSON.stringify({ baseline, candidate, comparison: compareBenchmarks(baseline, candidate) }, null, 2));
    return;
  }
  console.log(JSON.stringify(await benchmarkApi({ baseUrl: args[0] ?? DEFAULT_BASE_URL, samples, concurrency }), null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof ApiLoadError ? error.message : "Falló el benchmark de la API", error instanceof ApiLoadError ? "" : error);
    process.exitCode = 1;
  });
}
