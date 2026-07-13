import { TECH } from "@/lib/content";

export function Marquee({ items = TECH }: { items?: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="ak-marquee">
      <div className="ak-marquee-fade-l" />
      <div className="ak-marquee-fade-r" />
      <div className="ak-marquee-track">
        {row.map((it, i) => (
          <span key={`${it}-${i}`} className="ak-marquee-item">
            {it}
            <span className="ak-marquee-sep">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
