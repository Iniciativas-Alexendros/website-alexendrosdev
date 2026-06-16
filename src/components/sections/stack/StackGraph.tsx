"use client";

import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type WheelEvent,
} from "react";
import { STACK_CATS, STACK_DETAIL } from "@/lib/content";
import type { StackDetail } from "@/lib/content";
import { Icon } from "@/components/ui/Icon";

const W = 880;
const H = 560;
const CENTER = { x: 440, y: 280 };
const CAT_POS: Record<string, { x: number; y: number }> = {
  Lenguajes: { x: 205, y: 150 },
  Web: { x: 675, y: 150 },
  "Infra & Datos": { x: 205, y: 410 },
  "Tooling & IA": { x: 675, y: 410 },
};

type NodeType = "center" | "cat" | "leaf";
interface GraphNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  color?: string;
  cat?: string;
}
interface GraphEdge {
  from: string;
  to: string;
  cat: string;
}

function buildLayout(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [{ id: "Stack", type: "center", x: CENTER.x, y: CENTER.y }];
  const edges: GraphEdge[] = [];
  STACK_CATS.forEach((cat) => {
    const c = CAT_POS[cat.name];
    nodes.push({ id: cat.name, type: "cat", x: c.x, y: c.y, color: cat.color });
    edges.push({ from: "Stack", to: cat.name, cat: cat.name });
    const dir = { x: c.x - CENTER.x, y: c.y - CENTER.y };
    const len = Math.hypot(dir.x, dir.y);
    dir.x /= len;
    dir.y /= len;
    const perp = { x: -dir.y, y: dir.x };
    const n = cat.leaves.length;
    cat.leaves.forEach((leaf, i) => {
      const off = i - (n - 1) / 2;
      const x = c.x + dir.x * 78 + perp.x * off * 62 + dir.x * Math.abs(off) * 10;
      const y = c.y + dir.y * 78 + perp.y * off * 62 + dir.y * Math.abs(off) * 10;
      nodes.push({ id: leaf, type: "leaf", x, y, cat: cat.name, color: cat.color });
      edges.push({ from: cat.name, to: leaf, cat: cat.name });
    });
  });
  return { nodes, edges };
}

function detailFor(name: string): StackDetail {
  if (STACK_DETAIL[name]) return STACK_DETAIL[name];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 1000;
  const level = 0.62 + (h % 30) / 100;
  const years = 2 + (h % 6);
  return {
    level,
    years: `${years} años`,
    projects: ["TrenchPass", "XEK", "plantillas"],
    note: "Herramienta activa en el stack actual.",
  };
}

export function StackGraph() {
  const { nodes, edges } = useMemo(() => buildLayout(), []);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [sel, setSel] = useState("Rust");
  const [hot, setHot] = useState<string | null>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const s = Math.min(1, (r.width - 40) / W);
    setScale(s);
    setPan({ x: (r.width - W * s) / 2, y: (r.height - H * s) / 2 });
  }, []);

  const node = (id: string) => nodes.find((n) => n.id === id);
  const selCat = (() => {
    const s = node(sel);
    return s ? (s.type === "cat" ? s.id : (s.cat ?? null)) : null;
  })();
  const active = hot ?? selCat;

  const onWheel = (e: WheelEvent) => {
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    const ns = Math.max(0.5, Math.min(2, scale * (e.deltaY < 0 ? 1.1 : 0.9)));
    const k = ns / scale;
    setPan((p) => ({ x: mx - (mx - p.x) * k, y: my - (my - p.y) * k }));
    setScale(ns);
  };
  const onDown = (e: PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    wrapRef.current?.classList.add("dragging");
  };
  const onMove = (e: PointerEvent) => {
    if (!drag.current) return;
    setPan({
      x: drag.current.px + (e.clientX - drag.current.x),
      y: drag.current.py + (e.clientY - drag.current.y),
    });
  };
  const onUp = () => {
    drag.current = null;
    wrapRef.current?.classList.remove("dragging");
  };
  const zoom = (f: number) => setScale((s) => Math.max(0.5, Math.min(2, s * f)));
  const reset = () => {
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    const s = Math.min(1, (r.width - 40) / W);
    setScale(s);
    setPan({ x: (r.width - W * s) / 2, y: (r.height - H * s) / 2 });
  };

  const d = detailFor(sel);

  return (
    <div className="ak-stack-layout">
      <div
        className="ak-graph dotgrid ak-dotgrid"
        ref={wrapRef}
        onWheel={onWheel}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      >
        <span className="ak-graph-hint">arrastra · scroll para zoom · clic en un nodo</span>
        <div
          className="ak-graph-inner"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
        >
          <svg className="ak-graph-svg" width={W} height={H}>
            {edges.map((e, i) => {
              const a = node(e.from)!;
              const b = node(e.to)!;
              const isHot = active === e.cat;
              return (
                <line
                  key={i}
                  className={`ak-edge ${isHot ? "hot" : ""}`.trim()}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                />
              );
            })}
          </svg>
          {nodes.map((n) => {
            const dim = active && n.type !== "center" && n.cat !== active && n.id !== active;
            const cls =
              `ak-node ak-node-${n.type} ${sel === n.id ? "sel" : ""} ${dim ? "dim" : ""}`.trim();
            return (
              <div
                key={n.id}
                className={cls}
                style={{ left: n.x, top: n.y }}
                tabIndex={n.type !== "center" ? 0 : -1}
                role="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  if (n.type !== "center") setSel(n.id);
                }}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && n.type !== "center") {
                    e.preventDefault();
                    setSel(n.id);
                  }
                }}
                onMouseEnter={() => n.type === "cat" && setHot(n.id)}
                onMouseLeave={() => setHot(null)}
              >
                {n.type === "center" ? (
                  <>
                    <span>Stack</span>
                    <small>
                      {STACK_CATS.length} · {STACK_CATS.reduce((s, c) => s + c.leaves.length, 0)}
                    </small>
                  </>
                ) : n.type === "cat" ? (
                  <>
                    <span className="ak-cat-swatch" style={{ background: `hsl(${n.color})` }} />
                    {n.id}
                  </>
                ) : (
                  n.id
                )}
              </div>
            );
          })}
        </div>
        <div className="ak-graph-controls">
          <button type="button" onClick={() => zoom(1.15)} aria-label="Acercar">
            <Icon name="plus" size={16} />
          </button>
          <button type="button" onClick={() => zoom(0.87)} aria-label="Alejar">
            <Icon name="minus" size={16} />
          </button>
          <button type="button" onClick={reset} aria-label="Centrar">
            <Icon name="locate-fixed" size={16} />
          </button>
        </div>
      </div>

      <div className="ak-stack-side">
        <div className="ak-panel">
          <div className="ak-side-group-t">Categorías</div>
          {STACK_CATS.map((c) => (
            <button
              key={c.name}
              type="button"
              className={`ak-legend-row ${active === c.name ? "on" : ""}`.trim()}
              onMouseEnter={() => setHot(c.name)}
              onMouseLeave={() => setHot(null)}
              onClick={() => setSel(c.name)}
            >
              <span className="l">
                <span className="sw" style={{ background: `hsl(${c.color})` }} />
                {c.name}
              </span>
              <span className="n">{c.leaves.length}</span>
            </button>
          ))}
        </div>
        <div className="ak-panel">
          <div className="ak-detail-h">
            {"// detalle · "}
            {sel}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
            <div className="ak-detail-row">
              <span className="lbl">Nivel</span>
              <span>{Math.round(d.level * 100)}%</span>
            </div>
            <div className="ak-level">
              <span style={{ width: `${d.level * 100}%` }} />
            </div>
          </div>
          <div className="ak-detail-row" style={{ marginBottom: 12 }}>
            <span className="lbl">Experiencia</span>
            <span>{d.years}</span>
          </div>
          <div className="ak-side-group-t" style={{ marginBottom: 8 }}>
            Proyectos
          </div>
          <div className="ak-pcard-tags" style={{ marginBottom: 12 }}>
            {d.projects.map((p) => (
              <span key={p} className="ak-tag">
                {p}
              </span>
            ))}
          </div>
          <p className="ak-principle-body" style={{ margin: 0 }}>
            {d.note}
          </p>
        </div>
      </div>
    </div>
  );
}
