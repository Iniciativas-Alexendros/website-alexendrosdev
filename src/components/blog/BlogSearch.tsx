"use client";

import { useMemo, useState } from "react";
import type { Post } from "@/lib/content/posts";
import Link from "next/link";

export function BlogSearch({ posts }: { posts: Post[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return posts;
    return posts.filter((p) =>
      [p.title, p.desc, p.tag].filter(Boolean).join(" ").toLowerCase().includes(needle),
    );
  }, [posts, q]);

  return (
    <div>
      <label className="ak-search">
        <span className="sr-only">Buscar artículos</span>
        <input
          type="search"
          aria-label="Buscar artículos"
          placeholder="Buscar artículos"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>

      {filtered.length === 0 ? (
        <p className="ak-empty">Sin artículos para este filtro</p>
      ) : (
        <ul className="ak-post-grid">
          {filtered.map((p) => (
            <li key={p.id}>
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
          ))}
        </ul>
      )}
    </div>
  );
}
