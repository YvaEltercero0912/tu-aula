"use client";

import { FormEvent, useEffect, useState } from "react";
import styles from "../admin.module.css";

interface Materia {
  _id: string;
  nombre: string;
  descripcion?: string;
}

export default function MateriasPage() {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [mostrar, setMostrar] = useState(false);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState("");

  async function cargar() {
    const res = await fetch("/api/materias", { cache: "no-store" });
    const data = await res.json();
    if (res.ok) setMaterias(data.materias || []);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function crear(e: FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/materias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, descripcion }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data?.message || "No se pudo crear.");
      return;
    }

    setNombre("");
    setDescripcion("");
    setMostrar(false);
    cargar();
  }

  return (
    <section className={styles.page}>
      <div className={styles.heading}>
        <div>
          <p>Configuración académica</p>
          <h1>Materias</h1>
        </div>
        <button className={styles.button} onClick={() => setMostrar((v) => !v)}>
          {mostrar ? "Cancelar" : "+ Nueva materia"}
        </button>
      </div>

      {mostrar && (
        <div className={styles.panel}>
          <form className={styles.form} onSubmit={crear}>
            <label>
              Nombre
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Matemática"
                required
              />
            </label>

            <label className={styles.full}>
              Descripción
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Opcional"
              />
            </label>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.full}>
              <button className={styles.button}>Guardar materia</button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.tableWrap}>
        {materias.length === 0 ? (
          <div className={styles.empty}>Todavía no creaste materias.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Materia</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {materias.map((m) => (
                <tr key={m._id}>
                  <td>{m.nombre}</td>
                  <td>{m.descripcion || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
