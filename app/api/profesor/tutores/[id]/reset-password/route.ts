import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/auth";
import Course from "@/models/Course";
import Student from "@/models/Student";
import User from "@/models/User";

function temporaryPassword() {
  return `TA-${randomBytes(8).toString("base64url").slice(0, 10)}`;
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const profesor = await requireRole(["docente"]);
    const { id } = await context.params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { ok: false, message: "Tutor inválido." },
        { status: 400 }
      );
    }

    await connectDB();

    const cursos = await Course.find({
      activo: true,
      docenteIds: profesor.id,
    })
      .select("_id")
      .lean();

    const cursoIds = cursos.map((curso) => curso._id);

    const vinculo = await Student.exists({
      activo: true,
      cursoId: { $in: cursoIds },
      tutorIds: id,
    });

    if (!vinculo) {
      return NextResponse.json(
        {
          ok: false,
          message: "Ese tutor no está vinculado a uno de tus alumnos.",
        },
        { status: 403 }
      );
    }

    const tutor = await User.findOne({
      _id: id,
      role: "padre",
      activo: true,
    });

    if (!tutor) {
      return NextResponse.json(
        { ok: false, message: "Tutor no encontrado." },
        { status: 404 }
      );
    }

    const password = temporaryPassword();
    tutor.password = await bcrypt.hash(password, 12);
    tutor.requiereCambioPassword = true;
    await tutor.save();

    return NextResponse.json({
      ok: true,
      message: "Contraseña temporal generada.",
      credencialesTemporales: {
        email: tutor.email,
        password,
      },
    });
  } catch (error) {
    console.error("POST reset password tutor:", error);
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { ok: false, message: "No se pudo generar la contraseña temporal." },
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
