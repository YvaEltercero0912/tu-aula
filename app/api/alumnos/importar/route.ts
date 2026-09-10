import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/auth";
import Course from "@/models/Course";
import Student from "@/models/Student";
import User from "@/models/User";

function tempPassword() { return `TA-${randomBytes(8).toString("base64url").slice(0, 10)}`; }
function text(v: unknown) { return String(v ?? "").trim(); }
function norm(v: unknown) { return text(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
function rowValue(row: Record<string, unknown>, names: string[]) {
  for (const [k,v] of Object.entries(row)) if (names.includes(norm(k))) return v;
  return "";
}
function excelDate(v: unknown) {
  if (typeof v === "number") { const d = XLSX.SSF.parse_date_code(v); if (d) return new Date(d.y, d.m - 1, d.d); }
  const s=text(v); if (!s) return null;
  const m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/); if (m) return new Date(Number(m[3]), Number(m[2])-1, Number(m[1]));
  const d=new Date(s); return Number.isNaN(d.getTime()) ? null : d;
}

export async function POST(request: Request) {
  try {
    const profesor = await requireRole(["docente"]); await connectDB();
    const form = await request.formData(); const file = form.get("archivo");
    if (!(file instanceof File)) return NextResponse.json({ ok:false, message:"Seleccioná un archivo Excel." }, {status:400});
    const wb = XLSX.read(Buffer.from(await file.arrayBuffer()), { type:"buffer", cellDates:false });
    const ws = wb.Sheets[wb.SheetNames[0]]; const rows = XLSX.utils.sheet_to_json(ws, { defval:"" }) as Record<string, unknown>[];
    if (!rows.length) return NextResponse.json({ok:false,message:"El Excel no tiene alumnos."},{status:400});
    const result = { creados:0, actualizados:0, omitidos:0, tutoresCreados:0, cursosCreados:0, errores:[] as string[], credenciales:[] as Array<{email:string;password:string;alumno:string}> };

    for (let i=0;i<rows.length;i++) {
      const r=rows[i]; const nombre=text(rowValue(r,["nombre","nombre alumno","alumno nombre"])); const apellido=text(rowValue(r,["apellido","apellido alumno","alumno apellido"]));
      const dni=text(rowValue(r,["dni","dni alumno"])); const cursoNombre=text(rowValue(r,["curso","ano","año"])); const division=text(rowValue(r,["division","división"]));
      const turno=norm(rowValue(r,["turno"])) || "mañana"; const ciclo=Number(text(rowValue(r,["ciclo lectivo","ciclo","anio lectivo","año lectivo"])) || new Date().getFullYear());
      const tutorNombre=text(rowValue(r,["tutor nombre","nombre tutor","responsable nombre"])); const tutorApellido=text(rowValue(r,["tutor apellido","apellido tutor","responsable apellido"]));
      const tutorDni=text(rowValue(r,["tutor dni","dni tutor","responsable dni"])); const tutorEmail=text(rowValue(r,["tutor email","email tutor","correo tutor","tutor correo"])).toLowerCase(); const tutorTelefono=text(rowValue(r,["tutor telefono","tutor teléfono","telefono tutor","teléfono tutor"]));
      if (!nombre || !apellido || !cursoNombre || !tutorNombre || !tutorEmail) { result.omitidos++; result.errores.push(`Fila ${i+2}: faltan Nombre, Apellido, Curso, Tutor nombre o Tutor email.`); continue; }
      let curso = await Course.findOne({ nombre: cursoNombre, division, cicloLectivo:ciclo, docenteIds: profesor.id, activo:true });
      if (!curso) { curso = await Course.create({ nombre:cursoNombre, division, turno:["mañana","tarde","noche"].includes(turno)?turno:"mañana", cicloLectivo:ciclo, docenteIds:[profesor.id], activo:true }); result.cursosCreados++; }
      const cond: any[]=[{email:tutorEmail}]; if(tutorDni) cond.push({dni:tutorDni});
      let tutor = await User.findOne({$or:cond}).select("+password"); let clave:string|null=null;
      if (tutor && String(tutor.role)!=="padre") { result.omitidos++; result.errores.push(`Fila ${i+2}: el tutor ${tutorEmail} pertenece a una cuenta de profesor.`); continue; }
      if (!tutor) { clave=tempPassword(); tutor=await User.create({nombre:tutorNombre,apellido:tutorApellido,dni:tutorDni,telefono:tutorTelefono,email:tutorEmail,password:await bcrypt.hash(clave,12),role:"padre",activo:true,requiereCambioPassword:true}); result.tutoresCreados++; result.credenciales.push({email:tutorEmail,password:clave,alumno:`${nombre} ${apellido}`}); }
      const fechaNacimiento=excelDate(rowValue(r,["fecha nacimiento","fecha de nacimiento","nacimiento"]));
      let alumno = dni ? await Student.findOne({dni}) : await Student.findOne({nombre,apellido,cursoId:curso._id});
      if (alumno) { alumno.nombre=nombre; alumno.apellido=apellido; alumno.cursoId=curso._id; alumno.activo=true; if(fechaNacimiento) alumno.fechaNacimiento=fechaNacimiento; if(dni) alumno.dni=dni; if(!(alumno.tutorIds||[]).some((id:any)=>String(id)===String(tutor._id))) alumno.tutorIds=[...(alumno.tutorIds||[]),tutor._id]; await alumno.save(); result.actualizados++; }
      else { await Student.create({nombre,apellido,dni,fechaNacimiento,cursoId:curso._id,tutorIds:[tutor._id],activo:true}); result.creados++; }
    }
    return NextResponse.json({ok:true, ...result, totalFilas:rows.length});
  } catch (error) { console.error("Importar alumnos:", error); return NextResponse.json({ok:false,message:"No se pudo importar el Excel.", ...(process.env.NODE_ENV!=="production"&&{error:error instanceof Error?error.message:String(error)})},{status:500}); }
}
