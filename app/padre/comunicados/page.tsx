import ParentAnnouncements from "@/components/comunicados/ParentAnnouncements";
import styles from "@/app/app-pages.module.css";

export default function ComunicadosPadrePage() {
  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Familia</p>
          <h1 className={styles.title}>Comunicados</h1>
          <p className={styles.subtitle}>
            Avisos y novedades que enviaron los profesores de tus hijos.
          </p>
        </div>
      </div>

      <ParentAnnouncements />
    </section>
  );
}
