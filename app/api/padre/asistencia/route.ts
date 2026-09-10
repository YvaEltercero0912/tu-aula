import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/auth";
import Student from "@/models/Student";
import Attendance from "@/models/Attendance";
import Course from "@/models/Course";
import Justification from "@/models/Justification";

export async function GET(request: Request) {
  try {
    const user = await requireRole(["padre"]);
    const alumnoId = String(
      new URL(request.url).searchParams.get("alumnoId") || ""
    );

    if (!mongoose.isValidObjectId(alumnoId)) {
      return NextResponse.json(
        { ok: false, message: "Alumno inválido." },
        { status: 400 }
      );
    }

    await connectDB();
    void Course;
    void Justification;

    const alumno = await Student.findOne({
      _id: alumnoId,
      activo: true,
      tutorIds: user.id,
    })
      .populate("cursoId", "nombre division")
      .lean();

    if (!alumno) {
      return NextResponse.json(
        { ok: false, message: "No tenés acceso a este alumno." },
        { status: 403 }
      );
    }

    const asistencias = await Attendance.find({ alumnoId })
      .populate("justificacionId", "motivo observacion estado createdAt")
      .sort({ fecha: -1 })
      .limit(90)
      .lean();

    return NextResponse.json({ ok: true, alumno, asistencias });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { ok: false, message: "No se pudo obtener la asistencia." },
      { status: message === "FORBIDDEN" ? 403 : 401 }
    );
  }
}
