# Zivelo — Design System (Panel de Control)

> Sistema de diseño extraído del **Panel de Control de Zivelo**. Listo para reutilizar en otro proyecto (React + Tailwind via CDN, o adaptado a CSS plano). Incluye tokens, modo oscuro, y el kit de componentes UI.

---

## 0. Stack base

- **React 18.3.1** (UMD) + **Babel standalone** para JSX inline.
- **Tailwind CSS** vía CDN (`https://cdn.tailwindcss.com`) con `darkMode: 'class'`.
- **Fuentes:** Inter (UI/headings) + JetBrains Mono (números/código).
- Arquitectura: cada vista en su propio `.jsx`, componentes compartidos exportados a `window`.

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
<script src="https://cdn.tailwindcss.com"></script>
```

---

## 1. Identidad

**Marca:** Zivelo · software house / consultoría tecnológica para PyMEs.
**Personalidad:** minimalista, premium, sobria, moderna, cercana.
**Regla de oro:** interfaz principalmente blanca y limpia; el **rojo Zivelo es acento**, no color dominante.

---

## 2. Tailwind config (copiar tal cual)

```js
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        zred:   '#D72228',  // rojo Zivelo — CTAs, acentos, links
        zred2:  '#B91C22',  // rojo oscuro — hover / estados
        carbon: '#1D1D1B',  // texto principal / fondos oscuros
        tint:   '#F5E0E1',  // fondo suave cálido
        soft:   '#F5F5F5',  // fondo secundario / divisores
        muted:  '#6B6B6B',  // texto secundario
        line:   'rgba(29,29,27,0.10)',  // bordes
        line2:  'rgba(29,29,27,0.06)',  // bordes sutiles
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: { sm:'12px', md:'16px', lg:'24px', xl:'32px', full:'999px' },
      boxShadow: {
        soft: '0 12px 30px rgba(29,29,27,0.06)',
        card: '0 18px 40px rgba(29,29,27,0.08)',
        red:  '0 12px 28px rgba(215,34,40,0.22)',
        pop:  '0 24px 60px rgba(29,29,27,0.18)',
      },
    }
  }
};
```

### Equivalencia en CSS vars (si no usas Tailwind)

```css
:root {
  --zred: #D72228;  --zred2: #B91C22;
  --carbon: #1D1D1B; --tint: #F5E0E1;
  --soft: #F5F5F5;  --muted: #6B6B6B;
  --line: rgba(29,29,27,0.10);  --line2: rgba(29,29,27,0.06);
  --bg: #FAFAF9;

  --radius-sm:12px; --radius-md:16px; --radius-lg:24px; --radius-xl:32px; --radius-full:999px;
  --shadow-soft:0 12px 30px rgba(29,29,27,0.06);
  --shadow-card:0 18px 40px rgba(29,29,27,0.08);
  --shadow-red:0 12px 28px rgba(215,34,40,0.22);
  --shadow-pop:0 24px 60px rgba(29,29,27,0.18);
}
```

---

## 3. Base / globals

```css
html, body { background: #FAFAF9; color: #1D1D1B; transition: background 220ms ease, color 220ms ease; }
body { font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }

/* Números tabulares (tablas, métricas, dinero) */
.nums { font-feature-settings: 'tnum' 1, 'cv11' 1; }

/* Grid de fondo decorativo */
.grid-bg {
  background-image:
    linear-gradient(to right, rgba(29,29,27,0.04) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(29,29,27,0.04) 1px, transparent 1px);
  background-size: 28px 28px;
}

/* Scrollbar delgado */
.scroll-thin::-webkit-scrollbar { width: 8px; height: 8px; }
.scroll-thin::-webkit-scrollbar-thumb { background: rgba(29,29,27,0.18); border-radius: 999px; }
.scroll-thin::-webkit-scrollbar-track { background: transparent; }

/* Placeholder de imagen / franjas */
.stripe { background-image: repeating-linear-gradient(135deg, rgba(29,29,27,0.06) 0 6px, transparent 6px 12px); }
```

### Focus ring (rojo Zivelo)

```css
input:focus, textarea:focus, select:focus, button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px rgba(215,34,40,0.12);
  border-color: #D72228 !important;
}
```

### Hover de superficies — anillo rojo (no ilumina el fondo)

```css
.hover\:bg-soft:hover, .hover\:bg-white:hover {
  background-color: rgba(215,34,40,0.05) !important;
  outline: 1px solid rgba(215,34,40,0.30);
  outline-offset: -1px;
}
```
> Patrón clave: en hover de filas/celdas/items usamos un **outline rojo** en vez de cambiar el fondo, para no desplazar el layout.

---

## 4. Animaciones

```css
@keyframes pop-in { from { opacity:0; transform: translateY(8px) scale(.98); } to { opacity:1; transform:none; } }
.pop-in { animation: pop-in 220ms ease both; }
@keyframes fade-in { from { opacity:0 } to { opacity:1 } }
.fade-in { animation: fade-in 160ms ease both; }

/* Drag & drop (kanban, listas) */
.dragging { opacity: 0.4; }
.drag-over { background: rgba(215,34,40,0.04); border-color: rgba(215,34,40,0.4) !important; }
```

| Token | Valor |
|---|---|
| Rápida (hover, fade) | `160ms ease` |
| Base (transiciones, tema) | `220ms ease` |
| Drawer / modal entrada | `260ms cubic-bezier(.2,.8,.2,1)` |

---

## 5. Modo oscuro (`.dark`)

Paleta carbon manteniendo el rojo Zivelo (aclarado a `#FF5A60` para contraste). Aplicar como overrides `!important`.

```css
.dark, .dark html, .dark body { background:#0E0E0D !important; color:#F2F2F0 !important; }

/* Superficies */
.dark .bg-white    { background-color:#1A1A18 !important; }
.dark .bg-soft     { background-color:#242422 !important; }
.dark .bg-tint     { background-color:rgba(215,34,40,0.14) !important; }
.dark .bg-carbon   { background-color:#000 !important; }

/* Bordes */
.dark .border-line  { border-color:rgba(255,255,255,0.08) !important; }
.dark .border-line2 { border-color:rgba(255,255,255,0.06) !important; }
.dark .border-tint  { border-color:rgba(215,34,40,0.22) !important; }

/* Texto */
.dark .text-carbon { color:#F2F2F0 !important; }
.dark .text-muted  { color:#9B9B98 !important; }
.dark .text-zred   { color:#FF5A60 !important; }

/* Form controls */
.dark input, .dark textarea, .dark select { background-color:#1A1A18 !important; color:#F2F2F0 !important; }
.dark input::placeholder, .dark textarea::placeholder { color:#6E6E6C !important; }

/* Grid de fondo en oscuro */
.dark .grid-bg {
  background-image:
    linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px);
}

/* Hover/focus más sutiles en oscuro */
.dark .hover\:bg-soft:hover, .dark .hover\:bg-white:hover {
  background-color: rgba(215,34,40,0.05) !important;
  outline: 1px solid rgba(215,34,40,0.14); outline-offset:-1px;
}
.dark input:focus, .dark textarea:focus, .dark select:focus, .dark button:focus-visible {
  box-shadow: 0 0 0 4px rgba(215,34,40,0.08) !important;
}
```

---

## 6. Status / badge colors (semánticos)

Cada estado tiene par light/dark. Patrón `bg-[#hex] text-[#hex]`:

| Estado | Light bg / text | Dark bg / text |
|---|---|---|
| Éxito / activo | `#E6F4EA` / `#1E6B3C` | `rgba(60,179,113,.18)` / `#6FCF93` |
| Advertencia / pendiente | `#FFF4DE` / `#7A5A12` | `rgba(224,168,0,.18)` / `#E0B84A` |
| Info | `#EEF2FF` / `#3A47B5` | `rgba(99,113,217,.20)` / `#93A0FF` |
| Morado | `#F2EAFE` / `#5A2EA6` | `rgba(141,93,232,.20)` / `#BFA0FF` |
| Rojo / urgente | `#FDECEC` / `#B91C22` | `rgba(215,34,40,.20)` / `#FF6F73` |

---

## 7. Kit de componentes (React)

Convenciones de todos los componentes: radios `rounded-full` (pills/botones) o `rounded-lg` (cards/inputs), bordes `border-line`, transiciones de 200ms, acento `zred`.

### Button
Variantes: `primary` (rojo + sombra roja + lift), `secondary` (blanco, borde→rojo en hover), `ghost`, `dark` (carbon), `danger` (blanco/rojo/tint). Tamaños `sm/md/lg`. Siempre `rounded-full font-semibold`.

```jsx
const sizes = { sm:'h-8 px-3 text-[13px]', md:'h-10 px-4 text-[14px]', lg:'h-12 px-5 text-[15px]' };
const variants = {
  primary:   'bg-zred text-white hover:shadow-red hover:-translate-y-px',
  secondary: 'bg-white text-carbon border border-line hover:border-zred hover:text-zred',
  ghost:     'bg-transparent text-carbon hover:bg-soft',
  dark:      'bg-carbon text-white hover:bg-black',
  danger:    'bg-white text-zred border border-tint hover:bg-tint',
};
// base: inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200
```

### IconButton
`w-9 h-9 rounded-full border border-line bg-white text-carbon hover:border-zred hover:text-zred`.

### Card
`bg-white border border-line rounded-lg`. Con `hover`: `hover:-translate-y-0.5 hover:shadow-card hover:border-zred/30`.

### Avatar / AvatarStack
Círculo con iniciales, color de fondo por usuario (`user.color`), texto blanco, fontSize ≈ 40% del tamaño. Stack usa `-space-x-2` + `ring-2 ring-white`; overflow muestra `+N` con `bg-soft`.

### Badge / Tag
`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-tight`. Tag aplica estilos de color desde un mapa `TAG_STYLES`.

### Input / Textarea / Select
Label en caps: `text-[12px] font-semibold uppercase tracking-wider mb-1.5`.
Control: `rounded-md border border-line bg-white text-[14px]` — Input `h-11 px-4`, Textarea `px-4 py-3 resize-none`. Select usa flecha SVG inline como `background-image`. Hint en `text-muted`, error en `text-zred`.

### Drawer (panel lateral derecho)
`fixed inset-0 z-50`, backdrop `bg-carbon/30 fade-in`, panel `right-0 h-full bg-white border-l border-line shadow-pop`, ancho default 460px, entrada `pop-in 260ms`. Header con título + botón X (`hover:bg-soft`). Cierra con Escape. Footer opcional con borde superior.

### Modal (centrado)
`fixed inset-0 z-50 flex items-center justify-center p-4`, backdrop igual, panel `bg-white rounded-lg shadow-pop border border-line2 pop-in max-h-[88vh]`, ancho default 520px. Mismo header/footer que Drawer.

### ProgressBar
Track `h-1.5 bg-soft rounded-full overflow-hidden`; relleno con `transition-all duration-500`, color default `#D72228`.

---

## 8. Helpers de formato (es-MX)

```js
formatDate(iso) // toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' })
formatMoney(n)  // Intl.NumberFormat('es-MX', { style:'currency', currency:'MXN', maximumFractionDigits:0 })
daysUntil(iso)  // días enteros desde hoy hasta iso
```

---

## 9. Tipografía

| Rol | Fuente | Notas |
|---|---|---|
| UI / headings | Inter 400–800 | `-letter-spacing` ligero en títulos grandes |
| Números / mono | JetBrains Mono 400–500 | métricas, IDs, código, montos en `.nums` |

| Elemento | Tamaño | Peso |
|---|---|---|
| Título de vista | 20–24px | 600–700 |
| Card title | 16–18px | 600 |
| Body / tabla | 14px | 400–500 |
| Label de form | 12px caps | 600 |
| Badge | 11px | 600 |

---

## 10. Layout del panel

- **Sidebar** fija a la izquierda + área de contenido con scroll propio (`scroll-thin`).
- Fondo de la app `#FAFAF9` (light) / `#0E0E0D` (dark), con `grid-bg` opcional en zonas decorativas.
- Cards sobre `bg-white`, separadas con `gap` (flex/grid), bordes `border-line`, radios `rounded-lg`.
- Header sticky con `backdrop-blur-md`.
- Densidad media: mucho aire, pero compacto donde hay datos (tablas, kanban).

---

## 11. Logos disponibles

En `uploads/` (variantes de la barra Zivelo):
`zivelo-bars-dark-full.svg`, `zivelo-bars-dark-compact.svg`, `zivelo-bars-white-full.svg`, `zivelo-bars-white-compact.svg`. Usar **dark** sobre fondos claros, **white** sobre carbon/oscuro.

---

## 12. Reglas para mantener consistencia

1. Rojo Zivelo siempre como **acento** (CTAs, links, focus, hover-outline), nunca como fondo masivo.
2. Hover de filas/items = **outline rojo**, no cambio de fondo (evita desplazar layout).
3. Todo elemento interactivo: transición de 200ms, focus ring rojo.
4. Pills (`rounded-full`) para botones/badges; `rounded-lg` para cards/inputs.
5. Números siempre tabulares (`.nums`) y en JetBrains Mono cuando aplique.
6. Cada estado semántico usa su par de color light/dark de la tabla §6.
7. Modo oscuro vía clase `.dark` + overrides `!important`; el rojo se aclara a `#FF5A60`.
