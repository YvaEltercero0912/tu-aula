import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Course from "@/models/Course";
import Student from "@/models/Student";

export async function GET() {
  try {
    const user = await requireRole(["docente"]);
    await connectDB();

    const cursos = await Course.find({ activo: true, docenteIds: user.id })
      .sort({ nombre: 1, division: 1 })
      .lean();

    const ids = cursos.map((curso) => curso._id);
    const counts = ids.length
      ? await Student.aggregate([
          { $match: { activo: true, cursoId: { $in: ids } } },
          { $group: { _id: "$cursoId", total: { $sum: 1 } } },
        ])
      : [];
    const map = new Map(counts.map((x) => [String(x._id), Number(x.total)]));

    return NextResponse.json({
      ok: true,
      cursos: cursos.map((curso) => ({
        ...curso,
        cantidadAlumnos: map.get(String(curso._id)) || 0,
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
