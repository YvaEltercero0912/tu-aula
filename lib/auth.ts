import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import User from "@/models/User";

export const AUTH_COOKIE_NAME = "tu_aula_token";

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    await connectDB();

    const user = await User.findById(payload.userId)
      .select(
        "_id nombre apellido dni telefono email role activo requiereCambioPassword"
      )
      .lean();

    if (!user || !user.activo) return null;

    const role = String(user.role);
    if (role !== "docente" && role !== "padre") return null;

    return {
      id: String(user._id),
      nombre: user.nombre,
      apellido: user.apellido || "",
      dni: user.dni || "",
      telefono: user.telefono || "",
      email: user.email,
      role: role as "docente" | "padre",
      activo: user.activo,
      requiereCambioPassword: Boolean(user.requiereCambioPassword),
    };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireRole(roles: Array<"docente" | "padre">) {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new Error("FORBIDDEN");
  return user;
}
