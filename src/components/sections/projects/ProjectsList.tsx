"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { PROJECTS } from "@/lib/content/projects";
import { getProjectImageOrGradient } from "@/lib/project-images";
import { Icon, Reveal } from "@/components/ui";

const CATEGORIES = ["Todas", ...Array.from(new Set(PROJECTS.map((p) => p.category)))];
const TAGS = Array.from(new Set(PROJECTS.flatMap((p) => p.tags)));

export function ProjectsList() {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredProjects = useMemo(() => {
    return PROJECTS.filter((p) => {
      const catMatch = selectedCategory === "Todas" || p.category === selectedCategory;
      const searchMatch =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const tagMatch = selectedTags.length === 0 || selectedTags.every((t) => p.tags.includes(t));
      return catMatch && searchMatch && tagMatch;
    });
  }, [selectedCategory, searchQuery, selectedTags]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  return (
    <div className="ak-projects-page">
      <aside
        className={`ak-projects-sidebar ${sidebarOpen ? "open" : ""}`}
        role="complementary"
        aria-label="Filtros de proyectos"
      >
        <div className="ak-sidebar-header">
          <h2 className="ak-h3">Filtros</h2>
          <button
            className="ak-sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar filtros"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="ak-filter-group">
          <label className="ak-filter-label" htmlFor="category-filter">
            Categoría
          </label>
          <select
            id="category-filter"
            className="ak-filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="ak-filter-group">
          <label className="ak-filter-label" htmlFor="search-filter">
            Buscar
          </label>
          <input
            id="search-filter"
            type="search"
            className="ak-filter-input"
            placeholder="Título, descripción, stack…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="ak-filter-group">
          <label className="ak-filter-label">Stack</label>
          <div className="ak-tag-cloud" role="group" aria-label="Etiquetas de tecnología">
            {TAGS.map((tag) => (
              <button
                key={tag}
                className={`ak-tag ${selectedTags.includes(tag) ? "on" : ""}`}
                onClick={() => toggleTag(tag)}
                aria-pressed={selectedTags.includes(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="ak-filter-actions">
          <button
            className="ak-btn-reset"
            onClick={() => {
              setSelectedCategory("Todas");
              setSearchQuery("");
              setSelectedTags([]);
            }}
            disabled={selectedCategory === "Todas" && !searchQuery && selectedTags.length === 0}
          >
            Limpiar
          </button>
          <span className="ak-results-count">
            {filteredProjects.length} {filteredProjects.length === 1 ? "proyecto" : "proyectos"}
          </span>
        </div>
      </aside>

      <main className="ak-projects-main">
        <header className="ak-projects-header">
          <div className="ak-header-top">
            <h1 className="ak-page-title">Proyectos</h1>
            <button
              className="ak-sidebar-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir filtros"
            >
              <Icon name="filter" size={20} />
              Filtros
            </button>
          </div>
          <p className="ak-page-lead">
            Webs, plataformas y herramientas a medida. Código abierto, propiedad tuya.
          </p>
        </header>

        {filteredProjects.length === 0 ? (
          <div className="ak-empty" role="status">
            <Icon name="folder-open" size={48} className="ak-empty-icon" />
            <h2 className="ak-empty-title">Sin resultados</h2>
            <p className="ak-empty-text">
              No hay proyectos que coincidan con los filtros actuales.
            </p>
            <button
              className="ak-btn ak-btn-secondary"
              onClick={() => {
                setSelectedCategory("Todas");
                setSearchQuery("");
                setSelectedTags([]);
              }}
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="ak-masonry" role="list" aria-label="Lista de proyectos">
            {filteredProjects.map((p, i) => {
              const lcpOptimized = i === 0;
              const tile = (
                <article className="ak-masonry-tile" role="listitem" key={p.id}>
                  <Link href={`/proyectos/${p.id}`} className="ak-tile-link">
                    <div className="ak-tile-media" style={{ aspectRatio: "4 / 3" }}>
                      {(() => {
                        const img = getProjectImageOrGradient(p.id);
                        return img.type === "image" ? (
                          // Imágenes de proyecto son dinámicas y pueden provenir
                          // de dominios externos; se mantiene <img>.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img.src}
                            alt={p.title}
                            loading={lcpOptimized ? "eager" : "lazy"}
                            {...(lcpOptimized ? { fetchPriority: "high" } : {})}
                            className="ak-tile-img"
                          />
                        ) : (
                          <div
                            className="ak-tile-img"
                            style={{ background: img.style, width: "100%", height: "100%" }}
                            aria-hidden="true"
                          />
                        );
                      })()}
                      <span className="ak-tile-badge">{p.category}</span>
                    </div>
                    <div className="ak-tile-body">
                      <div className="ak-tile-meta">
                        <span className="ak-tile-idx">{p.id}</span>
                        <span className="ak-tile-year">{p.year}</span>
                      </div>
                      <h2 className="ak-tile-title">{p.title}</h2>
                      <p className="ak-tile-desc">{p.desc}</p>
                      <div className="ak-tile-tags">
                        {p.tags.slice(0, 3).map((t) => (
                          <span key={t} className="ak-tag">
                            {t}
                          </span>
                        ))}
                        {p.tags.length > 3 && (
                          <span className="ak-tag ak-tag-more">+{p.tags.length - 3}</span>
                        )}
                      </div>
                      <div className="ak-tile-metrics">
                        {p.metrics.slice(0, 2).map((m) => (
                          <span key={m.l} className="ak-tile-metric">
                            <b>{m.v}</b>
                            <span>{m.l}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                </article>
              );

              return lcpOptimized ? (
                tile
              ) : (
                <Reveal key={p.id} delay={i * 0.06}>
                  {tile}
                </Reveal>
              );
            })}
          </div>
        )}
      </main>

      {sidebarOpen && (
        <div
          className="ak-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
