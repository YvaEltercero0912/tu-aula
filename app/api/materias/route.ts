import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/auth";
import Subject from "@/models/Subject";

export async function GET() {
  try {
    await requireRole(["docente"]);
    await connectDB();
    const materias = await Subject.find({ activo: true })
      .sort({ nombre: 1 })
      .lean();
    return NextResponse.json({ ok: true, materias });
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(["docente"]);
    const body = await request.json();
    const nombre = String(body?.nombre || "").trim();

    if (!nombre) {
      return NextResponse.json(
        { ok: false, message: "Ingresá el nombre de la materia." },
        { status: 400 }
      );
    }

    await connectDB();
    const materia = await Subject.create({
      nombre,
      descripcion: String(body?.descripcion || "").trim(),
    });

    return NextResponse.json({ ok: true, materia }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, message: "No se pudo crear la materia." },
      { status: 500 }
    );
  }
}
