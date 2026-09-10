import mongoose, { Schema, models } from "mongoose";

const NotificationSchema = new Schema(
  {
    usuarioId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tipo: {
      type: String,
      enum: [
        "inasistencia",
        "tardanza",
        "justificacion_recibida",
        "justificacion_aprobada",
        "justificacion_rechazada",
        "calificacion",
        "comunicado",
        "general",
      ],
      default: "general",
      index: true,
    },
    titulo: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    mensaje: {
      type: String,
      required: true,
      trim: true,
      maxlength: 800,
    },
    leida: {
      type: Boolean,
      default: false,
      index: true,
    },
    alumnoId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },
    asistenciaId: {
      type: Schema.Types.ObjectId,
      ref: "Attendance",
      default: null,
    },
    justificacionId: {
      type: Schema.Types.ObjectId,
      ref: "Justification",
      default: null,
    },
    calificacionId: {
      type: Schema.Types.ObjectId,
      ref: "Grade",
      default: null,
    },
    comunicadoId: {
      type: Schema.Types.ObjectId,
      ref: "Announcement",
      default: null,
    },
    href: {
      type: String,
      trim: true,
      default: "/notificaciones",
    },
  },
  { timestamps: true }
);

NotificationSchema.index({ usuarioId: 1, createdAt: -1 });

export default models.Notification ||
  mongoose.model("Notification", NotificationSchema);
