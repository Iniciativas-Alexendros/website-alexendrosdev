import { describe, expect, it, vi } from "vitest";
import { renderWithUser, screen } from "../helpers/render";
import { Testimonials } from "@/components/sections/home/Testimonials";

// El catálogo real de testimonios está vacío (placeholder). Inyectamos datos
// para ejercitar la lógica del carrusel (límites, navegación, dots).
vi.mock("@/lib/content", () => ({
  TESTIMONIALS: Array.from({ length: 5 }, (_, n) => ({
    quote: `Cita ${n}`,
    name: `Persona ${n}`,
    role: `Rol ${n}`,
  })),
}));

describe("Testimonials (carrusel)", () => {
  it("renderiza el encabezado y un dot por posición (maxI + 1)", () => {
    renderWithUser(<Testimonials />);
    expect(screen.getByRole("heading", { name: "Prueba en abierto" })).toBeInTheDocument();
    // 5 testimonios, 3 por vista → maxI = 2 → 3 dots.
    expect(screen.getByRole("button", { name: "Ir a 3" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ir a 4" })).not.toBeInTheDocument();
  });

  it("deshabilita «Anterior» al inicio y «Siguiente» al final", async () => {
    const { user } = renderWithUser(<Testimonials />);
    const prev = screen.getByRole("button", { name: "Anterior" });
    const next = screen.getByRole("button", { name: "Siguiente" });

    expect(prev).toBeDisabled();
    expect(next).toBeEnabled();

    await user.click(next);
    expect(prev).toBeEnabled();
    await user.click(next);
    expect(next).toBeDisabled();
  });

  it("salta a una posición concreta al pulsar su dot", async () => {
    const { user } = renderWithUser(<Testimonials />);
    await user.click(screen.getByRole("button", { name: "Ir a 3" }));
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
  });
});
