self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {
      title: "Tu Aula",
      body: event.data ? event.data.text() : "Tenés una nueva notificación.",
    };
  }

  const title = data.title || "Tu Aula";
  const options = {
    body: data.body || "Tenés una nueva notificación.",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-96.png",
    tag: data.tag || "tu-aula-notificacion",
    renotify: true,
    data: {
      url: data.url || "/notificaciones",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/notificaciones";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (windowClients) => {
        for (const client of windowClients) {
          if ("focus" in client) {
            try {
              if ("navigate" in client) {
                await client.navigate(target);
              }
            } catch {}
            return client.focus();
          }
        }
        return clients.openWindow(target);
      })
  );
});
