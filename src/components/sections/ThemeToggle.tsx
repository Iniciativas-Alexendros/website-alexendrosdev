"use client";

import { useTheme } from "@/lib/hooks/useTheme";
import { Icon } from "@/components/ui/Icon";

export function ThemeToggle() {
  const [dark, toggle] = useTheme();
  return (
    <button type="button" className="ak-theme-toggle" onClick={toggle} aria-label="Cambiar tema">
      <Icon name={dark ? "sun" : "moon"} size={17} />
    </button>
  );
}
