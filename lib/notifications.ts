import { connectDB } from "@/lib/mongodb";
import { sendPushToUser } from "@/lib/push";
import Notification from "@/models/Notification";

type NotificationType =
  | "inasistencia"
  | "tardanza"
  | "justificacion_recibida"
  | "justificacion_aprobada"
  | "justificacion_rechazada"
  | "calificacion"
  | "comunicado"
  | "evento"
  | "tarea"
  | "boletin"
  | "general";

export interface CreateNotificationInput {
  usuarioId: string;
  tipo: NotificationType;
  titulo: string;
  mensaje: string;
  alumnoId?: string | null;
  asistenciaId?: string | null;
  justificacionId?: string | null;
  calificacionId?: string | null;
  comunicadoId?: string | null;
  href?: string;
}

async function pushNotification(input: CreateNotificationInput, id: string) {
  try {
    await sendPushToUser(input.usuarioId, {
      title: input.titulo,
      body: input.mensaje,
      url: input.href || "/notificaciones",
      tag: `${input.tipo}-${id}`,
    });
  } catch (error) {
    // La notificación interna no debe perderse si Web Push falla.
    console.error("Push no enviado, notificación interna guardada:", error);
  }
}

export async function createNotification(input: CreateNotificationInput) {
  await connectDB();

  const notification = await Notification.create({
    ...input,
    href: input.href || "/notificaciones",
    leida: false,
  });

  await pushNotification(input, String(notification._id));
  return notification;
}

export async function upsertNotification(
  filter: Record<string, unknown>,
  input: CreateNotificationInput
) {
  await connectDB();

  const notification = await Notification.findOneAndUpdate(
    filter,
    {
      $set: {
        ...input,
        href: input.href || "/notificaciones",
        leida: false,
      },
    },
    { upsert: true, new: true, runValidators: true }
  );

  await pushNotification(input, String(notification._id));
  return notification;
}
