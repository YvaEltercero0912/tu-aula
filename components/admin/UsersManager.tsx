"use client";

import { FormEvent, useEffect, useState } from "react";
import styles from "@/app/admin/admin.module.css";

type Role = "docente" | "padre";

interface Item {
  _id: string;
  nombre: string;
  apellido?: string;
  email: string;
}

export default function UsersManager({
  role,
  title,
}: {
  role: Role;
  title: string;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [mostrar, setMostrar] = useState(false);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function cargar() {
    const res = await fetch(`/api/admin/usuarios?role=${role}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (res.ok) setItems(data.usuarios || []);
  }

  useEffect(() => {
    cargar();
  }, [role]);

  async function crear(e: FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/admin/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre,
        apellido,
        email,
        password,
        role,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data?.message || "No se pudo crear.");
      return;
    }

    setNombre("");
    setApellido("");
    setEmail("");
    setPassword("");
    setMostrar(false);
    cargar();
  }

  return (
    <section className={styles.page}>
      <div className={styles.heading}>
        <div>
          <p>Usuarios</p>
          <h1>{title}</h1>
        </div>
        <button
          className={styles.button}
          onClick={() => setMostrar((v) => !v)}
        >
          {mostrar ? "Cancelar" : "+ Nuevo"}
        </button>
      </div>

      {mostrar && (
        <div className={styles.panel}>
          <form className={styles.form} onSubmit={crear}>
            <label>
              Nombre
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </label>
            <label>
              Apellido
              <input value={apellido} onChange={(e) => setApellido(e.target.value)} />
            </label>
            <label>
              Correo
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
              Contraseña inicial
              <input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.full}>
              <button className={styles.button}>Guardar</button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.tableWrap}>
        {items.length === 0 ? (
          <div className={styles.empty}>Todavía no hay registros.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  <td>{item.nombre} {item.apellido || ""}</td>
                  <td>{item.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
