import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/auth";
import Course from "@/models/Course";
import Student from "@/models/Student";

export async function GET() {
  try {
    const user = await requireRole(["docente"]);
    await connectDB();

    const cursos = await Course.find({
      activo: true,
      docenteIds: user.id,
    })
      .sort({ cicloLectivo: -1, nombre: 1, division: 1 })
      .lean();

    const ids = cursos.map((curso) => curso._id);
    const counts = ids.length
      ? await Student.aggregate([
          { $match: { activo: true, cursoId: { $in: ids } } },
          { $group: { _id: "$cursoId", total: { $sum: 1 } } },
        ])
      : [];

    const countMap = new Map(
      counts.map((item) => [String(item._id), Number(item.total)])
    );

    return NextResponse.json({
      ok: true,
      cursos: cursos.map((curso) => ({
        ...curso,
        cantidadAlumnos: countMap.get(String(curso._id)) || 0,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { ok: false, message: "No se pudieron obtener tus cursos." },
      { status: message === "FORBIDDEN" ? 403 : 401 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["docente"]);
    const body = await request.json();
    const nombre = String(body?.nombre || "").trim();
    const division = String(body?.division || "").trim();
    const turno = String(body?.turno || "mañana");
    const cicloLectivo = Number(body?.cicloLectivo || new Date().getFullYear());

    if (!nombre) {
      return NextResponse.json(
        { ok: false, message: "Ingresá el nombre del curso." },
        { status: 400 }
      );
    }

    if (!["mañana", "tarde", "noche"].includes(turno)) {
      return NextResponse.json(
        { ok: false, message: "Turno inválido." },
        { status: 400 }
      );
    }

    await connectDB();

    const existente = await Course.exists({
      activo: true,
      docenteIds: user.id,
      nombre,
      division,
      cicloLectivo,
    });

    if (existente) {
      return NextResponse.json(
        { ok: false, message: "Ya tenés un curso con esos datos." },
        { status: 409 }
      );
    }

    const curso = await Course.create({
      nombre,
      division,
      turno,
      cicloLectivo,
      docenteIds: [user.id],
      activo: true,
    });

    return NextResponse.json({ ok: true, curso }, { status: 201 });
  } catch (error) {
    console.error("POST curso:", error);
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { ok: false, message: "No se pudo crear el curso." },
      { status: message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
