# TLOZ Mission Operator

La skill canónica está versionada en [`.codex/skills/tloz-mission-operator`](../../.codex/skills/tloz-mission-operator/SKILL.md).

## Codex

Al abrir este repositorio, Codex puede descubrir la skill desde `.codex/skills`. También puede copiarse la carpeta completa a `${CODEX_HOME:-$HOME/.codex}/skills/` para instalarla globalmente. Después, instalar el CLI reutilizable con `node ${CODEX_HOME:-$HOME/.codex}/skills/tloz-mission-operator/scripts/install-tloz-api.mjs`; quedará en `${HOME}/.local/bin/tloz-api`.

## Otros agentes

Copiar la carpeta completa al directorio de skills soportado por el agente. Conservar juntos `SKILL.md`, `agents/` y `references/`; las referencias forman parte de las instrucciones operativas.

Configurar `ZIPFORM_TOKEN` en el proceso que inicia el agente. Nunca guardar el valor real en el repositorio. La skill usa `tloz-api` para llamadas de producción y conserva `pnpm tloz:api` como alias dentro de Zipform.
