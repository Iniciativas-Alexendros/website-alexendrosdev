"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PROJECTS } from "@/lib/content";
import type { Project } from "@/lib/content";
import { Icon } from "@/components/ui/Icon";
import { Eyebrow } from "@/components/ui/SectionHead";

const PROJ_CATS = ["Todos", "Web App", "Plataforma", "Open Source"];
const ORDERS: [string, string][] = [
  ["recientes", "Más recientes"],
  ["antiguos", "Más antiguos"],
  ["destacados", "Destacados primero"],
];

function ProjTile({ p }: { p: Project }) {
  return (
    <Link href={`/proyectos/${p.id}`} className="ak-tile" data-reveal>
      <div className="ak-tile-media" style={{ height: p.h }}>
        <div className="ak-tile-thumb" />
        {p.featured && (
          <span className="ak-tile-star">
            <Icon name="star" size={13} />
          </span>
        )}
        <span className="ak-tile-cat">{p.category}</span>
        <div className="ak-tile-overlay">
          {p.metrics.slice(0, 2).map((m) => (
            <span key={m.l} className="ak-tile-stat">
              <b>{m.v}</b> {m.l}
            </span>
          ))}
        </div>
      </div>
      <div className="ak-tile-body">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 8,
          }}
        >
          <h3 className="ak-tile-title">{p.title}</h3>
          <span className="mono" style={{ color: "hsl(var(--text-muted))", fontSize: 11 }}>
            {p.year}
          </span>
        </div>
        <p className="ak-tile-desc">{p.desc}</p>
        <div className="ak-pcard-tags">
          {p.tags.slice(0, 3).map((t) => (
            <span key={t} className="ak-tag">
              {t}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export function ProjectsView() {
  const [cat, setCat] = useState("Todos");
  const [q, setQ] = useState("");
  const [order, setOrder] = useState("recientes");

  const filtered = useMemo(() => {
    let list = PROJECTS.filter(
      (p) =>
        (cat === "Todos" || p.kind === cat) &&
        (q === "" ||
          (p.title + p.desc + p.category + p.tags.join()).toLowerCase().includes(q.toLowerCase())),
    );
    if (order === "antiguos") list = [...list].sort((a, b) => a.year.localeCompare(b.year));
    else if (order === "recientes") list = [...list].sort((a, b) => b.year.localeCompare(a.year));
    else if (order === "destacados")
      list = [...list].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    return list;
  }, [cat, q, order]);

  return (
    <div className="ak-container">
      <section className="ak-page-head" data-screen-label="header">
        <Eyebrow>portafolio · {PROJECTS.length}+ proyectos</Eyebrow>
        <h1 className="ak-page-title">Proyectos</h1>
        <p className="ak-page-lead">
          Una selección de lo que he construido: webs y aplicaciones, plataformas y backend,
          herramientas a medida y proyectos open source.
        </p>
      </section>
      <section className="ak-section" style={{ paddingTop: 14 }}>
        <div className="ak-proj-controls" style={{ marginBottom: 14 }}>
          <div className="ak-search">
            <Icon name="search" size={16} />
            <input
              placeholder="Buscar proyecto, stack…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Buscar proyecto"
            />
          </div>
          <div className="ak-chips">
            {PROJ_CATS.map((c) => (
              <button
                key={c}
                type="button"
                className={`ak-chip ${c === cat ? "on" : ""}`.trim()}
                onClick={() => setCat(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="ak-proj-bar">
          <span className="ak-count">
            {filtered.length} {filtered.length === 1 ? "proyecto" : "proyectos"}
          </span>
          <span className="ak-order">
            <Icon name="arrow-up-down" size={14} />
            Orden
            <select value={order} onChange={(e) => setOrder(e.target.value)} aria-label="Orden">
              {ORDERS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </span>
        </div>
        {filtered.length === 0 ? (
          <div className="ak-empty">Sin resultados para “{q}”.</div>
        ) : (
          <div className="ak-masonry">
            {filtered.map((p) => (
              <ProjTile key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
