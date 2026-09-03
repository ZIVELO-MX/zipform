# TLOZ Mission Operator

La skill canónica vive en el repositorio [`zivelo-skills`](https://github.com/ZIVELO-MX/zivelo-skills),
en `skills/operations/tloz-mission-operator`. Este repositorio ya no versiona su propia copia:
`zivelo-skills` es la fuente de verdad.

## Instalación

Desde un clon de `zivelo-skills`:

```bash
node scripts/install.mjs --agents codex,claude --categories operations
```

El instalador coloca la skill en el directorio de cada agente y deja el CLI `tloz-api` en
`${HOME}/.local/bin`. Si ese directorio no está en `PATH`, invoca la ruta absoluta o agrégalo al
entorno del agente.

## Uso desde este repositorio

`pnpm tloz:api /api/v1/... [GET|POST|PATCH|PUT|DELETE]` es un alias del CLI instalado. El CLI fija
el origen de producción, lee el token de `ZIPFORM_TOKEN` y nunca lo imprime.

Las pruebas del CLI viven junto a su implementación, en `zivelo-skills/tests/tloz-api.test.mjs`.
