"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Home,
  School,
  Users,
  ClipboardCheck,
  CalendarDays,
  Star,
  FileText,
  Megaphone,
  FileSpreadsheet,
  MessageSquareText,
  MoreHorizontal,
  Bell,
  GraduationCap,
} from "lucide-react";

import NotificationBell from "@/components/notificaciones/NotificationBell";
import PushSubscriptionSync from "@/components/notificaciones/PushSubscriptionSync";
import LogoutButton from "@/components/auth/LogoutButton";

import styles from "./RoleShell.module.css";

export type AppRole = "docente" | "padre";

type MenuItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
};

const menus: Record<AppRole, MenuItem[]> = {
  docente: [
    {
      href: "/profesor",
      icon: Home,
      label: "Inicio",
    },
    {
      href: "/profesor/cursos",
      icon: School,
      label: "Cursos",
    },
    {
      href: "/profesor/alumnos",
      icon: Users,
      label: "Alumnos",
    },
    {
      href: "/profesor/asistencia",
      icon: ClipboardCheck,
      label: "Asistencia",
    },
    {
      href: "/profesor/agenda",
      icon: CalendarDays,
      label: "Agenda",
    },
    {
      href: "/profesor/calificaciones",
      icon: Star,
      label: "Notas",
    },
    {
      href: "/profesor/boletines",
      icon: FileText,
      label: "Boletines",
    },
    {
      href: "/profesor/comunicados",
      icon: Megaphone,
      label: "Avisos",
    },
    {
      href: "/profesor/importar",
      icon: FileSpreadsheet,
      label: "Importar Excel",
    },
    {
      href: "/profesor/justificaciones",
      icon: MessageSquareText,
      label: "Justificaciones",
    },
  ],

  padre: [
    {
      href: "/padre",
      icon: Home,
      label: "Inicio",
    },
    {
      href: "/padre/hijos",
      icon: Users,
      label: "Hijos",
    },
    {
      href: "/padre/asistencia",
      icon: ClipboardCheck,
      label: "Asistencia",
    },
    {
      href: "/padre/agenda",
      icon: CalendarDays,
      label: "Agenda",
    },
    {
      href: "/padre/notas",
      icon: Star,
      label: "Notas",
    },
    {
      href: "/padre/boletines",
      icon: FileText,
      label: "Boletines",
    },
    {
      href: "/padre/comunicados",
      icon: Megaphone,
      label: "Comunicados",
    },
    {
      href: "/notificaciones",
      icon: Bell,
      label: "Alertas",
    },
  ],
};

const mobileMenus: Record<AppRole, MenuItem[]> = {
  docente: [
    {
      href: "/profesor",
      icon: Home,
      label: "Inicio",
    },
    {
      href: "/profesor/alumnos",
      icon: Users,
      label: "Alumnos",
    },
    {
      href: "/profesor/asistencia",
      icon: ClipboardCheck,
      label: "Asistencia",
    },
    {
      href: "/profesor/agenda",
      icon: CalendarDays,
      label: "Agenda",
    },
    {
      href: "/profesor/mas",
      icon: MoreHorizontal,
      label: "Más",
    },
  ],

  padre: [
    {
      href: "/padre",
      icon: Home,
      label: "Inicio",
    },
    {
      href: "/padre/hijos",
      icon: Users,
      label: "Hijos",
    },
    {
      href: "/padre/asistencia",
      icon: ClipboardCheck,
      label: "Asistencia",
    },
    {
      href: "/padre/agenda",
      icon: CalendarDays,
      label: "Agenda",
    },
    {
      href: "/padre/mas",
      icon: MoreHorizontal,
      label: "Más",
    },
  ],
};

function home(role: AppRole) {
  return role === "docente"
    ? "/profesor"
    : "/padre";
}

function roleLabel(role: AppRole) {
  return role === "docente"
    ? "Profesor"
    : "Familia";
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

  const active = (href: string) =>
    href === homeHref
      ? pathname === href
      : pathname === href ||
        pathname.startsWith(`${href}/`);

  return (
    <div className={styles.shell}>
      <PushSubscriptionSync />

      <aside className={styles.sidebar}>
        <Link
          href={homeHref}
          className={styles.brand}
        >
          <span className={styles.logo}>
            <GraduationCap
              size={24}
              strokeWidth={2.2}
            />
          </span>

          <span>
            <strong>Tu Aula</strong>
            <small>{roleLabel(role)}</small>
          </span>
        </Link>

        <nav className={styles.desktopNav}>
          {menu.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active(item.href)
                    ? styles.active
                    : ""
                }
              >
                <span className={styles.navIcon}>
                  <Icon
                    size={20}
                    strokeWidth={2}
                  />
                </span>

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
          <Link
            href={homeHref}
            className={styles.mobileBrand}
          >
            <span className={styles.mobileLogo}>
              <GraduationCap
                size={21}
                strokeWidth={2.2}
              />
            </span>

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

        <main className={styles.main}>
          {children}
        </main>
      </div>

      <nav className={styles.mobileNav}>
        {mobileMenu.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active(item.href)
                  ? styles.mobileActive
                  : ""
              }
            >
              <span>
                <Icon
                  size={21}
                  strokeWidth={2}
                />
              </span>

              <small>{item.label}</small>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}