export function JsonLd({ data }: { data: object }) {
  // Escapamos `<` a su forma unicode: JSON.stringify NO lo escapa, y un `</script>`
  // dentro de cualquier campo cerraría la etiqueta y abriría inyección de HTML.
  // Defensa en profundidad aunque hoy el contenido provenga de catálogos internos.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  // semgrep-ignore typescript.react.security.audit.react-dangerouslysetinnerhtml.react-dangerouslysetinnerhtml
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
