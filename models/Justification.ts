import mongoose, { Schema, models } from "mongoose";

const JustificationSchema = new Schema(
  {
    asistenciaId: {
      type: Schema.Types.ObjectId,
      ref: "Attendance",
      required: true,
      unique: true,
      index: true,
    },
    alumnoId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    tutorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    motivo: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    observacion: {
      type: String,
      trim: true,
      maxlength: 800,
      default: "",
    },
    estado: {
      type: String,
      enum: ["pendiente", "aprobada", "rechazada"],
      default: "pendiente",
      index: true,
    },
    revisadoPorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    revisadoAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default models.Justification ||
  mongoose.model("Justification", JustificationSchema);
