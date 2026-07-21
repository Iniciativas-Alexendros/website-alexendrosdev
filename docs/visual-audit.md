# Auditoría Visual — Pipeline de imágenes

Pipeline automatizado para auditar, clasificar y reemplazar imágenes en el sitio.

## Estructura

```
scripts/visual-audit/
├── extract-images.js          # Browser-side: extrae imgs, backgrounds, SVGs
├── crawl-and-extract.mjs      # Playwright: crawl, screenshot, extract, inventario
├── preclassify.mjs            # Heurísticas + DECISIONS.md + inventory.json
├── capture-real.mjs           # Captura screenshots reales de proyectos live
└── run-audit.sh               # Orquestación completa

artifacts/visual-audit/
├── screenshots/               # PNGs full-page (1440px)
├── images/                    # Recortes individuales de imágenes
├── replacements/              # Capturas reales sin normalizar
└── reports/
    ├── inventory.json         # Inventario completo con veredictos
    ├── DECISIONS.md           # Tabla revisable por humano
    └── pages/                 # JSONs por ruta
```

## Uso

### 1. Servidor local

```bash
pnpm dev
```

### 2. Crawl + extracción

```bash
node scripts/visual-audit/crawl-and-extract.mjs
```

Genera: `artifacts/visual-audit/reports/pages/*.json` + `screenshots/*.png`

### 3. Clasificación

```bash
node scripts/visual-audit/preclassify.mjs
```

Actualiza: `inventory.json` + genera `DECISIONS.md`

### 4. Capturas reales (Sprint 4)

```bash
node scripts/visual-audit/capture-real.mjs
```

Captura screenshots de proyectos con URL live y los guarda en `public/images/projects/{slug}/hero.png`

### 5. Pipeline completo

```bash
bash scripts/visual-audit/run-audit.sh
```

O desde npm:

```bash
pnpm audit:visual        # local
pnpm audit:visual:prod   # contra producción
```

## Tests de regresión

```bash
pnpm test:e2e:images       # Solo test de imágenes rotas
pnpm e2e tests/e2e/images-no-broken.spec.ts
```

## Verificación manual

1. `pnpm build` — verifica que todo compila
2. Abrir `http://localhost:3000` en light y dark mode
3. Verificar que las imágenes reales cargan y los gradientes se ven correctos
4. `playwright test tests/e2e/images-no-broken.spec.ts`

## Mapa de reemplazo (Sprint 4)

| Proyecto       | Tipo            | Fuente                                          |
| -------------- | --------------- | ----------------------------------------------- |
| alexendros-me  | Imagen real     | `public/images/projects/alexendros-me/hero.png` |
| nasve          | Imagen real     | `public/images/projects/nasve/hero.png`         |
| pipeline-crm   | Gradiente OKLCH | `var(--primary-400)` → `var(--success)`         |
| stripe-catalog | Gradiente OKLCH | `var(--accent)` → `var(--primary-400)`          |
| mcp-toolkit    | Gradiente OKLCH | `var(--info)` → `var(--primary-400)`            |

## Criterios de clasificación

- **KEEP**: logo, avatar, icono semántico, captura real del proyecto citado
- **REPLACE**: imagen stock que no representa el contenido citado, hay URL capturable
- **REMOVE**: decorativa sin valor, rota (404), duplicada, sin URL de reemplazo
