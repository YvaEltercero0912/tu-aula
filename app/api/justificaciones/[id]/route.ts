import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/auth";
import Attendance from "@/models/Attendance";
import Course from "@/models/Course";
import Justification from "@/models/Justification";
import { createNotification } from "@/lib/notifications";
import Student from "@/models/Student";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["docente"]);
    const { id } = await context.params;
    const body = await request.json();
    const estado = String(body?.estado || "");

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { ok: false, message: "Justificación inválida." },
        { status: 400 }
      );
    }

    if (!['aprobada', 'rechazada'].includes(estado)) {
      return NextResponse.json(
        { ok: false, message: "Estado inválido." },
        { status: 400 }
      );
    }

    await connectDB();

    const justificacion = await Justification.findById(id).lean();

    if (!justificacion) {
      return NextResponse.json(
        { ok: false, message: "Justificación no encontrada." },
        { status: 404 }
      );
    }

    const asistencia = await Attendance.findById(
      justificacion.asistenciaId
    ).lean();

    if (!asistencia) {
      return NextResponse.json(
        { ok: false, message: "Asistencia no encontrada." },
        { status: 404 }
      );
    }

    const acceso = await Course.exists({
      _id: asistencia.cursoId,
      docenteIds: user.id,
      activo: true,
    });

    if (!acceso) {
      return NextResponse.json(
        { ok: false, message: "No tenés acceso a esta justificación." },
        { status: 403 }
      );
    }

    const actualizada = await Justification.findByIdAndUpdate(
      id,
      {
        estado,
        revisadoPorId: user.id,
        revisadoAt: new Date(),
      },
      { new: true }
    );

    await Attendance.findByIdAndUpdate(asistencia._id, {
      justificada: estado === "aprobada",
    });

    const alumno = await Student.findById(justificacion.alumnoId)
      .select("nombre apellido")
      .lean();

    const nombreAlumno = alumno
      ? `${alumno.nombre} ${alumno.apellido}`.trim()
      : "El alumno";

    await createNotification({
      usuarioId: String(justificacion.tutorId),
      tipo:
        estado === "aprobada"
          ? "justificacion_aprobada"
          : "justificacion_rechazada",
      titulo:
        estado === "aprobada"
          ? "Justificación aprobada"
          : "Justificación rechazada",
      mensaje:
        estado === "aprobada"
          ? `La justificación de ${nombreAlumno} fue aprobada.`
          : `La justificación de ${nombreAlumno} fue rechazada.`,
      alumnoId: String(justificacion.alumnoId),
      asistenciaId: String(asistencia._id),
      justificacionId: String(justificacion._id),
      href: `/padre/asistencia?alumnoId=${justificacion.alumnoId}`,
    });

    return NextResponse.json({ ok: true, justificacion: actualizada });
  } catch (error) {
    console.error("PATCH justificación:", error);
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { ok: false, message: "No se pudo revisar la justificación." },
      { status: message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
