import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";

const AUTH_COOKIE_NAME = "tu_aula_token";

function homeByRole(role: "docente" | "padre") {
  return role === "docente" ? "/profesor" : "/padre";
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/admin") || pathname.startsWith("/docente")) {
    return NextResponse.redirect(new URL("/profesor", request.url));
  }

  const protectedPath = [
    "/profesor",
    "/padre",
    "/dashboard",
    "/notificaciones",
    "/ajustes",
    "/cambiar-clave-inicial",
  ].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (!protectedPath) return NextResponse.next();

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const payload = verifyToken(token);

    if (pathname.startsWith("/profesor") && payload.role !== "docente") {
      return NextResponse.redirect(new URL("/padre", request.url));
    }

    if (pathname.startsWith("/padre") && payload.role !== "padre") {
      return NextResponse.redirect(new URL("/profesor", request.url));
    }

    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return response;
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/docente/:path*",
    "/profesor/:path*",
    "/padre/:path*",
    "/dashboard/:path*",
    "/notificaciones/:path*",
    "/ajustes/:path*",
    "/cambiar-clave-inicial/:path*",
  ],
};
