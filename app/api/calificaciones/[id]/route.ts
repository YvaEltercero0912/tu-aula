import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/auth";
import Grade from "@/models/Grade";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const profesor = await requireRole(["docente"]);
    const { id } = await context.params;
    const body = await request.json();

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { ok: false, message: "Calificación inválida." },
        { status: 400 }
      );
    }

    const nota = Number(body?.nota);
    if (!Number.isFinite(nota) || nota < 0 || nota > 10) {
      return NextResponse.json(
        { ok: false, message: "La nota debe estar entre 0 y 10." },
        { status: 400 }
      );
    }

    await connectDB();

    const calificacion = await Grade.findOneAndUpdate(
      { _id: id, profesorId: profesor.id },
      {
        $set: {
          nota,
          ...(body.observacion !== undefined && {
            observacion: String(body.observacion || "").trim(),
          }),
        },
      },
      { new: true, runValidators: true }
    ).lean();

    if (!calificacion) {
      return NextResponse.json(
        { ok: false, message: "Calificación no encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, calificacion });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { ok: false, message: "No se pudo actualizar la calificación." },
      { status: message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
