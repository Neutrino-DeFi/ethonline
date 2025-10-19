import { Schema, model } from "mongoose";

const UserSchema = new Schema({
  uniqueWalletId: { type: String, required: true, unique: true },
  walletAddress: { type: String, required: true, unique: true },
  signature: String,
  agentSquadDetails: [{ type: String }],
  isAutonomousActive: { type: Boolean, default: false },
  totalPnL: { type: Number, default: 0 },
  createdAt: Date,
  lastLoginAt: Date,
});

export const User = model("User", UserSchema);
