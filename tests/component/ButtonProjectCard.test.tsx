import { describe, expect, it } from "vitest";
import { render, screen } from "../helpers/render";
import { Button } from "@/components/ui/Button";
import { ProjectCard } from "@/components/sections/projects/ProjectCard";
import { PROJECTS } from "@/lib/content/projects";

describe("Button", () => {
  it("renderiza un button para acciones y conserva type", () => {
    render(
      <Button type="submit" variant="primary">
        Guardar
      </Button>,
    );

    expect(screen.getByRole("button", { name: "Guardar" })).toHaveAttribute("type", "submit");
  });

  it("renderiza un enlace con navegación externa segura", () => {
    render(
      <Button href="https://example.com" target="_blank" rel="noopener noreferrer">
        Ver en vivo
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Ver en vivo" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});

describe("ProjectCard", () => {
  it("expone una tarjeta semántica y CTAs con nombres claros", () => {
    render(<ProjectCard project={PROJECTS[0]!} />);

    expect(screen.getByRole("article")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: /alexendros/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ver caso/ })).toHaveAttribute(
      "href",
      "/proyectos/alexendros-me",
    );
    expect(screen.getByRole("link", { name: /Ver en vivo/ })).toHaveAttribute("target", "_blank");
  });
});
