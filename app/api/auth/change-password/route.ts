import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    const current = await requireUser();
    const body = await request.json();
    const password = String(body?.password || "");

    if (password.length < 8) {
      return NextResponse.json(
        { ok: false, message: "La nueva contraseña debe tener al menos 8 caracteres." },
        { status: 400 }
      );
    }

    await connectDB();
    await User.findByIdAndUpdate(current.id, {
      password: await bcrypt.hash(password, 12),
      requiereCambioPassword: false,
    });

    return NextResponse.json({ ok: true, message: "Contraseña actualizada." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { ok: false, message: "No se pudo cambiar la contraseña." },
      { status: message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
