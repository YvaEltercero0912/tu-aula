import ParentAttendance from "@/components/asistencia/ParentAttendance";
import styles from "@/app/app-pages.module.css";

export default async function PadreAsistenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ alumnoId?: string }>;
}) {
  const params = await searchParams;

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Seguimiento</p>
          <h1 className={styles.title}>Asistencia</h1>
          <p className={styles.subtitle}>
            Consultá presentes, ausencias y tardanzas. Las faltas se
            pueden justificar directamente desde el celular.
          </p>
        </div>
      </div>

      <ParentAttendance initialAlumnoId={params.alumnoId || ""} />
    </section>
  );
}
