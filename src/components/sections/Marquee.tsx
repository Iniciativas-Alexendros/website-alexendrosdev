"use client";

import { useRef, useState } from "react";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

const ITEMS = [
  "TypeScript",
  "Next.js",
  "React",
  "Node.js",
  "Python",
  "Tailwind",
  "Docker",
  "Vercel",
  "Rust",
  "Supabase",
  "GitHub Actions",
  "OpenTelemetry",
];

export function Marquee() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const isReduced = useReducedMotion();

  if (isReduced) {
    return (
      <div className="ak-marquee" aria-hidden="true">
        <div className="ak-marquee-track-static" role="list">
          {ITEMS.map((item, i) => (
            <span key={i} className="ak-marquee-item-static" role="listitem">
              {item}
              {i < ITEMS.length - 1 && <span className="ak-marquee-sep" />}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="ak-marquee"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-hidden="true"
    >
      <div
        ref={trackRef}
        className="ak-marquee-track"
        style={{ animationPlayState: paused ? "paused" : "running" }}
        role="list"
      >
        {[...ITEMS, ...ITEMS].map((item, i) => (
          <span key={i} className="ak-marquee-item" role="listitem">
            {item}
            <span className="ak-marquee-sep" />
          </span>
        ))}
      </div>
      <div className="ak-marquee-fade-l" />
      <div className="ak-marquee-fade-r" />
    </div>
  );
}
