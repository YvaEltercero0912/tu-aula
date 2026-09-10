import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/auth";
import Attendance from "@/models/Attendance";
import Course from "@/models/Course";
import Justification from "@/models/Justification";
import { createNotification } from "@/lib/notifications";
import Student from "@/models/Student";
import User from "@/models/User";

export async function GET() {
  try {
    const user = await requireRole(["docente"]);
    await connectDB();
    void User;

    let filtro: Record<string, unknown> = {};

    {
      const cursos = await Course.find({
        activo: true,
        docenteIds: user.id,
      })
        .select("_id")
        .lean();

      const cursoIds = cursos.map((curso) => curso._id);
      const asistencias = await Attendance.find({
        cursoId: { $in: cursoIds },
        justificacionId: { $ne: null },
      })
        .select("_id")
        .lean();

      filtro = {
        asistenciaId: {
          $in: asistencias.map((asistencia) => asistencia._id),
        },
      };
    }

    const justificaciones = await Justification.find(filtro)
      .populate("alumnoId", "nombre apellido")
      .populate("tutorId", "nombre apellido email")
      .populate({
        path: "asistenciaId",
        select: "fecha estado cursoId justificada",
        populate: {
          path: "cursoId",
          select: "nombre division",
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ ok: true, justificaciones });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { ok: false, message: "No se pudieron obtener las justificaciones." },
      { status: message === "FORBIDDEN" ? 403 : 401 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["padre"]);
    const body = await request.json();
    const asistenciaId = String(body?.asistenciaId || "");
    const motivo = String(body?.motivo || "").trim();
    const observacion = String(body?.observacion || "").trim();

    if (!mongoose.isValidObjectId(asistenciaId) || !motivo) {
      return NextResponse.json(
        { ok: false, message: "Completá el motivo de la justificación." },
        { status: 400 }
      );
    }

    await connectDB();

    const asistencia = await Attendance.findById(asistenciaId).lean();

    if (!asistencia || !["ausente", "tarde"].includes(asistencia.estado)) {
      return NextResponse.json(
        { ok: false, message: "La asistencia no se puede justificar." },
        { status: 404 }
      );
    }

    const alumno = await Student.findOne({
      _id: asistencia.alumnoId,
      tutorIds: user.id,
      activo: true,
    }).lean();

    if (!alumno) {
      return NextResponse.json(
        { ok: false, message: "No tenés acceso a este alumno." },
        { status: 403 }
      );
    }

    const existente = await Justification.findOne({ asistenciaId }).lean();

    if (existente) {
      return NextResponse.json(
        { ok: false, message: "Esta falta ya tiene una justificación enviada." },
        { status: 409 }
      );
    }

    const justificacion = await Justification.create({
      asistenciaId,
      alumnoId: asistencia.alumnoId,
      tutorId: user.id,
      motivo,
      observacion,
      estado: "pendiente",
    });

    await Attendance.findByIdAndUpdate(asistenciaId, {
      justificacionId: justificacion._id,
      justificada: false,
    });

    const curso = await Course.findById(asistencia.cursoId)
      .select("docenteIds")
      .lean();

    const nombreAlumno = `${alumno.nombre} ${alumno.apellido}`.trim();

    for (const docenteId of curso?.docenteIds || []) {
      await createNotification({
        usuarioId: String(docenteId),
        tipo: "justificacion_recibida",
        titulo: "Nueva justificación",
        mensaje: `${nombreAlumno} tiene una justificación pendiente de revisión.`,
        alumnoId: String(alumno._id),
        asistenciaId,
        justificacionId: String(justificacion._id),
        href: "/profesor/justificaciones",
      });
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Justificación enviada correctamente.",
        justificacion,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST justificación:", error);
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { ok: false, message: "No se pudo enviar la justificación." },
      { status: message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
