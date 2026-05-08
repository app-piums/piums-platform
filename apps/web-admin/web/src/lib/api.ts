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
  revenueByMonth: { month: string; amount: number }[];
  usersByMonth: { month: string; count: number }[];
  artistsByCategory: { category: string; count: number }[];
  topArtists: { artistId: string; nombre: string; bookings: number; revenue: number }[];
  conversionFunnel: { totalUsers: number; totalArtists: number; verifiedArtists: number };
}

export const statsApi = {
  get: (period?: string) =>
    request<AdminStats>(`/admin/stats${period ? `?period=${period}` : ""}`),
};

// ─── Users ───────────────────────────────────────────────────────────────────

export interface AdminUserRow {
  id: string;
  nombre: string;
  email: string;
  role: string;
  provider?: string;
  isBlocked: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
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
  list: (params: { page?: number; limit?: number; search?: string; role?: string; provider?: string; category?: string }) => {
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

  delete: (id: string) =>
    request<{ message: string; id: string }>(`/admin/users/${id}`, {
      method: "DELETE",
    }),

  exportCSV: async (params: { role?: string; provider?: string; search?: string; category?: string }) => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)])
    ).toString();

    const token = typeof window !== "undefined" ? sessionStorage.getItem("admin_token") : null;
    const res = await fetch(`${API_BASE}/admin/users/export${qs ? `?${qs}` : ""}`, {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, body?.message ?? `HTTP ${res.status}`);
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `usuarios-piums-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
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
  ciudad?: string;
  location?: string;
  isBlocked?: boolean;
  reviewsCount?: number;
  // Identity & OAuth
  emailVerified?: boolean;
  provider?: string;
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
  // Shadow ban
  shadowBannedAt?: string | null;
  shadowBanReason?: string | null;
  authId?: string;
}

export interface CommissionRule {
  id: string;
  artistId: string;
  type: "RATE_OVERRIDE" | "FIXED_PENALTY";
  rate?: number | null;
  fixedAmount?: number | null;
  currency: string;
  reason: string;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  createdByAdminId: string;
  createdAt: string;
}

export interface AdminPayout {
  id: string;
  artistId: string;
  bookingId?: string | null;
  amount: number;
  currency: string;
  status: string;
  commissionRate?: number | null;
  platformFee?: number | null;
  netAmount?: number | null;
  transferReference?: string | null;
  completedByAdmin?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  // enriched by backend
  artistName?: string;
  bookingCode?: string;
}

export interface PaginatedArtists {
  artists: AdminArtistRow[];
  total: number;
  page: number;
  totalPages: number;
}

export const artistsApi = {
  list: (params: { page?: number; limit?: number; verified?: string; search?: string; category?: string }) => {
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

  shadowBan: (authId: string, banned: boolean, reason?: string) =>
    request<{ success: boolean; banned: boolean }>(`/admin/artists/${authId}/shadow-ban`, {
      method: "PATCH",
      body: JSON.stringify({ banned, reason }),
    }),
};

// ─── User Identity Verification ──────────────────────────────────────────────

export interface PendingVerificationUser {
  id: string;
  nombre: string;
  email: string;
  role: string;
  provider?: string;
  createdAt: string;
  documentType?: string;
  documentNumber?: string;
  documentFrontUrl?: string;
  documentBackUrl?: string;
  documentSelfieUrl?: string;
}

export interface PendingVerificationsResponse {
  users: PendingVerificationUser[];
  total: number;
  page: number;
  totalPages: number;
}

export const verificationsApi = {
  listPending: (params?: { page?: number; limit?: number }) => {
    const qs = new URLSearchParams(
      Object.entries(params ?? {})
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return request<PendingVerificationsResponse>(`/admin/users/pending-verification${qs ? `?${qs}` : ""}`);
  },

  verify: (id: string, approved: boolean, rejectionReason?: string) =>
    request<{ success: boolean; isVerified: boolean }>(`/admin/users/${id}/verify`, {
      method: "PATCH",
      body: JSON.stringify({ approved, rejectionReason }),
    }),
};

// ─── Commission Rules ─────────────────────────────────────────────────────────

export const commissionsApi = {
  list: (params?: { artistId?: string; isActive?: boolean }) => {
    const qs = new URLSearchParams(
      Object.entries(params ?? {})
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return request<{ success: boolean; data: CommissionRule[] }>(`/admin/commission-rules${qs ? `?${qs}` : ""}`);
  },

  create: (data: {
    artistId: string;
    type: "RATE_OVERRIDE" | "FIXED_PENALTY";
    rate?: number;
    fixedAmount?: number;
    currency?: string;
    reason: string;
    startDate: string;
    endDate?: string;
  }) =>
    request<{ success: boolean; data: CommissionRule }>("/admin/commission-rules", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ─── Payouts ─────────────────────────────────────────────────────────────────

export const payoutsApi = {
  list: (params?: { status?: string; artistId?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams(
      Object.entries(params ?? {})
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return request<{ payouts?: AdminPayout[]; data?: AdminPayout[]; total?: number }>(`/admin/payouts${qs ? `?${qs}` : ""}`);
  },

  complete: (id: string, transferReference: string) =>
    request<{ success: boolean; data: AdminPayout }>(`/admin/payouts/${id}/complete`, {
      method: "PATCH",
      body: JSON.stringify({ transferReference }),
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

export interface BookingStatusHistory {
  id: string;
  status: string;
  changedAt: string;
  notes?: string;
}

export interface AdminBookingDetail extends AdminBookingRow {
  clientePhone: string | null;
  artistaEmail: string;
  estadoLabel: string;
  montoDecimal: number | null;
  serviceId: string;
  scheduledDate: string;
  scheduledTime: string | null;
  duration: number | null;
  notes: string | null;
  location: string | null;
  paymentStatus: string | null;
  totalPrice: number | null;
  status: string;
  statusHistory: BookingStatusHistory[];
}

export interface PaginatedBookings {
  bookings: AdminBookingRow[];
  total: number;
  page: number;
  totalPages: number;
}

export const bookingsApi = {
  list: (params: { page?: number; limit?: number; estado?: string; search?: string; dateFrom?: string; dateTo?: string }) => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k === "estado" ? "status" : k, String(v)])
    ).toString();
    return request<PaginatedBookings>(`/admin/bookings${qs ? `?${qs}` : ""}`);
  },
  getById: (id: string) => request<AdminBookingDetail>(`/admin/bookings/${id}`),
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

// ─── Credits ─────────────────────────────────────────────────────────────────

export interface AdminCreditRow {
  id: string;
  userId: string;
  bookingId?: string | null;
  amount: number;
  currency: string;
  status: "ACTIVE" | "USED" | "EXPIRED" | "CANCELLED";
  reason: string;
  expiresAt: string;
  usedAt?: string | null;
  usedInBookingId?: string | null;
  createdAt: string;
}

export interface PaginatedCredits {
  credits: AdminCreditRow[];
  total: number;
  page: number;
  totalPages: number;
}

export const creditsApi = {
  list: (params?: { status?: string; userId?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams(
      Object.entries(params ?? {})
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return request<{ success: boolean; data: PaginatedCredits }>(`/credits/admin${qs ? `?${qs}` : ""}`);
  },

  cancel: (id: string) =>
    request<{ success: boolean; data: AdminCreditRow }>(`/credits/admin/cancel/${id}`, {
      method: "POST",
    }),
};

// ─── Analytics (booking funnel) ─────────────────────────────────────────────

export interface FunnelStep {
  step: string;
  entered: number;
  completed: number;
  abandoned: number;
  conversionRate: number;
}

export interface BookingFunnelData {
  steps: FunnelStep[];
  totalSessions: number;
  totalCompleted: number;
  overallConversionRate: number;
  period: string;
}

export const analyticsApi = {
  getFunnel: (days?: number) =>
    request<BookingFunnelData>(`/analytics/funnel${days ? `?days=${days}` : ''}`),
};

// ─── Coupons ─────────────────────────────────────────────────────────────────

export interface AdminCoupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  currency: string;
  maxUses?: number;
  maxUsesPerUser: number;
  currentUses: number;
  validationCount?: number;
  targetType: 'GLOBAL' | 'ARTIST' | 'CLIENT' | 'SERVICE';
  targetId?: string;
  minimumAmount?: number;
  maxDiscountAmount?: number;
  status: 'ACTIVE' | 'PAUSED' | 'EXPIRED';
  startsAt: string;
  expiresAt?: string;
  createdAt: string;
}

export const couponsApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.status) qs.set('status', params.status);
    return request<{ coupons: AdminCoupon[]; total: number; page: number; totalPages: number }>(`/coupons?${qs}`);
  },
  get: (id: string) => request<{ coupon: AdminCoupon }>(`/coupons/${id}`),
  create: (data: Partial<AdminCoupon>) =>
    request<{ coupon: AdminCoupon }>('/coupons', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<AdminCoupon>) =>
    request<{ coupon: AdminCoupon }>(`/coupons/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ message: string }>(`/coupons/${id}`, { method: 'DELETE' }),
  sendEmail: (id: string, email: string, recipientName: string) =>
    request<{ message: string }>(`/coupons/${id}/send-email`, {
      method: 'POST',
      body: JSON.stringify({ email, recipientName }),
    }),
  bulkGenerate: (data: { prefix: string; count: number; template: Partial<AdminCoupon> }) =>
    request<{ ok: boolean; count: number; coupons: { code: string; name: string }[] }>('/coupons/bulk-generate', {
      method: 'POST',
      body: JSON.stringify(data),
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
  list: (params: {
    page?: number;
    limit?: number;
    status?: string;
    disputeType?: string;
    reportedAgainst?: string;
  }) => {
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
