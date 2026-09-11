import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE_NAME = "tu_aula_token";

const protectedPrefixes = [
  "/profesor",
  "/padre",
  "/dashboard",
  "/notificaciones",
  "/ajustes",
];

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const protegida = protectedPrefixes.some(
    (prefix) =>
      pathname === prefix ||
      pathname.startsWith(`${prefix}/`)
  );

  if (!protegida) {
    return NextResponse.next();
  }

  const token =
    request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    const loginUrl = new URL(
      "/login",
      request.url
    );

    loginUrl.searchParams.set(
      "from",
      pathname
    );

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/profesor/:path*",
    "/padre/:path*",
    "/dashboard/:path*",
    "/notificaciones/:path*",
    "/ajustes/:path*",
  ],
};