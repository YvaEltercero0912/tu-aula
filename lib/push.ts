import webpush from "web-push";
import { connectDB } from "@/lib/mongodb";
import PushSubscription from "@/models/PushSubscription";
import SystemConfig from "@/models/SystemConfig";

interface StoredVapidKeys {
  publicKey: string;
  privateKey: string;
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

let cachedKeys: StoredVapidKeys | null = null;
let vapidConfigured = false;

export async function getVapidKeys(): Promise<StoredVapidKeys> {
  if (cachedKeys) return cachedKeys;

  await connectDB();

  const existing = await SystemConfig.findOne({ key: "web_push_vapid" }).lean();

  if (existing?.value?.publicKey && existing?.value?.privateKey) {
    cachedKeys = {
      publicKey: String(existing.value.publicKey),
      privateKey: String(existing.value.privateKey),
    };
    return cachedKeys;
  }

  const generated = webpush.generateVAPIDKeys();

  try {
    const created = await SystemConfig.create({
      key: "web_push_vapid",
      value: generated,
    });
    cachedKeys = {
      publicKey: String(created.value.publicKey),
      privateKey: String(created.value.privateKey),
    };
  } catch {
    const raced = await SystemConfig.findOne({ key: "web_push_vapid" }).lean();
    if (!raced?.value?.publicKey || !raced?.value?.privateKey) {
      throw new Error("No se pudieron inicializar las claves de notificaciones push.");
    }
    cachedKeys = {
      publicKey: String(raced.value.publicKey),
      privateKey: String(raced.value.privateKey),
    };
  }

  return cachedKeys;
}

async function configureVapid() {
  if (vapidConfigured) return;
  const keys = await getVapidKeys();
  const subject = process.env.VAPID_SUBJECT || "mailto:soporte@tuaula.app";
  webpush.setVapidDetails(subject, keys.publicKey, keys.privateKey);
  vapidConfigured = true;
}

export async function sendPushToUser(
  usuarioId: string,
  payload: PushPayload
) {
  await connectDB();
  await configureVapid();

  const subscriptions = await PushSubscription.find({
    usuarioId,
    activo: true,
  }).lean();

  if (!subscriptions.length) {
    return { enviados: 0, fallidos: 0 };
  }

  let enviados = 0;
  let fallidos = 0;

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth,
            },
          },
          JSON.stringify({
            title: payload.title,
            body: payload.body,
            url: payload.url || "/notificaciones",
            tag: payload.tag || "tu-aula",
          }),
          {
            TTL: 60 * 60 * 24,
            urgency: "high",
          }
        );
        enviados += 1;
      } catch (error) {
        fallidos += 1;
        const statusCode =
          typeof error === "object" && error !== null && "statusCode" in error
            ? Number((error as { statusCode?: number }).statusCode)
            : 0;

        if (statusCode === 404 || statusCode === 410) {
          await PushSubscription.deleteOne({ _id: subscription._id });
        } else {
          console.error("No se pudo enviar push:", error);
        }
      }
    })
  );

  return { enviados, fallidos };
}
