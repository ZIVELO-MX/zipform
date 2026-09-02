# Authentication

## Configure the token

Use `TLOZ_TOKEN` in the environment that launches the agent. For interactive work delegated by a human, prefer a personal key created by that user in Configuración; the API will authenticate the agent as that user. Use an agent-owned key for unattended automation or when an agent identity is explicitly required. `ZIPFORM_TOKEN` remains a one-release compatibility fallback for existing installations.

For Bash, Zsh, macOS, Linux, or WSL:

```bash
export TLOZ_TOKEN="tloz_REPLACE_WITH_TOKEN"
codex
```

For PowerShell:

```powershell
$env:TLOZ_TOKEN = "tloz_REPLACE_WITH_TOKEN"
codex
```

For CMD:

```cmd
set TLOZ_TOKEN=tloz_REPLACE_WITH_TOKEN
codex
```

Graphical applications may not inherit variables from a terminal. Launch VS Code from the configured shell or restart the relevant process.

## Validate safely

Never print the token. In a Unix-like shell:

```bash
if [ -z "$TLOZ_TOKEN" ]; then
  echo "TLOZ_TOKEN is not configured"
  exit 1
fi
echo "TLOZ_TOKEN is configured"
```

Use these headers for authenticated JSON requests:

```bash
curl --fail-with-body --silent --show-error \
  -H "Authorization: Bearer $TLOZ_TOKEN" \
  -H "Content-Type: application/json" \
  "https://zipform.zivelo.dev/api/v1/projects"
```

## Diagnose failures

- `401`: inspect the response before distinguishing missing, invalid, expired, or revoked credentials. Do not repeatedly retry the same key.
- `403`: stop; do not bypass authorization.
- `404`: check the base URL, endpoint, and internal resource ID.
- `400` or `422`: inspect `error.fields` and the current OpenAPI schema.
- `500`: do not claim success; GET the affected resource when safe.

Personal keys are created and revoked from an active browser session through `/api/v1/users/me/api-keys`; raw keys are returned only once. Platform Owners can manage agent keys from an active browser session through `/api/v1/agents/{agentId}/api-keys`. API-key-authenticated requests cannot create, list, or revoke credentials. If a personal key is lost or revoked, create a replacement in Configuración and export the new raw value as `TLOZ_TOKEN` before launching the agent.
