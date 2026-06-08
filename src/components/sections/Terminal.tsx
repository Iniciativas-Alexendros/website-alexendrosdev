"use client";

import { useEffect, useRef, useState } from "react";

const TERMINAL_LINES = [
  { t: "cat ~/whoami.json" },
  {
    html: '<span class="ak-str">"role"</span>: <span class="ak-str">"Software &amp; Platform Engineer"</span>,',
  },
  {
    html: '<span class="ak-str">"focus"</span>: [<span class="ak-str">"Seguridad"</span>, <span class="ak-str">"Tooling"</span>, <span class="ak-str">"Fullstack"</span>],',
  },
  {
    html: '<span class="ak-str">"stack"</span>: [<span class="ak-str">"Rust"</span>, <span class="ak-str">"Python"</span>, <span class="ak-str">"TypeScript"</span>, <span class="ak-str">"MCP"</span>], <span class="ak-cm">// y más</span>',
  },
  {
    html: '<span class="ak-str">"open_to_work"</span>: <span class="ak-kw">true</span> <span class="ak-cm">// abierto a proyectos</span>',
  },
] as const;

export function Terminal({ title = "~/whoami.sh" }: { title?: string }) {
  const [phase, setPhase] = useState(0); // 0 = escribiendo cmd, 1..n = revela líneas
  const [cmd, setCmd] = useState("");
  const reduced = useRef(false);
  const full = TERMINAL_LINES[0].t;

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
          phase > idx ? (
            <div key={idx} className="ak-terminal-line ak-tl-fade">
              <span dangerouslySetInnerHTML={{ __html: "html" in l ? l.html : "" }} />
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
