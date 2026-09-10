import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/auth";
import User from "@/models/User";

export async function GET(request: Request) {
  try {
    await requireRole(["admin"]);
    await connectDB();

    const role = new URL(request.url).searchParams.get("role");
    const filtro =
      role === "docente" || role === "padre"
        ? { role, activo: true }
        : { role: { $in: ["docente", "padre"] }, activo: true };

    const usuarios = await User.find(filtro)
      .select("_id nombre apellido email role activo")
      .sort({ apellido: 1, nombre: 1 })
      .lean();

    return NextResponse.json({ ok: true, usuarios });
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(["admin"]);
    const body = await request.json();

    const nombre = String(body?.nombre || "").trim();
    const apellido = String(body?.apellido || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const role = String(body?.role || "");

    if (
      !nombre ||
      !email ||
      password.length < 8 ||
      !["docente", "padre"].includes(role)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "Revisá los datos. La contraseña debe tener 8 caracteres.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    if (await User.exists({ email })) {
      return NextResponse.json(
        { ok: false, message: "Ese correo ya está registrado." },
        { status: 409 }
      );
    }

    const usuario = await User.create({
      nombre,
      apellido,
      email,
      password: await bcrypt.hash(password, 12),
      role,
      activo: true,
    });

    return NextResponse.json(
      {
        ok: true,
        usuario: {
          _id: usuario._id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          role: usuario.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, message: "No se pudo crear el usuario." },
      { status: 500 }
    );
  }
}
