import AnnouncementManager from "@/components/comunicados/AnnouncementManager";
import styles from "@/app/app-pages.module.css";

export default function ComunicadosProfesorPage() {
  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Profesor</p>
          <h1 className={styles.title}>Comunicados</h1>
          <p className={styles.subtitle}>
            Enviá novedades a todo un curso o hablale directamente a una familia.
          </p>
        </div>
      </div>

      <AnnouncementManager />
    </section>
  );
}
