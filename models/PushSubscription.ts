import mongoose, { Schema, models } from "mongoose";

const PushSubscriptionSchema = new Schema(
  {
    usuarioId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      unique: true,
    },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userAgent: {
      type: String,
      trim: true,
      default: "",
    },
    activo: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

PushSubscriptionSchema.index({ usuarioId: 1, activo: 1 });

export default models.PushSubscription ||
  mongoose.model("PushSubscription", PushSubscriptionSchema);
