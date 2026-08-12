import { describe, expect, it, vi } from "vitest";
import { render, renderWithUser, screen } from "../helpers/render";
import { Button, ButtonLink, buttonVariants } from "@/components/ui/Button";

describe("buttonVariants", () => {
  it("aplica la variante primary por defecto", () => {
    const cls = buttonVariants();
    expect(cls).toContain("bg-primary");
    expect(cls).toContain("text-on-primary");
  });

  it("mapea cada variante a sus clases de token", () => {
    expect(buttonVariants({ variant: "primary" })).toContain("bg-primary");
    expect(buttonVariants({ variant: "secondary" })).toContain("border-border");
    expect(buttonVariants({ variant: "ghost" })).toContain("text-text-secondary");
  });

  it("mapea cada tamaño a su altura", () => {
    expect(buttonVariants({ size: "sm" })).toContain("min-h-8");
    expect(buttonVariants({ size: "md" })).toContain("h-10");
    expect(buttonVariants({ size: "lg" })).toContain("h-12");
  });

  it("incluye estados base de foco, activo y disabled", () => {
    const cls = buttonVariants();
    expect(cls).toContain("focus-visible:outline-2");
    expect(cls).toContain("active:scale-[0.98]");
    expect(cls).toContain("disabled:opacity-50");
  });

  it("fusiona className sin romper la variante", () => {
    const cls = buttonVariants({ variant: "ghost", className: "w-full" });
    expect(cls).toContain("w-full");
    expect(cls).toContain("text-text-secondary");
  });
});

describe("Button", () => {
  it("renderiza un <button> para acciones y conserva type", () => {
    render(
      <Button variant="primary" type="submit">
        Guardar
      </Button>,
    );

    const btn = screen.getByRole("button", { name: "Guardar" });
    expect(btn.tagName).toBe("BUTTON");
    expect(btn).toHaveAttribute("type", "submit");
    expect(btn).toHaveClass("bg-primary");
  });

  it("no dispara onClick cuando está disabled", async () => {
    const onClick = vi.fn();
    const { user } = renderWithUser(
      <Button onClick={onClick} disabled>
        Guardar
      </Button>,
    );

    await user.click(screen.getByRole("button", { name: "Guardar" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renderiza un enlace externo seguro cuando recibe href", () => {
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

describe("ButtonLink", () => {
  it("renderiza un enlace next/link con las clases de la variante", () => {
    render(
      <ButtonLink variant="secondary" size="sm" href="/contacto">
        Hablemos
      </ButtonLink>,
    );

    const link = screen.getByRole("link", { name: "Hablemos" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/contacto");
    expect(link).toHaveClass("border-border", "min-h-8");
  });

  it("aplica la variante primary por defecto", () => {
    render(<ButtonLink href="/contacto">Hablemos</ButtonLink>);

    expect(screen.getByRole("link", { name: "Hablemos" })).toHaveClass("bg-primary");
  });

  it("disabled marca aria-disabled y lo saca del tab order", () => {
    render(
      <ButtonLink href="/contacto" disabled>
        Hablemos
      </ButtonLink>,
    );

    const link = screen.getByRole("link", { name: "Hablemos" });
    expect(link).toHaveAttribute("aria-disabled", "true");
    expect(link).toHaveAttribute("tabindex", "-1");
    expect(link).toHaveClass("opacity-50", "pointer-events-none");
  });

  it("disabled no ejecuta el onClick del consumidor", async () => {
    const onClick = vi.fn();
    const { user } = renderWithUser(
      <ButtonLink href="/contacto" disabled onClick={onClick}>
        Hablemos
      </ButtonLink>,
    );

    await user.click(screen.getByRole("link", { name: "Hablemos" }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
