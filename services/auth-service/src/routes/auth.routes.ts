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
  completeOnboarding,
  registerFCMToken,
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
router.post("/firebase", refreshTokenLimiter, firebaseLogin);
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
router.patch("/complete-onboarding", authenticate, completeOnboarding);
router.patch("/fcm-token", authenticate, registerFCMToken);

// Internal endpoint — solo para llamadas inter-servicio con x-internal-secret
router.get("/internal/fcm-token/:userId", async (req, res) => {
  const secret = process.env.INTERNAL_SERVICE_SECRET;
  if (!secret || req.headers['x-internal-secret'] !== secret) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: { fcmToken: true },
    });
    await prisma.$disconnect();
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ fcmToken: user.fcmToken ?? null });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;

