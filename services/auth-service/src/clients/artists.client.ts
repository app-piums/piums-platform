const ARTISTS_SERVICE_URL = process.env.ARTISTS_SERVICE_URL || 'http://artists-service:4003';

export const artistsClient = {
  async getAuthIdsByCategory(category: string): Promise<string[]> {
    try {
      const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
      if (!internalSecret) return [];
      const res = await fetch(
        `${ARTISTS_SERVICE_URL}/artists/internal/auth-ids?category=${encodeURIComponent(category)}`,
        { headers: { 'x-internal-secret': internalSecret } }
      );
      if (!res.ok) return [];
      const data = await res.json() as { authIds: string[] };
      return data.authIds ?? [];
    } catch {
      return [];
    }
  },

  async getCategoryStats(): Promise<Record<string, number>> {
    try {
      const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
      if (!internalSecret) return {};
      const res = await fetch(
        `${ARTISTS_SERVICE_URL}/artists/internal/stats`,
        { headers: { 'x-internal-secret': internalSecret } }
      );
      if (!res.ok) return {};
      const data = await res.json() as { byCategory: Record<string, number> };
      return data.byCategory ?? {};
    } catch {
      return {};
    }
  },

  async setActive(authId: string, isActive: boolean): Promise<boolean> {
    try {
      const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
      if (!internalSecret) return false;
      const res = await fetch(
        `${ARTISTS_SERVICE_URL}/artists/internal/by-auth/${authId}/active`,
        {
          method: 'PATCH',
          headers: { 'x-internal-secret': internalSecret, 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive }),
        }
      );
      return res.ok;
    } catch {
      return false;
    }
  },

  async shadowBan(authId: string, banned: boolean, reason?: string): Promise<boolean> {
    try {
      const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
      if (!internalSecret) return false;
      const res = await fetch(
        `${ARTISTS_SERVICE_URL}/artists/internal/by-auth/${authId}/shadow-ban`,
        {
          method: 'PATCH',
          headers: { 'x-internal-secret': internalSecret, 'Content-Type': 'application/json' },
          body: JSON.stringify({ banned, reason }),
        }
      );
      return res.ok;
    } catch {
      return false;
    }
  },

  async getByIds(ids: string[]): Promise<Array<{ id: string; authId: string; nombre: string; category: string }>> {
    try {
      const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
      if (!internalSecret || ids.length === 0) return [];
      const res = await fetch(
        `${ARTISTS_SERVICE_URL}/artists/internal/by-ids`,
        {
          method: 'POST',
          headers: { 'x-internal-secret': internalSecret, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        }
      );
      if (!res.ok) return [];
      const data = await res.json() as { artists: Array<{ id: string; authId: string; nombre: string; category: string }> };
      return data.artists ?? [];
    } catch {
      return [];
    }
  },
};
