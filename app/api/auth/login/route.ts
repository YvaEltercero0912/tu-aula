import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User, { type UserRole } from "@/models/User";
import { createToken } from "@/lib/jwt";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, message: "Ingresá correo y contraseña." },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email }).select("+password");

    if (!user || !user.activo) {
      return NextResponse.json(
        { ok: false, message: "Correo o contraseña incorrectos." },
        { status: 401 }
      );
    }

    const passwordValida = await bcrypt.compare(password, user.password);
    if (!passwordValida) {
      return NextResponse.json(
        { ok: false, message: "Correo o contraseña incorrectos." },
        { status: 401 }
      );
    }

    // Compatibility with the previous version: the old administrator becomes a professor.
    if (String(user.role) === "admin") {
      await User.updateOne(
        { _id: user._id },
        { $set: { role: "docente", requiereCambioPassword: false } }
      );
      user.role = "docente" as UserRole;
      user.requiereCambioPassword = false;
    }

    const role = String(user.role) as UserRole;
    if (role !== "docente" && role !== "padre") {
      return NextResponse.json(
        { ok: false, message: "La cuenta tiene un rol no compatible." },
        { status: 403 }
      );
    }

    const token = createToken({
      userId: String(user._id),
      email: user.email,
      role,
      nombre: user.nombre,
    });

    const response = NextResponse.json({
      ok: true,
      message: "Sesión iniciada correctamente.",
      requiereCambioPassword: Boolean(user.requiereCambioPassword),
      user: {
        id: String(user._id),
        nombre: user.nombre,
        apellido: user.apellido || "",
        email: user.email,
        role,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Error login:", error);
    return NextResponse.json(
      { ok: false, message: "No se pudo iniciar sesión." },
      { status: 500 }
    );
  }
}
