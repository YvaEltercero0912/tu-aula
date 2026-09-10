import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";
import Announcement from "@/models/Announcement";
import Student from "@/models/Student";
import Course from "@/models/Course";
import User from "@/models/User";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { ok: false, message: "Comunicado inválido." },
        { status: 400 }
      );
    }

    await connectDB();
    void Course;
    void User;
    const comunicado = await Announcement.findById(id)
      .populate("profesorId", "nombre apellido")
      .populate("cursoId", "nombre division")
      .populate("tutorId", "nombre apellido")
      .lean();

    if (!comunicado) {
      return NextResponse.json(
        { ok: false, message: "Comunicado no encontrado." },
        { status: 404 }
      );
    }

    if (user.role === "docente") {
      if (String(comunicado.profesorId?._id || comunicado.profesorId) !== user.id) {
        return NextResponse.json({ ok: false }, { status: 403 });
      }
    } else if (comunicado.alcance === "tutor") {
      if (String(comunicado.tutorId?._id || comunicado.tutorId) !== user.id) {
        return NextResponse.json({ ok: false }, { status: 403 });
      }
    } else {
      const cursoId = String(comunicado.cursoId?._id || comunicado.cursoId || "");
      const tieneAlumno = await Student.exists({
        activo: true,
        tutorIds: user.id,
        cursoId,
      });

      if (!tieneAlumno) {
        return NextResponse.json({ ok: false }, { status: 403 });
      }
    }

    return NextResponse.json({ ok: true, comunicado });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { ok: false, message: "No se pudo obtener el comunicado." },
      { status: message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
