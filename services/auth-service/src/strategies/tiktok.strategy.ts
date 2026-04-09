import crypto from 'crypto';
import axios from 'axios';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

const TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/';
const TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
const TIKTOK_USER_URL = 'https://open.tiktokapis.com/v2/user/info/';

// ─── PKCE helpers ─────────────────────────────────────────────────────────────

function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

// ─── Auth URL builder ─────────────────────────────────────────────────────────

export function buildTikTokAuthUrl(session: Record<string, any>): string {
  if (!process.env.TIKTOK_CLIENT_KEY) {
    throw new Error('TIKTOK_CLIENT_KEY not configured');
  }

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = crypto.randomBytes(16).toString('hex');

  session.tiktokCodeVerifier = codeVerifier;
  session.tiktokState = state;

  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY,
    scope: 'user.info.basic',
    response_type: 'code',
    redirect_uri: process.env.TIKTOK_CALLBACK_URL || 'http://localhost:4001/auth/tiktok/callback',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return `${TIKTOK_AUTH_URL}?${params.toString()}`;
}

// ─── Token exchange ────────────────────────────────────────────────────────────

export async function exchangeTikTokCode(code: string, codeVerifier: string): Promise<string> {
  if (!process.env.TIKTOK_CLIENT_KEY || !process.env.TIKTOK_CLIENT_SECRET) {
    throw new Error('TikTok credentials not configured');
  }

  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY,
    client_secret: process.env.TIKTOK_CLIENT_SECRET,
    code,
    grant_type: 'authorization_code',
    redirect_uri: process.env.TIKTOK_CALLBACK_URL || 'http://localhost:4001/auth/tiktok/callback',
    code_verifier: codeVerifier,
  });

  const response = await axios.post(TIKTOK_TOKEN_URL, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (response.data.error) {
    throw new Error(`TikTok token exchange failed: ${response.data.error_description || response.data.error}`);
  }

  return response.data.access_token as string;
}

// ─── User info ─────────────────────────────────────────────────────────────────

export interface TikTokUserInfo {
  openId: string;
  unionId: string;
  displayName: string;
  avatarUrl: string;
}

export async function getTikTokUser(accessToken: string): Promise<TikTokUserInfo> {
  const response = await axios.get(TIKTOK_USER_URL, {
    params: { fields: 'open_id,union_id,avatar_url,display_name' },
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const user = response.data?.data?.user;
  if (!user || !user.open_id) {
    throw new Error('Could not retrieve TikTok user info');
  }

  return {
    openId: user.open_id,
    unionId: user.union_id ?? '',
    displayName: user.display_name ?? 'Usuario TikTok',
    avatarUrl: user.avatar_url ?? '',
  };
}

// ─── Find or create user ───────────────────────────────────────────────────────

export async function findOrCreateTikTokUser(tiktokUser: TikTokUserInfo) {
  // Look up by tiktokId first
  let user = await (prisma as any).user.findFirst({
    where: { tiktokId: tiktokUser.openId },
  });

  if (user) {
    logger.info('User logged in via TikTok', 'TIKTOK_OAUTH', { userId: user.id });
    return user;
  }

  // TikTok does not provide email — use synthetic identifier
  const syntheticEmail = `tiktok.${tiktokUser.openId}@piums.tiktok`;

  // Check if a user with that synthetic email already exists
  user = await (prisma as any).user.findUnique({ where: { email: syntheticEmail } });

  if (!user) {
    user = await (prisma as any).user.create({
      data: {
        email: syntheticEmail,
        nombre: tiktokUser.displayName,
        name: tiktokUser.displayName,
        avatar: tiktokUser.avatarUrl || null,
        provider: 'tiktok',
        tiktokId: tiktokUser.openId,
        emailVerified: true,
        isVerified: false,
        role: 'user',
      },
    });
    logger.info('New user created via TikTok', 'TIKTOK_OAUTH', { userId: user.id });
  } else {
    // Attach tiktokId to existing account
    user = await (prisma as any).user.update({
      where: { id: user.id },
      data: { tiktokId: tiktokUser.openId, provider: 'tiktok' },
    });
  }

  return user;
}
