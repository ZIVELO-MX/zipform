# Authentication

## Configure the token

Use `ZIPFORM_TOKEN` in the environment that launches the agent.

For Bash, Zsh, macOS, Linux, or WSL:

```bash
export ZIPFORM_TOKEN="zaf_REPLACE_WITH_TOKEN"
codex
```

For PowerShell:

```powershell
$env:ZIPFORM_TOKEN = "zaf_REPLACE_WITH_TOKEN"
codex
```

For CMD:

```cmd
set ZIPFORM_TOKEN=zaf_REPLACE_WITH_TOKEN
codex
```

Graphical applications may not inherit variables from a terminal. Launch VS Code from the configured shell or restart the relevant process.

## Validate safely

Never print the token. In a Unix-like shell:

```bash
if [ -z "$ZIPFORM_TOKEN" ]; then
  echo "ZIPFORM_TOKEN is not configured"
  exit 1
fi
echo "ZIPFORM_TOKEN is configured"
```

Use these headers for authenticated JSON requests:

```bash
curl --fail-with-body --silent --show-error \
  -H "Authorization: Bearer $ZIPFORM_TOKEN" \
  -H "Content-Type: application/json" \
  "https://zipform.zivelo.dev/api/v1/projects"
```

## Diagnose failures

- `401`: inspect the response before distinguishing missing, invalid, expired, or revoked credentials. Do not repeatedly retry the same key.
- `403`: stop; do not bypass authorization.
- `404`: check the base URL, endpoint, and internal resource ID.
- `400` or `422`: inspect `error.fields` and the current OpenAPI schema.
- `500`: do not claim success; GET the affected resource when safe.

If a key was lost or revoked, create a replacement through `POST /api/v1/agents/{agentId}/api-keys`. Raw keys are returned only once. Revoke keys through `DELETE /api/v1/agents/{agentId}/api-keys/{keyId}`.
