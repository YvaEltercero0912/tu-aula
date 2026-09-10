"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./NotificationBell.module.css";

export default function NotificationBell() {
  const [cantidad, setCantidad] = useState(0);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const response = await fetch(
          "/api/notificaciones?noLeidas=1&limite=1",
          { cache: "no-store" }
        );
        const data = await response.json();
        if (activo && response.ok) {
          setCantidad(Number(data.noLeidas || 0));
        }
      } catch {
        if (activo) setCantidad(0);
      }
    }

    cargar();
    const timer = window.setInterval(cargar, 60000);

    return () => {
      activo = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <Link
      href="/notificaciones"
      className={styles.bell}
      aria-label={`${cantidad} notificaciones sin leer`}
    >
      <span aria-hidden="true">🔔</span>
      {cantidad > 0 && (
        <strong>{cantidad > 99 ? "99+" : cantidad}</strong>
      )}
    </Link>
  );
}
