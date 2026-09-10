"use client";

import { FormEvent, useEffect, useState } from "react";
import styles from "../admin.module.css";

interface Curso {
  _id: string;
  nombre: string;
  division: string;
}

interface Tutor {
  _id: string;
  nombre: string;
  apellido?: string;
}

interface Alumno {
  _id: string;
  nombre: string;
  apellido: string;
  dni?: string;
  cursoId?: Curso | null;
  tutorIds?: Tutor[];
}

export default function AlumnosPage() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [tutores, setTutores] = useState<Tutor[]>([]);
  const [mostrar, setMostrar] = useState(false);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [dni, setDni] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [tutorIds, setTutorIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  async function cargar() {
    const [a, c, t] = await Promise.all([
      fetch("/api/alumnos", { cache: "no-store" }),
      fetch("/api/cursos", { cache: "no-store" }),
      fetch("/api/admin/usuarios?role=padre", { cache: "no-store" }),
    ]);

    const [ad, cd, td] = await Promise.all([a.json(), c.json(), t.json()]);

    if (a.ok) setAlumnos(ad.alumnos || []);
    if (c.ok) setCursos(cd.cursos || []);
    if (t.ok) setTutores(td.usuarios || []);
  }

  useEffect(() => {
    cargar();
  }, []);

  function toggleTutor(id: string) {
    setTutorIds((actual) =>
      actual.includes(id)
        ? actual.filter((x) => x !== id)
        : [...actual, id]
    );
  }

  async function crear(e: FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/alumnos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre,
        apellido,
        dni,
        fechaNacimiento,
        cursoId,
        tutorIds,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data?.message || "No se pudo crear.");
      return;
    }

    setNombre("");
    setApellido("");
    setDni("");
    setFechaNacimiento("");
    setCursoId("");
    setTutorIds([]);
    setMostrar(false);
    cargar();
  }

  return (
    <section className={styles.page}>
      <div className={styles.heading}>
        <div>
          <p>Estudiantes</p>
          <h1>Alumnos</h1>
        </div>
        <button className={styles.button} onClick={() => setMostrar((v) => !v)}>
          {mostrar ? "Cancelar" : "+ Nuevo alumno"}
        </button>
      </div>

      {mostrar && (
        <div className={styles.panel}>
          <form className={styles.form} onSubmit={crear}>
            <label>
              Nombre
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </label>
            <label>
              Apellido
              <input value={apellido} onChange={(e) => setApellido(e.target.value)} required />
            </label>
            <label>
              DNI
              <input value={dni} onChange={(e) => setDni(e.target.value)} />
            </label>
            <label>
              Fecha de nacimiento
              <input
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
              />
            </label>
            <label>
              Curso
              <select value={cursoId} onChange={(e) => setCursoId(e.target.value)}>
                <option value="">Sin asignar</option>
                {cursos.map((c) => (
                  <option value={c._id} key={c._id}>
                    {c.nombre} {c.division}
                  </option>
                ))}
              </select>
            </label>

            <div className={styles.full}>
              <strong>Padres / tutores</strong>
              <div className={styles.checks}>
                {tutores.length === 0 ? (
                  <div className={styles.empty}>Primero creá un tutor.</div>
                ) : (
                  tutores.map((t) => (
                    <label key={t._id}>
                      <input
                        type="checkbox"
                        checked={tutorIds.includes(t._id)}
                        onChange={() => toggleTutor(t._id)}
                      />
                      {t.nombre} {t.apellido || ""}
                    </label>
                  ))
                )}
              </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.full}>
              <button className={styles.button}>Guardar alumno</button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.tableWrap}>
        {alumnos.length === 0 ? (
          <div className={styles.empty}>Todavía no creaste alumnos.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Alumno</th>
                <th>DNI</th>
                <th>Curso</th>
                <th>Tutor</th>
              </tr>
            </thead>
            <tbody>
              {alumnos.map((a) => (
                <tr key={a._id}>
                  <td>{a.apellido}, {a.nombre}</td>
                  <td>{a.dni || "—"}</td>
                  <td>
                    {a.cursoId
                      ? `${a.cursoId.nombre} ${a.cursoId.division || ""}`
                      : "Sin asignar"}
                  </td>
                  <td>
                    {a.tutorIds?.length
                      ? a.tutorIds.map((t) => `${t.nombre} ${t.apellido || ""}`).join(", ")
                      : "Sin tutor"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
