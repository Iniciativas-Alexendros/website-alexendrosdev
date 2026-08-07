import "server-only";

type FlagEnv = { COMING_SOON?: string };

/**
 * Modo "próximamente" (holding page).
 *
 * Por defecto: INACTIVO en todos los entornos — el portfolio completo es público
 * (sitio lanzado). La landing de "en construcción" queda como opt-in explícito:
 * actívala con `COMING_SOON=1` (o `true`) para volver a cerrar el sitio
 * temporalmente, sin tocar código.
 */
export function isComingSoon(env: FlagEnv = { COMING_SOON: process.env.COMING_SOON }): boolean {
  const flag = env.COMING_SOON;
  return flag === "1" || flag === "true";
}
