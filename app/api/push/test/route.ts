import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push";

export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await requireUser();
    const result = await sendPushToUser(user.id, {
      title: "Tu Aula",
      body: "Las notificaciones push funcionan correctamente en este dispositivo.",
      url: "/notificaciones",
      tag: `prueba-${Date.now()}`,
    });

    if (result.enviados === 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "No hay un dispositivo push activo para esta cuenta.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Notificación de prueba enviada.",
      ...result,
    });
  } catch (error) {
    console.error("POST push test:", error);
    return NextResponse.json(
      { ok: false, message: "No se pudo enviar la prueba." },
      { status: 500 }
    );
  }
}
