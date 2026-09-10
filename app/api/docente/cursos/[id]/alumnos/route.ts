import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/auth";
import Course from "@/models/Course";
import Student from "@/models/Student";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["docente"]);
    const { id } = await context.params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { ok: false, message: "Curso inválido." },
        { status: 400 }
      );
    }

    await connectDB();

    const curso = await Course.findOne({
      _id: id,
      activo: true,
      docenteIds: user.id,
    })
      .populate("materiaIds", "nombre")
      .lean();

    if (!curso) {
      return NextResponse.json(
        { ok: false, message: "No tenés acceso a este curso." },
        { status: 403 }
      );
    }

    const alumnos = await Student.find({
      activo: true,
      cursoId: id,
    })
      .select("_id nombre apellido dni tutorIds")
      .sort({ apellido: 1, nombre: 1 })
      .lean();

    return NextResponse.json({ ok: true, curso, alumnos });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { ok: false, message: "No se pudieron obtener los alumnos." },
      { status: message === "FORBIDDEN" ? 403 : 401 }
    );
  }
}
