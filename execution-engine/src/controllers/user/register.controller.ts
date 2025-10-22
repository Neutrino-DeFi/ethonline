import { Request, Response } from "express";
import { User } from "../../models/user.model";

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

/**
 * @swagger
 * /api/v1/user/register:
 *   post:
 *     summary: Register or retrieve an existing user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uniqueWalletId
 *               - walletAddress
 *             properties:
 *               uniqueWalletId:
 *                 type: string
 *               walletAddress:
 *                 type: string
 *     responses:
 *       200:
 *         description: User retrieved or created successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
export const registerUser = async (req: Request, res: Response) => {
  // try {
  //   const authHeader = req.headers.authorization || "";
  //   const token = authHeader.replace("Bearer ", "");

  //   // ✅ Verify the Privy token
  //   const verifiedUser = await privy.verifyAuthToken(token);

  //   // You now have a secure user object
  //   console.log("Authenticated user:", verifiedUser);

  //   // Example secure action
  //   // res.json({
  //   //   message: "Secure action complete",
  //   //   user: verifiedUser,
  //   // });
  // } catch (err) {
  //   console.error(err);
  //   res.status(401).json({ error: "Unauthorized" });
  // }

  try {
    const { uniqueWalletId, walletAddress } = req.body;

    if (!uniqueWalletId || !walletAddress) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if user already exists
    let existingUser = await User.findOne({ uniqueWalletId });

    if (existingUser) {
      // Update last login timestamp
      existingUser.lastLoginAt = new Date();
      await existingUser.save();
      return res.status(200).json(existingUser);
    }

    // Create new user
    const newUser = new User({
      uniqueWalletId,
      walletAddress,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    });

    const savedUser = await newUser.save();
    return res.status(201).json(savedUser);
  } catch (err: any) {
    console.error("Error registering user:", err);
    return res.status(500).json({ error: err.message });
  }
};
