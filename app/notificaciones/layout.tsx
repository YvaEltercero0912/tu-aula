import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import RoleShell from "@/components/layout/RoleShell";

export default async function NotificationsLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.requiereCambioPassword) redirect("/cambiar-clave-inicial");
  return <RoleShell role={user.role} nombre={user.nombre}>{children}</RoleShell>;
}
