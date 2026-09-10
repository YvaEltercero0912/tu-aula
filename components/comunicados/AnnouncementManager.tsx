"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import styles from "./AnnouncementManager.module.css";

interface Course {
  _id: string;
  nombre: string;
  division?: string;
}

interface Tutor {
  _id: string;
  nombre: string;
  apellido?: string;
  email: string;
}

interface Student {
  _id: string;
  nombre: string;
  apellido: string;
  cursoId?: Course | null;
  tutorIds?: Tutor[];
}

interface Announcement {
  _id: string;
  titulo: string;
  mensaje: string;
  alcance: "curso" | "tutor";
  destinatarios: number;
  cursoId?: Course | null;
  tutorId?: Tutor | null;
  createdAt: string;
}

export default function AnnouncementManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [items, setItems] = useState<Announcement[]>([]);
  const [alcance, setAlcance] = useState<"curso" | "tutor">("curso");
  const [cursoId, setCursoId] = useState("");
  const [tutorId, setTutorId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const tutors = useMemo(() => {
    const map = new Map<string, Tutor & { alumnos: string[] }>();

    students.forEach((student) => {
      (student.tutorIds || []).forEach((tutor) => {
        const current = map.get(tutor._id);
        const alumno = `${student.nombre} ${student.apellido}`;

        if (current) {
          if (!current.alumnos.includes(alumno)) current.alumnos.push(alumno);
        } else {
          map.set(tutor._id, { ...tutor, alumnos: [alumno] });
        }
      });
    });

    return [...map.values()].sort((a, b) =>
      `${a.apellido || ""} ${a.nombre}`.localeCompare(
        `${b.apellido || ""} ${b.nombre}`,
        "es"
      )
    );
  }, [students]);

  async function cargar() {
    const [coursesResponse, studentsResponse, announcementsResponse] =
      await Promise.all([
        fetch("/api/cursos", { cache: "no-store" }),
        fetch("/api/alumnos", { cache: "no-store" }),
        fetch("/api/comunicados", { cache: "no-store" }),
      ]);

    const [coursesData, studentsData, announcementsData] =
      await Promise.all([
        coursesResponse.json(),
        studentsResponse.json(),
        announcementsResponse.json(),
      ]);

    if (coursesResponse.ok) {
      setCourses(coursesData.cursos || []);
      setCursoId((actual) => actual || coursesData.cursos?.[0]?._id || "");
    }
    if (studentsResponse.ok) setStudents(studentsData.alumnos || []);
    if (announcementsResponse.ok) setItems(announcementsData.comunicados || []);
  }

  useEffect(() => {
    cargar();
  }, []);

  useEffect(() => {
    if (!tutorId && tutors.length) setTutorId(tutors[0]._id);
  }, [tutors, tutorId]);

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGuardando(true);
    setFeedback("");
    setError("");

    try {
      const response = await fetch("/api/comunicados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          mensaje,
          alcance,
          cursoId: alcance === "curso" ? cursoId : undefined,
          tutorId: alcance === "tutor" ? tutorId : undefined,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data?.message || "No se pudo enviar el comunicado.");
        return;
      }

      setTitulo("");
      setMensaje("");
      setFeedback(data?.message || "Comunicado enviado.");
      await cargar();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <form className={styles.form} onSubmit={enviar}>
        <div className={styles.formHead}>
          <div>
            <span>Nuevo aviso</span>
            <h2>Enviar comunicado</h2>
          </div>
          <span className={styles.helper}>Las familias reciben también una notificación.</span>
        </div>

        <div className={styles.segmented}>
          <button
            type="button"
            className={alcance === "curso" ? styles.selected : ""}
            onClick={() => setAlcance("curso")}
          >
            Todo un curso
          </button>
          <button
            type="button"
            className={alcance === "tutor" ? styles.selected : ""}
            onClick={() => setAlcance("tutor")}
          >
            Un tutor
          </button>
        </div>

        {alcance === "curso" ? (
          <label>
            Curso
            <select value={cursoId} onChange={(e) => setCursoId(e.target.value)} required>
              {courses.length === 0 && <option value="">No tenés cursos</option>}
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.nombre} {course.division || ""}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label>
            Padre / tutor
            <select value={tutorId} onChange={(e) => setTutorId(e.target.value)} required>
              {tutors.length === 0 && <option value="">No hay tutores vinculados</option>}
              {tutors.map((tutor) => (
                <option key={tutor._id} value={tutor._id}>
                  {tutor.nombre} {tutor.apellido || ""} · {tutor.alumnos.join(", ")}
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          Título
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej.: Reunión de padres"
            maxLength={160}
            required
          />
        </label>

        <label>
          Mensaje
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Escribí el comunicado para la familia..."
            maxLength={2000}
            rows={5}
            required
          />
          <small>{mensaje.length}/2000</small>
        </label>

        {feedback && <div className={styles.success}>{feedback}</div>}
        {error && <div className={styles.error}>{error}</div>}

        <button
          className={styles.send}
          disabled={
            guardando ||
            !titulo.trim() ||
            !mensaje.trim() ||
            (alcance === "curso" ? !cursoId : !tutorId)
          }
        >
          {guardando ? "Enviando..." : "Enviar comunicado"}
        </button>
      </form>

      <section className={styles.history}>
        <div className={styles.historyHead}>
          <div>
            <span>Historial</span>
            <h2>Comunicados enviados</h2>
          </div>
          <b>{items.length}</b>
        </div>

        {items.length === 0 ? (
          <div className={styles.empty}>Todavía no enviaste comunicados.</div>
        ) : (
          <div className={styles.list}>
            {items.map((item) => (
              <article className={styles.item} key={item._id}>
                <div className={styles.itemTop}>
                  <span>
                    {item.alcance === "curso"
                      ? `${item.cursoId?.nombre || "Curso"} ${item.cursoId?.division || ""}`
                      : `${item.tutorId?.nombre || "Tutor"} ${item.tutorId?.apellido || ""}`}
                  </span>
                  <small>
                    {new Date(item.createdAt).toLocaleString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </small>
                </div>
                <h3>{item.titulo}</h3>
                <p>{item.mensaje}</p>
                <footer>
                  {item.destinatarios} destinatario{item.destinatarios === 1 ? "" : "s"}
                </footer>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
