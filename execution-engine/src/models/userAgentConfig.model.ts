import { Schema, model } from "mongoose";

const UserAgentConfigSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  strategyId: { type: Schema.Types.ObjectId, ref: "Strategy", required: true },
  agentId: { type: Schema.Types.ObjectId, ref: "Agent", required: true },
  votingPower: { type: Number, required: true },
  customPrompt: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const UserAgentConfig = model("UserAgentConfig", UserAgentConfigSchema);
