import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";
import Course from "@/models/Course";
import Student from "@/models/Student";
import User from "@/models/User";
import CalendarEvent from "@/models/CalendarEvent";
import Task from "@/models/Task";
import { createNotification } from "@/lib/notifications";

const validDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

async function notifyCourse(cursoId: string, input: { tipo: "evento" | "tarea"; titulo: string; mensaje: string; href: string }) {
  const students = await Student.find({ activo: true, cursoId }).select("tutorIds").lean();
  const tutorIds = [...new Set(students.flatMap((s: any) => (s.tutorIds || []).map(String)))];
  for (const tutorId of tutorIds) {
    try { await createNotification({ usuarioId: tutorId, ...input }); } catch (e) { console.error("Aviso agenda no enviado:", e); }
  }
  return tutorIds.length;
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    await connectDB();
    void Course; void User;
    const url = new URL(request.url);
    const cursoId = String(url.searchParams.get("cursoId") || "");

    let cursoIds: mongoose.Types.ObjectId[] = [];
    if (user.role === "docente") {
      const cursos = await Course.find({ activo: true, docenteIds: user.id, ...(cursoId && mongoose.isValidObjectId(cursoId) ? { _id: cursoId } : {}) }).select("_id").lean();
      cursoIds = cursos.map((c: any) => c._id);
    } else {
      const hijos = await Student.find({ activo: true, tutorIds: user.id }).select("cursoId").lean();
      cursoIds = hijos.map((h: any) => h.cursoId).filter(Boolean);
    }

    const [eventos, tareas] = await Promise.all([
      CalendarEvent.find({ cursoId: { $in: cursoIds } }).populate("cursoId", "nombre division").sort({ fecha: 1, hora: 1 }).lean(),
      Task.find({ cursoId: { $in: cursoIds } }).populate("cursoId", "nombre division").sort({ fechaEntrega: 1 }).lean(),
    ]);
    return NextResponse.json({ ok: true, eventos, tareas });
  } catch (error) {
    const m = error instanceof Error ? error.message : "";
    return NextResponse.json({ ok: false, message: "No se pudo cargar la agenda." }, { status: m === "UNAUTHORIZED" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (user.role !== "docente") return NextResponse.json({ ok: false, message: "Solo el profesor puede crear agenda." }, { status: 403 });
    const body = await request.json();
    const tipoRegistro = String(body?.registro || "evento");
    const cursoId = String(body?.cursoId || "");
    if (!mongoose.isValidObjectId(cursoId)) return NextResponse.json({ ok: false, message: "Elegí un curso." }, { status: 400 });
    await connectDB();
    const curso = await Course.findOne({ _id: cursoId, activo: true, docenteIds: user.id }).lean();
    if (!curso) return NextResponse.json({ ok: false, message: "Ese curso no pertenece a tu cuenta." }, { status: 403 });

    if (tipoRegistro === "tarea") {
      const materia = String(body?.materia || "").trim(); const titulo = String(body?.titulo || "").trim(); const fechaEntrega = String(body?.fechaEntrega || "");
      if (!materia || !titulo || !validDate(fechaEntrega)) return NextResponse.json({ ok: false, message: "Completá materia, tarea y fecha de entrega." }, { status: 400 });
      const tarea = await Task.create({ profesorId: user.id, cursoId, materia, titulo, descripcion: String(body?.descripcion || "").trim(), fechaEntrega });
      const nombreCurso = `${curso.nombre} ${curso.division || ""}`.trim();
      const notificados = await notifyCourse(cursoId, { tipo: "tarea", titulo: `Nueva tarea · ${materia}`, mensaje: `${titulo} · Entrega ${fechaEntrega} · ${nombreCurso}`, href: "/padre/agenda" });
      return NextResponse.json({ ok: true, tarea, notificados }, { status: 201 });
    }

    const titulo = String(body?.titulo || "").trim(); const fecha = String(body?.fecha || "");
    if (!titulo || !validDate(fecha)) return NextResponse.json({ ok: false, message: "Completá título y fecha." }, { status: 400 });
    const evento = await CalendarEvent.create({ profesorId: user.id, cursoId, tipo: body?.tipo || "otro", titulo, descripcion: String(body?.descripcion || "").trim(), fecha, hora: String(body?.hora || "").trim(), recordatorio: body?.recordatorio !== false });
    const nombreCurso = `${curso.nombre} ${curso.division || ""}`.trim();
    const notificados = await notifyCourse(cursoId, { tipo: "evento", titulo: `Nuevo evento · ${titulo}`, mensaje: `${fecha}${body?.hora ? ` ${body.hora}` : ""} · ${nombreCurso}`, href: "/padre/agenda" });
    return NextResponse.json({ ok: true, evento, notificados }, { status: 201 });
  } catch (error) {
    console.error("POST agenda:", error);
    return NextResponse.json({ ok: false, message: "No se pudo guardar en la agenda." }, { status: 500 });
  }
}
