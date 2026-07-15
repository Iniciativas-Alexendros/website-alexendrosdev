"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const FRAMES = [
  '{"name": "alexendros", "role": "developer", "stack": ["TypeScript", "React", "Node", "Python", "Rust"]}',
  '{"name": "alexendros", "role": "freelance", "location": "Valencia", "mode": "remote-first"}',
  '{"name": "alexendros", "role": "builder", "philosophy": "clean code, fair price, your IP"}',
];

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Terminal() {
  const [frameIndex, setFrameIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const isReduced = useSyncExternalStore(subscribeReduced, getReduced, () => false);

  useEffect(() => {
    const currentFrame = FRAMES[frameIndex];

    if (isReduced) {
      const timeout = setTimeout(() => {
        setFrameIndex((i) => (i + 1) % FRAMES.length);
      }, 2000);
      return () => clearTimeout(timeout);
    }

    let timeout: ReturnType<typeof setTimeout>;
    const speed = deleting ? 30 : 50;

    if (!deleting && charIndex < currentFrame.length) {
      timeout = setTimeout(() => setCharIndex((c) => c + 1), speed);
    } else if (deleting && charIndex > 0) {
      timeout = setTimeout(() => setCharIndex((c) => c - 1), speed / 2);
    } else if (!deleting && charIndex === currentFrame.length) {
      timeout = setTimeout(() => setDeleting(true), 1500);
    } else if (deleting && charIndex === 0) {
      timeout = setTimeout(() => {
        setDeleting(false);
        setFrameIndex((i) => (i + 1) % FRAMES.length);
      }, 0);
    }

    return () => clearTimeout(timeout);
  }, [frameIndex, charIndex, deleting, isReduced]);

  const currentFrame = FRAMES[frameIndex];
  const displayText = isReduced ? currentFrame : currentFrame.slice(0, charIndex);

  return (
    <div className="ak-terminal" role="region" aria-label="Terminal animada">
      <div className="ak-terminal-bar">
        <span className="ak-dot" style={{ background: "#ff5f57" }} />
        <span className="ak-dot" style={{ background: "#ffbd2e" }} />
        <span className="ak-dot" style={{ background: "#28ca42" }} />
        <span className="ak-terminal-title">whoami.json</span>
        <span className="ak-terminal-meta">~/.config/alexendros</span>
      </div>
      <pre className="ak-terminal-body">
        <span className="ak-prompt">$</span> <span className="ak-str">cat</span> whoami.json
        <br />
        <span className="ak-prompt">$</span> <span className="ak-kw">{displayText}</span>
        <span className="ak-cursor" aria-hidden="true" />
      </pre>
    </div>
  );
}
