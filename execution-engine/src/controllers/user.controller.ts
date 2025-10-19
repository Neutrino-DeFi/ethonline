import { Request, Response } from "express";
import { User } from "../models/user.model";

// import { PrivyClient } from "@privy-io/node";
import { PrivyClient } from "@privy-io/server-auth";

// const privy = new PrivyClient({
//   appId: process.env["NEXT_PUBLIC_PRIVY_APP_ID"] || "",
//   appSecret: process.env["NEXT_PUBLIC_PRIVY_APP_SECRET"] || "",
// });
const privy = new PrivyClient(
  process.env["NEXT_PUBLIC_PRIVY_APP_ID"] || "",
  process.env["NEXT_PUBLIC_PRIVY_APP_SECRET"] || ""
);

export const registerUser = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");

    // ✅ Verify the Privy token
    const verifiedUser = await privy.verifyAuthToken(token);

    // You now have a secure user object
    console.log("Authenticated user:", verifiedUser);

    // Example secure action
    // res.json({
    //   message: "Secure action complete",
    //   user: verifiedUser,
    // });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Unauthorized" });
  }

  const { uniqueWalletId, walletAddress } =
    req.body; // did:privy:cmgo0862z03fml50c5bushsec, walletAddress

  const newUser = new User({
    uniqueWalletId,
    walletAddress,
    createdAt: new Date(),
    lastLoginAt: new Date(),
  });

  newUser
    .save()
    .then((user) => res.status(201).json(user))
    .catch((err) => res.status(500).json({ error: err.message }));
};
