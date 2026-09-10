import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Course from "@/models/Course";
import Student from "@/models/Student";
import Attendance from "@/models/Attendance";
import Justification from "@/models/Justification";
import styles from "@/app/app-pages.module.css";
import localStyles from "./profesor.module.css";

export default async function ProfesorPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  await connectDB();

  const cursos = await Course.find({ activo: true, docenteIds: user.id }).select("_id").lean();
  const cursoIds = cursos.map((x) => x._id);
  const [alumnos, asistencias] = await Promise.all([
    Student.countDocuments({ activo: true, cursoId: { $in: cursoIds } }),
    Attendance.find({ cursoId: { $in: cursoIds }, justificacionId: { $ne: null } }).select("justificacionId").lean(),
  ]);
  const ids = asistencias.map((x) => x.justificacionId).filter(Boolean);
  const pendientes = ids.length ? await Justification.countDocuments({ _id: { $in: ids }, estado: "pendiente" }) : 0;

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Tu Aula · Profesor</p>
          <h1 className={styles.title}>Hola, {user.nombre}</h1>
          <p className={styles.subtitle}>Creá tus cursos y alumnos, tomá asistencia y mantené informadas a las familias.</p>
        </div>
      </div>

      <div className={styles.grid}>
        <Link href="/profesor/cursos" className={`${styles.card} ${styles.cardLink}`}><span className={localStyles.icon}>▤</span><span className={styles.statLabel}>Mis cursos</span><strong className={styles.statValue}>{cursos.length}</strong></Link>
        <Link href="/profesor/alumnos" className={`${styles.card} ${styles.cardLink}`}><span className={localStyles.icon}>♙</span><span className={styles.statLabel}>Alumnos</span><strong className={styles.statValue}>{alumnos}</strong></Link>
        <Link href="/profesor/justificaciones" className={`${styles.card} ${styles.cardLink}`}><span className={localStyles.icon}>✎</span><span className={styles.statLabel}>Justificaciones pendientes</span><strong className={styles.statValue}>{pendientes}</strong></Link>
      </div>

      <div className={localStyles.quick}>
        <Link href="/profesor/alumnos?nuevo=1" className={styles.primaryButton}>+ Nuevo alumno</Link>
        <Link href="/profesor/cursos?nuevo=1" className={styles.secondaryButton}>+ Nuevo curso</Link>
        <Link href="/profesor/asistencia" className={styles.secondaryButton}>✓ Tomar asistencia</Link>
        <Link href="/profesor/comunicados" className={styles.secondaryButton}>✉ Enviar comunicado</Link>
      </div>

      {cursos.length === 0 && <div className={styles.empty}>Empezá creando tu primer curso. Después vas a poder agregar alumnos desde el mismo teléfono.</div>}
    </section>
  );
}
