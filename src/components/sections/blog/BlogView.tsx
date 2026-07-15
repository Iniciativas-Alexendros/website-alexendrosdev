"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import type { Post } from "@/lib/content/posts";
import { Icon, Reveal } from "@/components/ui";

const POSTS_PER_PAGE = 6;

interface BlogViewProps {
  posts: Post[];
}

export function BlogView({ posts: allPosts }: BlogViewProps) {
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);

  const tags = useMemo(() => {
    return ["all", ...Array.from(new Set(allPosts.map((p) => p.tag).filter(Boolean)))];
  }, [allPosts]);

  const filteredPosts = useMemo(() => {
    let result = allPosts;
    if (selectedTag !== "all") {
      result = result.filter((p) => p.tag === selectedTag);
    }
    if (query.trim()) {
      const needle = query.trim().toLowerCase();
      result = result.filter((p) =>
        [p.title, p.desc, p.tag].filter(Boolean).join(" ").toLowerCase().includes(needle),
      );
    }
    return result;
  }, [allPosts, selectedTag, query]);

  const featuredPost = allPosts[0];
  const otherPosts = useMemo(() => {
    return allPosts.slice(1).filter((p) => {
      if (selectedTag !== "all" && p.tag !== selectedTag) return false;
      if (query.trim()) {
        const needle = query.trim().toLowerCase();
        return [p.title, p.desc, p.tag].filter(Boolean).join(" ").toLowerCase().includes(needle);
      }
      return true;
    });
  }, [allPosts, selectedTag, query]);

  const totalPages = Math.ceil(otherPosts.length / POSTS_PER_PAGE);

  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    return otherPosts.slice(start, start + POSTS_PER_PAGE);
  }, [otherPosts, currentPage]);

  return (
    <div className="ak-blog-page">
      {featuredPost && (
        <Reveal className="ak-featured">
          <Link href={`/blog/${featuredPost.id}`} className="ak-featured-link">
            <div className="ak-featured-media">
              <img
                src={`https://picsum.photos/seed/${featuredPost.id}-featured/1200/675`}
                alt=""
                loading="eager"
                className="ak-featured-img"
              />
              <span className="ak-featured-tag">{featuredPost.tag}</span>
            </div>
            <div className="ak-featured-body">
              <time className="ak-featured-date" dateTime={featuredPost.date}>
                {featuredPost.date}
              </time>
              <h1 className="ak-featured-title">{featuredPost.title}</h1>
              {featuredPost.desc && <p className="ak-featured-desc">{featuredPost.desc}</p>}
              <span className="ak-featured-read">
                {featuredPost.read ? `${featuredPost.read} de lectura` : "Leer más"}
                <Icon name="arrow-right" size={14} />
              </span>
            </div>
          </Link>
        </Reveal>
      )}

      <Reveal delay={0.1} className="ak-section ak-blog-filters">
        <div className="ak-filters-inner">
          <label className="ak-search" htmlFor="blog-search">
            <span className="sr-only">Buscar artículos</span>
            <input
              id="blog-search"
              type="search"
              aria-label="Buscar artículos"
              placeholder="Buscar artículos…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>

          <div className="ak-tag-bar" role="group" aria-label="Filtrar por tema">
            {tags.map((tag) => (
              <button
                key={tag}
                className={`ak-tag-chip ${selectedTag === tag ? "on" : ""}`}
                onClick={() => setSelectedTag(tag)}
                aria-pressed={selectedTag === tag}
              >
                {tag === "all" ? "Todos" : tag}
              </button>
            ))}
          </div>
        </div>

        {otherPosts.length === 0 && (
          <p className="ak-empty" role="status">
            Sin artículos para los filtros actuales
          </p>
        )}
      </Reveal>

      {otherPosts.length > 0 && (
        <Reveal delay={0.2} className="ak-section">
          <ul className="ak-post-grid" role="list">
            {paginatedPosts.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.06}>
                <li role="listitem">
                  <Link className="ak-post-card" href={`/blog/${p.id}`}>
                    <div className="ak-post-meta">
                      <span className="ak-post-tag">{p.tag}</span>
                      <time className="ak-post-date" dateTime={p.date}>
                        {p.date}
                      </time>
                    </div>
                    <h2 className="ak-post-title">{p.title}</h2>
                    {p.desc && <p className="ak-post-desc">{p.desc}</p>}
                    {p.read && <span className="ak-post-read">{p.read} de lectura</span>}
                  </Link>
                </li>
              </Reveal>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav className="ak-pagination" aria-label="Paginación de artículos">
              <button
                className="ak-page-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Página anterior"
              >
                <Icon name="chevron-left" size={18} />
              </button>
              <div className="ak-page-numbers" role="navigation" aria-label="Números de página">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (page) =>
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1),
                  )
                  .map((page, idx, arr) => (
                    <React.Fragment key={page}>
                      {idx > 0 && page !== arr[idx - 1] + 1 && (
                        <span className="ak-page-ellipsis" aria-hidden="true">
                          …
                        </span>
                      )}
                      <button
                        className={`ak-page-num ${currentPage === page ? "on" : ""}`}
                        onClick={() => setCurrentPage(page)}
                        aria-label={`Página ${page}`}
                        aria-current={currentPage === page ? "page" : undefined}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
              </div>
              <button
                className="ak-page-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label="Página siguiente"
              >
                <Icon name="chevron-right" size={18} />
              </button>
            </nav>
          )}
        </Reveal>
      )}
    </div>
  );
}
