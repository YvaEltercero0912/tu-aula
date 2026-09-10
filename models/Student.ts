import mongoose, { Schema, models } from "mongoose";

const StudentSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    apellido: { type: String, required: true, trim: true },
    dni: { type: String, trim: true, default: "" },
    fechaNacimiento: { type: Date, default: null },
    cursoId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },
    tutorIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default models.Student || mongoose.model("Student", StudentSchema);
