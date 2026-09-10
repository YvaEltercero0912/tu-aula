import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import RoleShell from "@/components/layout/RoleShell";

export default async function ProfesorLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.requiereCambioPassword) redirect("/cambiar-clave-inicial");
  if (user.role !== "docente") redirect("/padre");

  return <RoleShell role="docente" nombre={user.nombre}>{children}</RoleShell>;
}
