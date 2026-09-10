import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/auth";
import Attendance from "@/models/Attendance";
import Course from "@/models/Course";
import Student from "@/models/Student";
import { upsertNotification } from "@/lib/notifications";

const ESTADOS = ["presente", "ausente", "tarde"] as const;
type EstadoAsistencia = (typeof ESTADOS)[number];

interface RegistroEntrada {
  alumnoId?: string;
  estado?: string;
}

function fechaValida(fecha: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha);
}

export async function GET(request: Request) {
  try {
    const user = await requireRole(["docente"]);
    const { searchParams } = new URL(request.url);
    const cursoId = String(searchParams.get("cursoId") || "");
    const fecha = String(searchParams.get("fecha") || "");

    if (!mongoose.isValidObjectId(cursoId) || !fechaValida(fecha)) {
      return NextResponse.json(
        { ok: false, message: "Curso o fecha inválidos." },
        { status: 400 }
      );
    }

    await connectDB();

    const acceso = await Course.exists({
      _id: cursoId,
      activo: true,
      docenteIds: user.id,
    });

    if (!acceso) {
      return NextResponse.json(
        { ok: false, message: "No tenés acceso a este curso." },
        { status: 403 }
      );
    }

    const registros = await Attendance.find({ cursoId, fecha })
      .select("_id alumnoId estado justificada justificacionId")
      .lean();

    return NextResponse.json({ ok: true, registros });
  } catch (error) {
    console.error("GET asistencia:", error);
    const message = error instanceof Error ? error.message : "";

    return NextResponse.json(
      { ok: false, message: "No se pudo obtener la asistencia." },
      { status: message === "FORBIDDEN" ? 403 : 401 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["docente"]);
    const body = await request.json();

    const cursoId = String(body?.cursoId || "");
    const fecha = String(body?.fecha || "");
    const registros: RegistroEntrada[] = Array.isArray(body?.registros)
      ? body.registros
      : [];

    if (!mongoose.isValidObjectId(cursoId) || !fechaValida(fecha)) {
      return NextResponse.json(
        { ok: false, message: "Curso o fecha inválidos." },
        { status: 400 }
      );
    }

    if (!registros.length) {
      return NextResponse.json(
        { ok: false, message: "No hay asistencia para guardar." },
        { status: 400 }
      );
    }

    await connectDB();

    const curso = await Course.findOne({
      _id: cursoId,
      activo: true,
      docenteIds: user.id,
    }).lean();

    if (!curso) {
      return NextResponse.json(
        { ok: false, message: "No tenés acceso a este curso." },
        { status: 403 }
      );
    }

    const alumnos = await Student.find({
      cursoId,
      activo: true,
    })
      .select("_id nombre apellido tutorIds")
      .lean();

    const alumnoMap = new Map(
      alumnos.map((alumno) => [String(alumno._id), alumno])
    );

    const idsValidos = registros
      .map((registro) => String(registro?.alumnoId || ""))
      .filter((id) => alumnoMap.has(id));

    const existentes = idsValidos.length
      ? await Attendance.find({
          cursoId,
          fecha,
          alumnoId: { $in: idsValidos },
        }).lean()
      : [];

    const existenteMap = new Map(
      existentes.map((item) => [String(item.alumnoId), item])
    );

    let guardados = 0;
    let notificaciones = 0;
    let erroresNotificacion = 0;

    for (const registro of registros) {
      const alumnoId = String(registro?.alumnoId || "");
      const estado = String(registro?.estado || "") as EstadoAsistencia;
      const alumno = alumnoMap.get(alumnoId);

      if (!alumno || !ESTADOS.includes(estado)) {
        continue;
      }

      const anterior = existenteMap.get(alumnoId);
      const cambioRelevante = !anterior || anterior.estado !== estado;

      const setData: Record<string, unknown> = {
        alumnoId,
        cursoId,
        fecha,
        estado,
        docenteId: user.id,
      };

      // Si cambia el estado, una justificación anterior deja de ser válida.
      // También inicializamos estos campos al crear el registro por primera vez.
      if (!anterior || anterior.estado !== estado) {
        setData.justificada = false;
        setData.justificacionId = null;
      }

      const asistencia = await Attendance.findOneAndUpdate(
        { alumnoId, cursoId, fecha },
        { $set: setData },
        { upsert: true, new: true, runValidators: true }
      );

      existenteMap.set(alumnoId, asistencia.toObject());
      guardados += 1;

      if (
        cambioRelevante &&
        (estado === "ausente" || estado === "tarde") &&
        alumno.tutorIds?.length
      ) {
        const nombreAlumno = `${alumno.nombre} ${alumno.apellido}`.trim();
        const esAusencia = estado === "ausente";

        for (const tutorId of alumno.tutorIds) {
          if (!mongoose.isValidObjectId(tutorId)) {
            erroresNotificacion += 1;
            continue;
          }

          try {
            // Conserva un único aviso interno por asistencia/tipo, pero si el
            // estado vuelve a cambiar a ausente/tarde envía un nuevo push.
            await upsertNotification(
              {
                usuarioId: tutorId,
                asistenciaId: asistencia._id,
                tipo: esAusencia ? "inasistencia" : "tardanza",
              },
              {
                usuarioId: String(tutorId),
                tipo: esAusencia ? "inasistencia" : "tardanza",
                titulo: esAusencia
                  ? `${nombreAlumno} faltó a clases`
                  : `${nombreAlumno} llegó tarde`,
                mensaje: esAusencia
                  ? `Se registró una ausencia el ${fecha}. Podés justificarla desde Tu Aula.`
                  : `Se registró una llegada tarde el ${fecha}.`,
                alumnoId,
                asistenciaId: String(asistencia._id),
                href: `/padre/asistencia?alumnoId=${alumnoId}`,
              }
            );

            notificaciones += 1;
          } catch (notificationError) {
            erroresNotificacion += 1;
            console.error(
              `Error creando notificación para tutor ${String(tutorId)}:`,
              notificationError
            );
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message:
        erroresNotificacion > 0
          ? "Asistencia guardada, pero algunas notificaciones no pudieron generarse."
          : "Asistencia guardada correctamente.",
      guardados,
      notificaciones,
      erroresNotificacion,
    });
  } catch (error) {
    console.error("POST asistencia:", error);
    const message = error instanceof Error ? error.message : "";

    return NextResponse.json(
      {
        ok: false,
        message: "No se pudo guardar la asistencia.",
        ...(process.env.NODE_ENV !== "production" && {
          error: message || String(error),
        }),
      },
      {
        status:
          message === "FORBIDDEN"
            ? 403
            : message === "UNAUTHORIZED"
              ? 401
              : 500,
      }
    );
  }
}
