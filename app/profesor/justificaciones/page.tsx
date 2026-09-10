import TeacherJustifications from "@/components/justificaciones/TeacherJustifications";
import styles from "@/app/app-pages.module.css";

export default function JustificacionesPage() {
  return <section className={styles.page}><div className={styles.hero}><div><p className={styles.eyebrow}>Profesor</p><h1 className={styles.title}>Justificaciones</h1><p className={styles.subtitle}>Revisá las razones enviadas por padres y tutores.</p></div></div><TeacherJustifications /></section>;
}
