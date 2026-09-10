"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import styles from "./StudentManager.module.css";

interface Curso { _id: string; nombre: string; division?: string; }
interface Tutor { _id: string; nombre: string; apellido?: string; email?: string; telefono?: string; }
interface Alumno { _id: string; nombre: string; apellido: string; dni?: string; cursoId?: Curso | null; tutorIds?: Tutor[]; }
interface Creds { email: string; password: string; }

export default function StudentManager({ initialCursoId = "", openInitially = false }: { initialCursoId?: string; openInitially?: boolean }) {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [mostrar, setMostrar] = useState(openInitially);
  const [cursoId, setCursoId] = useState(initialCursoId);
  const [nombre, setNombre] = useState(""); const [apellido, setApellido] = useState(""); const [dni, setDni] = useState(""); const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [tutorNombre, setTutorNombre] = useState(""); const [tutorApellido, setTutorApellido] = useState(""); const [tutorDni, setTutorDni] = useState(""); const [tutorTelefono, setTutorTelefono] = useState(""); const [tutorEmail, setTutorEmail] = useState("");
  const [error, setError] = useState(""); const [mensaje, setMensaje] = useState(""); const [creds, setCreds] = useState<Creds | null>(null); const [guardando, setGuardando] = useState(false);
  const [resetCreds, setResetCreds] = useState<Creds | null>(null);
  const [reseteandoTutor, setReseteandoTutor] = useState<string | null>(null);

  async function cargar() {
    const [cRes, aRes] = await Promise.all([fetch("/api/cursos", { cache: "no-store" }), fetch("/api/alumnos", { cache: "no-store" })]);
    const [cData, aData] = await Promise.all([cRes.json(), aRes.json()]);
    if (cRes.ok) { const lista = cData.cursos || []; setCursos(lista); if (!cursoId && lista.length) setCursoId(lista[0]._id); }
    if (aRes.ok) setAlumnos(aData.alumnos || []);
  }
  useEffect(() => { cargar(); }, []);

  const cursoSeleccionado = useMemo(() => cursos.find((x) => x._id === cursoId), [cursos, cursoId]);

  async function crear(e: FormEvent) {
    e.preventDefault(); setError(""); setMensaje(""); setCreds(null); setResetCreds(null); setGuardando(true);
    try {
      const res = await fetch("/api/alumnos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ alumno: { nombre, apellido, dni, fechaNacimiento, cursoId }, tutor: { nombre: tutorNombre, apellido: tutorApellido, dni: tutorDni, telefono: tutorTelefono, email: tutorEmail } }) });
      const data = await res.json();
      if (!res.ok) { setError(data?.message || "No se pudo crear el alumno."); return; }
      setMensaje(data.message); setCreds(data.credencialesTemporales || null);
      setNombre(""); setApellido(""); setDni(""); setFechaNacimiento(""); setTutorNombre(""); setTutorApellido(""); setTutorDni(""); setTutorTelefono(""); setTutorEmail("");
      await cargar();
    } catch { setError("No se pudo conectar con el servidor."); } finally { setGuardando(false); }
  }

  async function copiar(datos: Creds) {
    await navigator.clipboard.writeText(`Tu Aula\nCorreo: ${datos.email}\nContraseña temporal: ${datos.password}\nIngresá y creá una contraseña nueva.`);
    setMensaje("Datos de acceso copiados.");
  }

  async function resetTutor(tutor: Tutor) {
    if (!window.confirm(`¿Generar una nueva contraseña temporal para ${tutor.nombre} ${tutor.apellido || ""}? La contraseña anterior dejará de funcionar.`)) return;
    setError(""); setMensaje(""); setCreds(null); setResetCreds(null); setReseteandoTutor(tutor._id);
    try {
      const res = await fetch(`/api/profesor/tutores/${tutor._id}/reset-password`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data?.message || "No se pudo generar la contraseña temporal."); return; }
      setResetCreds(data.credencialesTemporales || null);
      setMensaje("Nueva contraseña temporal generada. El tutor deberá cambiarla al iniciar sesión.");
    } catch { setError("No se pudo conectar con el servidor."); } finally { setReseteandoTutor(null); }
  }

  return <div className={styles.wrapper}>
    <button className={styles.add} onClick={() => { setMostrar((v) => !v); setError(""); }}>{mostrar ? "Cerrar formulario" : "+ Nuevo alumno"}</button>

    {mostrar && <form className={styles.form} onSubmit={crear}>
      <section className={styles.section}><div className={styles.sectionHead}><span>1</span><div><strong>Datos del alumno</strong><small>El curso es obligatorio.</small></div></div>
        <div className={styles.grid}><label>Nombre<input value={nombre} onChange={(e) => setNombre(e.target.value)} required /></label><label>Apellido<input value={apellido} onChange={(e) => setApellido(e.target.value)} required /></label><label>DNI<input inputMode="numeric" value={dni} onChange={(e) => setDni(e.target.value)} /></label><label>Fecha de nacimiento<input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} /></label><label className={styles.full}>Curso<select value={cursoId} onChange={(e) => setCursoId(e.target.value)} required><option value="">Elegir curso</option>{cursos.map((c) => <option key={c._id} value={c._id}>{c.nombre} {c.division || ""}</option>)}</select></label></div>
      </section>

      <section className={styles.section}><div className={styles.sectionHead}><span>2</span><div><strong>Padre / Tutor</strong><small>Si ya existe, Tu Aula lo vincula automáticamente.</small></div></div>
        <div className={styles.grid}><label>Nombre<input value={tutorNombre} onChange={(e) => setTutorNombre(e.target.value)} required /></label><label>Apellido<input value={tutorApellido} onChange={(e) => setTutorApellido(e.target.value)} /></label><label>DNI<input inputMode="numeric" value={tutorDni} onChange={(e) => setTutorDni(e.target.value)} /></label><label>Teléfono<input type="tel" value={tutorTelefono} onChange={(e) => setTutorTelefono(e.target.value)} placeholder="381..." /></label><label className={styles.full}>Correo electrónico<input type="email" value={tutorEmail} onChange={(e) => setTutorEmail(e.target.value)} required /></label></div>
      </section>

      {error && <div className={styles.error}>{error}</div>}
      {mensaje && <div className={styles.success}>{mensaje}</div>}
      {creds && <div className={styles.credentials}><div><span>Cuenta del tutor creada</span><strong>{creds.email}</strong><code>{creds.password}</code><small>Esta contraseña es temporal. Al ingresar, el tutor deberá cambiarla.</small></div><button type="button" onClick={() => copiar(creds)}>Copiar acceso</button></div>}
      <div className={styles.saveBar}><div><strong>{cursoSeleccionado ? `${cursoSeleccionado.nombre} ${cursoSeleccionado.division || ""}` : "Elegí un curso"}</strong><span>Alumno + tutor en un solo paso</span></div><button disabled={guardando || cursos.length === 0}>{guardando ? "Guardando..." : "Crear alumno"}</button></div>
    </form>}

    {!mostrar && error && <div className={styles.error}>{error}</div>}
    {!mostrar && mensaje && <div className={styles.success}>{mensaje}</div>}
    {resetCreds && <div className={styles.credentials}><div><span>Nueva clave temporal</span><strong>{resetCreds.email}</strong><code>{resetCreds.password}</code><small>La clave anterior ya no funciona. Al ingresar, el tutor deberá crear una nueva.</small></div><button type="button" onClick={() => copiar(resetCreds)}>Copiar acceso</button></div>}

    {cursos.length === 0 && <div className={styles.warning}>Primero tenés que crear un curso.</div>}
    <div className={styles.studentList}>{alumnos.length === 0 ? <div className={styles.empty}>Todavía no creaste alumnos.</div> : alumnos.map((a) => {
      const tutor = a.tutorIds?.[0];
      return <article key={a._id} className={styles.student}><span className={styles.avatar}>{a.nombre.charAt(0)}{a.apellido.charAt(0)}</span><div className={styles.studentInfo}><strong>{a.apellido}, {a.nombre}</strong><small>{a.cursoId ? `${a.cursoId.nombre} ${a.cursoId.division || ""}` : "Sin curso"}</small><p>{tutor ? `Tutor: ${tutor.nombre} ${tutor.apellido || ""}${tutor.email ? ` · ${tutor.email}` : ""}` : "Sin tutor"}</p></div>{tutor && <button type="button" className={styles.resetButton} disabled={reseteandoTutor === tutor._id} onClick={() => resetTutor(tutor)}>{reseteandoTutor === tutor._id ? "Generando..." : "Clave temporal"}</button>}</article>;
    })}</div>
  </div>;
}
