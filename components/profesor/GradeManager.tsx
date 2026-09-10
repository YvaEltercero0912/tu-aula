"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import styles from "./GradeManager.module.css";

interface Curso {
  _id: string;
  nombre: string;
  division?: string;
  cantidadAlumnos?: number;
}

interface Alumno {
  _id: string;
  nombre: string;
  apellido: string;
}

interface GradeRow {
  alumnoId: string;
  nota: string;
}

function todayLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export default function GradeManager() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [cursoId, setCursoId] = useState("");
  const [materia, setMateria] = useState("");
  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState(todayLocal());
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function cargarCursos() {
    const response = await fetch("/api/cursos", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) return;

    const lista: Curso[] = data.cursos || [];
    setCursos(lista);
    if (!cursoId && lista.length) setCursoId(lista[0]._id);
  }

  async function cargarAlumnos(id: string) {
    if (!id) {
      setAlumnos([]);
      return;
    }

    const response = await fetch(`/api/alumnos?cursoId=${id}`, {
      cache: "no-store",
    });
    const data = await response.json();
    if (response.ok) {
      setAlumnos(data.alumnos || []);
      setNotas({});
    }
  }

  useEffect(() => {
    cargarCursos();
  }, []);

  useEffect(() => {
    cargarAlumnos(cursoId);
  }, [cursoId]);

  const cargadas = useMemo(
    () => Object.values(notas).filter((nota) => nota.trim() !== "").length,
    [notas]
  );

  function setNota(alumnoId: string, value: string) {
    const normalizada = value.replace(",", ".");
    if (normalizada && !/^\d{0,2}(\.\d{0,2})?$/.test(normalizada)) return;
    setNotas((actual) => ({ ...actual, [alumnoId]: normalizada }));
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMensaje("");

    const calificaciones: GradeRow[] = alumnos
      .map((alumno) => ({
        alumnoId: alumno._id,
        nota: notas[alumno._id] || "",
      }))
      .filter((item) => item.nota.trim() !== "");

    if (!calificaciones.length) {
      setError("Ingresá al menos una nota.");
      return;
    }

    const invalida = calificaciones.some((item) => {
      const n = Number(item.nota);
      return !Number.isFinite(n) || n < 0 || n > 10;
    });

    if (invalida) {
      setError("Las notas deben estar entre 0 y 10.");
      return;
    }

    setGuardando(true);

    try {
      const response = await fetch("/api/calificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cursoId,
          materia,
          titulo,
          fecha,
          calificaciones,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.message || "No se pudieron guardar las notas.");
        return;
      }

      setMensaje(
        `${data.guardadas} nota${data.guardadas === 1 ? "" : "s"} guardada${data.guardadas === 1 ? "" : "s"}. ${data.notificaciones || 0} aviso${data.notificaciones === 1 ? "" : "s"} enviado${data.notificaciones === 1 ? "" : "s"}.`
      );
      setNotas({});
      setTitulo("");
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className={styles.wrapper} onSubmit={guardar}>
      <section className={styles.setupCard}>
        <div className={styles.grid}>
          <label>
            Curso
            <select
              value={cursoId}
              onChange={(e) => setCursoId(e.target.value)}
              required
            >
              <option value="">Elegir curso</option>
              {cursos.map((curso) => (
                <option key={curso._id} value={curso._id}>
                  {curso.nombre} {curso.division || ""}
                </option>
              ))}
            </select>
          </label>

          <label>
            Materia
            <input
              value={materia}
              onChange={(e) => setMateria(e.target.value)}
              placeholder="Matemática"
              required
            />
          </label>

          <label>
            Evaluación / actividad
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Evaluación 1"
              required
            />
          </label>

          <label>
            Fecha
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
          </label>
        </div>
      </section>

      {cursos.length === 0 ? (
        <div className={styles.empty}>Primero creá un curso.</div>
      ) : alumnos.length === 0 ? (
        <div className={styles.empty}>Este curso todavía no tiene alumnos.</div>
      ) : (
        <section className={styles.list}>
          <div className={styles.listHeader}>
            <div>
              <strong>Cargar notas</strong>
              <span>{alumnos.length} alumnos</span>
            </div>
            <span className={styles.counter}>{cargadas} cargadas</span>
          </div>

          {alumnos.map((alumno) => (
            <article className={styles.student} key={alumno._id}>
              <span className={styles.avatar}>
                {alumno.nombre.charAt(0)}{alumno.apellido.charAt(0)}
              </span>
              <div className={styles.studentName}>
                <strong>{alumno.apellido}, {alumno.nombre}</strong>
                <small>Nota de 0 a 10</small>
              </div>
              <input
                className={styles.gradeInput}
                inputMode="decimal"
                placeholder="—"
                value={notas[alumno._id] || ""}
                onChange={(e) => setNota(alumno._id, e.target.value)}
                aria-label={`Nota de ${alumno.nombre} ${alumno.apellido}`}
              />
            </article>
          ))}
        </section>
      )}

      {error && <div className={styles.error}>{error}</div>}
      {mensaje && <div className={styles.success}>{mensaje}</div>}

      {alumnos.length > 0 && (
        <div className={styles.saveBar}>
          <div>
            <strong>{cargadas} notas listas</strong>
            <span>Al guardar se avisa automáticamente a los tutores.</span>
          </div>
          <button disabled={guardando || cargadas === 0}>
            {guardando ? "Guardando..." : "Guardar notas"}
          </button>
        </div>
      )}
    </form>
  );
}
