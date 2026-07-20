// Skeleton estático del grafo de stack. Se renderiza server-side en el
// HTML inicial para que Lighthouse pueda medir LCP sin esperar a que JS
// posicione los nodos del grafo interactivo.
//
// Los nodos y categorías están en las mismas posiciones que el grafo real
// (definidas en CAT_POS en StackGraph.tsx y STACK_CATS en src/lib/content).

import { STACK_CATS } from "@/lib/content";

const W = 880;
const H = 560;
const CENTER = { x: 440, y: 280 };
const CAT_POS: Record<string, { x: number; y: number }> = {
  Lenguajes: { x: 205, y: 150 },
  Web: { x: 675, y: 150 },
  Infraestructura: { x: 205, y: 410 },
  "Herramientas e IA": { x: 675, y: 410 },
};

export function StackGraphSkeleton() {
  const centerX = CENTER.x;
  const centerY = CENTER.y;

  // Últimos 2 nodos hoja por categoría como muestra del skeleton
  const sampleLeaves = STACK_CATS.map((cat) => {
    const c = CAT_POS[cat.name];
    const dir = { x: c.x - centerX, y: c.y - centerY };
    const len = Math.hypot(dir.x, dir.y);
    const nx = dir.x / len;
    const ny = dir.y / len;
    const px = -ny;
    const py = nx;
    const n = cat.leaves.length;
    // Mostrar solo los 3 primeros + los 2 últimos
    const indices = [0, 1, 2, n - 2, n - 1].filter((i) => i >= 0 && i < n);
    return indices.map((i) => {
      const off = i - (n - 1) / 2;
      const x = c.x + nx * 78 + px * off * 62 + nx * Math.abs(off) * 10;
      const y = c.y + ny * 78 + py * off * 62 + ny * Math.abs(off) * 10;
      return { id: cat.leaves[i], x, y, cat: cat.name };
    });
  }).flat();

  return (
    <div className="ak-stack-layout">
      <div className="ak-graph" aria-hidden="true">
        <svg className="ak-graph-svg" width={W} height={H} style={{ opacity: 0.15 }}>
          {/* Centro → categorías */}
          {STACK_CATS.map((cat) => {
            const c = CAT_POS[cat.name];
            return (
              <line
                key={`s-edge-${cat.name}`}
                x1={centerX}
                y1={centerY}
                x2={c.x}
                y2={c.y}
                stroke="currentColor"
                strokeWidth={1}
              />
            );
          })}
          {/* Categoría → hojas (solo las sample) */}
          {sampleLeaves.map((leaf) => {
            const c = CAT_POS[leaf.cat];
            return (
              <line
                key={`s-edge-${leaf.id}`}
                x1={c.x}
                y1={c.y}
                x2={leaf.x}
                y2={leaf.y}
                stroke="currentColor"
                strokeWidth={1}
              />
            );
          })}
        </svg>

        {/* Nodo centro */}
        <div className="ak-node ak-node-center" style={{ left: centerX, top: centerY }}>
          <span>Stack</span>
        </div>

        {/* Categorías */}
        {STACK_CATS.map((cat) => (
          <div
            key={`s-cat-${cat.name}`}
            className="ak-node ak-node-cat"
            style={{ left: CAT_POS[cat.name].x, top: CAT_POS[cat.name].y }}
          >
            <span className="ak-cat-swatch" style={{ background: `hsl(${cat.color})` }} />
            {cat.name}
          </div>
        ))}

        {/* Hojas (solo sample) */}
        {sampleLeaves.map((leaf) => (
          <div
            key={`s-leaf-${leaf.id}`}
            className="ak-node ak-node-leaf"
            style={{ left: leaf.x, top: leaf.y }}
          >
            {leaf.id}
          </div>
        ))}
      </div>
    </div>
  );
}
