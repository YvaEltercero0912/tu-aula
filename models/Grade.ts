import mongoose, { Schema, models } from "mongoose";

const GradeSchema = new Schema(
  {
    profesorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    cursoId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    alumnoId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    materia: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      index: true,
    },
    titulo: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    nota: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    fecha: {
      type: String,
      required: true,
      index: true,
    },
    observacion: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    evaluacionId: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

GradeSchema.index({ alumnoId: 1, fecha: -1 });
GradeSchema.index({ profesorId: 1, cursoId: 1, fecha: -1 });

export default models.Grade || mongoose.model("Grade", GradeSchema);
