"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BLOG_TAGS, POSTS, SITE } from "@/lib/content";
import type { Post } from "@/lib/content";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Eyebrow } from "@/components/ui/SectionHead";

function shortDate(d: string) {
  return d.replace(/ 20\d\d$/, "");
}

function Featured({ p }: { p: Post }) {
  return (
    <Link href={`/blog/${p.id}`} className="ak-featured" data-reveal>
      <div className="ak-featured-media ak-ph ak-ph-grad" style={{ borderRadius: 0 }}>
        <span className="ak-ph-label">cover destacado</span>
      </div>
      <div className="ak-featured-body">
        <div className="ak-featured-meta">
          <span className="ak-badge-star">
            <Icon name="star" size={12} />
            Destacado
          </span>
          <span className="ak-byline-sub">
            {p.date} · {p.read}
          </span>
        </div>
        <h2 className="ak-featured-title">{p.title}</h2>
        <p className="ak-featured-excerpt">{p.desc}</p>
        <div className="ak-byline">
          <span className="ak-avatar" />
          <div>
            <div className="ak-byline-name">{SITE.name}</div>
            <div className="ak-byline-sub">{SITE.role}</div>
          </div>
          <Button variant="secondary" style={{ marginLeft: "auto" }}>
            Leer <Icon name="arrow-right" size={15} style={{ marginLeft: 5 }} />
          </Button>
        </div>
      </div>
    </Link>
  );
}

function PostCard({ p }: { p: Post }) {
  return (
    <Link href={`/blog/${p.id}`} className="ak-postcard" data-reveal>
      <div className="ak-postcard-media ak-ph ak-ph-grad" style={{ borderRadius: 0 }}>
        <span className="ak-ph-label">cover</span>
      </div>
      <div className="ak-postcard-body">
        <div className="ak-postcard-meta">
          <span className="ak-postcard-date">{shortDate(p.date)}</span>
          <span className="ak-tag">{p.tag}</span>
        </div>
        <h3 className="ak-postcard-title">{p.title}</h3>
        <div className="ak-postcard-foot">
          <span className="ak-postcard-rt">{p.read} de lectura</span>
          <Icon name="arrow-up-right" size={16} style={{ color: "hsl(var(--text-link))" }} />
        </div>
      </div>
    </Link>
  );
}

export function BlogView() {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("Todos");
  const [page, setPage] = useState(1);
  const featured = POSTS.find((p) => p.featured);

  const rest = useMemo(
    () =>
      POSTS.filter(
        (p) =>
          !p.featured &&
          (tag === "Todos" || p.tag === tag) &&
          (q === "" || p.title.toLowerCase().includes(q.toLowerCase())),
      ),
    [tag, q],
  );

  return (
    <div className="ak-container">
      <section className="ak-page-head" data-screen-label="header">
        <div className="ak-blog-top">
          <div>
            <Eyebrow>blog · escrito en MDX</Eyebrow>
            <h1 className="ak-page-title">Notas de ingeniería</h1>
            <p className="ak-page-lead">
              Apuntes sobre desarrollo web, productos digitales e ingeniería. Sin relleno: lo que
              aprendo construyendo mis propios proyectos.
            </p>
          </div>
          <div className="ak-search" style={{ minWidth: 240 }}>
            <Icon name="search" size={16} />
            <input
              placeholder="Buscar artículos…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              aria-label="Buscar artículos"
            />
          </div>
        </div>
      </section>

      {featured && (
        <section className="ak-section" style={{ paddingTop: 16, paddingBottom: 32 }}>
          <Featured p={featured} />
        </section>
      )}

      <section className="ak-section" style={{ paddingTop: 0 }}>
        <div className="ak-tagbar" style={{ marginBottom: 26 }}>
          <div className="ak-chips" style={{ marginLeft: 0 }}>
            {BLOG_TAGS.map((t) => (
              <button
                key={t}
                type="button"
                className={`ak-chip ${t === tag ? "on" : ""}`.trim()}
                onClick={() => {
                  setTag(t);
                  setPage(1);
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <span className="ak-count">{rest.length} artículos</span>
        </div>
        {rest.length === 0 ? (
          <div className="ak-empty">Sin artículos para este filtro.</div>
        ) : (
          <div className="ak-postgrid">
            {rest.map((p) => (
              <PostCard key={p.id} p={p} />
            ))}
          </div>
        )}
        <div className="ak-pagination" style={{ marginTop: 40 }}>
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              type="button"
              className={`ak-page-btn ${n === page ? "on" : ""}`.trim()}
              onClick={() => setPage(n)}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            className="ak-page-btn"
            onClick={() => setPage((p) => Math.min(3, p + 1))}
            aria-label="Siguiente"
          >
            <Icon name="arrow-right" size={15} />
          </button>
        </div>
      </section>
    </div>
  );
}
