import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";
import Course from "@/models/Course";
import Student from "@/models/Student";
import Grade from "@/models/Grade";
import ReportCard from "@/models/ReportCard";
import { createNotification } from "@/lib/notifications";

const validDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

export async function GET(request: Request) {
  try {
    const user = await requireUser(); await connectDB(); void Course; void Student;
    const alumnoId = String(new URL(request.url).searchParams.get("alumnoId") || "");
    const filter: Record<string, unknown> = {};
    if (user.role === "docente") {
      const cursos = await Course.find({ activo: true, docenteIds: user.id }).select("_id").lean();
      filter.cursoId = { $in: cursos.map((c: any) => c._id) };
    } else {
      const hijos = await Student.find({ activo: true, tutorIds: user.id }).select("_id").lean();
      const ids = hijos.map((h: any) => h._id); filter.alumnoId = { $in: ids };
    }
    if (alumnoId && mongoose.isValidObjectId(alumnoId)) filter.alumnoId = alumnoId;
    const boletines = await ReportCard.find(filter).populate("alumnoId", "nombre apellido").populate("cursoId", "nombre division").sort({ cicloLectivo: -1, createdAt: -1 }).lean();
    return NextResponse.json({ ok: true, boletines });
  } catch (error) {
    const m = error instanceof Error ? error.message : "";
    return NextResponse.json({ ok: false, message: "No se pudieron cargar los boletines." }, { status: m === "UNAUTHORIZED" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (user.role !== "docente") return NextResponse.json({ ok: false, message: "Solo el profesor puede publicar boletines." }, { status: 403 });
    const body = await request.json();
    const cursoId = String(body?.cursoId || ""), alumnoId = String(body?.alumnoId || "");
    const periodo = String(body?.periodo || "").trim(), desde = String(body?.desde || ""), hasta = String(body?.hasta || "");
    const cicloLectivo = Number(body?.cicloLectivo || new Date().getFullYear());
    if (!mongoose.isValidObjectId(cursoId) || !mongoose.isValidObjectId(alumnoId) || !periodo || !validDate(desde) || !validDate(hasta)) return NextResponse.json({ ok: false, message: "Completá alumno, período y fechas." }, { status: 400 });
    await connectDB();
    const [curso, alumno] = await Promise.all([
      Course.findOne({ _id: cursoId, activo: true, docenteIds: user.id }).lean(),
      Student.findOne({ _id: alumnoId, cursoId, activo: true }).select("nombre apellido tutorIds").lean(),
    ]);
    if (!curso || !alumno) return NextResponse.json({ ok: false, message: "Curso o alumno inválido." }, { status: 403 });
    const notas = await Grade.find({ alumnoId, cursoId, fecha: { $gte: desde, $lte: hasta } }).select("materia nota").lean();
    const grupos = new Map<string, number[]>();
    for (const n of notas as any[]) { if (!grupos.has(n.materia)) grupos.set(n.materia, []); grupos.get(n.materia)!.push(Number(n.nota)); }
    const promedios = [...grupos.entries()].map(([materia, values]) => ({ materia, promedio: Math.round((values.reduce((a,b)=>a+b,0)/values.length)*100)/100, cantidad: values.length })).sort((a,b)=>a.materia.localeCompare(b.materia));
    const promedioGeneral = promedios.length ? Math.round((promedios.reduce((a,p)=>a+p.promedio,0)/promedios.length)*100)/100 : null;
    const boletin = await ReportCard.findOneAndUpdate({ alumnoId, periodo, cicloLectivo }, { $set: { profesorId: user.id, cursoId, alumnoId, periodo, cicloLectivo, desde, hasta, promedios, promedioGeneral, observacion: String(body?.observacion || "").trim(), publicado: true } }, { upsert: true, new: true, runValidators: true });
    for (const tutorId of (alumno as any).tutorIds || []) {
      try { await createNotification({ usuarioId: String(tutorId), tipo: "boletin", titulo: `Nuevo boletín de ${alumno.nombre} ${alumno.apellido}`, mensaje: `${periodo} · ${cicloLectivo}`, alumnoId, href: `/padre/boletines?alumnoId=${alumnoId}` }); } catch (e) { console.error("Notificación boletín:", e); }
    }
    return NextResponse.json({ ok: true, boletin, cantidadNotas: notas.length }, { status: 201 });
  } catch (error) {
    console.error("POST boletin:", error);
    return NextResponse.json({ ok: false, message: "No se pudo publicar el boletín." }, { status: 500 });
  }
}
