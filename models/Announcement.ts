import mongoose, { Schema, models } from "mongoose";

const AnnouncementSchema = new Schema(
  {
    profesorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
      maxlength: 2000,
    },
    alcance: {
      type: String,
      enum: ["curso", "tutor"],
      required: true,
      index: true,
    },
    cursoId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      default: null,
      index: true,
    },
    tutorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    destinatarios: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

AnnouncementSchema.index({ profesorId: 1, createdAt: -1 });
AnnouncementSchema.index({ cursoId: 1, createdAt: -1 });
AnnouncementSchema.index({ tutorId: 1, createdAt: -1 });

export default models.Announcement ||
  mongoose.model("Announcement", AnnouncementSchema);
