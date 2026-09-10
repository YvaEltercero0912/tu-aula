"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./TeacherJustifications.module.css";

interface Justificacion {
  _id: string;
  motivo: string;
  observacion?: string;
  estado: "pendiente" | "aprobada" | "rechazada";
  createdAt: string;
  alumnoId?: {
    _id: string;
    nombre: string;
    apellido: string;
  };
  tutorId?: {
    nombre: string;
    apellido?: string;
    email?: string;
  };
  asistenciaId?: {
    _id: string;
    fecha: string;
    estado: "ausente" | "tarde" | "presente";
    cursoId?: {
      nombre: string;
      division?: string;
    };
  };
}

export default function TeacherJustifications() {
  const [items, setItems] = useState<Justificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<"pendiente" | "todas">("pendiente");
  const [error, setError] = useState("");

  async function cargar() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/justificaciones", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data?.message || "No se pudieron cargar las justificaciones.");
        return;
      }

      setItems(data.justificaciones || []);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const visibles = useMemo(
    () =>
      filtro === "pendiente"
        ? items.filter((item) => item.estado === "pendiente")
        : items,
    [items, filtro]
  );

  async function revisar(
    id: string,
    estado: "aprobada" | "rechazada"
  ) {
    setProcesando(id);
    setError("");

    try {
      const response = await fetch(`/api/justificaciones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data?.message || "No se pudo actualizar.");
        return;
      }

      await cargar();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setProcesando(null);
    }
  }

  if (loading) {
    return <div className={styles.state}>Cargando justificaciones...</div>;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.filters}>
        <button
          type="button"
          className={filtro === "pendiente" ? styles.active : ""}
          onClick={() => setFiltro("pendiente")}
        >
          Pendientes
        </button>
        <button
          type="button"
          className={filtro === "todas" ? styles.active : ""}
          onClick={() => setFiltro("todas")}
        >
          Todas
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {visibles.length === 0 ? (
        <div className={styles.state}>
          {filtro === "pendiente"
            ? "No tenés justificaciones pendientes."
            : "Todavía no hay justificaciones."}
        </div>
      ) : (
        <div className={styles.list}>
          {visibles.map((item) => {
            const alumno = item.alumnoId
              ? `${item.alumnoId.nombre} ${item.alumnoId.apellido}`
              : "Alumno";
            const curso = item.asistenciaId?.cursoId
              ? `${item.asistenciaId.cursoId.nombre} ${item.asistenciaId.cursoId.division || ""}`
              : "Curso";

            return (
              <article key={item._id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div>
                    <span className={styles.course}>{curso}</span>
                    <h2>{alumno}</h2>
                    <p>
                      {item.asistenciaId?.fecha || "—"} · {item.asistenciaId?.estado || "ausencia"}
                    </p>
                  </div>
                  <span className={`${styles.status} ${styles[item.estado]}`}>
                    {item.estado}
                  </span>
                </div>

                <div className={styles.reason}>
                  <small>Motivo</small>
                  <strong>{item.motivo}</strong>
                  {item.observacion && <p>{item.observacion}</p>}
                </div>

                <div className={styles.tutor}>
                  Enviada por {item.tutorId?.nombre || "Tutor"} {item.tutorId?.apellido || ""}
                </div>

                {item.estado === "pendiente" && (
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.reject}
                      disabled={procesando === item._id}
                      onClick={() => revisar(item._id, "rechazada")}
                    >
                      Rechazar
                    </button>
                    <button
                      type="button"
                      className={styles.approve}
                      disabled={procesando === item._id}
                      onClick={() => revisar(item._id, "aprobada")}
                    >
                      {procesando === item._id ? "Guardando..." : "Aprobar"}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
