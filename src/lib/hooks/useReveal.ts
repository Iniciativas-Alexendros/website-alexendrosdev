"use client";

import { useEffect } from "react";

/**
 * Revela elementos con `[data-reveal]` al entrar en viewport añadiendo
 * la clase `is-revealed`. Respeta `prefers-reduced-motion`. Enfoque basado
 * en scroll (robusto frente a IntersectionObserver en previews/iframes).
 *
 * INP: los listeners de `scroll`/`resize` se coalescen con `requestAnimationFrame`
 * para que `getBoundingClientRect` se ejecute a lo sumo una vez por frame en
 * lugar de en cada evento de scroll (que disparaba lecturas de layout en cada
 * tick y competía por el hilo principal).
 */
export function useReveal(): void {
  useEffect(() => {
    const all = () => Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      all().forEach((e) => e.classList.add("is-revealed"));
      return;
    }

    let frame = 0;
    const reveal = () => {
      document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-revealed)").forEach((e) => {
        const r = e.getBoundingClientRect();
        if (r.top < window.innerHeight - 40 && r.bottom > 0) {
          e.classList.add("is-revealed");
        }
      });
    };

    // Coalesce: agenda un único reveal por frame; si ya hay uno pendiente,
    // el evento de scroll actual no encola otro.
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        reveal();
      });
    };

    reveal();
    const raf = requestAnimationFrame(reveal);
    const t = setTimeout(reveal, 250);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(frame);
      clearTimeout(t);
    };
  }, []);
}
