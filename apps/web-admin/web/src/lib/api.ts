/**
 * Admin API client — thin wrapper over fetch that always sends credentials
 * and attaches the stored JWT from sessionStorage (set on login).
 */

const API_BASE = "/api";

/** Typed API error that includes the HTTP status code for precise error UI. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("admin_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body?.message ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  nombre: string;
  email: string;
  role: "admin";
}

export interface LoginResponse {
  token: string;
  user: AdminUser;
}

export const authApi = {
  login: (email: string, password: string) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<{ user: AdminUser }>("/auth/me"),

  logout: () =>
    request("/auth/logout", { method: "POST" }),
};

// ─── Dashboard stats ─────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  totalArtists: number;
  totalBookings: number;
  totalRevenue: number;
  recentUsers: number;
  bookingsThisMonth: number;
  revenueThisMonth: number;
  pendingReports: number;
  bookingsByMonth: { month: string; count: number }[];
}

export const statsApi = {
  get: () => request<AdminStats>("/admin/stats"),
};

// ─── Users ───────────────────────────────────────────────────────────────────

export interface AdminUserRow {
  id: string;
  nombre: string;
  email: string;
  role: string;
  isBlocked: boolean;
  createdAt: string;
  pais?: string;
}

export interface PaginatedUsers {
  users: AdminUserRow[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AdminUserDetail extends AdminUserRow {
  telefono?: string;
  avatarUrl?: string;
}

export const usersApi = {
  list: (params: { page?: number; limit?: number; search?: string; role?: string }) => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return request<PaginatedUsers>(`/admin/users${qs ? `?${qs}` : ""}`);
  },

  detail: (id: string) => request<AdminUserDetail>(`/admin/users/${id}`),

  toggleBlock: (id: string) =>
    request<{ message: string; isBlocked: boolean }>(`/admin/users/${id}/block`, {
      method: "PATCH",
    }),
};

// ─── Artists ─────────────────────────────────────────────────────────────────

export interface AdminArtistRow {
  id: string;
  userId: string;
  nombre: string;
  email: string;
  nombreArtistico: string;
  categoria: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  rating?: number;
  totalBookings?: number;
}

export interface AdminArtistDetail extends AdminArtistRow {
  telefono?: string;
  avatarUrl?: string;
  bio?: string;
  pais?: string;
  location?: string;
  isBlocked?: boolean;
  reviewsCount?: number;
  // Identity & OAuth
  emailVerified?: boolean;
  provider?: string;           // 'email' | 'google' | 'facebook' | 'tiktok'
  hasGoogleId?: boolean;
  hasFacebookId?: boolean;
  hasTiktokId?: boolean;
  // Admin review
  rejectionReason?: string;
  adminNotes?: string;
  accountStatus?: string;
  lastLoginAt?: string;
  // Document verification
  documentType?: string;
  documentNumber?: string;
  documentFrontUrl?: string;
  documentBackUrl?: string;
  documentSelfieUrl?: string;
}

export interface PaginatedArtists {
  artists: AdminArtistRow[];
  total: number;
  page: number;
  totalPages: number;
}

export const artistsApi = {
  list: (params: { page?: number; limit?: number; verified?: string }) => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return request<PaginatedArtists>(`/admin/artists${qs ? `?${qs}` : ""}`);
  },

  detail: (id: string) => request<AdminArtistDetail>(`/admin/artists/${id}`),

  verify: (id: string, approved: boolean, opts?: { rejectionReason?: string; adminNotes?: string }) =>
    request<{ message: string; isVerified: boolean }>(`/admin/artists/${id}/verify`, {
      method: "PATCH",
      body: JSON.stringify({
        isVerified: approved,
        ...(opts?.rejectionReason ? { rejectionReason: opts.rejectionReason } : {}),
        ...(opts?.adminNotes !== undefined ? { adminNotes: opts.adminNotes } : {}),
      }),
    }),
};

// ─── Bookings ─────────────────────────────────────────────────────────────────

export interface AdminBookingRow {
  id: string;
  code?: string;           // Código PIU de la reserva (e.g. PIU-XXXX-XXXX)
  clienteNombre: string;
  clienteEmail: string;
  artistaNombre: string;
  servicio: string;
  fecha: string;
  estado: string;
  monto: number;
  createdAt: string;
}

export interface PaginatedBookings {
  bookings: AdminBookingRow[];
  total: number;
  page: number;
  totalPages: number;
}

export const bookingsApi = {
  list: (params: { page?: number; limit?: number; estado?: string; search?: string }) => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return request<PaginatedBookings>(`/admin/bookings${qs ? `?${qs}` : ""}`);
  },
};

// ─── Reports ─────────────────────────────────────────────────────────────────

export interface AdminReportRow {
  id: string;
  reviewId: string;
  reportedBy: string;  // userId del que reportó
  reason: string;     // SPAM | OFFENSIVE | INAPPROPRIATE | OTHER
  description?: string;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
  messages?: { id: string; message: string; senderType: string; createdAt: string }[];
  review?: {
    id: string;
    artistId: string;
    clientId: string;
    comment?: string;
    rating: number;
  };
}

export interface PaginatedReports {
  reports: AdminReportRow[];
  total: number;
  page: number;
  totalPages: number;
}

export const reportsApi = {
  list: (params: { page?: number; limit?: number; estado?: string }) => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return request<PaginatedReports>(`/reviews/admin/reports/pending${qs ? `?${qs}` : ""}`);
  },

  resolve: (id: string, action: "resolved" | "dismissed", notes?: string) =>
    request<{ message: string }>(`/reviews/admin/reports/${id}/resolve`, {
      method: "PATCH",
      body: JSON.stringify({ action, notes }),
    }),

  getMessages: (id: string) =>
    request<{ messages: { id: string; message: string; senderType: string; createdAt: string }[] }>(
      `/reviews/admin/reports/${id}/messages`
    ),

  addMessage: (id: string, message: string) =>
    request<{ id: string; message: string; senderType: string; createdAt: string }>(
      `/reviews/admin/reports/${id}/messages`,
      { method: "POST", body: JSON.stringify({ message }) }
    ),
};

// ─── Disputes (Quejas) ────────────────────────────────────────────────────────

export interface DisputeRow {
  id: string;
  bookingId: string;
  reportedBy: string;
  reportedAgainst?: string;
  disputeType: string;
  status: string;
  subject: string;
  description: string;
  priority: number;
  resolution?: string;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  refundAmount?: number;
  refundIssued?: boolean;
  createdAt: string;
  messages?: { id: string; message: string; createdAt: string }[];
}

export interface PaginatedDisputes {
  disputes: DisputeRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const disputesApi = {
  list: (params: { page?: number; limit?: number; status?: string }) => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return request<PaginatedDisputes>(`/disputes${qs ? `?${qs}` : ""}`);
  },

  getById: (id: string) =>
    request<DisputeRow>(`/disputes/${id}`),

  addMessage: (id: string, message: string) =>
    request<{ id: string; message: string; senderType: string; createdAt: string }>(
      `/disputes/${id}/messages`,
      { method: "POST", body: JSON.stringify({ message }) }
    ),

  updateStatus: (id: string, status: string, notes?: string) =>
    request<{ message: string; dispute: DisputeRow }>(`/disputes/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status, notes }),
    }),

  resolve: (id: string, resolution: string, resolutionNotes: string, refundAmount?: number) =>
    request<{ message: string; dispute: DisputeRow }>(`/disputes/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify({ resolution, resolutionNotes, refundAmount }),
    }),
};
