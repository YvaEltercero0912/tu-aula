"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import styles from "./ParentAttendance.module.css";

interface Hijo {
  _id: string;
  nombre: string;
  apellido: string;
  cursoId?: {
    nombre: string;
    division?: string;
  } | null;
}

interface Justificacion {
  _id: string;
  motivo: string;
  observacion?: string;
  estado: "pendiente" | "aprobada" | "rechazada";
}

interface Asistencia {
  _id: string;
  fecha: string;
  estado: "presente" | "ausente" | "tarde";
  justificada: boolean;
  justificacionId?: Justificacion | null;
}

const motivos = [
  "Enfermedad",
  "Consulta médica",
  "Motivo familiar",
  "Viaje",
  "Problema de transporte",
  "Otro",
];

export default function ParentAttendance({
  initialAlumnoId = "",
}: {
  initialAlumnoId?: string;
}) {
  const [hijos, setHijos] = useState<Hijo[]>([]);
  const [alumnoId, setAlumnoId] = useState(initialAlumnoId);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLista, setLoadingLista] = useState(false);
  const [formId, setFormId] = useState<string | null>(null);
  const [motivo, setMotivo] = useState(motivos[0]);
  const [observacion, setObservacion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function cargarHijos() {
    setLoading(true);
    try {
      const response = await fetch("/api/padre/hijos", {
        cache: "no-store",
      });
      const data = await response.json();
      const lista = response.ok ? data.hijos || [] : [];
      setHijos(lista);

      if (!alumnoId && lista.length > 0) {
        setAlumnoId(lista[0]._id);
      }
    } finally {
      setLoading(false);
    }
  }

  async function cargarAsistencia(id: string) {
    if (!id) return;
    setLoadingLista(true);
    setError("");

    try {
      const response = await fetch(
        `/api/padre/asistencia?alumnoId=${id}`,
        { cache: "no-store" }
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data?.message || "No se pudo cargar la asistencia.");
        return;
      }

      setAsistencias(data.asistencias || []);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoadingLista(false);
    }
  }

  useEffect(() => {
    cargarHijos();
  }, []);

  useEffect(() => {
    if (alumnoId) cargarAsistencia(alumnoId);
  }, [alumnoId]);

  const resumen = useMemo(() => {
    const mes = new Date().toISOString().slice(0, 7);
    const items = asistencias.filter((item) => item.fecha.startsWith(mes));
    return {
      presentes: items.filter((x) => x.estado === "presente").length,
      ausentes: items.filter((x) => x.estado === "ausente").length,
      tarde: items.filter((x) => x.estado === "tarde").length,
    };
  }, [asistencias]);

  function abrirFormulario(id: string) {
    setFormId(id);
    setMotivo(motivos[0]);
    setObservacion("");
    setMensaje("");
    setError("");
  }

  async function enviarJustificacion(
    e: FormEvent<HTMLFormElement>,
    asistenciaId: string
  ) {
    e.preventDefault();
    setEnviando(true);
    setError("");
    setMensaje("");

    try {
      const response = await fetch("/api/justificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asistenciaId,
          motivo,
          observacion,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data?.message || "No se pudo enviar la justificación.");
        return;
      }

      setMensaje("Justificación enviada. El profesor la revisará.");
      setFormId(null);
      await cargarAsistencia(alumnoId);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setEnviando(false);
    }
  }

  if (loading) {
    return <div className={styles.state}>Cargando...</div>;
  }

  if (hijos.length === 0) {
    return (
      <div className={styles.state}>
        No hay alumnos vinculados a tu cuenta.
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <label className={styles.selector}>
        Alumno
        <select
          value={alumnoId}
          onChange={(e) => setAlumnoId(e.target.value)}
        >
          {hijos.map((hijo) => (
            <option key={hijo._id} value={hijo._id}>
              {hijo.nombre} {hijo.apellido}
            </option>
          ))}
        </select>
      </label>

      <div className={styles.summary}>
        <div>
          <span>Presentes</span>
          <strong>{resumen.presentes}</strong>
        </div>
        <div>
          <span>Ausencias</span>
          <strong>{resumen.ausentes}</strong>
        </div>
        <div>
          <span>Tardanzas</span>
          <strong>{resumen.tarde}</strong>
        </div>
      </div>

      {mensaje && <div className={styles.success}>{mensaje}</div>}
      {error && <div className={styles.error}>{error}</div>}

      {loadingLista ? (
        <div className={styles.state}>Cargando asistencia...</div>
      ) : asistencias.length === 0 ? (
        <div className={styles.state}>
          Todavía no hay registros de asistencia.
        </div>
      ) : (
        <div className={styles.list}>
          {asistencias.map((item) => {
            const puedeJustificar =
              ["ausente", "tarde"].includes(item.estado) &&
              !item.justificacionId;

            return (
              <article key={item._id} className={styles.card}>
                <div className={styles.row}>
                  <span className={`${styles.icon} ${styles[item.estado]}`}>
                    {item.estado === "presente"
                      ? "✓"
                      : item.estado === "ausente"
                        ? "✕"
                        : "◷"}
                  </span>

                  <div className={styles.info}>
                    <strong>{item.fecha}</strong>
                    <span>{item.estado}</span>
                  </div>

                  {item.justificacionId ? (
                    <span
                      className={`${styles.justStatus} ${styles[item.justificacionId.estado]}`}
                    >
                      {item.justificacionId.estado}
                    </span>
                  ) : item.justificada ? (
                    <span className={`${styles.justStatus} ${styles.aprobada}`}>
                      justificada
                    </span>
                  ) : null}

                  {puedeJustificar && (
                    <button
                      type="button"
                      className={styles.justifyButton}
                      onClick={() => abrirFormulario(item._id)}
                    >
                      Justificar
                    </button>
                  )}
                </div>

                {item.justificacionId && (
                  <div className={styles.existing}>
                    <strong>{item.justificacionId.motivo}</strong>
                    {item.justificacionId.observacion && (
                      <p>{item.justificacionId.observacion}</p>
                    )}
                  </div>
                )}

                {formId === item._id && (
                  <form
                    className={styles.form}
                    onSubmit={(e) => enviarJustificacion(e, item._id)}
                  >
                    <label>
                      Motivo
                      <select
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                      >
                        {motivos.map((itemMotivo) => (
                          <option key={itemMotivo} value={itemMotivo}>
                            {itemMotivo}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Observación
                      <textarea
                        value={observacion}
                        onChange={(e) => setObservacion(e.target.value)}
                        placeholder="Contanos brevemente por qué no pudo asistir."
                      />
                    </label>

                    <div className={styles.formActions}>
                      <button
                        type="button"
                        className={styles.cancel}
                        onClick={() => setFormId(null)}
                      >
                        Cancelar
                      </button>
                      <button type="submit" disabled={enviando}>
                        {enviando ? "Enviando..." : "Enviar justificación"}
                      </button>
                    </div>
                  </form>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
