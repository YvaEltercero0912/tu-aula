import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";
import PushSubscription from "@/models/PushSubscription";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const endpoint = String(body?.endpoint || "").trim();
    const p256dh = String(body?.keys?.p256dh || "").trim();
    const auth = String(body?.keys?.auth || "").trim();

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        { ok: false, message: "Suscripción push inválida." },
        { status: 400 }
      );
    }

    await connectDB();

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        $set: {
          usuarioId: user.id,
          endpoint,
          keys: { p256dh, auth },
          userAgent: request.headers.get("user-agent") || "",
          activo: true,
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST push subscription:", error);
    return NextResponse.json(
      { ok: false, message: "No se pudo activar este dispositivo." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));
    const endpoint = String(body?.endpoint || "").trim();

    await connectDB();

    await PushSubscription.deleteMany({
      usuarioId: user.id,
      ...(endpoint ? { endpoint } : {}),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE push subscription:", error);
    return NextResponse.json(
      { ok: false, message: "No se pudo desactivar este dispositivo." },
      { status: 500 }
    );
  }
}
