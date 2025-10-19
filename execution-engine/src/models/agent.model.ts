import { Schema, model } from "mongoose";

// base agent schema
const AgentSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true }, // e.g., sentiment, technical, fundamental
  prompt: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Agent = model("Agent", AgentSchema);
