import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import RoleShell from "@/components/layout/RoleShell";

export default async function PadreLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.requiereCambioPassword) redirect("/cambiar-clave-inicial");
  if (user.role !== "padre") redirect("/profesor");

  return <RoleShell role="padre" nombre={user.nombre}>{children}</RoleShell>;
}
