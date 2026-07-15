import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderWithUser, screen } from "../helpers/render";
import { Testimonials } from "@/components/sections/home/Testimonials";

vi.mock("@/lib/content", () => ({
  TESTIMONIALS: Array.from({ length: 5 }, (_, n) => ({
    quote: `Cita ${n}`,
    name: `Persona ${n}`,
    role: `Rol ${n}`,
    avatarSeed: `avatar-${n}`,
  })),
}));

function mockMatchMedia() {
  vi.spyOn(window, "matchMedia").mockImplementation((query: string) => {
    const matches = query === "(min-width: 880px)" ? true : false;
    return {
      matches,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
      onchange: null,
    } as unknown as MediaQueryList;
  });
}

describe("Testimonials (carrusel)", () => {
  beforeEach(() => {
    mockMatchMedia();
  });

  it("renderiza el encabezado y un dot por posición (maxI + 1)", () => {
    renderWithUser(<Testimonials />);
    expect(screen.getByRole("heading", { name: "Testimonios" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ir al testimonio 3" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ir al testimonio 4" })).not.toBeInTheDocument();
  });

  it("deshabilita «Testimonio anterior» al inicio y «Siguiente testimonio» al final", async () => {
    const { user } = renderWithUser(<Testimonials />);
    const prev = screen.getByRole("button", { name: "Testimonio anterior" });
    const next = screen.getByRole("button", { name: "Siguiente testimonio" });

    expect(prev).toBeDisabled();
    expect(next).toBeEnabled();

    await user.click(next);
    expect(prev).toBeEnabled();
    await user.click(next);
    expect(next).toBeDisabled();
  });

  it("salta a una posición concreta al pulsar su dot", async () => {
    const { user } = renderWithUser(<Testimonials />);
    await user.click(screen.getByRole("button", { name: "Ir al testimonio 3" }));
    expect(screen.getByRole("button", { name: "Siguiente testimonio" })).toBeDisabled();
  });
});
