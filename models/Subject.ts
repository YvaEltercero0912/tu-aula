import mongoose, { Schema, models } from "mongoose";

const SubjectSchema = new Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    descripcion: { type: String, trim: true, default: "" },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default models.Subject || mongoose.model("Subject", SubjectSchema);
