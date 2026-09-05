import { test, expect, type Page } from "@playwright/test";
import { encode } from "next-auth/jwt";
import { defaultMissionFields, defaultInventoryFields } from "@tloz/data";

// Only the isolated mock server uses this test session. Login providers and real
// accounts remain untouched; the token intentionally has no database email.
test.beforeAll(async ({ request }) => {
  const headers = { Authorization: "Bearer zipform-local-e2e-api-only" };
  for (const [id, publicId, presentation, title] of [
    ["project-core", "project-core", "project", "Core"],
    ["inventory", "inventory", "inventory", "Inventory"],
    ["workshop", "workshop", "workshop", "Workshop"],
    ["library", "library", "library", "Library"],
  ]) {
    const existing = await request.get(`/api/v2/containers/${publicId}`, { headers });
    if (existing.ok()) continue;
    const response = await request.post("/api/v2/containers", { headers, data: {
      id, publicId, presentation, title, slug: title.toLowerCase(), data: { ownerId: "owner" },
      definition: {
        fields: (presentation === "inventory" ? defaultInventoryFields(id) : defaultMissionFields(id)).map((field) => ({ ...field, format: field.type })),
        views: ["list", "table", ...(presentation === "project" ? ["dashboard", "board", "calendar"] : [])].map((id) => ({ id, fields: ["title", "status"] })),
        defaultView: "list",
      },
    } });
    expect(response.ok(), await response.text()).toBe(true);
  }
});

async function authenticate(page: Page) {
  await page.route("http://127.0.0.1:3100/api/v*/**", (route) => route.continue({
    headers: { ...route.request().headers(), authorization: "Bearer zipform-local-e2e-api-only" },
  }));
  const value = await encode({
    secret: "zipform-local-e2e-only",
    salt: "authjs.session-token",
    token: { sub: "owner", name: "Owner", username: "owner", role: "Platform Owner", type: "human" },
  });
  await page.context().addCookies([{ name: "authjs.session-token", value, url: "http://127.0.0.1:3100" }]);
}

async function settings(page: Page) {
  await page.getByRole("button", { name: "Abrir perfil de Owner", exact: true }).click();
  await page.getByRole("menuitem", { name: "Configuración", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Configuración", exact: true })).toBeVisible();
}

async function expectNoOverflow(page: Page) {
  const bounds = await page.locator("#main-content").boundingBox();
  expect(bounds?.y).toBe(0);
  expect(await page.locator("#tloz-content").evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
}

test("login validates required fields and recovers from a Zoho connection failure", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByLabel("Email o usuario")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Contraseña", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await page.getByLabel("Contraseña", { exact: true }).fill("local-test");
  await page.getByRole("button", { name: "Mostrar contraseña" }).click();
  await expect(page.getByLabel("Contraseña", { exact: true })).toHaveAttribute("type", "text");
  await page.route("**/api/auth/signin/zoho*", (route) => route.abort("failed"));
  await page.getByRole("button", { name: "Zoho", exact: true }).click();
  await expect(page.getByText("No se pudo conectar con Zoho. Intenta nuevamente.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar", exact: true })).toBeEnabled();
});

for (const width of [320, 390, 834, 1440]) {
  test(`dashboard fits the workspace at ${width}px`, async ({ page }) => {
    await authenticate(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: width < 768 ? "Lista" : "Dashboard", exact: true })).toBeVisible();
    await expectNoOverflow(page);
    await expect(page.getByRole("dialog", { name: "Menú de navegación" })).toHaveCount(0);
    await page.screenshot({ animations: "disabled", path: `test-results/dashboard-${width}.png` });
  });
}

test("all collections and mission views render without page errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await authenticate(page);
  for (const path of ["/", "/projects", "/inventory", "/workshop", "/library", "/core"]) {
    await page.goto(path);
    await expect(page.getByRole("button", { name: "Control", exact: true })).toBeVisible();
    await expect(page.locator("#tloz-content")).not.toBeEmpty();
    await expectNoOverflow(page);
  }
  await page.goto("/");
  for (const view of ["Lista", "Board", "Tabla", "Calendario", "Dashboard"]) {
    await page.getByRole("button", { name: "Control", exact: true }).click();
    await page.getByRole("button", { name: view, exact: true }).click();
    await expect(page.getByRole("button", { name: view, exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("heading", { name: view, exact: true })).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("dashboard audience filter updates and cards open with the keyboard", async ({ page }) => {
  await authenticate(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Solo yo", exact: true }).click();
  await expect(page.getByRole("button", { name: "Solo yo", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Todo el equipo", exact: true }).click();
  const cards = page.getByRole("button", { name: "Abrir COR-0001: Publicar dashboard operativo de TLOZ", exact: true });
  await expect(cards).toHaveCount(2);
  await cards.first().press("Enter");
  await expect(page.locator("dialog[open]")).toBeVisible();
  await expect(page.locator("dialog[open]")).toHaveAttribute("aria-labelledby", /.+/);
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog[open]")).toHaveCount(0);
});

test("mobile menu traps focus, restores it and closes when opening settings", async ({ page }) => {
  await authenticate(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir menú", exact: true }).click();
  const menu = page.getByRole("dialog", { name: "Menú de navegación", exact: true });
  await expect(menu).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  expect(await menu.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Abrir menú", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Abrir menú", exact: true }).click();
  await settings(page);
  await expect(menu).toHaveCount(0);
  await page.screenshot({ animations: "disabled", path: "test-results/settings-mobile.png" });
});

test("avatar modal is absent when closed and restores the profile draft on reopen", async ({ page }) => {
  await authenticate(page);
  await page.goto("/");
  await settings(page);
  await expect(page.getByRole("button", { name: "Usar avatar" })).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Seleccionar tema" })).toHaveCount(0);
  await page.route("**/storage/v1/object/public/PFP/**", (route) => route.abort("failed"));
  await page.getByRole("button", { name: "Cambiar avatar" }).click();
  const avatar = page.getByRole("dialog", { name: "Elegir avatar", exact: true });
  await expect(avatar).toBeVisible();
  await expect(avatar.getByRole("button", { name: "Dragon", exact: true })).toBeVisible();
  await avatar.getByRole("button", { name: "Dragon", exact: true }).click();
  await expect(avatar.getByRole("button", { name: "Dragon", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");
  await expect(avatar).toHaveCount(0);
  await expect(page.getByRole("dialog", { name: "Configuración", exact: true })).toBeVisible();
  await page.getByLabel("Nombre", { exact: true }).fill("Unsaved draft");
  await page.keyboard.press("Escape");
  await settings(page);
  await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("Owner");
});

test("search preserves server-ranked matches and cancels stale queries", async ({ page }) => {
  await authenticate(page);
  await page.goto("/");
  await page.route("**/api/v1/search?**", async (route) => {
    const query = new URL(route.request().url()).searchParams.get("q");
    if (query === "old") await new Promise((resolve) => setTimeout(resolve, 600));
    await route.fulfill({ json: { data: [{ id: query, type: "mission", title: query === "old" ? "Old result" : "A matching document body", context: "Core", destination: "/core" }] } });
  });
  await page.getByRole("button", { name: "Buscar documentos", exact: true }).click();
  const input = page.getByRole("combobox");
  await input.fill("old");
  await page.waitForRequest((request) => request.url().includes("q=old"));
  await input.fill("needle");
  await expect(page.getByRole("option", { name: /A matching document body/ })).toBeVisible();
  await expect(page.getByRole("option", { name: /Old result/ })).toHaveCount(0);
  await page.getByRole("option", { name: /A matching document body/ }).click();
  await expect(page).toHaveURL(/\/core$/);
});

test("mobile creation preserves project context, validates and saves", async ({ page }) => {
  await authenticate(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/core");
  await page.getByRole("button", { name: "Control", exact: true }).click();
  await page.getByRole("button", { name: "Crear nuevo Mission", exact: true }).click();
  await expect(page).toHaveURL(/\/new\?kind=mission&projectId=/);
  const save = page.getByRole("button", { name: "Guardar", exact: true });
  await save.click();
  await expect(page.getByText(/título.*obligatorio/i)).toBeVisible();
  await page.getByLabel("Título", { exact: false }).fill("E2E mobile mission");
  await page.getByLabel(/^Descripción/).fill("Created using the isolated mock driver.");
  await save.click();
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
});

test("restricted browser storage does not crash the app shell", async ({ page }) => {
  await authenticate(page);
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Blocked", "SecurityError"); } });
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Contraer barra", exact: true }).click();
  await expect(page.getByRole("button", { name: "Expandir barra", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});


test("mission panel displays a retry action after a loading failure", async ({ page }) => {
  await authenticate(page);
  await page.goto("/");
  await page.route("**/", (route) => route.request().method() === "POST" ? route.abort("failed") : route.continue());
  const cards = page.getByRole("button", { name: "Abrir COR-0001: Publicar dashboard operativo de TLOZ", exact: true });
  await expect(cards).toHaveCount(2);
  await cards.first().click();
  await expect(page.getByText("No se pudo cargar la misión.")).toBeVisible();
  await page.unroute("**/");
  await page.getByRole("button", { name: "Reintentar", exact: true }).click();
  await expect(page.getByText("No se pudo cargar la misión.")).toHaveCount(0);
  await expect(page.locator("dialog[open]").getByText("Descripción", { exact: true })).toBeVisible();
});

test("API key creation shows the result only after the save completes", async ({ page }) => {
  await authenticate(page);
  await page.goto("/");
  await settings(page);
  await page.getByRole("button", { name: "Seguridad", exact: true }).click();
  await expect(page.getByText("Cargando API keys…")).toHaveCount(0);
  await page.route("**/", async (route) => {
    if (route.request().method() === "POST") await new Promise((resolve) => setTimeout(resolve, 500));
    await route.continue();
  });
  await page.getByRole("button", { name: "Crear API key", exact: true }).click();
  await expect(page.getByRole("button", { name: "Creando…", exact: true })).toBeDisabled();
  await expect(page.getByRole("heading", { name: "API key creada", exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "API key creada", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copiar", exact: true })).toBeEnabled();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "API key creada", exact: true })).toHaveCount(0);
});


test("desktop create blocks duplicate saves and dismissal while pending", async ({ page }) => {
  await authenticate(page);
  await page.goto("/core");
  await page.getByRole("button", { name: "Control", exact: true }).click();
  await page.getByRole("button", { name: "Crear nuevo Mission", exact: true }).click();
  const panel = page.locator("dialog[open]");
  await expect(panel).toBeVisible();
  await panel.getByLabel(/^Título/).fill("E2E desktop mission");
  await panel.getByLabel(/^Descripción/).fill("Save once using the mock driver.");
  let submissions = 0;
  await page.route("**/core", async (route) => {
    if (route.request().method() === "POST") {
      submissions += 1;
      await new Promise((resolve) => setTimeout(resolve, 700));
    }
    await route.continue();
  });
  await panel.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(panel.getByRole("button", { name: "Guardando…", exact: true })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(panel).toBeVisible();
  await expect(panel).toHaveCount(0);
  expect(submissions).toBe(1);
});

test("settings and avatar actions fit a short mobile viewport", async ({ page }) => {
  await authenticate(page);
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir menú", exact: true }).click();
  await settings(page);
  const dialog = page.getByRole("dialog", { name: "Configuración", exact: true });
  const bounds = await dialog.boundingBox();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(568);
  await page.route("**/storage/v1/object/public/PFP/**", (route) => route.abort("failed"));
  await page.getByRole("button", { name: "Cambiar avatar" }).click();
  const avatar = page.getByRole("dialog", { name: "Elegir avatar", exact: true });
  await expect(avatar.getByRole("button", { name: "Usar avatar" })).toBeVisible();
  await expect(avatar.getByRole("button", { name: "Dragon", exact: true })).toContainText("DR");
  expect(await avatar.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
  await page.screenshot({ animations: "disabled", path: "test-results/avatar-mobile.png" });
});

test("desktop settings keeps API key creation visible until completion", async ({ page }) => {
  await authenticate(page);
  await page.goto("/");
  await settings(page);
  await page.getByRole("button", { name: "Seguridad", exact: true }).click();
  await expect(page.getByText("Cargando API keys…")).toHaveCount(0);
  await page.route("**/", async (route) => {
    if (route.request().method() === "POST") await new Promise((resolve) => setTimeout(resolve, 900));
    await route.continue();
  });
  await page.getByRole("button", { name: "Crear API key", exact: true }).click();
  await expect(page.getByRole("button", { name: "Perfil", exact: true })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Configuración", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "API key creada", exact: true })).toBeVisible();
});

test("desktop profile submits with Enter and keeps the save visible", async ({ page }) => {
  await authenticate(page);
  await page.goto("/");
  await settings(page);
  await page.getByLabel("Nombre", { exact: true }).fill("Owner desktop");
  await page.route("**/", async (route) => {
    if (route.request().method() === "POST") {
      await new Promise((resolve) => setTimeout(resolve, 900));
      await route.abort("failed");
    } else await route.continue();
  });
  await page.getByLabel("Nombre", { exact: true }).press("Enter");
  await expect(page.getByRole("button", { name: "Guardando...", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Cancelar", exact: true })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Configuración", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar cambios", exact: true })).toBeEnabled();
  await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("Owner desktop");
});

test("desktop Board handle does not open a mission and cards remain clickable", async ({ page }) => {
  await authenticate(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Control", exact: true }).click();
  await page.getByRole("button", { name: "Board", exact: true }).click();
  await page.keyboard.press("Escape");
  const title = "Publicar dashboard operativo de TLOZ";
  await page.getByRole("button", { name: `Mantén presionado para mover ${title}`, exact: true }).click();
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await page.locator(".tloz-kcard").filter({ hasText: title }).getByText(title, { exact: true }).click();
  await expect(page.locator("dialog[open]")).toBeVisible();
});

test("desktop calendar opens missions from the keyboard", async ({ page }) => {
  await authenticate(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Control", exact: true }).click();
  await page.getByRole("button", { name: "Calendario", exact: true }).click();
  await page.keyboard.press("Escape");
  const mission = page.getByRole("region", { name: "Calendario de Missions" }).getByRole("button").first();
  await expect(mission).toBeVisible();
  await page.screenshot({ animations: "disabled", path: "test-results/calendar-desktop.png" });
  await mission.press("Enter");
  await expect(page.locator("dialog[open]")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(mission).toBeFocused();
});

test("desktop user filter selects a trimmed query with Enter and resets after closing", async ({ page }) => {
  await authenticate(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Control", exact: true }).click();
  const trigger = page.getByRole("button", { name: "Seleccionar responsable", exact: true });
  await trigger.click();
  await page.getByLabel("Buscar usuarios").fill("  owner  ");
  await page.getByLabel("Buscar usuarios").press("Enter");
  await expect(page.getByLabel("Buscar usuarios")).toHaveCount(0);
  await expect(trigger).toContainText(/owner/i);
  await trigger.click();
  await page.getByLabel("Buscar usuarios").fill("no-match");
  await page.keyboard.press("Escape");
  await trigger.click();
  await expect(page.getByLabel("Buscar usuarios")).toHaveValue("");
  await expect(page.getByRole("button", { name: /Owner$/, pressed: true })).toHaveAttribute("aria-pressed", "true");
});

test("desktop project picker selects with Enter without submitting the creation form", async ({ page }) => {
  await authenticate(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Control", exact: true }).click();
  await page.getByRole("button", { name: "Crear nuevo Mission", exact: true }).click();
  const panel = page.locator("dialog[open]");
  await panel.getByRole("button", { name: /^Proyecto / }).click();
  const trigger = panel.getByRole("button", { name: "Seleccionar proyecto", exact: true });
  await trigger.click();
  await page.getByLabel("Buscar proyecto", { exact: true }).fill("Core");
  await page.getByLabel("Buscar proyecto", { exact: true }).press("Enter");
  await expect(page.getByLabel("Buscar proyecto", { exact: true })).toHaveCount(0);
  await expect(trigger).toContainText("Core");
  await expect(panel.getByRole("alert")).toHaveCount(0);
  await expect(panel).toBeVisible();
});


test("desktop profile closes after a successful save", async ({ page }) => {
  await authenticate(page);
  await page.goto("/");
  await settings(page);
  await page.getByLabel("Nombre", { exact: true }).fill("Owner saved");
  await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
  await expect(page.getByText("Perfil actualizado", { exact: true })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Configuración", exact: true })).toHaveCount(0);
});

test("search distinguishes documents with identical titles and context", async ({ page }) => {
  await authenticate(page);
  await page.goto("/");
  await page.route("**/api/v1/search?**", (route) => route.fulfill({ json: { data: [
    { id: "first", type: "mission", title: "Repeated title", context: "Core", destination: "/projects" },
    { id: "second", type: "mission", title: "Repeated title", context: "Core", destination: "/inventory" },
  ] } }));
  await page.getByRole("button", { name: "Buscar documentos", exact: true }).click();
  await page.getByRole("combobox").fill("Repeated");
  const hits = page.getByRole("option", { name: /Repeated title/ });
  await expect(hits).toHaveCount(2);
  await expect(hits.first()).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowDown");
  await expect(hits.last()).toHaveAttribute("aria-selected", "true");
  await expect(hits.first()).toHaveAttribute("aria-selected", "false");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("http://127.0.0.1:3100/inventory");
});

test("mission completion recovers from a failed save without duplicate submissions", async ({ page }) => {
  await authenticate(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir COR-0001: Publicar dashboard operativo de TLOZ", exact: true }).first().click();
  const panel = page.locator("dialog[open]");
  const complete = panel.getByRole("button", { name: "Marcar como completada", exact: true });
  await expect(complete).toBeEnabled();
  let submissions = 0;
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/", async (route) => {
    if (route.request().method() === "POST") {
      submissions += 1;
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.abort("failed");
    } else await route.continue();
  });
  await complete.click();
  await expect(complete).toBeDisabled();
  await expect(page.getByText("No se pudieron guardar los cambios", { exact: true })).toBeVisible();
  await expect(complete).toBeEnabled();
  expect(submissions).toBe(1);
  expect(errors).toEqual([]);
  await complete.click();
  await expect(complete).toBeDisabled();
  await expect(complete).toBeEnabled();
  expect(submissions).toBe(2);
});

test("paginated collection controls explain that filters and sorting apply to the current page", async ({ page, request }) => {
  const headers = { Authorization: "Bearer zipform-local-e2e-api-only" };
  for (let index = 0; index < 26; index += 1) {
    const response = await request.post("/api/v2/contents", { headers, data: {
      publicId: `e2e-page-scope-${index}`, containerId: "workshop", presentation: "workshop",
      title: `Page scope ${index}`, data: { status: "later", category: "side_quest", ownerId: "owner" },
    } });
    expect(response.ok(), await response.text()).toBe(true);
  }
  await authenticate(page);
  await page.goto("/workshop");
  await expect(page.getByRole("link", { name: "Siguiente", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Control", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Filtros de esta página", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Orden de esta página", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "Siguiente", exact: true }).click();
  await expect(page.getByRole("link", { name: "Primera página", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Control", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Filtros de esta página", exact: true })).toBeVisible();
  await page.goto("/");
  await page.getByRole("button", { name: "Control", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Filtros", exact: true })).toBeVisible();
});
