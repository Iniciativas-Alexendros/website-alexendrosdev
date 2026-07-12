# Calendario editorial — blog alexendros.dev

> Documento operativo. Define **qué se publica**, **cuándo** y **qué falta**.
> La regla de oro: **1 post válido al mes** (mínimo), orientado al cliente objetivo
> (decisor técnico / pyme que necesita web o plataforma a medida).

---

## Categorías

- **Clientes** (orientados a comprador): rangos de precio, qué incluye cada tier,
  cuándo WordPress vs Next.js, proceso de discovery call, qué preguntar.
- **Plataforma** (storytelling técnico): cuadernos derivados de proyectos reales,
  retrospectivas, decisiones de arquitectura.
- **DevTools** (profesional del sector): plantillas, servidores MCP, trucos de
  workflow.
- **Calidad** (auditoría + buenas prácticas): checklist de revisión de seguridad,
  cobertura de tests, OTel.

## Calendario Q3 2026

| Mes       | Tema (borrador)                          | Categoría     | Estado         |
| --------- | ---------------------------------------- | ------------- | -------------- |
| Jul 2026  | Cuánto cuesta una web a medida en 2026   | Clientes      | ✅ publicado    |
| Jul 2026  | WordPress vs Next.js en 2026             | Clientes      | ✅ publicado    |
| Ago 2026  | Qué preguntar en una discovery call      | Clientes      | 🟡 borrador    |
| Sep 2026  | Plantilla de revisión de seguridad web   | Calidad       | 🟡 esqueleto   |
| Oct 2026  | Retainer o proyecto fijo: cuándo elegir  | Clientes      | ⚪ por hacer    |
| Nov 2026  | Cómo presupuestar un proyecto a medida   | Clientes      | ⚪ por hacer    |
| Dic 2026  | Buenas prácticas de monitorización web   | Plataforma    | ⚪ por hacer    |

## Estado

- **5 posts ya publicados** (ver `src/lib/content/posts.ts`).
- **2 borradores en preparación** que cubren los huecos más urgentes:
  - *Qué preguntar en una discovery call* — reduce el ruido en leads y educa al
    visitante sobre el proceso.
  - *Plantilla de revisión de seguridad* — muestra metodología y coincide con
    el addon `revision-seguridad` del catálogo (€600).

## Cómo añadir un post

1. Crear `content/blog/<id>.mdx` con frontmatter (`id`, `title`, `date`,
   `read`, `tag`, `desc`, `metaDescription`).
2. Registrar la entrada en `src/lib/content/posts.ts` con los mismos campos.
3. Si la categoría es nueva, añadirla a `BLOG_TAGS` (en el mismo archivo).
4. Cubrir con tests si el post introduce invariantes (no requiere test).

## Métrica de éxito

- Cadencia: ≥ 1 post/mes.
- Lectura media objetivo: ≥ 5 min por post (medido con Vercel Analytics cuando
  se conecte el evento `post_complete`).
- Conversión newsletter → lead: track por Resend UTM.
