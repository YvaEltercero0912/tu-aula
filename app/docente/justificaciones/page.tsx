import TeacherJustifications from "@/components/justificaciones/TeacherJustifications";
import styles from "@/app/app-pages.module.css";

export default function JustificacionesDocentePage() {
  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Familias</p>
          <h1 className={styles.title}>Justificaciones</h1>
          <p className={styles.subtitle}>
            Revisá los motivos enviados por los padres o tutores.
          </p>
        </div>
      </div>

      <TeacherJustifications />
    </section>
  );
}
