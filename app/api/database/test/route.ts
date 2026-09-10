import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await connectDB();

    return NextResponse.json({
      ok: true,
      message: "MongoDB conectado correctamente",
      database: db.connection.name,
      estado: db.connection.readyState,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error desconocido";

    console.error("Error conectando con MongoDB:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Error conectando con MongoDB",
        detalle:
          process.env.NODE_ENV === "development"
            ? message
            : undefined,
      },
      { status: 500 }
    );
  }
}
