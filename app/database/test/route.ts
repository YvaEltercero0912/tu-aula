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
    console.error("ERROR COMPLETO MONGODB:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Error conectando con MongoDB",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}