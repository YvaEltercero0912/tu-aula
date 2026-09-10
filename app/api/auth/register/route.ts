import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nombre = String(body?.nombre || "").trim();
    const apellido = String(body?.apellido || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!nombre || !email || !password) {
      return NextResponse.json(
        { ok: false, message: "Nombre, correo y contraseña son obligatorios." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { ok: false, message: "La contraseña debe tener al menos 8 caracteres." },
        { status: 400 }
      );
    }

    await connectDB();

    const existente = await User.findOne({ email }).lean();
    if (existente) {
      return NextResponse.json(
        { ok: false, message: "Ya existe una cuenta con ese correo." },
        { status: 409 }
      );
    }

    const user = await User.create({
      nombre,
      apellido,
      email,
      password: await bcrypt.hash(password, 12),
      role: "docente",
      activo: true,
      requiereCambioPassword: false,
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Cuenta de profesor creada correctamente.",
        user: {
          id: String(user._id),
          nombre: user.nombre,
          email: user.email,
          role: "docente",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registro profesor:", error);
    return NextResponse.json(
      { ok: false, message: "No se pudo crear la cuenta." },
      { status: 500 }
    );
  }
}
