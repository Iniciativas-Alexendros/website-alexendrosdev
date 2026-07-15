"use client";

import { useTheme } from "@/lib/hooks/useTheme";
import { Icon } from "@/components/ui";

export function ThemeToggle() {
  const [dark, toggle] = useTheme();
  return (
    <button
      type="button"
      className="ak-theme-toggle"
      onClick={toggle}
      aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      <Icon name={dark ? "sun" : "moon"} size={17} />
    </button>
  );
}
