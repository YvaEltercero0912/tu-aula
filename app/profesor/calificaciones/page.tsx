import GradeManager from "@/components/profesor/GradeManager";
import styles from "@/app/app-pages.module.css";

export default function CalificacionesProfesorPage() {
  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Profesor</p>
          <h1 className={styles.title}>Calificaciones</h1>
          <p className={styles.subtitle}>
            Cargá las notas por curso. Al guardar, cada tutor recibe un aviso automático.
          </p>
        </div>
      </div>
      <GradeManager />
    </section>
  );
}
