"use client";

import { useRef, useState, useSyncExternalStore } from "react";

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

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Marquee() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const isReduced = useSyncExternalStore(subscribeReduced, getReduced, () => false);

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
