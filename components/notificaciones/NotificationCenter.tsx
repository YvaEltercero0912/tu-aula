"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./NotificationCenter.module.css";

interface NotificationItem {
  _id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  href?: string;
  createdAt: string;
}

function icono(tipo: string) {
  if (tipo === "inasistencia") return "✕";
  if (tipo === "tardanza") return "◷";
  if (tipo === "justificacion_recibida") return "✎";
  if (tipo === "justificacion_aprobada") return "✓";
  if (tipo === "justificacion_rechazada") return "!";
  if (tipo === "calificacion") return "★";
  if (tipo === "comunicado") return "✉";
  return "🔔";
}

export default function NotificationCenter() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function cargar() {
    setLoading(true);
    try {
      const response = await fetch("/api/notificaciones?limite=80", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data?.message || "No se pudieron cargar los avisos.");
        return;
      }

      setItems(data.notificaciones || []);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function marcarTodas() {
    await fetch("/api/notificaciones", { method: "PATCH" });
    setItems((actual) =>
      actual.map((item) => ({ ...item, leida: true }))
    );
  }

  async function abrir(item: NotificationItem) {
    if (!item.leida) {
      await fetch(`/api/notificaciones/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leida: true }),
      });
    }

    router.push(item.href || "/notificaciones");
  }

  if (loading) {
    return <div className={styles.state}>Cargando notificaciones...</div>;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <span>
          {items.filter((item) => !item.leida).length} sin leer
        </span>
        {items.some((item) => !item.leida) && (
          <button type="button" onClick={marcarTodas}>
            Marcar todas como leídas
          </button>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {items.length === 0 ? (
        <div className={styles.state}>
          No tenés notificaciones todavía.
        </div>
      ) : (
        <div className={styles.list}>
          {items.map((item) => (
            <button
              type="button"
              key={item._id}
              className={`${styles.item} ${!item.leida ? styles.unread : ""}`}
              onClick={() => abrir(item)}
            >
              <span className={styles.icon}>{icono(item.tipo)}</span>
              <span className={styles.body}>
                <strong>{item.titulo}</strong>
                <span>{item.mensaje}</span>
                <small>
                  {new Date(item.createdAt).toLocaleString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </small>
              </span>
              {!item.leida && <span className={styles.dot} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
