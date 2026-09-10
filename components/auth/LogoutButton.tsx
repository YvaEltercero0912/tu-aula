"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function cerrarSesion() {
    try {
      if (window.isSecureContext && "serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration("/");
        const subscription = await registration?.pushManager?.getSubscription();

        if (subscription) {
          await fetch("/api/push/subscription", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
        }
      }
    } catch {
      // El cierre de sesión no debe depender de Web Push.
    }

    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={cerrarSesion}>
      Cerrar sesión
    </button>
  );
}
