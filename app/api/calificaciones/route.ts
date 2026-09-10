import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";
import Course from "@/models/Course";
import Student from "@/models/Student";
import Grade from "@/models/Grade";
import { createNotification } from "@/lib/notifications";

function fechaValida(fecha: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha);
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const cursoId = String(searchParams.get("cursoId") || "");
    const alumnoId = String(searchParams.get("alumnoId") || "");

    await connectDB();

    if (user.role === "docente") {
      const cursos = await Course.find({
        activo: true,
        docenteIds: user.id,
        ...(cursoId && mongoose.isValidObjectId(cursoId)
          ? { _id: cursoId }
          : {}),
      })
        .select("_id")
        .lean();

      const cursoIds = cursos.map((curso) => curso._id);
      const filtro: Record<string, unknown> = {
        profesorId: user.id,
        cursoId: { $in: cursoIds },
      };

      if (alumnoId && mongoose.isValidObjectId(alumnoId)) {
        filtro.alumnoId = alumnoId;
      }

      const calificaciones = await Grade.find(filtro)
        .populate("alumnoId", "nombre apellido")
        .populate("cursoId", "nombre division")
        .sort({ fecha: -1, createdAt: -1 })
        .lean();

      return NextResponse.json({ ok: true, calificaciones });
    }

    const hijos = await Student.find({
      activo: true,
      tutorIds: user.id,
    })
      .select("_id")
      .lean();

    const hijoIds = hijos.map((hijo) => hijo._id);
    const filtro: Record<string, unknown> = {
      alumnoId: { $in: hijoIds },
    };

    if (alumnoId && mongoose.isValidObjectId(alumnoId)) {
      const pertenece = hijoIds.some((id) => String(id) === alumnoId);
      if (!pertenece) {
        return NextResponse.json(
          { ok: false, message: "Ese alumno no está vinculado a tu cuenta." },
          { status: 403 }
        );
      }
      filtro.alumnoId = alumnoId;
    }

    const calificaciones = await Grade.find(filtro)
      .populate("alumnoId", "nombre apellido")
      .populate("cursoId", "nombre division")
      .sort({ fecha: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ ok: true, calificaciones });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { ok: false, message: "No se pudieron obtener las calificaciones." },
      { status: message === "FORBIDDEN" ? 403 : 401 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const profesor = await requireUser();

    if (profesor.role !== "docente") {
      return NextResponse.json(
        { ok: false, message: "Solo un profesor puede cargar calificaciones." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const cursoId = String(body?.cursoId || "");
    const materia = String(body?.materia || "").trim();
    const titulo = String(body?.titulo || "").trim();
    const fecha = String(body?.fecha || "");
    const entradas = Array.isArray(body?.calificaciones)
      ? body.calificaciones
      : [];

    if (
      !mongoose.isValidObjectId(cursoId) ||
      !materia ||
      !titulo ||
      !fechaValida(fecha)
    ) {
      return NextResponse.json(
        { ok: false, message: "Completá curso, materia, evaluación y fecha." },
        { status: 400 }
      );
    }

    const validas = entradas
      .map((item: { alumnoId?: string; nota?: unknown; observacion?: string }) => ({
        alumnoId: String(item?.alumnoId || ""),
        nota: Number(item?.nota),
        observacion: String(item?.observacion || "").trim(),
      }))
      .filter(
        (item: { alumnoId: string; nota: number }) =>
          mongoose.isValidObjectId(item.alumnoId) &&
          Number.isFinite(item.nota) &&
          item.nota >= 0 &&
          item.nota <= 10
      );

    if (!validas.length) {
      return NextResponse.json(
        { ok: false, message: "Ingresá al menos una nota entre 0 y 10." },
        { status: 400 }
      );
    }

    await connectDB();

    const curso = await Course.findOne({
      _id: cursoId,
      activo: true,
      docenteIds: profesor.id,
    }).lean();

    if (!curso) {
      return NextResponse.json(
        { ok: false, message: "Ese curso no pertenece a tu cuenta." },
        { status: 403 }
      );
    }

    const alumnos = await Student.find({
      _id: { $in: validas.map((item: { alumnoId: string }) => item.alumnoId) },
      cursoId,
      activo: true,
    })
      .select("_id nombre apellido tutorIds")
      .lean();

    const alumnoMap = new Map(
      alumnos.map((alumno) => [String(alumno._id), alumno])
    );

    const evaluacionId = randomUUID();
    const documentos = validas
      .filter((item: { alumnoId: string }) => alumnoMap.has(item.alumnoId))
      .map((item: { alumnoId: string; nota: number; observacion: string }) => ({
        profesorId: profesor.id,
        cursoId,
        alumnoId: item.alumnoId,
        materia,
        titulo,
        nota: item.nota,
        fecha,
        observacion: item.observacion,
        evaluacionId,
      }));

    if (!documentos.length) {
      return NextResponse.json(
        { ok: false, message: "No hay alumnos válidos para guardar." },
        { status: 400 }
      );
    }

    const creadas = await Grade.insertMany(documentos);

    let notificaciones = 0;
    let erroresNotificacion = 0;

    for (const grade of creadas) {
      const alumno = alumnoMap.get(String(grade.alumnoId));
      if (!alumno?.tutorIds?.length) continue;

      const nombreAlumno = `${alumno.nombre} ${alumno.apellido}`.trim();

      for (const tutorId of alumno.tutorIds) {
        try {
          await createNotification({
            usuarioId: String(tutorId),
            tipo: "calificacion",
            titulo: `Nueva nota de ${nombreAlumno}`,
            mensaje: `${materia} · ${titulo}: ${grade.nota}`,
            alumnoId: String(grade.alumnoId),
            calificacionId: String(grade._id),
            href: `/padre/notas?alumnoId=${String(grade.alumnoId)}`,
          });
          notificaciones += 1;
        } catch (notificationError) {
          erroresNotificacion += 1;
          console.error("Error creando notificación de nota:", notificationError);
        }
      }
    }

    return NextResponse.json(
      {
        ok: true,
        message:
          erroresNotificacion > 0
            ? "Notas guardadas. Algunas notificaciones no pudieron generarse."
            : "Notas guardadas y tutores notificados.",
        guardadas: creadas.length,
        notificaciones,
        erroresNotificacion,
        evaluacionId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST calificaciones:", error);
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      {
        ok: false,
        message: "No se pudieron guardar las calificaciones.",
        ...(process.env.NODE_ENV !== "production" && {
          error: message || String(error),
        }),
      },
      { status: message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
