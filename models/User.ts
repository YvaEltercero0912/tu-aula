import mongoose, { Schema, models } from "mongoose";

export type UserRole = "docente" | "padre";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  nombre: string;
  apellido?: string;
  dni?: string;
  telefono?: string;
  email: string;
  password: string;
  role: UserRole;
  activo: boolean;
  requiereCambioPassword: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    apellido: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },
    dni: {
      type: String,
      trim: true,
      default: "",
    },
    telefono: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      // "admin" remains accepted only so existing installs can migrate on login.
      enum: ["docente", "padre", "admin"],
      required: true,
      default: "padre",
      index: true,
    },
    activo: {
      type: Boolean,
      default: true,
    },
    requiereCambioPassword: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const User = models.User || mongoose.model<IUser>("User", UserSchema);
export default User;
