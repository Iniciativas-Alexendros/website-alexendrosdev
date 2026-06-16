"use client";

import { useEffect, useState } from "react";
import { TESTIMONIALS } from "@/lib/content";
import { Eyebrow } from "@/components/ui/SectionHead";
import { Icon } from "@/components/ui/Icon";

const PER_VIEW = 3;

export function Testimonials() {
  const data = TESTIMONIALS;
  const maxI = Math.max(0, data.length - PER_VIEW);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((p) => (p >= maxI ? 0 : p + 1)), 4000);
    return () => clearInterval(t);
  }, [paused, maxI]);

  const go = (n: number) => setI(Math.max(0, Math.min(maxI, n)));

  return (
    <section className="ak-section ak-section-sunken">
      <div className="ak-container-inner">
        <div
          className="ak-section-head"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 28,
          }}
        >
          <div>
            <Eyebrow>confían en mí</Eyebrow>
            <h2 className="ak-h2">Testimonios</h2>
          </div>
          <div className="ak-tcar-nav">
            <button
              type="button"
              className="ak-tcar-btn"
              onClick={() => go(i - 1)}
              disabled={i === 0}
              aria-label="Anterior"
            >
              <Icon name="chevron-left" size={18} />
            </button>
            <button
              type="button"
              className="ak-tcar-btn"
              onClick={() => go(i + 1)}
              disabled={i === maxI}
              aria-label="Siguiente"
            >
              <Icon name="chevron-right" size={18} />
            </button>
          </div>
        </div>
        <div
          className="ak-tcar"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="ak-tcar-viewport">
            <div
              className="ak-tcar-track"
              style={{ transform: `translateX(calc(-${i} * (100% + 20px) / ${PER_VIEW}))` }}
            >
              {data.map((t, n) => (
                <figure key={n} className="ak-tcard">
                  <span className="ak-tcard-mark">“</span>
                  <blockquote className="ak-tcard-quote">{t.quote}</blockquote>
                  <figcaption className="ak-tcard-author">
                    <span className="ak-avatar" style={{ width: 40, height: 40 }} />
                    <span>
                      <div className="ak-tcard-name">{t.name}</div>
                      <div className="ak-tcard-role">{t.role}</div>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
          <div className="ak-tcar-dots">
            {Array.from({ length: maxI + 1 }).map((_, n) => (
              <button
                key={n}
                type="button"
                className={`ak-tcar-dot ${n === i ? "on" : ""}`.trim()}
                onClick={() => go(n)}
                aria-label={`Ir a ${n + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
