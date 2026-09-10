"use client";

import { useEffect, useState } from "react";
import styles from "./PushNotificationSetup.module.css";

type State =
  | "checking"
  | "unsupported"
  | "needs_https"
  | "ios_install"
  | "disabled"
  | "denied"
  | "active"
  | "working";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandalone() {
  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean;
  };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

export default function PushNotificationSetup() {
  const [state, setState] = useState<State>("checking");
  const [message, setMessage] = useState("");

  async function registration() {
    return navigator.serviceWorker.register("/sw.js", { scope: "/" });
  }

  useEffect(() => {
    async function check() {
      if (!window.isSecureContext) {
        setState("needs_https");
        return;
      }

      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        setState("unsupported");
        return;
      }

      if (isIOS() && !isStandalone()) {
        setState("ios_install");
        return;
      }

      if (Notification.permission === "denied") {
        setState("denied");
        return;
      }

      try {
        const reg = await registration();
        const subscription = await reg.pushManager.getSubscription();

        if (subscription) {
          await fetch("/api/push/subscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(subscription.toJSON()),
          });
          setState("active");
        } else {
          setState("disabled");
        }
      } catch {
        setState("disabled");
      }
    }

    check();
  }, []);

  async function activar() {
    setState("working");
    setMessage("");

    try {
      if (!window.isSecureContext) {
        setState("needs_https");
        return;
      }

      if (isIOS() && !isStandalone()) {
        setState("ios_install");
        return;
      }

      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "disabled");
        return;
      }

      const keyResponse = await fetch("/api/push/public-key", {
        cache: "no-store",
      });
      const keyData = await keyResponse.json();

      if (!keyResponse.ok || !keyData?.publicKey) {
        throw new Error(keyData?.message || "No se pudo obtener la clave pública.");
      }

      const reg = await registration();
      let subscription = await reg.pushManager.getSubscription();

      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
        });
      }

      const saveResponse = await fetch("/api/push/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!saveResponse.ok) {
        throw new Error("No se pudo guardar la suscripción.");
      }

      setState("active");
      setMessage("Este dispositivo ya puede recibir avisos de Tu Aula.");
    } catch (error) {
      setState("disabled");
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudieron activar las notificaciones."
      );
    }
  }

  async function enviarPrueba() {
    setMessage("Enviando prueba...");
    try {
      const response = await fetch("/api/push/test", { method: "POST" });
      const data = await response.json();
      setMessage(
        response.ok
          ? "Prueba enviada. Debería aparecer una notificación en este dispositivo."
          : data?.message || "No se pudo enviar la prueba."
      );
    } catch {
      setMessage("No se pudo enviar la prueba.");
    }
  }

  async function desactivar() {
    setState("working");
    setMessage("");

    try {
      const reg = await registration();
      const subscription = await reg.pushManager.getSubscription();
      const endpoint = subscription?.endpoint || "";

      if (subscription) {
        await subscription.unsubscribe();
      }

      await fetch("/api/push/subscription", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });

      setState("disabled");
      setMessage("Las notificaciones push se desactivaron en este dispositivo.");
    } catch {
      setState("active");
      setMessage("No se pudieron desactivar las notificaciones.");
    }
  }

  return (
    <section className={styles.card}>
      <div className={styles.icon}>🔔</div>
      <div className={styles.content}>
        <div className={styles.heading}>
          <div>
            <span>Este dispositivo</span>
            <h2>Notificaciones al celular</h2>
          </div>
          {state === "active" && <b className={styles.active}>Activas</b>}
        </div>

        {state === "checking" && <p>Comprobando este dispositivo...</p>}
        {state === "working" && <p>Configurando notificaciones...</p>}

        {state === "needs_https" && (
          <p>
            Para recibir avisos con Tu Aula cerrada necesitás abrir la plataforma
            desde una dirección HTTPS. La prueba por IP local sigue funcionando,
            pero el push real se activa al publicarla, por ejemplo en Vercel.
          </p>
        )}

        {state === "unsupported" && (
          <p>Este navegador no ofrece notificaciones push web.</p>
        )}

        {state === "ios_install" && (
          <div className={styles.instructions}>
            <p>
              En iPhone primero agregá Tu Aula a la pantalla de inicio. Después
              abrila desde el icono de Tu Aula y volvé a esta sección.
            </p>
            <ol>
              <li>Tocá Compartir en Safari.</li>
              <li>Elegí “Agregar a pantalla de inicio”.</li>
              <li>Abrí Tu Aula desde el nuevo icono.</li>
            </ol>
          </div>
        )}

        {state === "denied" && (
          <p>
            Las notificaciones están bloqueadas para Tu Aula. Habilitalas desde
            los permisos del navegador o del teléfono y volvé a intentar.
          </p>
        )}

        {state === "disabled" && (
          <p>
            Activá esta opción para recibir faltas, notas, justificaciones y
            comunicados aunque no tengas Tu Aula abierta.
          </p>
        )}

        {state === "active" && (
          <p>
            Este teléfono recibirá las novedades importantes asociadas a tu cuenta.
          </p>
        )}

        {message && <div className={styles.message}>{message}</div>}

        <div className={styles.actions}>
          {state === "disabled" && (
            <button type="button" onClick={activar}>
              Activar notificaciones
            </button>
          )}
          {state === "active" && (
            <>
              <button type="button" onClick={enviarPrueba}>
                Enviar prueba
              </button>
              <button type="button" className={styles.secondary} onClick={desactivar}>
                Desactivar en este dispositivo
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
