type FlagEnv = { COMING_SOON?: string; VERCEL_ENV?: string };

/**
 * Modo "próximamente" (holding page).
 *
 * Por defecto: ACTIVO en producción (Vercel pone `VERCEL_ENV=production`) e
 * INACTIVO en preview y desarrollo. Así el portfolio completo vive en los
 * deploys de preview y el dominio público muestra la landing de "en construcción"
 * — sin necesidad de configurar ninguna variable.
 *
 * Override explícito con `COMING_SOON=1|0` (p. ej. `COMING_SOON=0` en producción
 * para abrir el sitio completo el día del lanzamiento, sin tocar código).
 */
export function isComingSoon(
  env: FlagEnv = { COMING_SOON: process.env.COMING_SOON, VERCEL_ENV: process.env.VERCEL_ENV },
): boolean {
  const flag = env.COMING_SOON;
  if (flag === "1" || flag === "true") return true;
  if (flag === "0" || flag === "false") return false;
  return env.VERCEL_ENV === "production";
}
