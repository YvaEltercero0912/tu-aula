import NotificationCenter from "@/components/notificaciones/NotificationCenter";
import PushNotificationSetup from "@/components/notificaciones/PushNotificationSetup";
import styles from "@/app/app-pages.module.css";

export default function NotificacionesPage() {
  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Centro de avisos</p>
          <h1 className={styles.title}>Notificaciones</h1>
          <p className={styles.subtitle}>
            Faltas, tardanzas, calificaciones, comunicados y novedades importantes aparecen acá.
          </p>
        </div>
      </div>

      <PushNotificationSetup />
      <NotificationCenter />
    </section>
  );
}
