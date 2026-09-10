"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./registro-profesor.module.css";

export default function RegistroProfesorPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repetir, setRepetir] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function crear(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== repetir) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, apellido, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || "No se pudo crear la cuenta.");
        return;
      }
      router.push("/login");
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className={styles.wrapper}>
      <section className={styles.card}>
        <div className={styles.logo}>TA</div>
        <p className={styles.eyebrow}>Tu Aula</p>
        <h1>Crear cuenta de profesor</h1>
        <p className={styles.subtitle}>
          Después vas a poder crear tus cursos, alumnos y tutores.
        </p>

        <form onSubmit={crear} className={styles.form}>
          <div className={styles.two}>
            <label>Nombre<input value={nombre} onChange={(e) => setNombre(e.target.value)} required /></label>
            <label>Apellido<input value={apellido} onChange={(e) => setApellido(e.target.value)} /></label>
          </div>
          <label>Correo<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Contraseña<input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          <label>Repetir contraseña<input type="password" minLength={8} value={repetir} onChange={(e) => setRepetir(e.target.value)} required /></label>
          {error && <div className={styles.error}>{error}</div>}
          <button disabled={guardando}>{guardando ? "Creando..." : "Crear cuenta"}</button>
        </form>

        <Link className={styles.back} href="/login">← Volver al login</Link>
      </section>
    </main>
  );
}
