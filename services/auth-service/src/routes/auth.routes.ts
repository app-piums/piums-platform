import { Router } from "express";
import { register, login, refreshToken, verify } from "../controller/auth.controller";
import { loginLimiter, registerLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/refresh", refreshToken);
router.post("/verify", verify);

export default router;
