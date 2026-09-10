import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Student from "@/models/Student";
import Course from "@/models/Course";
import Notification from "@/models/Notification";
import styles from "@/app/app-pages.module.css";
import localStyles from "./padre.module.css";

export default async function PadrePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  await connectDB();
  // Registrar el modelo usado por populate("cursoId").
  void Course;

  const [hijos, noLeidas] = await Promise.all([
    Student.find({ activo: true, tutorIds: user.id })
      .populate("cursoId", "nombre division")
      .sort({ nombre: 1 })
      .lean(),
    Notification.countDocuments({
      usuarioId: user.id,
      leida: false,
    }),
  ]);

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Familia</p>
          <h1 className={styles.title}>Hola, {user.nombre}</h1>
          <p className={styles.subtitle}>
            Desde acá podés consultar asistencia, avisos y justificar
            ausencias de tus hijos.
          </p>
        </div>
      </div>

      <div className={styles.grid}>
        <Link
          href="/padre/hijos"
          className={`${styles.card} ${styles.cardLink}`}
        >
          <span className={localStyles.icon}>♙</span>
          <span className={styles.statLabel}>Alumnos vinculados</span>
          <strong className={styles.statValue}>{hijos.length}</strong>
        </Link>

        <Link
          href="/notificaciones"
          className={`${styles.card} ${styles.cardLink}`}
        >
          <span className={localStyles.icon}>🔔</span>
          <span className={styles.statLabel}>Avisos sin leer</span>
          <strong className={styles.statValue}>{noLeidas}</strong>
        </Link>

        <Link
          href="/padre/asistencia"
          className={`${styles.card} ${styles.cardLink}`}
        >
          <span className={localStyles.icon}>✓</span>
          <span className={styles.statLabel}>Asistencia</span>
          <strong className={localStyles.go}>Consultar →</strong>
        </Link>

        <Link
          href="/padre/comunicados"
          className={`${styles.card} ${styles.cardLink}`}
        >
          <span className={localStyles.icon}>✉</span>
          <span className={styles.statLabel}>Comunicados</span>
          <strong className={localStyles.go}>Ver avisos →</strong>
        </Link>
      </div>

      <div className={localStyles.children}>
        <div className={localStyles.sectionTitle}>
          <h2>Mis hijos</h2>
          <Link href="/padre/hijos">Ver todos</Link>
        </div>

        {hijos.length === 0 ? (
          <div className={styles.empty}>
            Todavía no hay alumnos vinculados a tu cuenta.
          </div>
        ) : (
          <div className={localStyles.childGrid}>
            {hijos.map((hijo: any) => (
              <Link
                key={String(hijo._id)}
                href={`/padre/asistencia?alumnoId=${hijo._id}`}
                className={localStyles.child}
              >
                <span className={localStyles.avatar}>
                  {hijo.nombre.charAt(0)}{hijo.apellido.charAt(0)}
                </span>
                <span>
                  <strong>{hijo.nombre} {hijo.apellido}</strong>
                  <small>
                    {hijo.cursoId
                      ? `${hijo.cursoId.nombre} ${hijo.cursoId.division || ""}`
                      : "Sin curso asignado"}
                  </small>
                </span>
                <b>›</b>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
