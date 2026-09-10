import Link from "next/link";
import styles from "@/app/app-pages.module.css";

export default function UsuariosPage() {
  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Administración</p>
          <h1 className={styles.title}>Usuarios</h1>
          <p className={styles.subtitle}>
            Gestioná docentes y padres/tutores desde el celular o la PC.
          </p>
        </div>
      </div>

      <div className={styles.grid}>
        <Link
          href="/admin/docentes"
          className={`${styles.card} ${styles.cardLink}`}
        >
          <strong className={styles.statValue}>Docentes</strong>
          <span className={styles.statLabel}>
            Crear cuentas para maestros y profesores.
          </span>
        </Link>

        <Link
          href="/admin/tutores"
          className={`${styles.card} ${styles.cardLink}`}
        >
          <strong className={styles.statValue}>Tutores</strong>
          <span className={styles.statLabel}>
            Crear las cuentas que usarán las familias.
          </span>
        </Link>
      </div>
    </section>
  );
}
