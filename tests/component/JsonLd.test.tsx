import { describe, expect, it } from "vitest";
import { render } from "../helpers/render";
import { JsonLd } from "@/components/JsonLd";

describe("JsonLd", () => {
  it("escapa `<` para que un `</script>` en los datos no cierre la etiqueta (anti-XSS)", () => {
    const { container } = render(
      <JsonLd data={{ evil: "</script><img src=x onerror=alert(1)>" }} />,
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const html = script!.innerHTML;
    // No debe aparecer la secuencia de cierre literal...
    expect(html).not.toContain("</script>");
    // ...sino su forma escapada, y el JSON sigue siendo válido.
    expect(html).toContain("\\u003c");
    expect(() => JSON.parse(html.replace(/\\u003c/g, "<"))).not.toThrow();
  });

  it("serializa datos normales sin romper nada", () => {
    const { container } = render(<JsonLd data={{ "@type": "WebSite", name: "Alexendros" }} />);
    const html = container.querySelector("script")!.innerHTML;
    expect(JSON.parse(html)).toEqual({ "@type": "WebSite", name: "Alexendros" });
  });
});
