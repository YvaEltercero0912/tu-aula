import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Course from "@/models/Course";
import Student from "@/models/Student";
import styles from "@/app/app-pages.module.css";
import localStyles from "./cursos.module.css";

export default async function CursosDocentePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  await connectDB();

  const cursos = await Course.find({
    activo: true,
    docenteIds: user.id,
  })
    .populate("materiaIds", "nombre")
    .sort({ nombre: 1, division: 1 })
    .lean();

  const counts = await Promise.all(
    cursos.map((curso) =>
      Student.countDocuments({
        activo: true,
        cursoId: curso._id,
      })
    )
  );

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Docente</p>
          <h1 className={styles.title}>Mis cursos</h1>
          <p className={styles.subtitle}>
            Elegí un curso para ver los alumnos o tomar asistencia.
          </p>
        </div>
      </div>

      {cursos.length === 0 ? (
        <div className={styles.empty}>
          No tenés cursos asignados todavía.
        </div>
      ) : (
        <div className={localStyles.grid}>
          {cursos.map((curso, index) => {
            const materias = Array.isArray(curso.materiaIds)
              ? curso.materiaIds
              : [];

            return (
              <article key={String(curso._id)} className={localStyles.card}>
                <div className={localStyles.topline}>
                  <span>{curso.turno}</span>
                  <small>{curso.cicloLectivo}</small>
                </div>

                <h2>
                  {curso.nombre} {curso.division || ""}
                </h2>

                <p>
                  {counts[index]} {counts[index] === 1 ? "alumno" : "alumnos"}
                </p>

                {materias.length > 0 && (
                  <div className={localStyles.tags}>
                    {materias.slice(0, 4).map((materia: any) => (
                      <span key={String(materia._id)}>{materia.nombre}</span>
                    ))}
                  </div>
                )}

                <div className={localStyles.actions}>
                  <Link
                    href={`/docente/cursos/${curso._id}`}
                    className={styles.secondaryButton}
                  >
                    Ver curso
                  </Link>
                  <Link
                    href={`/docente/asistencia?cursoId=${curso._id}`}
                    className={styles.primaryButton}
                  >
                    Tomar asistencia
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
