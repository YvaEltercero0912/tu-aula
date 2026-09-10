import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getVapidKeys } from "@/lib/push";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireUser();
    const keys = await getVapidKeys();
    return NextResponse.json({ ok: true, publicKey: keys.publicKey });
  } catch (error) {
    console.error("GET push public key:", error);
    return NextResponse.json(
      { ok: false, message: "No se pudo preparar el servicio de notificaciones." },
      { status: 500 }
    );
  }
}
