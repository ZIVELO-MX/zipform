const DEFAULT_URL = "https://zipform.zivelo.dev";
const DEFAULT_MISSION_ID = "620ac6cc-60c4-43a3-b227-1b384e7311fb";

export function percentile(values, rank = 0.95) {
  if (!values.length) throw new Error("No latency samples were collected");
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(sorted.length * rank) - 1];
}

function serverTimingDuration(value) {
  const match = value?.match(/(?:^|,)\s*openapi;dur=([0-9.]+)/);
  return match ? Number(match[1]) : null;
}

async function requestOpenApi(url, headers, fetchImpl = fetch) {
  const started = performance.now();
  const response = await fetchImpl(`${url}/api/openapi`, { headers: { ...headers, Accept: "application/yaml" } });
  const body = await response.text();
  if (!response.ok) throw new Error(`OpenAPI returned HTTP ${response.status}`);
  if (!response.headers.get("content-type")?.includes("yaml")) throw new Error("OpenAPI did not return YAML");
  if (!body.startsWith("openapi:")) throw new Error("OpenAPI response is not YAML");
  const serverDuration = serverTimingDuration(response.headers.get("server-timing"));
  return { wallDuration: performance.now() - started, serverDuration };
}

export async function verifyOpenApiDeployment({
  url = DEFAULT_URL,
  bypassSecret,
  zipformToken,
  missionId = DEFAULT_MISSION_ID,
  sampleCount = 20,
  fetchImpl = fetch,
} = {}) {
  if (!bypassSecret) throw new Error("VERCEL_AUTOMATION_BYPASS_SECRET is required");
  if (!zipformToken) throw new Error("ZIPFORM_TOKEN is required");

  const headers = {
    "x-vercel-protection-bypass": bypassSecret,
    Authorization: `Bearer ${zipformToken}`,
  };
  const wallDurations = [];
  const serverDurations = [];
  let missingServerTiming = false;
  for (let index = 0; index < sampleCount; index += 1) {
    const sample = await requestOpenApi(url, headers, fetchImpl);
    wallDurations.push(sample.wallDuration);
    if (sample.serverDuration === null) {
      missingServerTiming = true;
    } else {
      serverDurations.push(sample.serverDuration);
    }
  }

  const missionResponse = await fetchImpl(`${url}/api/v1/missions/${missionId}`, { headers });
  const missionBody = await missionResponse.json().catch(() => null);
  const mission = missionBody?.data;
  if (!missionResponse.ok || !mission) throw new Error(`TLO-0004 verification returned HTTP ${missionResponse.status}`);
  if (mission.displayId !== "TLO-0004" || mission.status !== "completed" || mission.progress !== 100 || mission.checklistCount !== 18 || mission.completed !== 18) {
    throw new Error("TLO-0004 deployed state does not match the completed mission contract");
  }

  const warnings = [];
  const serverP95 = serverDurations.length ? percentile(serverDurations) : null;
  const wallP95 = percentile(wallDurations);
  if (missingServerTiming) warnings.push("OpenAPI response is missing Server-Timing");
  if (serverP95 !== null && serverP95 > 500) {
    warnings.push(`OpenAPI Server-Timing p95 ${serverP95.toFixed(2)} ms exceeds 500 ms`);
  }
  return { sampleCount, serverP95, wallP95, warnings, mission: { displayId: mission.displayId, status: mission.status, progress: mission.progress } };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  verifyOpenApiDeployment({
    url: process.env.OPENAPI_VERIFY_URL ?? DEFAULT_URL,
    bypassSecret: process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
    zipformToken: process.env.ZIPFORM_TOKEN,
  }).then((result) => {
    for (const warning of result.warnings) console.log(`::warning::${warning}`);
    console.log(JSON.stringify(result, null, 2));
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
