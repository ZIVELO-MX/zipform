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

for (const width of [320, 390, 834, 1024, 1440, 1920]) {
  test(`dashboard fits the workspace at ${width}px`, async ({ page }) => {
    await authenticate(page);
    await page.setViewportSize({ width, height: width === 1024 ? 768 : 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: width < 768 ? "Lista" : "Dashboard", exact: true })).toBeVisible();
    await expectNoOverflow(page);
    await expect(page.getByRole("dialog", { name: "Menú de navegación" })).toHaveCount(0);
    await page.screenshot({ animations: "disabled", path: `test-results/dashboard-${width}.png` });
  });
}

for (const width of [1024, 1440, 1920]) {
  test(`task panel keeps properties visible and actions reachable at ${width}px`, async ({ page }) => {
    await authenticate(page);
    await page.setViewportSize({ width, height: 768 });
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir COR-0001: Publicar dashboard operativo de TLOZ", exact: true }).first().click();
    const panel = page.locator("dialog[open]");
    await expect(panel.getByRole("heading", { name: "Publicar dashboard operativo de TLOZ", level: 1, exact: true })).toBeVisible();
    await expect(panel.getByText("Cargando actividad…", { exact: true })).toHaveCount(0);
    const bounds = await panel.locator(".slide-over-content-panel").boundingBox();
    expect(bounds!.width).toBeGreaterThan(850);
    expect(bounds!.width).toBeLessThan(1000);
    const properties = await panel.getByRole("complementary", { name: "Información de la misión" }).boundingBox();
    expect(properties!.y).toBeLessThan(220);
    expect(properties!.x).toBeGreaterThan(bounds!.x + 450);
    expect(await panel.locator(".slide-over-scroll").evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await expect(panel.getByRole("button", { name: "Marcar como completada", exact: true })).toBeInViewport();
    await page.screenshot({ path: `test-results/task-panel-${width}.png`, animations: "disabled" });
    await panel.getByRole("button", { name: "Añadir detalle", exact: true }).click();
    await expect(panel.getByLabel("Detalle en Markdown", { exact: true })).toBeFocused();
    await panel.getByRole("button", { name: "Cancelar", exact: true }).click();
    await panel.locator(".slide-over-scroll").evaluate(el => { el.scrollTop = el.scrollHeight; });
    await expect(panel.getByRole("button", { name: "Cerrar", exact: true })).toBeInViewport();
    await panel.getByRole("button", { name: "Cerrar", exact: true }).click();
    await expect(panel).toHaveCount(0);
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
  await expect(cards).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Abrir COR-0003: Integrar Wallet API", exact: true })).toBeVisible();
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
  await expect(cards).toHaveCount(1);
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
  const mission = page.getByRole("region", { name: "Calendario de misiones" }).getByRole("button", { name: /^Abrir / }).first();
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

for (const collection of ["projects", "inventory", "workshop", "library"] as const) {
  test(`${collection} filters and sorts the full collection before pagination`, async ({ page, request }) => {
    const headers = { Authorization: "Bearer zipform-local-e2e-api-only" };
    for (let index = 0; index < 30; index += 1) {
      const common = {
        publicId: `e2e-query-${collection}-${index}`,
        title: `AAA ${collection} ${String(index).padStart(2, "0")}`,
        data: { owner: index < 2 ? "developer" : "owner", status: index === 0 ? "completed" : "later" },
      };
      const response = collection === "projects"
        ? await request.post("/api/v2/containers", { headers, data: { ...common, presentation: "project", definition: { fields: [], views: [{ id: "list", fields: ["title"] }], defaultView: "list" } } })
        : await request.post("/api/v2/contents", { headers, data: { ...common, containerId: collection, presentation: collection === "inventory" ? "quest-item" : collection } });
      expect(response.ok(), await response.text()).toBe(true);
    }
    await authenticate(page);
    await page.goto(`/${collection}`);
    await expect(page.getByText(`AAA ${collection} 00`, { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Control", exact: true }).click();
    await page.getByRole("combobox", { name: "Orden", exact: true }).click();
    await page.getByRole("option", { name: "Título", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${collection}\\?sort=title$`));
    await page.keyboard.press("Escape");
    await expect(page.getByRole("checkbox", { name: "Mostrar completadas", exact: true })).toHaveCount(0);
    await expect(page.getByText(`AAA ${collection} 00`, { exact: true })).toBeVisible();
    const next = page.getByRole("link", { name: "Siguiente", exact: true });
    await expect(next).toHaveAttribute("href", new RegExp(`/${collection}\\?sort=title&cursor=`));
    await next.click();
    await expect(page.getByText(`AAA ${collection} 29`, { exact: true })).toBeVisible();
    await expect(page.getByText(`AAA ${collection} 00`, { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Control", exact: true }).click();
    await page.getByRole("button", { name: "Seleccionar responsable", exact: true }).click();
    await page.getByLabel("Buscar usuarios", { exact: true }).fill("developer");
    await page.getByLabel("Buscar usuarios", { exact: true }).press("Enter");
    await expect(page).toHaveURL(new RegExp(`/${collection}\\?sort=title&owner=developer$`));
    await page.keyboard.press("Escape");
    await expect(page.getByRole("checkbox", { name: "Mostrar completadas", exact: true })).toHaveCount(0);
    await expect(page.getByText(`AAA ${collection} 00`, { exact: true })).toBeVisible();
    await expect(page.getByText(`AAA ${collection} 01`, { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Siguiente", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Control", exact: true }).click();
    await page.getByRole("checkbox", { name: "Mostrar completadas", exact: true }).uncheck();
    await expect(page).toHaveURL(/completed=0/);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("checkbox", { name: "Mostrar completadas", exact: true })).toHaveCount(0);
    await expect(page.getByText(`AAA ${collection} 00`, { exact: true })).toHaveCount(0);
    await expect(page.getByText(`AAA ${collection} 01`, { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText(`AAA ${collection} 01`, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Control", exact: true }).click();
    await expect(page.getByRole("combobox", { name: "Orden", exact: true })).toContainText("Título");
    await expect(page.getByRole("checkbox", { name: "Mostrar completadas", exact: true })).not.toBeChecked();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("checkbox", { name: "Mostrar completadas", exact: true })).toHaveCount(0);
    await expectNoOverflow(page);
    await page.screenshot({ animations: "disabled", path: `test-results/${collection}-filtered-desktop.png` });
  });
}

test("markdown keeps the draft after a failed save and retries unchanged text", async ({ page }) => {
  await authenticate(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir COR-0001: Publicar dashboard operativo de TLOZ", exact: true }).first().click();
  const panel = page.locator("dialog[open]");
  await panel.getByRole("button", { name: "Añadir detalle", exact: true }).click();
  const draft = panel.getByLabel("Detalle en Markdown", { exact: true });
  await draft.fill("Desktop draft survives a failed save.");
  await page.route("**/", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.abort("failed");
  });
  await panel.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(draft).toBeDisabled();
  await expect(page.getByText("No se pudieron guardar los cambios", { exact: true })).toBeVisible();
  await expect(draft).toBeEnabled();
  await expect(draft).toHaveValue("Desktop draft survives a failed save.");
  await page.screenshot({ animations: "disabled", path: "test-results/markdown-retry-desktop.png" });
  await page.unroute("**/");
  await panel.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(draft).toHaveCount(0);
  await expect(panel.getByText("Desktop draft survives a failed save.", { exact: true })).toBeVisible();
});

test("an invalid collection cursor offers a working first page without losing filters", async ({ page }) => {
  await authenticate(page);
  await page.goto("/workshop?cursor=missing-e2e-record&sort=title&owner=developer");
  await expect(page.getByRole("heading", { name: "No se pudo cargar esta página", exact: true })).toBeVisible();
  const first = page.getByRole("link", { name: "Primera página", exact: true });
  await expect(first).toHaveAttribute("href", "/workshop?sort=title&owner=developer");
  await first.click();
  await expect(page.getByRole("button", { name: "Control", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "No se pudo cargar esta página", exact: true })).toHaveCount(0);
});

for (const collection of ["workshop", "library"] as const) {
  test(`${collection} preserves the markdown draft when another property is saved`, async ({ page, request }) => {
    const response = await request.post("/api/v2/contents", { headers: { Authorization: "Bearer zipform-local-e2e-api-only" }, data: {
      publicId: `e2e-draft-${collection}`, containerId: collection, presentation: collection,
      title: `Draft ${collection}`, body: "Original detail", data: { status: "later", category: "side_quest", ownerId: "owner" },
    } });
    expect(response.ok(), await response.text()).toBe(true);
    await authenticate(page);
    await page.goto(`/${collection}`);
    const activityResponse = page.waitForResponse((response) => /\/api\/v2\/contents\/[^/]+\/activity\?/.test(response.url()));
    await page.getByText(`Draft ${collection}`, { exact: true }).click();
    expect((await activityResponse).ok()).toBe(true);
    const panel = page.locator("dialog[open]");
    await expect(panel.getByRole("link", { name: "Abrir Missions", exact: true })).toHaveCount(0);
    await panel.getByRole("button", { name: "Opciones de descripción", exact: true }).click();
    await page.getByRole("menuitem", { name: "Editar", exact: true }).click();
    const draft = panel.getByLabel("Detalle en Markdown", { exact: true });
    await draft.fill("Unsaved description survives a status change.");
    await panel.getByRole("button", { name: /^Estado / }).click();
    await page.getByRole("combobox", { name: "Estado", exact: true }).click();
    await page.getByRole("option", { name: "Now", exact: true }).click();
    await expect(page.getByText("Estado actualizado", { exact: true })).toBeVisible();
    await expect(panel.getByText("Documento actualizado", { exact: true })).toBeVisible();
    await expect(draft).toHaveValue("Unsaved description survives a status change.");
    await page.keyboard.press("Escape");
    await panel.getByRole("button", { name: "Guardar", exact: true }).click();
    await expect(draft).toHaveCount(0);
    await expect(panel.getByText("Unsaved description survives a status change.", { exact: true })).toBeVisible();
  });
}

for (const reducedMotion of ["reduce", "no-preference"] as const) {
  test(`task detail contains long content without overflow (${reducedMotion})`, async ({ page, request }) => {
    await page.emulateMedia({ reducedMotion });
    const title = "Tarea".repeat(24) + reducedMotion;
    const body = ["https://example.com/" + "documentation".repeat(28), "```ts\nconst result = \"" + "long value ".repeat(40) + "\";\n```", "```mermaid\nflowchart LR\n A[Inicio] --> B[Revisión]\n```", "| Estado | Responsable |\n| --- | --- |\n| En revisión | Equipo de producto |"].join("\n\n");
    const response = await request.post("/api/v2/contents", { headers: { Authorization: "Bearer zipform-local-e2e-api-only" }, data: {
      publicId: `e2e-panel-long-${reducedMotion}`, containerId: "workshop", presentation: "workshop", title, body,
      data: { status: "later", ownerId: "owner" },
    } });
    expect(response.ok(), await response.text()).toBe(true);
    await authenticate(page);
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/workshop");
    await page.getByText(title, { exact: true }).click();
    const panel = page.locator("dialog[open]");
    await expect(panel.getByRole("img", { name: "Diagrama Mermaid", exact: true })).toBeVisible();
    const diagram = await panel.getByRole("img", { name: "Diagrama Mermaid", exact: true }).boundingBox();
    expect(diagram!.height).toBeLessThan(180);
    expect(await panel.getByRole("img", { name: "Diagrama Mermaid", exact: true }).evaluate(async (node: HTMLImageElement) => {
      await node.decode();
      const host = document.createElement("div");
      host.style.cssText = "position:absolute;visibility:hidden;pointer-events:none";
      host.innerHTML = await (await fetch(node.src)).text();
      node.closest("dialog")!.append(host);
      try {
        const svg = host.querySelector("svg")!;
        const box = svg.getBBox();
        const view = svg.viewBox.baseVal;
        return box.x >= view.x - 1 && box.y >= view.y - 1 && box.x + box.width <= view.x + view.width + 1 && box.y + box.height <= view.y + view.height + 1;
      } finally { host.remove(); }
    })).toBe(true);
    await expect(panel.getByRole("link", { name: "Abrir Missions", exact: true })).toHaveCount(0);
    await expect(panel.getByText("No se pudo cargar la actividad.", { exact: true })).toHaveCount(0);
    await expect(panel.getByText("Cargando actividad…", { exact: true })).toHaveCount(0);
    await expect(panel.locator("pre pre, pre figure")).toHaveCount(0);
    await expect(panel.getByRole("table")).toBeVisible();
    expect(await panel.locator(".slide-over-scroll").evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    const code = panel.locator("pre");
    await expect(code).toHaveCount(1);
    expect(await code.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true);
    await panel.locator(".slide-over-scroll").evaluate(el => { el.scrollTop = 0; });
    await page.screenshot({ path: `test-results/task-panel-long-content-${reducedMotion}.png`, animations: "disabled" });
    const resize = panel.getByRole("separator", { name: "Redimensionar panel", exact: true });
    await resize.focus();
    await resize.press("ArrowRight");
    expect(await panel.locator(".slide-over-scroll").evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  });
}

async function selectDesktopView(page: Page, view: string) {
  await page.getByRole("combobox", { name: "Vista actual", exact: true }).click();
  await page.getByRole("option", { name: view, exact: true }).click();
  await expect(page.getByRole("heading", { name: view, exact: true })).toBeVisible();
}

test("resource form retains failed drafts and retries without duplicate attachments", async ({ page }) => {
  await authenticate(page);
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir COR-0001: Publicar dashboard operativo de TLOZ", exact: true }).first().click();
  const panel = page.locator("dialog[open]");
  const resources = panel.getByRole("heading", { name: "Recursos", exact: true }).locator("..");
  await resources.getByRole("button", { name: "Agregar nuevo", exact: true }).click();
  const form = panel.getByRole("group", { name: "Adjuntar recurso", exact: true });
  await form.getByLabel("Título del recurso").fill("Recurso con reintento");
  await form.getByLabel("URL del recurso").fill("https://example.com/reference");
  let attempts = 0;
  let fail = true;
  await page.route("**/", async (route) => {
    if (route.request().method() === "POST") {
      attempts += 1;
      await new Promise((resolve) => setTimeout(resolve, 400));
      if (fail) { await route.abort("failed"); return; }
    }
    await route.continue();
  });
  await form.getByLabel("URL del recurso").press("Enter");
  await expect(form).toHaveAttribute("aria-busy", "true");
  await expect(form.getByRole("button", { name: "Adjuntar recurso", exact: true })).toBeDisabled();
  await expect(form.getByRole("button", { name: "Cancelar", exact: true })).toBeDisabled();
  await expect(form.getByRole("alert")).toContainText("No se pudo adjuntar");
  await expect(form.getByLabel("Título del recurso")).toHaveValue("Recurso con reintento");
  await expect(form.getByLabel("URL del recurso")).toHaveValue("https://example.com/reference");
  expect(attempts).toBe(1);
  await expect(form.getByRole("alert")).toBeInViewport();
  await expect(form.getByRole("button", { name: "Adjuntar recurso", exact: true })).toBeFocused();
  await page.screenshot({ path: "test-results/resource-error-1024.png", animations: "disabled" });
  fail = false;
  await form.getByRole("button", { name: "Adjuntar recurso", exact: true }).click();
  await expect(form).toHaveCount(0);
  await expect(resources.getByRole("link", { name: "Abrir Recurso con reintento", exact: true })).toHaveCount(1);
  expect(attempts).toBe(2);
  await expect(resources.getByRole("button", { name: "Agregar nuevo", exact: true })).toBeFocused();
  await expectNoOverflow(page);
});

test("Enter attaches a resource to the creation draft without submitting the mission", async ({ page }) => {
  await authenticate(page);
  await page.goto("/core");
  await page.getByRole("button", { name: "Control", exact: true }).click();
  await page.getByRole("button", { name: "Crear nuevo Mission", exact: true }).click();
  const panel = page.locator("dialog[open]");
  await panel.getByLabel(/^Título/).fill("Misión sin enviar");
  await panel.getByLabel(/^Descripción/).fill("Borrador local");
  const resources = panel.getByRole("heading", { name: "Attachments / Resources", exact: true }).locator("..");
  await resources.getByRole("button", { name: "Agregar nuevo", exact: true }).click();
  let submissions = 0;
  await page.route("**/core", async (route) => {
    if (route.request().method() === "POST") { submissions += 1; await route.abort("failed"); }
    else await route.continue();
  });
  await panel.getByLabel("Título del recurso", { exact: true }).fill("Referencia local");
  await panel.getByLabel("URL del recurso", { exact: true }).fill("https://example.com/local");
  await panel.getByLabel("URL del recurso", { exact: true }).press("Enter");
  await expect(resources.getByText("Referencia local", { exact: true })).toBeVisible();
  await expect(panel.getByLabel(/^Título/)).toHaveValue("Misión sin enviar");
  await expect(panel).toBeVisible();
  expect(submissions).toBe(0);
});

test("custom properties cancel with Escape and block repeat saves while pending", async ({ page, request }) => {
  const headers = { Authorization: "Bearer zipform-local-e2e-api-only" };
  const containerResponse = await request.get("/api/v2/containers/workshop", { headers });
  const container = (await containerResponse.json()).data;
  const updated = await request.patch("/api/v2/containers/workshop", { headers: { ...headers, "If-Match": `"${container.revision}"` }, data: {
    definition: { ...container.definition, fields: [...container.definition.fields, { id: "e2e-reference", key: "reference", label: "Referencia E2E", type: "text", format: "text", visible: true, required: false, position: 20, options: [] }] },
  } });
  expect(updated.ok(), await updated.text()).toBe(true);
  const created = await request.post("/api/v2/contents", { headers, data: {
    publicId: "e2e-property-cancel", containerId: "workshop", presentation: "workshop", title: "Propiedades cancelables", data: { ownerId: "owner", status: "later", category: "side_quest", reference: "Valor original", color: "#D72228" },
  } });
  expect(created.ok(), await created.text()).toBe(true);
  await authenticate(page);
  await page.goto("/workshop");
  await page.getByText("Propiedades cancelables", { exact: true }).click();
  const panel = page.locator("dialog[open]");
  let attempts = 0;
  let fail = true;
  await page.route("**/workshop", async (route) => {
    if (route.request().method() === "POST") {
      attempts += 1;
      await new Promise((resolve) => setTimeout(resolve, 400));
      if (fail) { await route.abort("failed"); return; }
    }
    await route.continue();
  });
  await panel.getByRole("button", { name: /^Referencia E2E/ }).click();
  const input = page.getByRole("textbox", { name: "Referencia E2E", exact: true });
  await input.fill("Texto cancelado");
  await input.press("Escape");
  await expect(input).toHaveValue("Valor original");
  await expect(panel).toBeVisible();
  expect(attempts).toBe(0);
  await input.fill("Texto que conserva el error");
  await input.press("Enter");
  await expect(input).toBeDisabled();
  await expect(input).toBeEnabled();
  await expect(input).toHaveValue("Texto que conserva el error");
  expect(attempts).toBe(1);
  fail = false;
  await input.focus();
  await input.press("Enter");
  await expect(page.getByText("Referencia E2E actualizado", { exact: true })).toBeVisible();
  expect(attempts).toBe(2);
  await page.keyboard.press("Escape");
  await panel.getByRole("button", { name: /^Color / }).click();
  const color = page.getByRole("textbox", { name: "Color", exact: true });
  const originalColor = await color.inputValue();
  await color.fill("#123456");
  await color.press("Escape");
  await expect(color).toHaveValue(originalColor);
  await expect(panel).toBeVisible();
  expect(attempts).toBe(2);
});

test("failed board moves restore the task without closing a panel opened during saving", async ({ page }) => {
  await authenticate(page);
  await page.goto("/");
  await selectDesktopView(page, "Board");
  const handle = page.locator('button[aria-label^="Mantén presionado para mover"]').first();
  const label = (await handle.getAttribute("aria-label"))!;
  const title = label.replace("Mantén presionado para mover ", "");
  const card = page.locator(".tloz-kcard").filter({ has: page.getByRole("button", { name: label, exact: true }) });
  const source = await card.locator("..").getAttribute("data-group");
  let release!: () => void;
  const blocked = new Promise<void>((resolve) => { release = resolve; });
  let intercepted = false;
  await page.route("**/", async (route) => {
    if (!intercepted && route.request().method() === "POST" && route.request().headers()["next-action"]) {
      intercepted = true;
      await blocked;
      await route.abort("failed");
    } else await route.continue();
  });
  try {
    await handle.focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Space");
    await expect(page.getByRole("status").filter({ hasText: "Guardando estado…" })).toBeVisible();
    await expect(page.getByRole("button", { name: label, exact: true })).toBeDisabled();
    await expect(card.locator("..")).not.toHaveAttribute("data-group", source!);
    await card.click();
    const panel = page.locator("dialog[open]");
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("heading", { level: 2, name: title, exact: true })).toBeVisible();
    release();
    await expect(page.locator('[role="status"]').filter({ hasText: "Guardando estado…" })).toHaveCount(0);
    await expect(panel.getByRole("heading", { level: 1, name: title, exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(card.locator("..")).toHaveAttribute("data-group", source!);
    await expect(page.getByRole("button", { name: label, exact: true })).toBeEnabled();
    await expectNoOverflow(page);
    await page.screenshot({ path: "test-results/desktop-board-recovery.png", animations: "disabled" });
  } finally { release(); }
});

test("inline mission edits preserve failed drafts and Escape only cancels the field", async ({ page }) => {
  await authenticate(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir COR-0001: Publicar dashboard operativo de TLOZ", exact: true }).first().click();
  const panel = page.locator("dialog[open]");
  const due = panel.getByRole("button", { name: /^Vence/ }).locator("time");
  await expect(due).toBeVisible();
  expect(await due.evaluate((node) => {
    const value = node.parentElement!;
    return value.scrollWidth <= value.clientWidth + 1 && getComputedStyle(value).whiteSpace === "normal";
  })).toBe(true);
  const originalTitle = "Publicar dashboard operativo de TLOZ";
  await panel.getByRole("button", { name: originalTitle, exact: true }).click();
  const title = panel.getByRole("textbox", { name: "Título de la misión", exact: true });
  await title.fill("Título que se cancela");
  await title.press("Escape");
  await expect(panel).toBeVisible();
  await expect(title).toHaveCount(0);
  await expect(panel.getByRole("heading", { level: 1, name: originalTitle, exact: true })).toBeVisible();

  let submissions = 0;
  let fail = true;
  await page.route("**/", async (route) => {
    if (route.request().method() === "POST" && fail) {
      submissions += 1;
      await new Promise((resolve) => setTimeout(resolve, 300));
      await route.abort("failed");
    } else await route.continue();
  });
  await panel.getByRole("button", { name: originalTitle, exact: true }).click();
  await title.fill("Borrador conservado al fallar");
  await title.press("Enter");
  await expect(title).toHaveAttribute("aria-busy", "true");
  await expect(title).toBeFocused();
  await expect(title).toHaveAttribute("aria-busy", "false");
  await expect(title).toHaveValue("Borrador conservado al fallar");
  expect(submissions).toBe(1);
  fail = false;
  await title.press("Enter");
  await expect(panel.getByRole("heading", { level: 1, name: "Borrador conservado al fallar", exact: true })).toBeVisible();
  await panel.getByRole("button", { name: "Borrador conservado al fallar", exact: true }).click();
  await title.fill(originalTitle);
  await title.press("Enter");
  await expect(panel.getByRole("heading", { level: 1, name: originalTitle, exact: true })).toBeVisible();

  const descriptionSection = panel.locator('[data-state="open"]').filter({ has: page.getByRole("button", { name: "Descripción", exact: true }) }).first();
  const descriptionButton = descriptionSection.locator('button.block').first();
  await descriptionButton.click();
  const description = panel.getByRole("textbox", { name: "Descripción de la misión", exact: true });
  const originalDescription = await description.inputValue();
  await description.fill("Resumen que se cancela");
  await description.press("Escape");
  await expect(panel).toBeVisible();
  await expect(description).toHaveCount(0);
  await descriptionButton.click();
  await expect(description).toHaveValue(originalDescription);
  await description.fill("Resumen pendiente de reintento");
  fail = true;
  await description.press("Tab");
  await expect(description).toBeFocused();
  await expect(description).toHaveAttribute("aria-busy", "false");
  await expect(description).toHaveValue("Resumen pendiente de reintento");
  await description.press("Escape");
  await expect(panel).toBeVisible();

  await panel.getByRole("button", { name: "Añadir subtarea", exact: true }).click();
  const task = panel.getByRole("textbox", { name: "Nueva subtarea", exact: true });
  await task.fill("Subtarea pendiente de reintento");
  await task.press("Enter");
  await expect(task).toBeFocused();
  await expect(task).toHaveAttribute("aria-busy", "false");
  await expect(task).toHaveValue("Subtarea pendiente de reintento");
  const attempts = submissions;
  await task.press("Escape");
  await expect(panel).toBeVisible();
  await expect(task).toHaveCount(0);
  expect(submissions).toBe(attempts);
  fail = false;
  await panel.getByRole("button", { name: "Añadir subtarea", exact: true }).click();
  await task.fill("Subtarea para editar");
  await task.press("Enter");
  await expect(task).toHaveCount(0);
  await expect(panel.getByRole("checkbox", { name: "Subtarea para editar", exact: true })).toBeVisible();
  await panel.getByRole("button", { name: "Acciones para Subtarea para editar", exact: true }).click();
  await page.getByRole("menuitem", { name: "Editar", exact: true }).click();
  const rename = panel.getByRole("textbox", { name: "Nombre del checkbox", exact: true });
  await rename.fill("Nombre pendiente de reintento");
  fail = true;
  await rename.press("Enter");
  await expect(rename).toBeFocused();
  await expect(rename).toHaveAttribute("aria-busy", "false");
  await expect(rename).toHaveValue("Nombre pendiente de reintento");
  await rename.press("Escape");
  await expect(panel).toBeVisible();
  await expect(rename).toHaveCount(0);
  await expect(panel.getByRole("checkbox", { name: "Subtarea para editar", exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/desktop-edit-recovery.png", animations: "disabled" });
});

test("desktop list and table prioritize titles and preserve them while scrolling", async ({ page }) => {
  await authenticate(page);
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/");
  await selectDesktopView(page, "Lista");
  const row = page.locator(".tloz-lrow").filter({ hasText: "Publicar dashboard operativo de TLOZ" });
  const id = row.getByText("COR-0001", { exact: true });
  expect(await id.evaluate(node => getComputedStyle(node).whiteSpace)).toBe("nowrap");
  const title = row.locator("strong");
  expect((await title.boundingBox())!.width).toBeGreaterThan(230);
  await page.screenshot({ path: "test-results/list-polished-1024.png", animations: "disabled" });
  await selectDesktopView(page, "Tabla");
  const table = page.getByRole("region", { name: "Tabla de elementos", exact: true });
  const tableRow = table.getByRole("row").filter({ hasText: "Publicar dashboard operativo de TLOZ" });
  await expect(tableRow.getByRole("cell").nth(2)).toBeInViewport();
  await expect(tableRow.getByRole("cell").nth(3)).toBeInViewport();
  const first = tableRow.getByRole("cell").first();
  const initial = (await first.boundingBox())!.x;
  await page.getByRole("button", { name: "Tabla de elementos: desplazar a la derecha", exact: true }).click();
  expect(await table.evaluate(node => node.scrollLeft)).toBeGreaterThan(0);
  expect(Math.abs((await first.boundingBox())!.x - initial)).toBeLessThan(2);
  await page.getByRole("button", { name: "Tabla de elementos: desplazar a la izquierda", exact: true }).click();
  await expect(page.getByRole("button", { name: "Tabla de elementos: desplazar a la izquierda", exact: true })).toBeDisabled();
  await expectNoOverflow(page);
  await page.screenshot({ path: "test-results/table-polished-1024.png", animations: "disabled" });
  await page.reload();
  await expect(page.getByRole("combobox", { name: "Vista actual", exact: true })).toContainText("Tabla");
});

test("desktop Board exposes horizontal navigation without opening tasks", async ({ page }) => {
  await authenticate(page);
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/");
  await selectDesktopView(page, "Board");
  const board = page.getByRole("region", { name: "Board de misiones", exact: true });
  const right = page.getByRole("button", { name: "Board de misiones: desplazar a la derecha", exact: true });
  await expect(right).toBeEnabled();
  await right.click();
  expect(await board.evaluate(node => node.scrollLeft)).toBeGreaterThan(0);
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await page.getByRole("button", { name: "Board de misiones: desplazar a la izquierda", exact: true }).click();
  await expect(page.getByRole("button", { name: "Board de misiones: desplazar a la izquierda", exact: true })).toBeDisabled();
  await expectNoOverflow(page);
  await page.screenshot({ path: "test-results/board-polished-1024.png", animations: "disabled" });
});

test("calendar month and week retain all tasks and navigate across year boundaries", async ({ page, request }) => {
  const headers = { Authorization: "Bearer zipform-local-e2e-api-only" };
  const existing = await (await request.get("/api/v1/missions?limit=100", { headers })).json();
  expect(existing.data.length).toBeGreaterThanOrEqual(6);
  const longTitle = "Calendario".repeat(20);
  for (let index = 0; index < 6; index += 1) {
    const response = await request.patch(`/api/v1/missions/${existing.data[index].id}`, { headers, data: {
      title: index === 5 ? longTitle : `Calendar load ${index}`, type: "side_quest", status: index === 0 ? "completed" : "later", dueDate: "2026-12-31",
    } });
    expect(response.ok(), await response.text()).toBe(true);
  }
  await page.clock.setFixedTime(new Date("2026-12-31T12:00:00-06:00"));
  await authenticate(page);
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/");
  await selectDesktopView(page, "Lista");
  await expect(page.locator(".tloz-lrow").filter({ hasText: longTitle })).toBeVisible();
  await expectNoOverflow(page);
  await selectDesktopView(page, "Board");
  const card = page.locator(".tloz-kcard").filter({ hasText: longTitle });
  await expect(card).toBeVisible();
  expect(await card.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
  const column = page.locator(".tloz-board-column").filter({ has: card });
  const heading = column.getByText("Later", { exact: true });
  const headingY = (await heading.boundingBox())!.y;
  const list = column.locator(".tloz-droplist");
  expect(await list.evaluate(node => node.scrollHeight > node.clientHeight)).toBe(true);
  await list.evaluate(node => { node.scrollTop = node.scrollHeight; });
  expect(Math.abs((await heading.boundingBox())!.y - headingY)).toBeLessThan(2);
  await selectDesktopView(page, "Tabla");
  const longTable = page.getByRole("region", { name: "Tabla de elementos", exact: true });
  await expect(longTable.getByRole("row").filter({ hasText: longTitle })).toBeVisible();
  expect(await longTable.evaluate(node => node.scrollWidth)).toBeLessThan(1000);
  await selectDesktopView(page, "Calendario");
  const calendar = page.getByRole("region", { name: "Calendario de misiones", exact: true });
  await expect(calendar.getByRole("button", { name: new RegExp(longTitle) })).toBeVisible();
  await calendar.getByRole("button", { name: "Mes", exact: true }).click();
  await expect(calendar.getByRole("button", { name: new RegExp(longTitle) })).toBeVisible();
  await calendar.getByRole("button", { name: new RegExp(longTitle) }).click();
  await expect(page.locator("dialog[open]").getByRole("heading", { level: 1, name: longTitle, exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await calendar.getByRole("button", { name: "Periodo siguiente", exact: true }).click();
  await expect(calendar.getByRole("heading", { level: 2 })).toContainText(/enero.*2027/i);
  await expect(calendar.getByRole("table")).toBeVisible();
  expect((await calendar.getByRole("table").boundingBox())!.width).toBeLessThanOrEqual((await calendar.boundingBox())!.width);
  await calendar.getByRole("button", { name: "Hoy", exact: true }).click();
  await calendar.getByRole("button", { name: "Semana", exact: true }).click();
  await expect(calendar.getByRole("button", { name: new RegExp(longTitle) })).toBeVisible();
  await expectNoOverflow(page);
  await page.screenshot({ path: "test-results/calendar-week-1024.png", animations: "disabled" });
  await calendar.getByRole("button", { name: "Mes", exact: true }).click();
  await page.screenshot({ path: "test-results/calendar-month-1024.png", animations: "disabled" });
});

test("calendar explains missing dates and returns directly to List", async ({ page, request }) => {
  const headers = { Authorization: "Bearer zipform-local-e2e-api-only" };
  const missions = await request.get("/api/v1/missions?limit=100", { headers });
  const payload = await missions.json();
  for (const mission of payload.data) {
    const response = await request.patch(`/api/v1/missions/${mission.id}`, { headers, data: { dueDate: "" } });
    expect(response.ok(), await response.text()).toBe(true);
  }
  await authenticate(page);
  await page.goto("/");
  await selectDesktopView(page, "Calendario");
  await expect(page.getByText("Sin misiones con fecha", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Ver Lista", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Lista", exact: true })).toBeVisible();
});

test.describe("local due dates", () => {
  test.use({ timezoneId: "America/Mexico_City" });
  test("due dates stay neutral for future and completed tasks and update at midnight", async ({ page, request }) => {
    const headers = { Authorization: "Bearer zipform-local-e2e-api-only" };
    const existing = await (await request.get("/api/v1/missions?limit=100", { headers })).json();
    expect(existing.data.length).toBeGreaterThanOrEqual(4);
    let index = 0;
    for (const [id, status, dueDate] of [["past", "later", "2026-09-06"], ["today", "later", "2026-09-07"], ["future", "later", "2026-09-08"], ["done", "completed", "2026-09-06"]]) {
      const response = await request.patch(`/api/v1/missions/${existing.data[index++].id}`, { headers, data: { title: `Date state ${id}`, type: "side_quest", status, dueDate } });
      expect(response.ok(), await response.text()).toBe(true);
    }
    await page.clock.install({ time: new Date("2026-09-07T23:59:30-06:00") });
    await authenticate(page);
    await page.goto("/");
    await selectDesktopView(page, "Lista");
    const date = (id: string) => page.locator(".tloz-lrow").filter({ hasText: `Date state ${id}` }).locator("[data-due-state]");
    await expect(date("past")).toHaveAttribute("data-due-state", "overdue");
    await expect(date("today")).toHaveAttribute("data-due-state", "today");
    await expect(date("future")).toHaveAttribute("data-due-state", "future");
    await expect(date("done")).toHaveAttribute("data-due-state", "completed");
    expect(await date("past").evaluate(node => getComputedStyle(node).color)).not.toBe(await date("future").evaluate(node => getComputedStyle(node).color));
    await page.clock.fastForward(31_000);
    await expect(date("today")).toHaveAttribute("data-due-state", "overdue");
    await expect(date("future")).toHaveAttribute("data-due-state", "today");
    await expect(date("done")).toHaveAttribute("data-due-state", "completed");
  });
});
