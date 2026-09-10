"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import styles from "./CourseManager.module.css";

interface Curso { _id: string; nombre: string; division?: string; turno: string; cicloLectivo: number; cantidadAlumnos?: number; }

export default function CourseManager({ openInitially = false }: { openInitially?: boolean }) {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [mostrar, setMostrar] = useState(openInitially);
  const [nombre, setNombre] = useState("");
  const [division, setDivision] = useState("");
  const [turno, setTurno] = useState("mañana");
  const [cicloLectivo, setCicloLectivo] = useState(new Date().getFullYear());
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    const res = await fetch("/api/cursos", { cache: "no-store" });
    const data = await res.json();
    if (res.ok) setCursos(data.cursos || []);
  }
  useEffect(() => { cargar(); }, []);

  async function crear(e: FormEvent) {
    e.preventDefault(); setError(""); setGuardando(true);
    try {
      const res = await fetch("/api/cursos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre, division, turno, cicloLectivo }) });
      const data = await res.json();
      if (!res.ok) { setError(data?.message || "No se pudo crear el curso."); return; }
      setNombre(""); setDivision(""); setMostrar(false); await cargar();
    } finally { setGuardando(false); }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.actionsTop}><button onClick={() => setMostrar((v) => !v)}>{mostrar ? "Cancelar" : "+ Nuevo curso"}</button></div>
      {mostrar && <form className={styles.form} onSubmit={crear}>
        <div className={styles.formTitle}><strong>Nuevo curso</strong><span>El curso quedará vinculado automáticamente a tu cuenta.</span></div>
        <label>Curso / año<input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="3°" required /></label>
        <label>División<input value={division} onChange={(e) => setDivision(e.target.value)} placeholder="B" /></label>
        <label>Turno<select value={turno} onChange={(e) => setTurno(e.target.value)}><option value="mañana">Mañana</option><option value="tarde">Tarde</option><option value="noche">Noche</option></select></label>
        <label>Ciclo lectivo<input type="number" value={cicloLectivo} onChange={(e) => setCicloLectivo(Number(e.target.value))} required /></label>
        {error && <div className={styles.error}>{error}</div>}
        <button className={styles.save} disabled={guardando}>{guardando ? "Guardando..." : "Crear curso"}</button>
      </form>}

      {cursos.length === 0 ? <div className={styles.empty}>Todavía no creaste cursos.</div> : <div className={styles.grid}>{cursos.map((curso) => <article key={curso._id} className={styles.card}>
        <div className={styles.top}><span>Turno {curso.turno}</span><small>{curso.cicloLectivo}</small></div>
        <h2>{curso.nombre} {curso.division || ""}</h2>
        <p>{curso.cantidadAlumnos || 0} alumnos</p>
        <div className={styles.cardActions}><Link href={`/profesor/cursos/${curso._id}`}>Ver curso</Link><Link className={styles.primary} href={`/profesor/alumnos?nuevo=1&cursoId=${curso._id}`}>+ Alumno</Link><Link href={`/profesor/asistencia?cursoId=${curso._id}`}>Asistencia</Link></div>
      </article>)}</div>}
    </div>
  );
}
