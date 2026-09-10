import mongoose, { Schema, models } from "mongoose";

const CourseSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    division: { type: String, trim: true, default: "" },
    turno: {
      type: String,
      enum: ["mañana", "tarde", "noche"],
      default: "mañana",
    },
    cicloLectivo: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
    docenteIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CourseSchema.index({ nombre: 1, division: 1, cicloLectivo: 1, docenteIds: 1 });

export default models.Course || mongoose.model("Course", CourseSchema);
