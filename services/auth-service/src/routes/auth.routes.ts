import { Router } from "express";
import { 
  register, 
  login, 
  refreshToken, 
  verify,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  resendVerification,
  logout
} from "../controller/auth.controller";
import { 
  loginLimiter, 
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  resendVerificationLimiter,
  refreshTokenLimiter
} from "../middleware/rateLimiter";

const router = Router();

// Autenticación básica
router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/refresh", refreshTokenLimiter, refreshToken);
router.post("/verify", verify);
router.post("/logout", logout);

// Password reset
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/reset-password", resetPasswordLimiter, resetPassword);
router.post("/change-password", changePassword); // Requiere autenticación

// Email verification
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationLimiter, resendVerification);

export default router;

