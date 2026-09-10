import ParentGrades from "@/components/padre/ParentGrades";
import styles from "@/app/app-pages.module.css";

export default function NotasPage() {
  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Familia</p>
          <h1 className={styles.title}>Notas</h1>
          <p className={styles.subtitle}>
            Consultá las calificaciones y promedios de tus hijos desde el celular.
          </p>
        </div>
      </div>
      <ParentGrades />
    </section>
  );
}
