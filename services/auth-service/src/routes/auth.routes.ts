import { Router } from "express";
import { register, login, refreshToken } from "../controller/auth.controller";
import { loginLimiter, registerLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/refresh", refreshToken);

export default router;
