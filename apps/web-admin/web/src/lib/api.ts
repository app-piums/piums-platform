/**
 * Admin API client — thin wrapper over fetch that always sends credentials
 * and attaches the stored JWT from sessionStorage (set on login).
 */

const API_BASE = "/api";

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
    throw new Error(body?.message ?? `HTTP ${res.status}`);
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

  verify: (id: string, approved: boolean) =>
    request<{ message: string; isVerified: boolean }>(`/admin/artists/${id}/verify`, {
      method: "PATCH",
      body: JSON.stringify({ approved }),
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
  reporterNombre: string;
  reporterEmail: string;
  targetType: "user" | "artist" | "booking";
  targetId: string;
  motivo: string;
  descripcion: string;
  estado: "pending" | "resolved" | "dismissed";
  createdAt: string;
  resolvedAt?: string;
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
    return request<PaginatedReports>(`/admin/reports${qs ? `?${qs}` : ""}`);
  },

  resolve: (id: string, action: "resolved" | "dismissed", notes?: string) =>
    request<{ message: string }>(`/admin/reports/${id}/resolve`, {
      method: "PATCH",
      body: JSON.stringify({ action, notes }),
    }),
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
