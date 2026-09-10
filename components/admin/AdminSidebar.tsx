"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AdminSidebar.module.css";

const desktopItems = [
  { href: "/admin", icon: "⌂", label: "Inicio" },
  { href: "/admin/docentes", icon: "♟", label: "Docentes" },
  { href: "/admin/alumnos", icon: "♙", label: "Alumnos" },
  { href: "/admin/tutores", icon: "♧", label: "Tutores" },
  { href: "/admin/cursos", icon: "▤", label: "Cursos" },
  { href: "/admin/materias", icon: "▥", label: "Materias" },
];

const mobileItems = [
  { href: "/admin", icon: "⌂", label: "Inicio" },
  { href: "/admin/usuarios", icon: "♟", label: "Usuarios" },
  { href: "/admin/alumnos", icon: "♙", label: "Alumnos" },
  { href: "/admin/cursos", icon: "▤", label: "Cursos" },
  { href: "/admin/materias", icon: "▥", label: "Materias" },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  if (
    href === "/admin/usuarios" &&
    (pathname.startsWith("/admin/docentes") ||
      pathname.startsWith("/admin/tutores"))
  ) {
    return true;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className={styles.sidebar}>
        <Link href="/admin" className={styles.brand}>
          <div className={styles.logo}>TA</div>
          <div>
            <strong>Tu Aula</strong>
            <span>Administración</span>
          </div>
        </Link>

        <nav className={styles.nav}>
          {desktopItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(pathname, item.href) ? styles.active : ""}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <nav className={styles.mobileNav}>
        {mobileItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={isActive(pathname, item.href) ? styles.mobileActive : ""}
          >
            <span>{item.icon}</span>
            <small>{item.label}</small>
          </Link>
        ))}
      </nav>
    </>
  );
}
