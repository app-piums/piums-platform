// Mock Data para el Dashboard de Artista
// Este archivo proporciona datos de ejemplo mientras configuramos los servicios backend

import { Booking } from '@piums/sdk';

export const mockArtistStats = {
  artistId: "user_1773073563803",
  bookings: {
    total: 156,
    thisMonth: 12,
    pending: 3,
    confirmed: 8,
    completed: 145,
  },
  revenue: {
    total: 12450,
    thisMonth: 2340,
    currency: "GTQ",
  },
  rating: {
    average: 4.8,
    totalReviews: 89,
  },
  profileViews: 1200,
  profileViewsGrowth: 8, // porcentaje
  earningsGrowth: 12.5, // porcentaje
  profileStrength: 85, // porcentaje
  upcomingBookings: [
    {
      id: "booking_001",
      code: "PRS-2026-001",
      serviceId: "service_photo_001",
      clientId: "client_001",
      artistId: "user_1773073563803",
      scheduledDate: "2026-10-11T10:00:00.000Z",
      durationMinutes: 45,
      location: "Studio B",
      status: "CONFIRMED",
      servicePrice: 130,
      addonsPrice: 20,
      totalPrice: 150,
      currency: "GTQ",
      depositRequired: true,
      depositAmount: 50,
      depositPaidAt: "2026-03-08T10:00:00.000Z",
      paymentStatus: "DEPOSIT_PAID",
      clientNotes: "Product shoot for studio B",
      artistNotes: "Prepare equipment checklist for 10:00 AM session",
      createdAt: "2026-03-08T10:00:00.000Z",
      updatedAt: "2026-03-08T10:00:00.000Z",
    },
    {
      id: "booking_002",
      code: "WED-2026-002",
      serviceId: "service_music_001",
      clientId: "client_002",
      artistId: "user_1773073563803",
      scheduledDate: "2026-10-15T18:00:00.000Z",
      durationMinutes: 240,
      location: "Grand Hotel Ballroom",
      status: "CONFIRMED",
      servicePrice: 700,
      addonsPrice: 100,
      totalPrice: 800,
      currency: "GTQ",
      depositRequired: true,
      depositAmount: 200,
      depositPaidAt: "2026-03-05T10:00:00.000Z",
      paymentStatus: "DEPOSIT_PAID",
      clientNotes: "Wedding reception performance",
      artistNotes: "Set up equipment 2 hours before event",
      createdAt: "2026-03-05T10:00:00.000Z",
      updatedAt: "2026-03-05T10:00:00.000Z",
    },
    {
      id: "booking_003",
      code: "COR-2026-003",
      serviceId: "service_music_002",
      clientId: "client_003",
      artistId: "user_1773073563803",
      scheduledDate: "2026-10-22T19:00:00.000Z",
      durationMinutes: 240,
      location: "Downtown Convention Center",
      status: "PENDING",
      servicePrice: 850,
      addonsPrice: 100,
      totalPrice: 950,
      currency: "GTQ",
      depositRequired: true,
      paymentStatus: "PENDING",
      clientNotes: "Corporate event DJ set",
      artistNotes: "Awaiting final playlist approval",
      createdAt: "2026-03-07T10:00:00.000Z",
      updatedAt: "2026-03-09T10:00:00.000Z",
    },
    {
      id: "booking_004",
      code: "BIR-2026-004",
      serviceId: "service_music_003",
      clientId: "client_004",
      artistId: "user_1773073563803",
      scheduledDate: "2026-10-28T20:00:00.000Z",
      durationMinutes: 300,
      location: "Private Residence",
      status: "CONFIRMED",
      servicePrice: 500,
      addonsPrice: 100,
      totalPrice: 600,
      currency: "GTQ",
      depositRequired: true,
      depositAmount: 150,
      depositPaidAt: "2026-03-04T10:00:00.000Z",
      paymentStatus: "DEPOSIT_PAID",
      clientNotes: "Birthday party celebration",
      artistNotes: "Latin music mix requested",
      createdAt: "2026-03-04T10:00:00.000Z",
      updatedAt: "2026-03-06T10:00:00.000Z",
    },
  ] as Booking[],
  revenueOverview: [
    { month: "JAN", value: 8500 },
    { month: "FEB", value: 7200 },
    { month: "MAR", value: 9800 },
    { month: "APR", value: 11200 },
    { month: "MAY", value: 13500 },
    { month: "JUN", value: 12450 },
    { month: "JUL", value: 0 }, // Future months
  ],
  profileCompletionTasks: [
    { task: "Add profile photo", completed: true },
    { task: "Complete bio", completed: true },
    { task: "Add portfolio images", completed: true },
    { task: "Set availability calendar", completed: true },
    { task: "Add payment methods", completed: false },
    { task: "Verify identity", completed: true },
    { task: "Add services & pricing", completed: true },
  ],
};

export const mockArtistProfile = {
  id: "artist_001",
  authId: "user_1773073563803",
  nombre: "Test Artist",
  email: "artisttest@example.com",
  categoria: "Músico/DJ",
  ciudad: "Ciudad de México",
  pais: "México",
  telefono: "+525551234567",
  descripcion: "Músico profesional con 10 años de experiencia en eventos corporativos y sociales.",
  imagenPerfil: null,
  rating: 4.8,
  reviewCount: 89,
  completedBookings: 145,
  responseTime: "< 2 horas",
  verified: true,
  createdAt: new Date("2024-01-15").toISOString(),
};

// Helper para simular delay de API
export const simulateApiDelay = (ms: number = 500) => 
  new Promise(resolve => setTimeout(resolve, ms));

// Helper para obtener stats mock
export const getMockArtistStats = async () => {
  await simulateApiDelay();
  return { stats: mockArtistStats };
};

// Helper para obtener perfil mock
export const getMockArtistProfile = async () => {
  await simulateApiDelay();
  return { artist: mockArtistProfile };
};
