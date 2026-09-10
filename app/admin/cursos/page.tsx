"use client";

import { FormEvent, useEffect, useState } from "react";
import styles from "../admin.module.css";
import localStyles from "./cursos.module.css";

interface Usuario {
  _id: string;
  nombre: string;
  apellido?: string;
  email: string;
}

interface Materia {
  _id: string;
  nombre: string;
}

interface Curso {
  _id: string;
  nombre: string;
  division: string;
  turno: string;
  cicloLectivo: number;
  docenteIds?: Usuario[];
  materiaIds?: Materia[];
}

export default function CursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [docentes, setDocentes] = useState<Usuario[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [mostrar, setMostrar] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [division, setDivision] = useState("");
  const [turno, setTurno] = useState("mañana");
  const [cicloLectivo, setCicloLectivo] = useState(new Date().getFullYear());
  const [docenteIds, setDocenteIds] = useState<string[]>([]);
  const [materiaIds, setMateriaIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    const [cRes, dRes, mRes] = await Promise.all([
      fetch("/api/cursos", { cache: "no-store" }),
      fetch("/api/admin/usuarios?role=docente", { cache: "no-store" }),
      fetch("/api/materias", { cache: "no-store" }),
    ]);

    const [cData, dData, mData] = await Promise.all([
      cRes.json(),
      dRes.json(),
      mRes.json(),
    ]);

    if (cRes.ok) setCursos(cData.cursos || []);
    if (dRes.ok) setDocentes(dData.usuarios || []);
    if (mRes.ok) setMaterias(mData.materias || []);
  }

  useEffect(() => {
    cargar();
  }, []);

  function toggle(
    id: string,
    values: string[],
    setValues: (values: string[]) => void
  ) {
    setValues(
      values.includes(id)
        ? values.filter((item) => item !== id)
        : [...values, id]
    );
  }

  function limpiar() {
    setNombre("");
    setDivision("");
    setTurno("mañana");
    setCicloLectivo(new Date().getFullYear());
    setDocenteIds([]);
    setMateriaIds([]);
    setEditandoId(null);
    setError("");
  }

  function nuevo() {
    limpiar();
    setMostrar(true);
  }

  function editar(curso: Curso) {
    setNombre(curso.nombre);
    setDivision(curso.division || "");
    setTurno(curso.turno);
    setCicloLectivo(curso.cicloLectivo);
    setDocenteIds((curso.docenteIds || []).map((item) => item._id));
    setMateriaIds((curso.materiaIds || []).map((item) => item._id));
    setEditandoId(curso._id);
    setMostrar(true);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError("");

    try {
      const url = editandoId ? `/api/cursos/${editandoId}` : "/api/cursos";
      const response = await fetch(url, {
        method: editandoId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          division,
          turno,
          cicloLectivo,
          docenteIds,
          materiaIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.message || "No se pudo guardar el curso.");
        return;
      }

      limpiar();
      setMostrar(false);
      await cargar();
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.heading}>
        <div>
          <p>Configuración académica</p>
          <h1>Cursos</h1>
        </div>
        <button
          className={styles.button}
          onClick={() => (mostrar ? (limpiar(), setMostrar(false)) : nuevo())}
        >
          {mostrar ? "Cancelar" : "+ Nuevo curso"}
        </button>
      </div>

      {mostrar && (
        <div className={styles.panel}>
          <form className={styles.form} onSubmit={guardar}>
            <label>
              Curso / año
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="3°"
                required
              />
            </label>
            <label>
              División
              <input
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                placeholder="B"
              />
            </label>
            <label>
              Turno
              <select value={turno} onChange={(e) => setTurno(e.target.value)}>
                <option value="mañana">Mañana</option>
                <option value="tarde">Tarde</option>
                <option value="noche">Noche</option>
              </select>
            </label>
            <label>
              Ciclo lectivo
              <input
                type="number"
                value={cicloLectivo}
                onChange={(e) => setCicloLectivo(Number(e.target.value))}
              />
            </label>

            <div className={styles.full}>
              <strong className={localStyles.fieldTitle}>Docentes asignados</strong>
              <div className={localStyles.checkGrid}>
                {docentes.length === 0 ? (
                  <span className={localStyles.helper}>Primero creá un docente.</span>
                ) : (
                  docentes.map((docente) => (
                    <label className={localStyles.check} key={docente._id}>
                      <input
                        type="checkbox"
                        checked={docenteIds.includes(docente._id)}
                        onChange={() => toggle(docente._id, docenteIds, setDocenteIds)}
                      />
                      <span>
                        <strong>{docente.nombre} {docente.apellido || ""}</strong>
                        <small>{docente.email}</small>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className={styles.full}>
              <strong className={localStyles.fieldTitle}>Materias del curso</strong>
              <div className={localStyles.checkGrid}>
                {materias.length === 0 ? (
                  <span className={localStyles.helper}>Primero creá materias.</span>
                ) : (
                  materias.map((materia) => (
                    <label className={localStyles.check} key={materia._id}>
                      <input
                        type="checkbox"
                        checked={materiaIds.includes(materia._id)}
                        onChange={() => toggle(materia._id, materiaIds, setMateriaIds)}
                      />
                      <span><strong>{materia.nombre}</strong></span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.full}>
              <button className={styles.button} disabled={guardando}>
                {guardando
                  ? "Guardando..."
                  : editandoId
                    ? "Guardar cambios"
                    : "Crear curso"}
              </button>
            </div>
          </form>
        </div>
      )}

      {cursos.length === 0 ? (
        <div className={styles.empty}>Todavía no creaste cursos.</div>
      ) : (
        <div className={localStyles.courseGrid}>
          {cursos.map((curso) => (
            <article key={curso._id} className={localStyles.courseCard}>
              <div className={localStyles.cardTop}>
                <div>
                  <span>{curso.turno} · {curso.cicloLectivo}</span>
                  <h2>{curso.nombre} {curso.division || ""}</h2>
                </div>
                <button type="button" onClick={() => editar(curso)}>
                  Editar
                </button>
              </div>

              <div className={localStyles.assignment}>
                <small>Docentes</small>
                <p>
                  {curso.docenteIds?.length
                    ? curso.docenteIds
                        .map((d) => `${d.nombre} ${d.apellido || ""}`.trim())
                        .join(", ")
                    : "Sin docente asignado"}
                </p>
              </div>

              <div className={localStyles.tags}>
                {curso.materiaIds?.length ? (
                  curso.materiaIds.map((materia) => (
                    <span key={materia._id}>{materia.nombre}</span>
                  ))
                ) : (
                  <span>Sin materias</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
