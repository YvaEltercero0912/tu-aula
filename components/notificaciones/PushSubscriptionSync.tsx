"use client";

import { useEffect } from "react";

export default function PushSubscriptionSync() {
  useEffect(() => {
    async function sync() {
      if (
        !window.isSecureContext ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        return;
      }

      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        const subscription = await registration.pushManager.getSubscription();

        if (!subscription) return;

        await fetch("/api/push/subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription.toJSON()),
        });
      } catch {
        // Si el navegador no soporta push, la app sigue funcionando.
      }
    }

    sync();
  }, []);

  return null;
}
