import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Course from "@/models/Course";
import Attendance from "@/models/Attendance";
import Justification from "@/models/Justification";
import styles from "@/app/app-pages.module.css";
import localStyles from "./docente.module.css";

export default async function DocentePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  await connectDB();

  const cursos = await Course.find({
    activo: true,
    docenteIds: user.id,
  })
    .select("_id nombre division")
    .lean();

  const cursoIds = cursos.map((curso) => curso._id);
  const asistenciasConJustificacion = await Attendance.find({
    cursoId: { $in: cursoIds },
    justificacionId: { $ne: null },
  })
    .select("justificacionId")
    .lean();

  const justificacionIds = asistenciasConJustificacion
    .map((item) => item.justificacionId)
    .filter(Boolean);

  const pendientes = justificacionIds.length
    ? await Justification.countDocuments({
        _id: { $in: justificacionIds },
        estado: "pendiente",
      })
    : 0;

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Panel docente</p>
          <h1 className={styles.title}>Hola, {user.nombre}</h1>
          <p className={styles.subtitle}>
            Tomá asistencia, revisá tus cursos y respondé las
            justificaciones de las familias.
          </p>
        </div>
      </div>

      <div className={styles.grid}>
        <Link
          href="/docente/cursos"
          className={`${styles.card} ${styles.cardLink}`}
        >
          <span className={localStyles.icon}>▤</span>
          <span className={styles.statLabel}>Mis cursos</span>
          <strong className={styles.statValue}>{cursos.length}</strong>
        </Link>

        <Link
          href="/docente/justificaciones"
          className={`${styles.card} ${styles.cardLink}`}
        >
          <span className={localStyles.icon}>✎</span>
          <span className={styles.statLabel}>Justificaciones pendientes</span>
          <strong className={styles.statValue}>{pendientes}</strong>
        </Link>

        <Link
          href="/docente/asistencia"
          className={`${styles.card} ${styles.cardLink}`}
        >
          <span className={localStyles.icon}>✓</span>
          <span className={styles.statLabel}>Tomar asistencia</span>
          <strong className={localStyles.go}>Abrir →</strong>
        </Link>
      </div>

      {cursos.length === 0 && (
        <div className={styles.empty}>
          Todavía no tenés cursos asignados. Un administrador debe
          asignarte a un curso desde el panel de administración.
        </div>
      )}
    </section>
  );
}
