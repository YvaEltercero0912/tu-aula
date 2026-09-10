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

export async function GET(request: Request) {
  try {
    const user = await requireRole(["docente"]);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const cursoId = String(searchParams.get("cursoId") || "");

    const cursos = await Course.find({
      activo: true,
      docenteIds: user.id,
      ...(cursoId && mongoose.isValidObjectId(cursoId) ? { _id: cursoId } : {}),
    })
      .select("_id")
      .lean();

    const cursoIds = cursos.map((curso) => curso._id);

    const alumnos = await Student.find({
      activo: true,
      cursoId: { $in: cursoIds },
    })
      .populate("cursoId", "nombre division turno cicloLectivo")
      .populate("tutorIds", "nombre apellido dni telefono email")
      .sort({ apellido: 1, nombre: 1 })
      .lean();

    return NextResponse.json({ ok: true, alumnos });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { ok: false, message: "No se pudieron obtener los alumnos." },
      { status: message === "FORBIDDEN" ? 403 : 401 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const profesor = await requireRole(["docente"]);
    const body = await request.json();

    const alumno = body?.alumno || body;
    const tutor = body?.tutor || {};

    const nombre = String(alumno?.nombre || "").trim();
    const apellido = String(alumno?.apellido || "").trim();
    const dni = String(alumno?.dni || "").trim();
    const fechaNacimiento = String(alumno?.fechaNacimiento || "").trim();
    const cursoId = String(alumno?.cursoId || "");

    const tutorNombre = String(tutor?.nombre || "").trim();
    const tutorApellido = String(tutor?.apellido || "").trim();
    const tutorDni = String(tutor?.dni || "").trim();
    const tutorTelefono = String(tutor?.telefono || "").trim();
    const tutorEmail = String(tutor?.email || "").trim().toLowerCase();

    if (!nombre || !apellido || !mongoose.isValidObjectId(cursoId)) {
      return NextResponse.json(
        { ok: false, message: "Completá el alumno y elegí un curso." },
        { status: 400 }
      );
    }

    if (!tutorNombre || !tutorEmail) {
      return NextResponse.json(
        { ok: false, message: "El nombre y el correo del tutor son obligatorios." },
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

    const tutorConditions: Record<string, unknown>[] = [{ email: tutorEmail }];
    if (tutorDni) tutorConditions.push({ dni: tutorDni });

    let tutorUser = await User.findOne({ $or: tutorConditions }).select(
      "_id nombre apellido dni telefono email role activo"
    );

    let tutorCreado = false;
    let claveTemporal: string | null = null;

    if (tutorUser) {
      if (String(tutorUser.role) !== "padre") {
        return NextResponse.json(
          {
            ok: false,
            message: "Ese correo o DNI ya pertenece a una cuenta de profesor.",
          },
          { status: 409 }
        );
      }

      tutorUser.nombre = tutorNombre || tutorUser.nombre;
      tutorUser.apellido = tutorApellido || tutorUser.apellido;
      tutorUser.dni = tutorDni || tutorUser.dni || "";
      tutorUser.telefono = tutorTelefono || tutorUser.telefono || "";
      tutorUser.activo = true;
      await tutorUser.save();
    } else {
      claveTemporal = temporaryPassword();
      tutorUser = await User.create({
        nombre: tutorNombre,
        apellido: tutorApellido,
        dni: tutorDni,
        telefono: tutorTelefono,
        email: tutorEmail,
        password: await bcrypt.hash(claveTemporal, 12),
        role: "padre",
        activo: true,
        requiereCambioPassword: true,
      });
      tutorCreado = true;
    }

    const nuevoAlumno = await Student.create({
      nombre,
      apellido,
      dni,
      fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
      cursoId,
      tutorIds: [tutorUser._id],
      activo: true,
    });

    return NextResponse.json(
      {
        ok: true,
        message: tutorCreado
          ? "Alumno y cuenta del tutor creados correctamente."
          : "Alumno creado y tutor existente vinculado correctamente.",
        alumno: nuevoAlumno,
        tutor: {
          id: String(tutorUser._id),
          nombre: tutorUser.nombre,
          apellido: tutorUser.apellido || "",
          email: tutorUser.email,
          telefono: tutorUser.telefono || "",
        },
        tutorCreado,
        credencialesTemporales: tutorCreado
          ? { email: tutorUser.email, password: claveTemporal }
          : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST alumno+tutor:", error);
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { ok: false, message: "No se pudo crear el alumno." },
      { status: message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
