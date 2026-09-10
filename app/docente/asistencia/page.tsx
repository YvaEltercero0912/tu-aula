import AttendanceManager from "@/components/asistencia/AttendanceManager";
import styles from "@/app/app-pages.module.css";

export default async function AsistenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ cursoId?: string }>;
}) {
  const params = await searchParams;

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Asistencia</p>
          <h1 className={styles.title}>Tomar asistencia</h1>
          <p className={styles.subtitle}>
            Marcá únicamente las excepciones. Todos los alumnos se
            cargan como presentes por defecto.
          </p>
        </div>
      </div>

      <AttendanceManager initialCursoId={params.cursoId || ""} />
    </section>
  );
}
