import mongoose, { Schema, models } from "mongoose";

const AverageSchema = new Schema({ materia: { type: String, required: true }, promedio: { type: Number, required: true }, cantidad: { type: Number, default: 0 } }, { _id: false });
const ReportCardSchema = new Schema({
  profesorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  cursoId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
  alumnoId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
  periodo: { type: String, required: true, trim: true, maxlength: 80 },
  cicloLectivo: { type: Number, required: true, index: true },
  desde: { type: String, required: true },
  hasta: { type: String, required: true },
  promedios: { type: [AverageSchema], default: [] },
  promedioGeneral: { type: Number, default: null },
  observacion: { type: String, trim: true, maxlength: 1500, default: "" },
  publicado: { type: Boolean, default: true },
}, { timestamps: true });
ReportCardSchema.index({ alumnoId: 1, periodo: 1, cicloLectivo: 1 }, { unique: true });
export default models.ReportCard || mongoose.model("ReportCard", ReportCardSchema);
