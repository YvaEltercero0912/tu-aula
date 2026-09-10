import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/auth";
import Course from "@/models/Course";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["docente"]);
    const { id } = await context.params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { ok: false, message: "Curso inválido." },
        { status: 400 }
      );
    }

    const body = await request.json();
    await connectDB();

    const update: Record<string, unknown> = {};

    if (body.nombre !== undefined) update.nombre = String(body.nombre).trim();
    if (body.division !== undefined) update.division = String(body.division).trim();
    if (body.turno !== undefined) update.turno = String(body.turno);
    if (body.cicloLectivo !== undefined) update.cicloLectivo = Number(body.cicloLectivo);
        if (body.activo !== undefined) update.activo = Boolean(body.activo);

    const curso = await Course.findOneAndUpdate({ _id: id, docenteIds: user.id, activo: true }, update, {
      new: true,
      runValidators: true,
    })
      .lean();

    if (!curso) {
      return NextResponse.json(
        { ok: false, message: "Curso no encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, curso });
  } catch (error) {
    console.error("PATCH curso:", error);
    return NextResponse.json(
      { ok: false, message: "No se pudo actualizar el curso." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["docente"]);
    const { id } = await context.params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { ok: false, message: "Curso inválido." },
        { status: 400 }
      );
    }

    await connectDB();
    await Course.findOneAndUpdate({ _id: id, docenteIds: user.id }, { activo: false });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE curso:", error);
    return NextResponse.json(
      { ok: false, message: "No se pudo eliminar el curso." },
      { status: 500 }
    );
  }
}
