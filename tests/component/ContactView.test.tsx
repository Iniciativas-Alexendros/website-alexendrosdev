import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { renderWithUser, screen } from "../helpers/render";
import { server } from "../helpers/msw/server";
import { ContactView } from "@/components/sections/contact/ContactView";

// useSearchParams: parámetros mutables vía hoisted para poder probar UTM.
const nav = vi.hoisted(() => ({ params: new URLSearchParams() }));
vi.mock("next/navigation", () => ({ useSearchParams: () => nav.params }));

async function avanzarHastaRevision(user: ReturnType<typeof renderWithUser>["user"]) {
  await user.type(screen.getByPlaceholderText("Tu nombre"), "Ana Pruebas");
  await user.type(screen.getByPlaceholderText("tu@email.com"), "ana@example.com");
  await user.click(screen.getByRole("button", { name: /Siguiente/ }));
  await user.type(screen.getByPlaceholderText(/Objetivo/), "Quiero una plataforma interna.");
  await user.click(screen.getByRole("button", { name: /Siguiente/ }));
}

describe("ContactView (formulario multi-paso)", () => {
  it("valida el primer paso antes de avanzar", async () => {
    nav.params = new URLSearchParams();
    const { user } = renderWithUser(<ContactView />);
    await user.click(screen.getByRole("button", { name: /Siguiente/ }));
    expect(screen.getByText("Indica tu nombre.")).toBeInTheDocument();
    expect(screen.getByText("Email no válido.")).toBeInTheDocument();
  });

  it("exige el consentimiento antes de enviar", async () => {
    nav.params = new URLSearchParams();
    const { user } = renderWithUser(<ContactView />);
    await avanzarHastaRevision(user);
    await user.click(screen.getByRole("button", { name: /Enviar mensaje/ }));
    expect(screen.getByText("Debes aceptar la política.")).toBeInTheDocument();
  });

  it("envía el formulario completo y muestra confirmación", async () => {
    nav.params = new URLSearchParams();
    const { user } = renderWithUser(<ContactView />);
    await avanzarHastaRevision(user);
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /Enviar mensaje/ }));
    expect(await screen.findByText(/Mensaje enviado/)).toBeInTheDocument();
  });

  it("enlaza labels, errores y selección de fecha con controles semánticos", async () => {
    nav.params = new URLSearchParams();
    const { user } = renderWithUser(<ContactView />);

    expect(screen.getByLabelText("Nombre")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(
      screen.getByRole("group", {
        name: /Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre/,
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Siguiente/ }));
    expect(screen.getByLabelText("Nombre")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Nombre")).toHaveAttribute("aria-describedby");

    await user.type(screen.getByLabelText("Nombre"), "Ana Pruebas");
    await user.type(screen.getByLabelText("Email"), "ana@example.com");
    await user.click(screen.getByRole("button", { name: /Siguiente/ }));
    const availableDay = screen.getByRole("button", { name: /^4 de/ });
    await user.click(availableDay);
    expect(availableDay).toHaveAttribute("aria-pressed", "true");
  });

  it("propaga los parámetros UTM en el cuerpo de la petición", async () => {
    nav.params = new URLSearchParams({ utm_source: "newsletter" });
    let captured: Record<string, unknown> | undefined;
    server.use(
      http.post("http://localhost:3000/api/contact", async ({ request }) => {
        captured = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ok: true });
      }),
    );
    const { user } = renderWithUser(<ContactView />);
    await avanzarHastaRevision(user);
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /Enviar mensaje/ }));
    await screen.findByText(/Mensaje enviado/);
    expect(captured?.utmSource).toBe("newsletter");
  });
});
