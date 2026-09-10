"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./cambiar-clave.module.css";

export default function CambiarClaveInicialPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [repetir, setRepetir] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== repetir) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setGuardando(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || "No se pudo cambiar la contraseña.");
        return;
      }
      const me = await fetch("/api/auth/me", { cache: "no-store" });
      const meData = await me.json();
      router.replace(meData?.user?.role === "docente" ? "/profesor" : "/padre");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className={styles.wrapper}>
      <form className={styles.card} onSubmit={guardar}>
        <div className={styles.logo}>TA</div>
        <h1>Creá tu contraseña</h1>
        <p>Por seguridad, reemplazá la contraseña temporal antes de continuar.</p>
        <label>Nueva contraseña<input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        <label>Repetir contraseña<input type="password" minLength={8} value={repetir} onChange={(e) => setRepetir(e.target.value)} required /></label>
        {error && <div className={styles.error}>{error}</div>}
        <button disabled={guardando}>{guardando ? "Guardando..." : "Guardar contraseña"}</button>
      </form>
    </main>
  );
}
