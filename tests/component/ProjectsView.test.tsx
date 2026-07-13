import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithUser, screen, within } from "../helpers/render";
import { ProjectsView } from "@/components/sections/projects/ProjectsView";
import { PROJECTS } from "@/lib/content/projects";

// next/link necesita contexto de router; lo sustituimos por un ancla simple.
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const openSourceCount = PROJECTS.filter((p) => p.kind === "Open Source").length;

function countText() {
  // La barra de orden muestra «N proyecto(s)».
  return screen.getByText(/\d+ proyectos?$/).textContent;
}

describe("ProjectsView", () => {
  it("lista todos los proyectos al inicio", () => {
    renderWithUser(<ProjectsView />);
    expect(countText()).toBe(`${PROJECTS.length} proyectos`);
  });

  it("filtra por categoría (Open Source)", async () => {
    const { user } = renderWithUser(<ProjectsView />);
    await user.click(screen.getByRole("button", { name: "Open Source" }));
    const suffix = openSourceCount === 1 ? "" : "s";
    expect(countText()).toBe(`${openSourceCount} proyecto${suffix}`);
  });

  it("busca por texto libre (case-insensitive)", async () => {
    const { user } = renderWithUser(<ProjectsView />);
    await user.type(screen.getByLabelText("Buscar proyecto"), "imprenta");
    // Solo «Gráficas Nasve» menciona imprenta.
    expect(countText()).toBe("1 proyecto");
    const masonry = screen.getByText("1 proyecto").closest("section")!;
    expect(within(masonry).getByRole("heading", { name: /Nasve/ })).toBeInTheDocument();
  });

  it("muestra el estado vacío sin resultados", async () => {
    const { user } = renderWithUser(<ProjectsView />);
    await user.type(screen.getByLabelText("Buscar proyecto"), "zzzz-no-existe");
    expect(await screen.findByText(/Sin resultados/)).toBeInTheDocument();
  });

  it("ordena por más antiguos sin romper el conteo", async () => {
    const { user } = renderWithUser(<ProjectsView />);
    await user.selectOptions(screen.getByLabelText("Orden"), "antiguos");
    expect(countText()).toBe(`${PROJECTS.length} proyectos`);
  });
});
