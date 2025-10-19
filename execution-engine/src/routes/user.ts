import { Router } from "express";
import { registerUser } from "../controllers/user.controller";
import { getUserByWalletId } from "../controllers/getUserByWalletId.controller";

const router = Router();

router.post("/register", registerUser);
router.get("/:uniqueWalletId", getUserByWalletId);

export default router;
