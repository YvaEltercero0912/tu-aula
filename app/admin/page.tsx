import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Student from "@/models/Student";
import Course from "@/models/Course";
import Subject from "@/models/Subject";

export default async function AdminPage() {
  await connectDB();

  const [alumnos, docentes, tutores, cursos, materias] =
    await Promise.all([
      Student.countDocuments({ activo: true }),
      User.countDocuments({ role: "docente", activo: true }),
      User.countDocuments({ role: "padre", activo: true }),
      Course.countDocuments({ activo: true }),
      Subject.countDocuments({ activo: true }),
    ]);

  const cards = [
    ["🎓", "Alumnos", alumnos],
    ["👨‍🏫", "Docentes", docentes],
    ["👨‍👩‍👧", "Tutores", tutores],
    ["🏫", "Cursos", cursos],
    ["📚", "Materias", materias],
  ];

  return (
    <section style={{ display: "grid", gap: 24 }}>
      <div>
        <p style={{ color: "#4f46e5", fontWeight: 800, margin: 0 }}>
          Resumen general
        </p>
        <h1 style={{ margin: "4px 0 0", fontSize: 36 }}>
          Tu institución
        </h1>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
        }}
      >
        {cards.map(([icon, label, value]) => (
          <article
            key={String(label)}
            style={{
              padding: 20,
              border: "1px solid #e5e7eb",
              borderRadius: 18,
              background: "#fff",
            }}
          >
            <div style={{ fontSize: 26 }}>{icon}</div>
            <span style={{ color: "#6b7280", fontWeight: 700 }}>
              {label}
            </span>
            <strong
              style={{
                display: "block",
                marginTop: 6,
                fontSize: 30,
              }}
            >
              {value}
            </strong>
          </article>
        ))}
      </div>
    </section>
  );
}
