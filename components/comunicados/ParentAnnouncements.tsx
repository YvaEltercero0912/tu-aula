"use client";

import { useEffect, useState } from "react";
import styles from "./ParentAnnouncements.module.css";

interface Announcement {
  _id: string;
  titulo: string;
  mensaje: string;
  alcance: "curso" | "tutor";
  createdAt: string;
  profesorId?: {
    nombre?: string;
    apellido?: string;
  } | null;
  cursoId?: {
    nombre?: string;
    division?: string;
  } | null;
}

export default function ParentAnnouncements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargar() {
      try {
        const response = await fetch("/api/comunicados", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          setError(data?.message || "No se pudieron cargar los comunicados.");
          return;
        }

        setItems(data.comunicados || []);
      } catch {
        setError("No se pudo conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    }

    cargar();
  }, []);

  if (loading) return <div className={styles.state}>Cargando comunicados...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  if (!items.length) {
    return (
      <div className={styles.state}>
        Todavía no recibiste comunicados de los profesores.
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {items.map((item) => {
        const profesor = `${item.profesorId?.nombre || "Profesor"} ${
          item.profesorId?.apellido || ""
        }`.trim();
        const destino =
          item.alcance === "curso"
            ? `${item.cursoId?.nombre || "Curso"} ${item.cursoId?.division || ""}`.trim()
            : "Mensaje para tu familia";

        return (
          <article key={item._id} className={styles.card}>
            <div className={styles.top}>
              <span>{destino}</span>
              <small>
                {new Date(item.createdAt).toLocaleString("es-AR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </small>
            </div>
            <h2>{item.titulo}</h2>
            <p>{item.mensaje}</p>
            <footer>Enviado por {profesor}</footer>
          </article>
        );
      })}
    </div>
  );
}
