import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import mongoose from "mongoose";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Course from "@/models/Course";
import Student from "@/models/Student";
import User from "@/models/User";
import styles from "@/app/app-pages.module.css";
import localStyles from "./curso.module.css";

export default async function CursoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) redirect("/login");
  const { id } = await params; if (!mongoose.isValidObjectId(id)) notFound();
  await connectDB();
  void User;
  const curso = await Course.findOne({ _id: id, activo: true, docenteIds: user.id }).lean();
  if (!curso) notFound();
  const alumnos = await Student.find({ activo: true, cursoId: id }).select("_id nombre apellido dni tutorIds").populate("tutorIds", "nombre apellido email telefono").sort({ apellido: 1, nombre: 1 }).lean();

  return <section className={styles.page}><div className={styles.hero}><div><p className={styles.eyebrow}>Curso</p><h1 className={styles.title}>{curso.nombre} {curso.division || ""}</h1><p className={styles.subtitle}>{alumnos.length} alumnos · Turno {curso.turno}</p></div><div className={localStyles.headerActions}><Link href={`/profesor/alumnos?nuevo=1&cursoId=${curso._id}`} className={styles.secondaryButton}>+ Alumno</Link><Link href={`/profesor/asistencia?cursoId=${curso._id}`} className={styles.primaryButton}>✓ Asistencia</Link></div></div>
  <div className={localStyles.list}>{alumnos.length === 0 ? <div className={styles.empty}>Este curso todavía no tiene alumnos.</div> : alumnos.map((alumno:any,index) => <article key={String(alumno._id)} className={localStyles.student}><span className={localStyles.number}>{index+1}</span><div><strong>{alumno.apellido}, {alumno.nombre}</strong><small>{alumno.tutorIds?.[0] ? `Tutor: ${alumno.tutorIds[0].nombre} ${alumno.tutorIds[0].apellido || ""}` : "Sin tutor"}</small></div></article>)}</div></section>;
}
