"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationBell from "@/components/notificaciones/NotificationBell";
import PushSubscriptionSync from "@/components/notificaciones/PushSubscriptionSync";
import LogoutButton from "@/components/auth/LogoutButton";
import styles from "./RoleShell.module.css";

export type AppRole = "docente" | "padre";

const menus = {
  docente: [
    { href: "/profesor", icon: "⌂", label: "Inicio" },
    { href: "/profesor/cursos", icon: "▤", label: "Cursos" },
    { href: "/profesor/alumnos", icon: "♙", label: "Alumnos" },
    { href: "/profesor/asistencia", icon: "✓", label: "Asistencia" },
    { href: "/profesor/calificaciones", icon: "★", label: "Notas" },
    { href: "/profesor/comunicados", icon: "✉", label: "Avisos" },
    { href: "/profesor/justificaciones", icon: "✎", label: "Justif." },
  ],
  padre: [
    { href: "/padre", icon: "⌂", label: "Inicio" },
    { href: "/padre/hijos", icon: "♙", label: "Hijos" },
    { href: "/padre/asistencia", icon: "✓", label: "Asistencia" },
    { href: "/padre/notas", icon: "★", label: "Notas" },
    { href: "/padre/comunicados", icon: "✉", label: "Comunic." },
    { href: "/notificaciones", icon: "●", label: "Alertas" },
  ],
} satisfies Record<AppRole, Array<{ href: string; icon: string; label: string }>>;


const mobileMenus = {
  docente: [
    { href: "/profesor", icon: "⌂", label: "Inicio" },
    { href: "/profesor/alumnos", icon: "♙", label: "Alumnos" },
    { href: "/profesor/asistencia", icon: "✓", label: "Asistencia" },
    { href: "/profesor/calificaciones", icon: "★", label: "Notas" },
    { href: "/profesor/comunicados", icon: "✉", label: "Avisos" },
  ],
  padre: [
    { href: "/padre", icon: "⌂", label: "Inicio" },
    { href: "/padre/hijos", icon: "♙", label: "Hijos" },
    { href: "/padre/asistencia", icon: "✓", label: "Asistencia" },
    { href: "/padre/notas", icon: "★", label: "Notas" },
    { href: "/padre/comunicados", icon: "✉", label: "Avisos" },
  ],
} satisfies Record<AppRole, Array<{ href: string; icon: string; label: string }>>;

function home(role: AppRole) {
  return role === "docente" ? "/profesor" : "/padre";
}

function roleLabel(role: AppRole) {
  return role === "docente" ? "Profesor" : "Familia";
}

export default function RoleShell({
  role,
  nombre,
  children,
}: {
  role: AppRole;
  nombre: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const menu = menus[role];
  const mobileMenu = mobileMenus[role];
  const homeHref = home(role);

  return (
    <div className={styles.shell}>
      <PushSubscriptionSync />
      <aside className={styles.sidebar}>
        <Link href={homeHref} className={styles.brand}>
          <span className={styles.logo}>TA</span>
          <span>
            <strong>Tu Aula</strong>
            <small>{roleLabel(role)}</small>
          </span>
        </Link>

        <nav className={styles.desktopNav}>
          {menu.map((item) => {
            const active =
              item.href === homeHref
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? styles.active : ""}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <span>{nombre}</span>
          <LogoutButton />
        </div>
      </aside>

      <div className={styles.content}>
        <header className={styles.topbar}>
          <Link href={homeHref} className={styles.mobileBrand}>
            <span className={styles.mobileLogo}>TA</span>
            <span>
              <strong>Tu Aula</strong>
              <small>{roleLabel(role)}</small>
            </span>
          </Link>

          <div className={styles.welcome}>
            <small>{roleLabel(role)}</small>
            <strong>{nombre}</strong>
          </div>

          <NotificationBell />
        </header>

        <main className={styles.main}>{children}</main>
      </div>

      <nav className={styles.mobileNav}>
        {mobileMenu.map((item) => {
          const active =
            item.href === homeHref
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? styles.mobileActive : ""}
            >
              <span>{item.icon}</span>
              <small>{item.label}</small>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
