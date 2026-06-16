"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/content";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(
    () => typeof window !== "undefined" && window.scrollY > 24,
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className={`ak-header ${scrolled ? "ak-header-scrolled" : ""}`.trim()}>
      <div className="ak-header-inner">
        <Link className="ak-logo" href="/">
          alex<b>endros</b>
        </Link>
        <nav className="ak-nav">
          {NAV.map((l) => (
            <Link key={l.label} href={l.href} className={isActive(l.href) ? "on" : ""}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ak-header-right">
          <ThemeToggle />
          <Button variant="primary" href="/contacto" style={{ padding: "8px 16px", fontSize: 13 }}>
            Contacto
          </Button>
          <button type="button" className="ak-burger" aria-label="Menú" onClick={() => setOpen((o) => !o)}>
            <Icon name={open ? "x" : "menu"} size={20} />
          </button>
        </div>
      </div>
      {open && (
        <div className="ak-mobile-nav">
          {[...NAV, { label: "Contacto", href: "/contacto" }].map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className={isActive(l.href) ? "on" : ""}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
