import { NextResponse, type NextRequest } from "next/server";
import { isComingSoon } from "@/lib/flags";

// En modo "próximamente" reescribimos todas las páginas a /proximamente, dejando
// la propia landing accesible (las APIs y los assets quedan fuera por el matcher).
const ALLOW = ["/proximamente"];

export function middleware(req: NextRequest) {
  if (!isComingSoon()) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (ALLOW.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/proximamente";
  return NextResponse.rewrite(url);
}

export const config = {
  // Excluye /api/*, assets de Next y cualquier fichero estático (con punto:
  // favicon.ico, robots.txt, sitemap.xml, feed.xml, imágenes…).
  matcher: ["/((?!api/|_next/|.*\\.).*)"],
};
