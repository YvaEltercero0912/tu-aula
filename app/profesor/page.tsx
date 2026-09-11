import CourseManager from "@/components/profesor/CourseManager";
import styles from "@/app/app-pages.module.css";

export default async function CursosProfesorPage({ searchParams }: { searchParams: Promise<{ nuevo?: string }> }) {
  const params = await searchParams;
  return <section className={styles.page}><div className={styles.hero}><div><p className={styles.eyebrow}>Profesor</p><h1 className={styles.title}>Mis cursos</h1><p className={styles.subtitle}>Creá y administrá tus cursos. Después agregá alumnos directamente a cada uno.</p></div></div><CourseManager openInitially={params.nuevo === "1"} /></section>;
}
