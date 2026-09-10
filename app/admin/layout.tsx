import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import LogoutButton from "@/components/auth/LogoutButton";
import NotificationBell from "@/components/notificaciones/NotificationBell";
import styles from "./layout.module.css";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.role !== "admin") redirect(`/${user.role}`);

  return (
    <div className={styles.shell}>
      <AdminSidebar />

      <div className={styles.content}>
        <header className={styles.topbar}>
          <div className={styles.mobileBrand}>
            <span>TA</span>
            <div>
              <strong>Tu Aula</strong>
              <small>Administración</small>
            </div>
          </div>

          <div className={styles.userInfo}>
            <span>Administrador</span>
            <strong>{user.nombre}</strong>
          </div>

          <div className={styles.actions}>
            <NotificationBell />
            <LogoutButton />
          </div>
        </header>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
