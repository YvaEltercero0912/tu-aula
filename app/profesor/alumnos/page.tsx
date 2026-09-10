import StudentManager from "@/components/profesor/StudentManager";
import styles from "@/app/app-pages.module.css";

export default async function AlumnosProfesorPage({ searchParams }: { searchParams: Promise<{ nuevo?: string; cursoId?: string }> }) {
  const params = await searchParams;
  return <section className={styles.page}><div className={styles.hero}><div><p className={styles.eyebrow}>Profesor</p><h1 className={styles.title}>Alumnos</h1><p className={styles.subtitle}>Creá al alumno, asignalo a un curso y cargá a su tutor en el mismo paso.</p></div></div><StudentManager initialCursoId={params.cursoId || ""} openInitially={params.nuevo === "1"} /></section>;
}
