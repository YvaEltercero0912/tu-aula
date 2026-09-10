import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";

const AUTH_COOKIE_NAME = "tu_aula_token";
const protectedPrefixes = ["/profesor", "/padre", "/dashboard", "/notificaciones", "/ajustes"];

function rolePath(role: "docente" | "padre") {
  return role === "docente" ? "/profesor" : "/padre";
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const protegida = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (!protegida) return NextResponse.next();

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const payload = verifyToken(token);
    if (pathname.startsWith("/profesor") && payload.role !== "docente") return NextResponse.redirect(new URL(rolePath(payload.role), request.url));
    if (pathname.startsWith("/padre") && payload.role !== "padre") return NextResponse.redirect(new URL(rolePath(payload.role), request.url));
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set({ name: AUTH_COOKIE_NAME, value: "", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
    return response;
  }
}

export const config = { matcher: ["/profesor/:path*", "/padre/:path*", "/dashboard/:path*", "/notificaciones/:path*", "/ajustes/:path*"] };
