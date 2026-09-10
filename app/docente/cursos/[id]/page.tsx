import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import mongoose from "mongoose";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Course from "@/models/Course";
import Student from "@/models/Student";
import styles from "@/app/app-pages.module.css";
import localStyles from "./curso.module.css";

export default async function CursoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) notFound();

  await connectDB();

  const curso = await Course.findOne({
    _id: id,
    activo: true,
    docenteIds: user.id,
  })
    .populate("materiaIds", "nombre")
    .lean();

  if (!curso) notFound();

  const alumnos = await Student.find({
    activo: true,
    cursoId: id,
  })
    .select("_id nombre apellido dni")
    .sort({ apellido: 1, nombre: 1 })
    .lean();

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Curso</p>
          <h1 className={styles.title}>
            {curso.nombre} {curso.division || ""}
          </h1>
          <p className={styles.subtitle}>
            {alumnos.length} alumnos · Turno {curso.turno}
          </p>
        </div>

        <Link
          href={`/docente/asistencia?cursoId=${curso._id}`}
          className={styles.primaryButton}
        >
          ✓ Tomar asistencia
        </Link>
      </div>

      <div className={localStyles.list}>
        {alumnos.length === 0 ? (
          <div className={styles.empty}>
            Este curso todavía no tiene alumnos.
          </div>
        ) : (
          alumnos.map((alumno, index) => (
            <article key={String(alumno._id)} className={localStyles.student}>
              <span className={localStyles.number}>{index + 1}</span>
              <div>
                <strong>
                  {alumno.apellido}, {alumno.nombre}
                </strong>
                <small>{alumno.dni ? `DNI ${alumno.dni}` : "Sin DNI"}</small>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
