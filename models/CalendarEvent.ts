import mongoose, { Schema, models } from "mongoose";

const CalendarEventSchema = new Schema({
  profesorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  cursoId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
  tipo: { type: String, enum: ["evaluacion", "reunion", "acto", "feriado", "otro"], default: "otro" },
  titulo: { type: String, required: true, trim: true, maxlength: 160 },
  descripcion: { type: String, trim: true, maxlength: 1000, default: "" },
  fecha: { type: String, required: true, index: true },
  hora: { type: String, trim: true, default: "" },
  recordatorio: { type: Boolean, default: true },
}, { timestamps: true });

CalendarEventSchema.index({ cursoId: 1, fecha: 1 });
export default models.CalendarEvent || mongoose.model("CalendarEvent", CalendarEventSchema);
