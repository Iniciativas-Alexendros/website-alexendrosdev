"use client";

import Image from "next/image";
import { useEffect, useMemo, useCallback, useRef, useState } from "react";
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
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 880px)").matches,
  );
  const filterTriggerRef = useRef<HTMLButtonElement>(null);
  const filterCloseRef = useRef<HTMLButtonElement>(null);
  const filterDialogRef = useRef<HTMLElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const wasSidebarOpen = useRef(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 880px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!sidebarOpen) {
      if (wasSidebarOpen.current) restoreFocusRef.current?.focus();
      wasSidebarOpen.current = false;
      return;
    }

    wasSidebarOpen.current = true;
    filterCloseRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = filterDialogRef.current?.querySelectorAll<HTMLElement>(
        "button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]",
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

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
        ref={filterDialogRef}
        className={`ak-projects-sidebar ${sidebarOpen ? "open" : ""}`}
        role={sidebarOpen ? "dialog" : "complementary"}
        aria-modal={sidebarOpen ? "true" : undefined}
        aria-labelledby="projects-filters-title"
        aria-label="Filtros de proyectos"
        aria-hidden={!sidebarOpen && isMobile ? "true" : undefined}
      >
        <div className="ak-sidebar-header">
          <h2 id="projects-filters-title" className="ak-h3">
            Filtros
          </h2>
          <button
            ref={filterCloseRef}
            type="button"
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
                type="button"
                className={`ak-tag ${selectedTags.includes(tag) ? "on" : ""}`}
                onClick={() => toggleTag(tag)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleTag(tag);
                  }
                }}
                aria-pressed={selectedTags.includes(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="ak-filter-actions">
          <button
            type="button"
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

      <section
        className="ak-projects-main"
        aria-labelledby="projects-title"
        aria-hidden={isMobile && sidebarOpen ? "true" : undefined}
      >
        <header className="ak-projects-header">
          <div className="ak-header-top">
            <h1 id="projects-title" className="ak-page-title">
              Proyectos
            </h1>
            <button
              ref={filterTriggerRef}
              type="button"
              className="ak-sidebar-toggle"
              onClick={(event) => {
                restoreFocusRef.current = event.currentTarget;
                setSidebarOpen(true);
              }}
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
              type="button"
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
                <article
                  className={lcpOptimized ? "ak-masonry-tile" : undefined}
                  role="listitem"
                  key={p.id}
                >
                  <Link href={`/proyectos/${p.id}`} className="ak-tile-link">
                    <div className="ak-tile-media">
                      {(() => {
                        const img = getProjectImageOrGradient(p.id);
                        return img.type === "image" ? (
                          <Image
                            src={img.src}
                            alt={p.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            priority={lcpOptimized}
                            className="ak-tile-img"
                          />
                        ) : (
                          <div
                            className="ak-tile-fallback"
                            style={{ background: img.style }}
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
                <Reveal className="ak-masonry-tile" key={p.id} delay={i * 0.06}>
                  {tile}
                </Reveal>
              );
            })}
          </div>
        )}
      </section>

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
