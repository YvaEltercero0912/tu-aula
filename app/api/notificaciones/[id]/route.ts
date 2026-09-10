import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";
import Notification from "@/models/Notification";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    await connectDB();

    const notificacion = await Notification.findOneAndUpdate(
      { _id: id, usuarioId: user.id },
      { $set: { leida: body?.leida !== false } },
      { new: true }
    ).lean();

    if (!notificacion) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    return NextResponse.json({ ok: true, notificacion });
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}
