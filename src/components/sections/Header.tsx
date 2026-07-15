"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { Button, Icon } from "@/components/ui";

const SCROLL_THRESHOLD = 24;

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(
    () => typeof window !== "undefined" && window.scrollY > SCROLL_THRESHOLD,
  );

  useEffect(() => {
    const sentinel = document.querySelector<HTMLElement>("[data-ak-header-sentinel]");
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), {
      threshold: 0,
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const navItems = [
    { label: "Proyectos", href: "/proyectos" },
    { label: "Servicios", href: "/servicios" },
    { label: "Blog", href: "/blog" },
    { label: "Stack", href: "/stack" },
    { label: "Contacto", href: "/contacto" },
  ];

  return (
    <>
      <div
        aria-hidden="true"
        data-ak-header-sentinel
        style={{ position: "absolute", top: 0, left: 0, width: 1, height: 1 }}
      />
      <header className={`ak-header ${scrolled ? "ak-header-scrolled" : ""}`.trim()} role="banner">
        <div className="ak-header-inner">
          <Link className="ak-logo" href="/" aria-label="Alexendros - Inicio">
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: "1rem",
              }}
            >
              alex<b>endros</b>
            </span>
          </Link>
          <nav className="ak-nav" aria-label="Navegación principal">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={isActive(item.href) ? "on" : ""}
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ak-header-right">
            <ThemeToggle />
            <Button variant="primary" size="sm" href="/contacto">
              Hablemos
            </Button>
            <button
              type="button"
              className="ak-burger"
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((o) => !o)}
            >
              <Icon name={open ? "x" : "list"} size={20} />
            </button>
          </div>
        </div>
        {open && (
          <div id="mobile-nav" className="ak-mobile-nav" role="navigation" aria-label="Móvil">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={isActive(item.href) ? "on" : ""}
                onClick={() => setOpen(false)}
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>
    </>
  );
}
