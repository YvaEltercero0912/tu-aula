import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import Announcement from "@/models/Announcement";
import Course from "@/models/Course";
import Student from "@/models/Student";
import User from "@/models/User";

export async function GET() {
  try {
    const user = await requireUser();
    await connectDB();

    // Registrar modelos usados por populate.
    void Course;
    void User;

    if (user.role === "docente") {
      const comunicados = await Announcement.find({ profesorId: user.id })
        .populate("cursoId", "nombre division turno")
        .populate("tutorId", "nombre apellido email")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      return NextResponse.json({ ok: true, comunicados });
    }

    const hijos = await Student.find({
      activo: true,
      tutorIds: user.id,
    })
      .select("cursoId")
      .lean();

    const cursoIds = [
      ...new Set(
        hijos
          .map((hijo) => String(hijo.cursoId || ""))
          .filter(Boolean)
      ),
    ].map((id) => new mongoose.Types.ObjectId(id));

    const comunicados = await Announcement.find({
      $or: [
        { alcance: "tutor", tutorId: user.id },
        ...(cursoIds.length
          ? [{ alcance: "curso", cursoId: { $in: cursoIds } }]
          : []),
      ],
    })
      .populate("profesorId", "nombre apellido")
      .populate("cursoId", "nombre division turno")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ ok: true, comunicados });
  } catch (error) {
    console.error("GET comunicados:", error);
    return NextResponse.json(
      { ok: false, message: "No se pudieron obtener los comunicados." },
      { status: 401 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const profesor = await requireUser();

    if (profesor.role !== "docente") {
      return NextResponse.json(
        { ok: false, message: "Solo un profesor puede enviar comunicados." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const titulo = String(body?.titulo || "").trim();
    const mensaje = String(body?.mensaje || "").trim();
    const alcance = String(body?.alcance || "curso");
    const cursoId = String(body?.cursoId || "");
    const tutorId = String(body?.tutorId || "");

    if (!titulo || !mensaje) {
      return NextResponse.json(
        { ok: false, message: "Escribí el título y el mensaje." },
        { status: 400 }
      );
    }

    if (!['curso', 'tutor'].includes(alcance)) {
      return NextResponse.json(
        { ok: false, message: "Destinatario inválido." },
        { status: 400 }
      );
    }

    await connectDB();

    let recipientIds: string[] = [];
    let finalCursoId: string | null = null;
    let finalTutorId: string | null = null;

    if (alcance === "curso") {
      if (!mongoose.isValidObjectId(cursoId)) {
        return NextResponse.json(
          { ok: false, message: "Elegí un curso." },
          { status: 400 }
        );
      }

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
        activo: true,
        cursoId,
      })
        .select("tutorIds")
        .lean();

      recipientIds = [
        ...new Set(
          alumnos.flatMap((alumno) =>
            (alumno.tutorIds || []).map((id: unknown) => String(id))
          )
        ),
      ];
      finalCursoId = cursoId;
    } else {
      if (!mongoose.isValidObjectId(tutorId)) {
        return NextResponse.json(
          { ok: false, message: "Elegí un padre o tutor." },
          { status: 400 }
        );
      }

      const cursosProfesor = await Course.find({
        activo: true,
        docenteIds: profesor.id,
      })
        .select("_id")
        .lean();

      const cursoIds = cursosProfesor.map((curso) => curso._id);

      const tieneAlumno = await Student.exists({
        activo: true,
        cursoId: { $in: cursoIds },
        tutorIds: tutorId,
      });

      if (!tieneAlumno) {
        return NextResponse.json(
          { ok: false, message: "Ese tutor no está vinculado a tus alumnos." },
          { status: 403 }
        );
      }

      recipientIds = [tutorId];
      finalTutorId = tutorId;
    }

    const comunicado = await Announcement.create({
      profesorId: profesor.id,
      titulo,
      mensaje,
      alcance,
      cursoId: finalCursoId,
      tutorId: finalTutorId,
      destinatarios: recipientIds.length,
    });

    await Promise.allSettled(
      recipientIds.map((usuarioId) =>
        createNotification({
          usuarioId,
          tipo: "comunicado",
          titulo: `Comunicado: ${titulo}`,
          mensaje,
          comunicadoId: String(comunicado._id),
          href: "/padre/comunicados",
        })
      )
    );

    return NextResponse.json(
      {
        ok: true,
        comunicado,
        destinatarios: recipientIds.length,
        message:
          recipientIds.length > 0
            ? `Comunicado enviado a ${recipientIds.length} tutor${recipientIds.length === 1 ? "" : "es"}.`
            : "Comunicado guardado. El curso todavía no tiene tutores vinculados.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST comunicado:", error);
    return NextResponse.json(
      { ok: false, message: "No se pudo enviar el comunicado." },
      { status: 500 }
    );
  }
}
