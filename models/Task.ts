import mongoose, { Schema, models } from "mongoose";

const TaskSchema = new Schema({
  profesorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  cursoId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
  materia: { type: String, required: true, trim: true, maxlength: 120 },
  titulo: { type: String, required: true, trim: true, maxlength: 160 },
  descripcion: { type: String, trim: true, maxlength: 1500, default: "" },
  fechaEntrega: { type: String, required: true, index: true },
}, { timestamps: true });
TaskSchema.index({ cursoId: 1, fechaEntrega: 1 });
export default models.Task || mongoose.model("Task", TaskSchema);
