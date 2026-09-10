import mongoose, { Schema, models } from "mongoose";

const SystemConfigSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

export default models.SystemConfig ||
  mongoose.model("SystemConfig", SystemConfigSchema);
