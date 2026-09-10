"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./ParentGrades.module.css";

interface AlumnoRef { _id: string; nombre: string; apellido: string; }
interface CursoRef { _id: string; nombre: string; division?: string; }
interface Calificacion {
  _id: string;
  alumnoId: AlumnoRef;
  cursoId: CursoRef;
  materia: string;
  titulo: string;
  nota: number;
  fecha: string;
  observacion?: string;
}

export default function ParentGrades() {
  const [items, setItems] = useState<Calificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargar() {
      try {
        const response = await fetch("/api/calificaciones", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) {
          setError(data?.message || "No se pudieron cargar las notas.");
          return;
        }
        setItems(data.calificaciones || []);
      } catch {
        setError("No se pudo conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

  const grupos = useMemo(() => {
    const map = new Map<string, { alumno: AlumnoRef; curso: CursoRef; materias: Map<string, Calificacion[]> }>();
    for (const item of items) {
      if (!item.alumnoId?._id) continue;
      const key = item.alumnoId._id;
      if (!map.has(key)) {
        map.set(key, { alumno: item.alumnoId, curso: item.cursoId, materias: new Map() });
      }
      const group = map.get(key)!;
      const lista = group.materias.get(item.materia) || [];
      lista.push(item);
      group.materias.set(item.materia, lista);
    }
    return Array.from(map.values());
  }, [items]);

  if (loading) return <div className={styles.state}>Cargando calificaciones...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!grupos.length) return <div className={styles.state}>Todavía no hay calificaciones cargadas.</div>;

  return (
    <div className={styles.wrapper}>
      {grupos.map((grupo) => (
        <section className={styles.childCard} key={grupo.alumno._id}>
          <div className={styles.childHead}>
            <span className={styles.avatar}>{grupo.alumno.nombre.charAt(0)}{grupo.alumno.apellido.charAt(0)}</span>
            <div>
              <strong>{grupo.alumno.nombre} {grupo.alumno.apellido}</strong>
              <span>{grupo.curso?.nombre || "Curso"} {grupo.curso?.division || ""}</span>
            </div>
          </div>

          <div className={styles.subjects}>
            {Array.from(grupo.materias.entries()).map(([materia, notas]) => {
              const promedio = notas.reduce((sum, nota) => sum + Number(nota.nota), 0) / notas.length;
              return (
                <article className={styles.subjectCard} key={materia}>
                  <div className={styles.subjectHead}>
                    <div><span>Materia</span><strong>{materia}</strong></div>
                    <div className={styles.average}><span>Promedio</span><strong>{promedio.toFixed(1).replace(".", ",")}</strong></div>
                  </div>
                  <div className={styles.gradeList}>
                    {notas.map((nota) => (
                      <div className={styles.gradeRow} key={nota._id}>
                        <div>
                          <strong>{nota.titulo}</strong>
                          <span>{nota.fecha.split("-").reverse().join("/")}</span>
                          {nota.observacion && <small>{nota.observacion}</small>}
                        </div>
                        <span className={styles.grade}>{nota.nota}</span>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
