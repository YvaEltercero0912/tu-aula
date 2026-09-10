"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./login.module.css";

type Role = "docente" | "padre";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setEnviando(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data?.message || "No se pudo iniciar sesión.");
        return;
      }

      if (data.requiereCambioPassword) {
        router.replace("/cambiar-clave-inicial");
      } else {
        const role = data.user.role as Role;
        router.replace(role === "docente" ? "/profesor" : "/padre");
      }
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className={styles.wrapper}>
      <section className={styles.loginCard}>
        <div className={styles.brand}>
          <div className={styles.logo}>TA</div>
          <div>
            <strong>Tu Aula</strong>
            <span>Profesores y familias</span>
          </div>
        </div>

        <div className={styles.heading}>
          <p>Bienvenido</p>
          <h1>Iniciar sesión</h1>
          <span>Ingresá como profesor o padre/tutor.</span>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            Correo electrónico
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" disabled={enviando}>
            {enviando ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className={styles.footer}>
          <span>¿Sos profesor y todavía no tenés cuenta?</span>
          <Link href="/registro-profesor">Crear cuenta de profesor</Link>
        </div>
      </section>

      <section className={styles.hero}>
        <div>
          <span className={styles.badge}>Tu Aula</span>
          <h2>Profesor y familia, conectados.</h2>
          <p>
            Cursos, alumnos, asistencia, justificaciones y avisos desde una
            plataforma simple que funciona muy bien en el celular.
          </p>
        </div>
      </section>
    </main>
  );
}
