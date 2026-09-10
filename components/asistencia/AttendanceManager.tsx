"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./AttendanceManager.module.css";

 type Estado = "presente" | "ausente" | "tarde";

interface Curso {
  _id: string;
  nombre: string;
  division?: string;
  turno: string;
  cantidadAlumnos?: number;
}

interface Alumno {
  _id: string;
  nombre: string;
  apellido: string;
}

interface RegistroGuardado {
  alumnoId: string;
  estado: Estado;
  justificada?: boolean;
}

function hoyLocal() {
  const ahora = new Date();
  const offset = ahora.getTimezoneOffset() * 60000;
  return new Date(ahora.getTime() - offset)
    .toISOString()
    .slice(0, 10);
}

export default function AttendanceManager({
  initialCursoId = "",
}: {
  initialCursoId?: string;
}) {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursoId, setCursoId] = useState(initialCursoId);
  const [fecha, setFecha] = useState(hoyLocal());
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [estados, setEstados] = useState<Record<string, Estado>>({});
  const [loading, setLoading] = useState(true);
  const [loadingLista, setLoadingLista] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarCursos() {
      setLoading(true);
      try {
        const response = await fetch("/api/profesor/cursos", {
          cache: "no-store",
        });
        const data = await response.json();
        const lista = response.ok ? data.cursos || [] : [];
        setCursos(lista);

        if (!cursoId && lista.length > 0) {
          setCursoId(lista[0]._id);
        }
      } finally {
        setLoading(false);
      }
    }

    cargarCursos();
  }, []);

  useEffect(() => {
    if (!cursoId || !fecha) {
      setAlumnos([]);
      setEstados({});
      return;
    }

    async function cargarLista() {
      setLoadingLista(true);
      setMensaje("");
      setError("");

      try {
        const [alumnosResponse, asistenciaResponse] = await Promise.all([
          fetch(`/api/profesor/cursos/${cursoId}/alumnos`, {
            cache: "no-store",
          }),
          fetch(`/api/asistencia?cursoId=${cursoId}&fecha=${fecha}`, {
            cache: "no-store",
          }),
        ]);

        const [alumnosData, asistenciaData] = await Promise.all([
          alumnosResponse.json(),
          asistenciaResponse.json(),
        ]);

        if (!alumnosResponse.ok) {
          setError(alumnosData?.message || "No se pudo cargar el curso.");
          return;
        }

        const lista: Alumno[] = alumnosData.alumnos || [];
        const guardados: RegistroGuardado[] = asistenciaResponse.ok
          ? asistenciaData.registros || []
          : [];

        const guardadoMap = new Map(
          guardados.map((item) => [String(item.alumnoId), item.estado])
        );

        const nuevosEstados: Record<string, Estado> = {};
        lista.forEach((alumno) => {
          nuevosEstados[alumno._id] =
            guardadoMap.get(alumno._id) || "presente";
        });

        setAlumnos(lista);
        setEstados(nuevosEstados);
      } catch {
        setError("No se pudo conectar con el servidor.");
      } finally {
        setLoadingLista(false);
      }
    }

    cargarLista();
  }, [cursoId, fecha]);

  const resumen = useMemo(() => {
    const values = Object.values(estados);
    return {
      presente: values.filter((x) => x === "presente").length,
      ausente: values.filter((x) => x === "ausente").length,
      tarde: values.filter((x) => x === "tarde").length,
    };
  }, [estados]);

  function cambiarEstado(alumnoId: string, estado: Estado) {
    setEstados((actual) => ({
      ...actual,
      [alumnoId]: estado,
    }));
    setMensaje("");
  }

  function todosPresentes() {
    setEstados(
      Object.fromEntries(
        alumnos.map((alumno) => [alumno._id, "presente"])
      ) as Record<string, Estado>
    );
    setMensaje("");
  }

  async function guardar() {
    if (!cursoId || alumnos.length === 0) return;

    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      const response = await fetch("/api/asistencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cursoId,
          fecha,
          registros: alumnos.map((alumno) => ({
            alumnoId: alumno._id,
            estado: estados[alumno._id] || "presente",
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.message || "No se pudo guardar la asistencia.");
        return;
      }

      setMensaje(
        data.notificaciones > 0
          ? `Asistencia guardada. Se generaron ${data.notificaciones} notificaciones.`
          : "Asistencia guardada correctamente."
      );
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setGuardando(false);
    }
  }

  if (loading) {
    return <div className={styles.state}>Cargando tus cursos...</div>;
  }

  if (cursos.length === 0) {
    return (
      <div className={styles.state}>
        Todavía no creaste cursos.
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.controls}>
        <label>
          Curso
          <select
            value={cursoId}
            onChange={(e) => setCursoId(e.target.value)}
          >
            {cursos.map((curso) => (
              <option key={curso._id} value={curso._id}>
                {curso.nombre} {curso.division || ""}
              </option>
            ))}
          </select>
        </label>

        <label>
          Fecha
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </label>
      </div>

      <div className={styles.summary}>
        <div>
          <span>Presentes</span>
          <strong>{resumen.presente}</strong>
        </div>
        <div>
          <span>Ausentes</span>
          <strong>{resumen.ausente}</strong>
        </div>
        <div>
          <span>Tarde</span>
          <strong>{resumen.tarde}</strong>
        </div>
      </div>

      <div className={styles.toolbar}>
        <strong>{alumnos.length} alumnos</strong>
        <button type="button" onClick={todosPresentes}>
          ✓ Todos presentes
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {mensaje && <div className={styles.success}>{mensaje}</div>}

      {loadingLista ? (
        <div className={styles.state}>Cargando alumnos...</div>
      ) : alumnos.length === 0 ? (
        <div className={styles.state}>
          Este curso todavía no tiene alumnos.
        </div>
      ) : (
        <div className={styles.list}>
          {alumnos.map((alumno) => {
            const actual = estados[alumno._id] || "presente";

            return (
              <article key={alumno._id} className={styles.student}>
                <div className={styles.identity}>
                  <span>
                    {alumno.nombre.charAt(0)}{alumno.apellido.charAt(0)}
                  </span>
                  <div>
                    <strong>
                      {alumno.apellido}, {alumno.nombre}
                    </strong>
                    <small>{actual === "tarde" ? "Llegada tarde" : actual}</small>
                  </div>
                </div>

                <div className={styles.statusButtons}>
                  <button
                    type="button"
                    className={actual === "presente" ? styles.presentActive : ""}
                    onClick={() => cambiarEstado(alumno._id, "presente")}
                  >
                    ✓ <span>Presente</span>
                  </button>
                  <button
                    type="button"
                    className={actual === "ausente" ? styles.absentActive : ""}
                    onClick={() => cambiarEstado(alumno._id, "ausente")}
                  >
                    ✕ <span>Ausente</span>
                  </button>
                  <button
                    type="button"
                    className={actual === "tarde" ? styles.lateActive : ""}
                    onClick={() => cambiarEstado(alumno._id, "tarde")}
                  >
                    ◷ <span>Tarde</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {alumnos.length > 0 && (
        <div className={styles.saveBar}>
          <div>
            <strong>{resumen.ausente} ausentes</strong>
            <span>{resumen.tarde} llegadas tarde</span>
          </div>
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
          >
            {guardando ? "Guardando..." : "Guardar asistencia"}
          </button>
        </div>
      )}
    </div>
  );
}
