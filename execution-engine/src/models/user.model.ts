import { Schema, model } from "mongoose";

const ApiWalletSchema = new Schema({
  address: { type: String, required: true },
  privateKey: { type: String, required: true },
}, { _id: false });

const UserSchema = new Schema({
  uniqueWalletId: { type: String, required: true, unique: true },
  walletAddress: { type: String, required: true, unique: true },
  apiWallet: { type: ApiWalletSchema, required: true },
  signature: String,
  agentSquadDetails: [{ type: String }],
  isAutonomousActive: { type: Boolean, default: false },
  totalPnL: { type: Number, default: 0 },
  createdAt: Date,
  lastLoginAt: Date,
});

export const User = model("User", UserSchema);
