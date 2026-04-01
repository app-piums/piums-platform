import { Router } from "express";
import { 
  register, 
  registerArtist,
  registerClient,
  login, 
  refreshToken, 
  verify,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  resendVerification,
  logout,
  getMe,
  updateProfile,
  firebaseLogin,
} from "../controller/auth.controller";
import { isAdmin } from "../middleware/isAdmin";
import { authenticate } from "../middleware/authenticate";
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
router.post("/register/artist", registerLimiter, registerArtist);
router.post("/register/client", registerLimiter, registerClient);
router.post("/login", loginLimiter, login);
router.post("/firebase", loginLimiter, firebaseLogin);
router.post("/refresh", refreshTokenLimiter, refreshToken);
router.post("/verify", verify);
router.post("/logout", logout);

// Password reset
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/reset-password", resetPasswordLimiter, resetPassword);
router.post("/change-password", authenticate, changePassword); // Requiere autenticación

// Email verification
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationLimiter, resendVerification);

// Get current authenticated user (any authenticated user)
router.get("/me", authenticate, getMe);
router.patch("/profile", authenticate, updateProfile);

export default router;

