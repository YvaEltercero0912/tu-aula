import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import RoleShell from "@/components/layout/RoleShell";

export default async function DocenteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.role !== "docente") redirect(`/${user.role}`);

  return (
    <RoleShell role="docente" nombre={user.nombre}>
      {children}
    </RoleShell>
  );
}
