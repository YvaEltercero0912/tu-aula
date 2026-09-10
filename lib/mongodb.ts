import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Falta la variable MONGODB_URI en .env.local");
}

const mongoUri: string = MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache =
  global.mongooseCache || {
    conn: null,
    promise: null,
  };

if (process.env.NODE_ENV !== "production") {
  global.mongooseCache = cached;
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoUri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log("MongoDB conectado correctamente");
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error("Error conectando MongoDB:", error);
    throw error;
  }
}
