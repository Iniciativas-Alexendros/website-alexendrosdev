"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ProjectCard } from "@/components/sections/projects/ProjectCard";
import { PROJECTS } from "@/lib/content/projects";
import { Button, Icon, Reveal } from "@/components/ui";

const CATEGORIES = ["Todas", ...Array.from(new Set(PROJECTS.map((project) => project.category)))];
const TAGS = Array.from(new Set(PROJECTS.flatMap((project) => project.tags)));

function resetFilters(
  setSelectedCategory: (value: string) => void,
  setSearchQuery: (value: string) => void,
  setSelectedTags: (value: string[]) => void,
) {
  setSelectedCategory("Todas");
  setSearchQuery("");
  setSelectedTags([]);
}

export function ProjectsList() {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  // Keep the server and first client render identical. The media query is
  // resolved in the effect below, after hydration, so mobile drawers never
  // depend on browser-only state during SSR.
  const [isMobile, setIsMobile] = useState(false);
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
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return PROJECTS.filter((project) => {
      const categoryMatches = selectedCategory === "Todas" || project.category === selectedCategory;
      const searchMatches =
        !normalizedQuery ||
        [project.title, project.desc, project.category, project.kind, ...project.tags].some(
          (value) => value.toLowerCase().includes(normalizedQuery),
        );
      const tagsMatch =
        selectedTags.length === 0 || selectedTags.every((tag) => project.tags.includes(tag));
      return categoryMatches && searchMatches && tagsMatch;
    });
  }, [searchQuery, selectedCategory, selectedTags]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((previous) =>
      previous.includes(tag) ? previous.filter((selected) => selected !== tag) : [...previous, tag],
    );
  }, []);

  const hasFilters =
    selectedCategory !== "Todas" || Boolean(searchQuery) || selectedTags.length > 0;

  return (
    <div
      className="ak-container ak-projects-page"
      data-projects-hydrated={hydrated ? "true" : undefined}
    >
      <aside
        ref={filterDialogRef}
        className={`ak-projects-sidebar ${sidebarOpen ? "open" : ""}`}
        role={sidebarOpen ? "dialog" : "complementary"}
        aria-modal={sidebarOpen ? "true" : undefined}
        aria-labelledby="projects-filters-title"
        aria-label="Filtros de proyectos"
        aria-hidden={!sidebarOpen && isMobile ? "true" : undefined}
        inert={!sidebarOpen && isMobile ? true : undefined}
      >
        <div className="ak-sidebar-header">
          <div>
            <h2 id="projects-filters-title" className="ak-projects-filter-title">
              Filtrar proyectos
            </h2>
            <p className="ak-projects-filter-help">
              Filtra por tipo de proyecto, stack o palabras clave.
            </p>
          </div>
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
            onChange={(event) => setSelectedCategory(event.target.value)}
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
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
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        <fieldset className="ak-filter-group ak-filter-fieldset">
          <legend className="ak-filter-label">Stack</legend>
          <div className="ak-tag-cloud" role="group" aria-label="Tecnologías">
            {TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`ak-tag ${selectedTags.includes(tag) ? "on" : ""}`}
                onClick={() => toggleTag(tag)}
                aria-pressed={selectedTags.includes(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="ak-filter-actions">
          <button
            type="button"
            className="ak-btn-reset"
            onClick={() => resetFilters(setSelectedCategory, setSearchQuery, setSelectedTags)}
            disabled={!hasFilters}
          >
            <Icon name="x" size={14} />
            Limpiar filtros
          </button>
          <span className="ak-results-count" aria-live="polite">
            {filteredProjects.length} {filteredProjects.length === 1 ? "proyecto" : "proyectos"}
          </span>
        </div>
      </aside>

      <section
        className="ak-projects-main"
        aria-labelledby="projects-title"
        aria-hidden={isMobile && sidebarOpen ? "true" : undefined}
        inert={isMobile && sidebarOpen ? true : undefined}
      >
        <header className="ak-projects-header">
          <div className="ak-header-top">
            <div>
              <span className="ak-eyebrow">Trabajo seleccionado · 2026</span>
              <h1 id="projects-title" className="ak-page-title">
                Proyectos
              </h1>
            </div>
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
            Productos digitales pensados para durar: desde una web editorial hasta sistemas que
            automatizan el trabajo diario.
          </p>
        </header>

        {filteredProjects.length === 0 ? (
          <div className="ak-empty" role="status">
            <Icon name="folder-open" size={48} className="ak-empty-icon" />
            <h2 className="ak-empty-title">Sin resultados</h2>
            <p className="ak-empty-text">
              No hay proyectos que coincidan con los filtros actuales.
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={() => resetFilters(setSelectedCategory, setSearchQuery, setSelectedTags)}
            >
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <div className="ak-project-grid" role="list" aria-label="Lista de proyectos">
            {filteredProjects.map((p, i) => {
              const lcpOptimized = i === 0;
              return lcpOptimized ? (
                <ProjectCard key={p.id} project={p} priority={true} />
              ) : (
                <Reveal key={p.id} delay={i * 0.06}>
                  <ProjectCard project={p} />
                </Reveal>
              );
            })}
          </div>
        )}
      </section>

      {sidebarOpen && (
        <button
          type="button"
          className="ak-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Cerrar filtros"
        />
      )}
    </div>
  );
}
