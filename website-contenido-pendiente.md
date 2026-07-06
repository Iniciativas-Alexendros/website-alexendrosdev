# Contenido website-alexendrosdev — propuestas afinadas (perfil junior avanzado)

> **ESTADO (verificado 2026-06-22 contra `src/lib/content/`): PLAN ABIERTO, no aplicado.**
>
> - ❌ `stack.ts` → `years` sigue presente (`years: "TODO"` en todas las entradas). Pendiente eliminar el campo.
> - ⚠️ `testimonials.ts` → array vacío `[]` (sección oculta = fallback ✏️), **no** la versión ✅ "prueba en abierto" con enlaces a repos. Pendiente.
> - ❌ `services.ts` → no existe la entrada "Landing 1 página · desde €600". Pendiente añadirla.
> - 🔴 **LinkedIn**: URL recogida abajo pero el perfil "hay que mejorarlo mucho" → hilo aparte (ver `/memory`).
>   Decisiones ya cerradas en línea más abajo. No borrar hasta cerrar el PR de contenido.

> El contenido actual YA está bien calibrado para un perfil honesto de **junior avanzado**: stats de valor en
> vez de años ("5 proyectos publicados", "100% código tuyo"), "experiencia y CV bajo petición", tarifas con
> ancla ~€40-45/h. Aquí no parto de cero: te doy **propuestas concretas** por sección. Marca ✅ aprobar /
> ✏️ ajustar / ❌ descartar, rellena solo los datos que únicamente tú sabes, guarda y avísame.
> Estrategia transversal: **liderar con proyectos reales como prueba** (TrenchPass, plantillas/XEK, los dos
> sitios) en vez de inventar testimonios o métricas de cliente que un junior aún no tiene.

## 1. Posicionamiento y enlaces · `about.ts`, `site.ts`

- **Propuesta (✅)**: mantener "Desarrollador independiente" (evita el techo de "junior" sin mentir) y dejar
  que la **profundidad técnica de los proyectos** señale el nivel. No tocar el framing actual: funciona.
- **Dato que solo tú tienes** → **URL LinkedIn**: `(hay que mejorarlo mucho, esto queda como pendiente en hilo a parte. recuerdamelo) https://www.linkedin.com/in/alejandro-d-a-024391384/`
- Otros enlaces (GitHub ya está; ¿web `.me`, email público, Mastodon?): `alexendros.me`
- **Historial laboral** (`about.ts:35`): propuesta = **dejarlo como "bajo petición"** (ya está así). Un junior
  gana más mostrando proyectos que un timeline corto. ¿De acuerdo? ✏️: `No he sido contratado, sólo mostrar mis proyectos en activo más atractivos y mi certificado en Dev Full-Stack del bootcamp de Hack a Boss`

## 2. Años por tecnología · `stack.ts`

- **Propuesta fuerte (recomendada)**: **eliminar el campo `years`** del componente. El sitio ya decidió
  "valor, no años" (`about.ts`), y exponer 1-2 años por tech **infravende** a un junior avanzado. Dejas
  `level` + `projects` (ya presentes), que comunican capacidad sin poner número de años.
  - ✅ eliminar `years` (yo quito el campo del badge) · ✏️ otra cosa: `Aprobado quitar years.`
- **Alternativa** si prefieres mostrar algo: poner **"desde 2024"/"desde 2025"** honesto solo en las 3-4 techs
  núcleo (TypeScript, Python, Rust, Next.js) y omitir el resto. Indica el año real de arranque si la eliges: `El mismo que al finalizar el bootcamp. Desde entonces: proyectos independientes, aportaciones en GitHub, websites bajo pedido.`

## 3. Tarifas · `services.ts`, `checkout.ts`

- Las tarifas actuales (Starter €1.200 · Pro €2.900 · Scale €5.900+ · Revisión desde €600 · ancla €40-45/h)
  **encajan con un junior avanzado accesible**. Propuesta = **mantener orientativas** (☑) salvo que quieras cerrar.
  - x mantener orientativas (recomendado) ☐ fijar tarifas (indica abajo)
- **Sugerencia de afinado (opcional)**: añadir un punto de entrada muy bajo para captar primeros clientes —
  p.ej. **"Landing 1 página · desde €600"** dentro de Webs. ¿Lo añado? ✅/❌: `Sí`
- Si fijas: Web/landing `____` · App/plataforma `____` · Revisión `____` · Automatización `____`

## 4. Testimonios · `testimonials.ts`

- **Realidad junior**: probablemente aún sin testimonios de cliente. **Propuesta = no fabricar**. Dos opciones:
  - ✅ **(recomendada)** sustituir la sección "testimonios" por **"prueba en abierto"**: enlaces a los repos y
    sitios reales (TrenchPass, plantillas, alexendros.me, este portfolio) como evidencia verificable. Yo lo
    monto reusando el componente.
  - ✏️ dejar la sección oculta hasta tener testimonios reales.
  - Si ya tienes 1-2 reales (texto · nombre · rol): `Aprobado, no tengo testimonios.`

## 5. Case studies · `case-studies.ts`

Propuesta = **reencuadrar como proyectos de portfolio honestos**, con la **profundidad técnica como gancho**
(es tu ventaja real frente a otros juniors). Borradores que yo redacto si apruebas:

- **TrenchPass** ✅: "Gateway MCP en Rust: custodia de credenciales con doble factor Bearer+mTLS, auditoría
  append-only en Postgres y OTLP→SigNoz. Binario único, AGPL." (sin métricas de adopción inventadas)
- **plantillas / XEK** (✏️NO INCLUIR): "Ecosistema `claude-init`: 15 módulos con validadores `--strict` y CI por módulo;
  catálogo XEK de skills de verificación check-only."
- **Gráficas Nasve** ⚠️: hoy el texto promete "métricas reales (visitas/presupuestos)". Pero ecom es una
  **plantilla/ejemplo** (lo aclaraste). **Propuesta = reencuadrar como "demo/plantilla de e-commerce para
  imprentas"**, sin métricas de cliente. ✅ reencuadrar
- Los dos sitios (`.dev` backend propio, `.me` estático) como piezas de front + arquitectura. ✅

## 6. Métricas de proyectos · `projects.ts`

- **Propuesta**: para proyectos personales, **liderar con alcance técnico** (lenguaje, arquitectura, lo
  resuelto) en vez de stars/usuarios que un junior aún no tiene. Yo quito los `TODO` de métricas no públicas
  y dejo la descripción técnica. ✅

---

**Cuando termines**: guarda y dime **"contenido listo"**. Por defecto, si solo me das el LinkedIn y apruebas las
propuestas ✅, aplico: quitar `years`, "prueba en abierto" en vez de testimonios, reencuadre de case-studies
(incl. Gráficas Nasve como plantilla), limpieza de `TODO` en projects — corro `pnpm typecheck && build` y abro el PR.
