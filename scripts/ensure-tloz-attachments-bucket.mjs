export const TLOZ_ATTACHMENTS_BUCKET = "tloz-attachments";
export const TLOZ_ATTACHMENTS_BUCKET_CONFIG = {
  public: false,
  file_size_limit: 6 * 1024 * 1024,
  allowed_mime_types: ["image/png", "image/jpeg", "image/webp"],
};

function configFrom(env) {
  const baseUrl = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceRoleKey) throw new Error("SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos.");
  return { baseUrl: baseUrl.replace(/\/$/, ""), serviceRoleKey };
}

async function request(fetchImpl, baseUrl, serviceRoleKey, path, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${serviceRoleKey}`);
  headers.set("apikey", serviceRoleKey);
  headers.set("Accept", "application/json");
  const response = await fetchImpl(`${baseUrl}/storage/v1${path}`, { ...init, headers });
  return response;
}

export async function ensureTlozAttachmentsBucket({ env = process.env, fetchImpl = fetch } = {}) {
  const { baseUrl, serviceRoleKey } = configFrom(env);
  const bucketPath = `/bucket/${TLOZ_ATTACHMENTS_BUCKET}`;
  const currentResponse = await request(fetchImpl, baseUrl, serviceRoleKey, bucketPath);
  let created = false;
  if (currentResponse.status === 404) {
    const createResponse = await request(fetchImpl, baseUrl, serviceRoleKey, "/bucket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: TLOZ_ATTACHMENTS_BUCKET, name: TLOZ_ATTACHMENTS_BUCKET, ...TLOZ_ATTACHMENTS_BUCKET_CONFIG }),
    });
    if (!createResponse.ok && createResponse.status !== 409) throw new Error(`No se pudo crear el bucket (HTTP ${createResponse.status}).`);
    created = createResponse.status !== 409;
  } else if (!currentResponse.ok) {
    throw new Error(`No se pudo consultar el bucket (HTTP ${currentResponse.status}).`);
  }

  const updateResponse = await request(fetchImpl, baseUrl, serviceRoleKey, bucketPath, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(TLOZ_ATTACHMENTS_BUCKET_CONFIG),
  });
  if (!updateResponse.ok) throw new Error(`No se pudieron validar las restricciones del bucket (HTTP ${updateResponse.status}).`);
  return { bucket: TLOZ_ATTACHMENTS_BUCKET, created, ...TLOZ_ATTACHMENTS_BUCKET_CONFIG };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await ensureTlozAttachmentsBucket();
  console.log(JSON.stringify(result));
}
