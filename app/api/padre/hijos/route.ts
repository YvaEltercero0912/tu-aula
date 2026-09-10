import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/auth";
import Student from "@/models/Student";
import Course from "@/models/Course";

export async function GET() {
  try {
    const user = await requireRole(["padre"]);
    await connectDB();
    void Course;

    const hijos = await Student.find({
      activo: true,
      tutorIds: user.id,
    })
      .populate("cursoId", "nombre division turno cicloLectivo")
      .sort({ apellido: 1, nombre: 1 })
      .lean();

    return NextResponse.json({ ok: true, hijos });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { ok: false, message: "No se pudieron obtener los alumnos vinculados." },
      { status: message === "FORBIDDEN" ? 403 : 401 }
    );
  }
}
