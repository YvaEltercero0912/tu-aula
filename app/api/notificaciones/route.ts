import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";
import Notification from "@/models/Notification";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const soloNoLeidas = searchParams.get("noLeidas") === "1";
    const limite = Math.min(
      Math.max(Number(searchParams.get("limite") || 40), 1),
      100
    );

    await connectDB();

    const filtro: Record<string, unknown> = { usuarioId: user.id };
    if (soloNoLeidas) filtro.leida = false;

    const [notificaciones, noLeidas] = await Promise.all([
      Notification.find(filtro)
        .sort({ createdAt: -1 })
        .limit(limite)
        .lean(),
      Notification.countDocuments({
        usuarioId: user.id,
        leida: false,
      }),
    ]);

    return NextResponse.json({ ok: true, notificaciones, noLeidas });
  } catch {
    return NextResponse.json(
      { ok: false, message: "No se pudieron obtener las notificaciones." },
      { status: 401 }
    );
  }
}

export async function PATCH() {
  try {
    const user = await requireUser();
    await connectDB();

    await Notification.updateMany(
      { usuarioId: user.id, leida: false },
      { $set: { leida: true } }
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}
