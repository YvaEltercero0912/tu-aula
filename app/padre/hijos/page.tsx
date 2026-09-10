import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Student from "@/models/Student";
import Course from "@/models/Course";
import styles from "@/app/app-pages.module.css";
import localStyles from "./hijos.module.css";

export default async function HijosPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  await connectDB();
  void Course;
  const hijos = await Student.find({
    activo: true,
    tutorIds: user.id,
  })
    .populate("cursoId", "nombre division turno cicloLectivo")
    .sort({ apellido: 1, nombre: 1 })
    .lean();

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Familia</p>
          <h1 className={styles.title}>Mis hijos</h1>
          <p className={styles.subtitle}>
            Alumnos vinculados a tu cuenta de padre o tutor.
          </p>
        </div>
      </div>

      {hijos.length === 0 ? (
        <div className={styles.empty}>
          No hay alumnos vinculados a tu cuenta.
        </div>
      ) : (
        <div className={localStyles.grid}>
          {hijos.map((hijo: any) => (
            <article key={String(hijo._id)} className={localStyles.card}>
              <div className={localStyles.avatar}>
                {hijo.nombre.charAt(0)}{hijo.apellido.charAt(0)}
              </div>
              <div className={localStyles.info}>
                <h2>{hijo.nombre} {hijo.apellido}</h2>
                <p>
                  {hijo.cursoId
                    ? `${hijo.cursoId.nombre} ${hijo.cursoId.division || ""} · Turno ${hijo.cursoId.turno}`
                    : "Sin curso asignado"}
                </p>
              </div>
              <Link
                href={`/padre/asistencia?alumnoId=${hijo._id}`}
                className={styles.primaryButton}
              >
                Ver asistencia
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
