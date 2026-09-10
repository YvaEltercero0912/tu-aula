import mongoose, { Schema, models } from "mongoose";

export type AttendanceStatus = "presente" | "ausente" | "tarde";

const AttendanceSchema = new Schema(
  {
    alumnoId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    cursoId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    fecha: {
      type: String,
      required: true,
      index: true,
    },
    estado: {
      type: String,
      enum: ["presente", "ausente", "tarde"],
      required: true,
      default: "presente",
    },
    docenteId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    justificada: {
      type: Boolean,
      default: false,
    },
    justificacionId: {
      type: Schema.Types.ObjectId,
      ref: "Justification",
      default: null,
    },
  },
  { timestamps: true }
);

AttendanceSchema.index(
  { alumnoId: 1, cursoId: 1, fecha: 1 },
  { unique: true }
);

export default models.Attendance ||
  mongoose.model("Attendance", AttendanceSchema);
