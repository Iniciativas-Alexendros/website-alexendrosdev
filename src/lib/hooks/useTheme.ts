"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "ao-theme";
const EVENT = "ao-theme-change";

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

function getSnapshot() {
  // Source-of-truth: data-theme attribute (set por el script bloqueante de
  // layout.tsx y por el toggle). El classList.dark se mantiene por compatibilidad
  // con CSS legacy (.dark selectors); siempre están sincronizados.
  return document.documentElement.dataset.theme === "dark";
}

function getServerSnapshot() {
  return false;
}

/**
 * Tema claro/oscuro persistente. Lee el estado real del `<html>` (resuelto sin
 * flash por el script bloqueante de `layout.tsx`) vía `useSyncExternalStore`.
 * Mantiene sincronizados: (1) classList("dark"), (2) data-theme attribute — este
 * último es el contrato del e2e gate te-3.1 (`data-theme` flips on <html>).
 */
export function useTheme(): [boolean, () => void] {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    // Sincronizar en orden defensivo: dataset.theme PRIMERO (es la fuente
    // de verdad según getSnapshot), luego classList (disparador CSS legacy).
    // Si setAttribute throws, el classList no se desincroniza al menos en lo
    // crítico; el read de getSnapshot sigue siendo coherente.
    document.documentElement.dataset.theme = next ? "dark" : "light";
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      /* almacenamiento no disponible */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return [dark, toggle];
}
