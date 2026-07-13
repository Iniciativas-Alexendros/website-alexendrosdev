"use client";

import { useEffect, useRef, useState } from "react";

type Segment =
  | { type: "text"; text: string }
  | { type: "str"; text: string }
  | { type: "kw"; text: string }
  | { type: "cm"; text: string };

type TerminalLine = { t: string; segments?: undefined } | { segments: Segment[]; t?: undefined };

const TERMINAL_LINES: TerminalLine[] = [
  { t: "cat ~/whoami.json" },
  {
    segments: [
      { type: "str", text: '"role"' },
      { type: "text", text: ": " },
      { type: "str", text: '"Desarrollador de plataformas, webs y apps"' },
      { type: "text", text: "," },
    ],
  },
  {
    segments: [
      { type: "str", text: '"focus"' },
      { type: "text", text: ": [" },
      { type: "str", text: '"Webs"' },
      { type: "text", text: ", " },
      { type: "str", text: '"Aplicaciones"' },
      { type: "text", text: ", " },
      { type: "str", text: '"Plataformas"' },
      { type: "text", text: "]," },
    ],
  },
  {
    segments: [
      { type: "str", text: '"stack"' },
      { type: "text", text: ": [" },
      { type: "str", text: '"TypeScript"' },
      { type: "text", text: ", " },
      { type: "str", text: '"Next.js"' },
      { type: "text", text: ", " },
      { type: "str", text: '"React"' },
      { type: "text", text: ", " },
      { type: "str", text: '"Python"' },
      { type: "text", text: "], " },
      { type: "cm", text: "// y más" },
    ],
  },
  {
    segments: [
      { type: "str", text: '"open_to_work"' },
      { type: "text", text: ": " },
      { type: "kw", text: "true" },
      { type: "text", text: " " },
      { type: "cm", text: "// abierto a proyectos" },
    ],
  },
];

export function Terminal({ title = "~/whoami.sh" }: { title?: string }) {
  const [phase, setPhase] = useState(0); // 0 = escribiendo cmd, 1..n = revela líneas
  const [cmd, setCmd] = useState("");
  const reduced = useRef(false);
  const firstLine = TERMINAL_LINES[0] as { t: string };
  const full = firstLine.t;

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced.current) {
      setCmd(full);
      setPhase(TERMINAL_LINES.length + 1);
      return;
    }
    let i = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const type = () => {
      if (i <= full.length) {
        setCmd(full.slice(0, i));
        i++;
        timers.push(setTimeout(type, 55));
      } else {
        timers.push(setTimeout(() => revealLine(1), 350));
      }
    };
    const revealLine = (n: number) => {
      setPhase(n);
      if (n < TERMINAL_LINES.length) timers.push(setTimeout(() => revealLine(n + 1), 260));
      else timers.push(setTimeout(restart, 4200));
    };
    const restart = () => {
      i = 0;
      setCmd("");
      setPhase(0);
      timers.push(setTimeout(type, 400));
    };
    timers.push(setTimeout(type, 600));
    return () => timers.forEach(clearTimeout);
  }, [full]);

  return (
    <div className="ak-terminal" data-reveal>
      <div className="ak-terminal-bar">
        <span className="ak-dot" style={{ background: "#ff5f57" }} />
        <span className="ak-dot" style={{ background: "#febc2e" }} />
        <span className="ak-dot" style={{ background: "#28c840" }} />
        <span className="ak-terminal-title">{title}</span>
        <span className="ak-terminal-meta mono">node v22</span>
      </div>
      <div className="ak-terminal-body">
        <div className="ak-terminal-line">
          <span className="ak-prompt">$ </span>
          <span>{cmd}</span>
          {phase === 0 && <span className="ak-cursor" />}
        </div>
        {TERMINAL_LINES.slice(1).map((l, idx) =>
          phase > idx && l.segments ? (
            <div key={`terminal-${idx}`} className="ak-terminal-line ak-tl-fade">
              {l.segments.map((s, sidx) => (
                <span key={sidx} className={s.type === "text" ? undefined : `ak-${s.type}`}>
                  {s.text}
                </span>
              ))}
            </div>
          ) : null,
        )}
        {phase > TERMINAL_LINES.length - 1 && (
          <div className="ak-terminal-line">
            <span className="ak-prompt">$ </span>
            <span className="ak-cursor" />
          </div>
        )}
      </div>
    </div>
  );
}
