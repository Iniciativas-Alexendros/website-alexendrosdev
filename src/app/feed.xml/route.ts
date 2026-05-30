import { POSTS, SITE } from "@/lib/content";

const MONTHS: Record<string, number> = {
  Ene: 0, Feb: 1, Mar: 2, Abr: 3, May: 4, Jun: 5,
  Jul: 6, Ago: 7, Sep: 8, Oct: 9, Nov: 10, Dic: 11,
};

function parseDate(d: string): Date | null {
  const m = /^(\d{1,2})\s+([A-Za-zÁ-ú]{3})\w*\s+(\d{4})$/.exec(d.trim());
  if (!m) return null;
  const day = Number(m[1]);
  const mon = MONTHS[m[2].slice(0, 3)];
  const year = Number(m[3]);
  if (mon === undefined) return null;
  return new Date(Date.UTC(year, mon, day));
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const base = SITE.url;
  const items = POSTS.map((p) => {
    const date = parseDate(p.date);
    const pubDate = date ? `<pubDate>${date.toUTCString()}</pubDate>` : "";
    const desc = p.desc ?? `${p.title} — nota de ingeniería.`;
    return `    <item>
      <title>${escape(p.title)}</title>
      <link>${base}/blog/${p.id}</link>
      <guid isPermaLink="true">${base}/blog/${p.id}</guid>
      <category>${escape(p.tag)}</category>
      ${pubDate}
      <description>${escape(desc)}</description>
    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escape(SITE.name)} · Blog</title>
    <link>${base}/blog</link>
    <description>Notas de platform engineering, cloud-native y desarrollo backend.</description>
    <language>es-ES</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
