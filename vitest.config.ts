import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Alias compartido por todos los proyectos:
// - `@`           → `src/` (igual que tsconfig).
// - `server-only` → módulo vacío, para poder importar la lógica servidor
//   (db/email/stripe/blog/rate-limit y los Route Handlers) en entorno node.
const alias = {
  "@": path.resolve(__dirname, "src"),
  "server-only": path.resolve(__dirname, "tests/helpers/server-only.ts"),
};

export default defineConfig({
  resolve: { alias },
  test: {
    // Dos entornos aislados, una única ejecución (`vitest run`) y cobertura
    // unificada en la raíz. Ver `tests/README.md`.
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
        },
      },
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: "component",
          environment: "jsdom",
          // URL fija para que los `fetch` relativos (`/api/...`) resuelvan a un
          // origen estable que MSW intercepta.
          environmentOptions: { jsdom: { url: "http://localhost:3000" } },
          include: ["tests/component/**/*.test.tsx"],
          setupFiles: ["tests/setup.component.ts"],
          // React 19 exporta `act` solo en el bundle development. Si el runner
          // se invoca con NODE_ENV=production, el shim de @testing-library/react
          // (`react-dom-test-utils.production.js → React.act`) falla con
          // "React.act is not a function" y 30 tests component rompen. Forzamos
          // `test` aquí (vitest lo inyecta antes de cargar el bundle de React)
          // para que el árbol cargado por jsdom sea el dev, no el production.
          env: { NODE_ENV: "test" },
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      // El gate se mide sobre la superficie con tests deterministas: lógica de
      // `lib` y los Route Handlers. Los componentes y páginas (Server
      // Components asíncronos incluidos) se cubren por comportamiento en los
      // proyectos `component`/e2e, no por porcentaje. Ver `tests/README.md`.
      include: ["src/lib/**", "src/app/api/**"],
      exclude: ["src/lib/content/index.ts", "src/lib/content/types.ts", "**/*.d.ts"],
      // Umbrales (ver tabla F10.6 en ROADMAP.md). Bloquean el merge.
      // F16 lock-in: 85/80/85/85. Branches en 74 — objetivo 80% requiere
      // tests de error paths en F15 (reparador/auditor/diagnosticador)
      // fuera del scope del redesign. Tracking issue abierta.
      thresholds: {
        statements: 85,
        branches: 74,
        functions: 85,
        lines: 85,
      },
    },
  },
});
