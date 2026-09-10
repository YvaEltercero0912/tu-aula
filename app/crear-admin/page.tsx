"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./crear-admin.module.css";

export default function CrearAdminPage() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repetir, setRepetir] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password !== repetir) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setEnviando(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          apellido,
          email,
          password,
          role: "admin",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.message || "No se pudo crear el administrador.");
        return;
      }

      router.push("/login?adminCreado=1");
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className={styles.wrapper}>
      <section className={styles.card}>
        <div className={styles.brand}>
          <span>TA</span>
        </div>

        <p className={styles.eyebrow}>Configuración inicial</p>
        <h1>Crear administrador</h1>
        <p className={styles.subtitle}>
          Este formulario funciona para crear la primera cuenta del sistema.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.twoColumns}>
            <label>
              Nombre
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Alejandro"
                required
              />
            </label>

            <label>
              Apellido
              <input
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                placeholder="Díaz"
              />
            </label>
          </div>

          <label>
            Correo electrónico
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@tuaula.com"
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
              placeholder="Mínimo 8 caracteres"
              minLength={8}
              autoComplete="new-password"
              required
            />
          </label>

          <label>
            Repetir contraseña
            <input
              type="password"
              value={repetir}
              onChange={(e) => setRepetir(e.target.value)}
              autoComplete="new-password"
              required
            />
          </label>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" disabled={enviando}>
            {enviando ? "Creando..." : "Crear administrador"}
          </button>
        </form>

        <Link href="/login" className={styles.link}>
          Ya tengo una cuenta
        </Link>
      </section>
    </main>
  );
}
