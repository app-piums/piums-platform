"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ClientSidebar from '@/components/ClientSidebar';
import { sdk } from '@piums/sdk';
import { ReviewModal } from '@/components/bookings/ReviewModal';

// ─── Mock data ────────────────────────────────────────────────────────────────
type BookingStatus = 'confirmed' | 'accepted' | 'pending' | 'completed' | 'cancelled' | 'rejected';

interface MockBooking {
  id: string;
  status: BookingStatus;
  title: string;
  artistName: string;
  imageUrl: string;
  price: number;
  priceLabel: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  location?: string;
  modality?: string;
  pendingNote?: string;
  cancelReason?: string;
  serviceId?: string;
  artistId?: string;
  reviewId?: string;
}

const BOOKINGS: MockBooking[] = [];

const STATS = [
  { label: 'Reservas Totales', value: 0, icon: BookIcon,        color: 'text-[#FF6A00] bg-orange-50' },
  { label: 'Próximas',         value: 0, icon: ClockIcon,       color: 'text-blue-600 bg-blue-50'   },
  { label: 'Pendientes',       value: 0, icon: BellIcon,        color: 'text-yellow-600 bg-yellow-50'},
  { label: 'Completadas',      value: 0, icon: CheckCircleIcon, color: 'text-green-600 bg-green-50' },
];

type TabKey = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'all',       label: 'Todas las reservas' },
  { key: 'pending',   label: 'Pendientes'         },
  { key: 'confirmed', label: 'Confirmadas'        },
  { key: 'completed', label: 'Completadas'        },
  { key: 'cancelled', label: 'Canceladas'         },
];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'Confirmada', className: 'bg-green-100 text-green-700'  },
  accepted:  { label: 'Aceptada',    className: 'bg-green-100 text-green-700'  },
  pending:   { label: 'Pendiente',  className: 'bg-yellow-100 text-yellow-700'},
  completed: { label: 'Completada', className: 'bg-blue-100 text-blue-700'   },
  cancelled: { label: 'Cancelada',  className: 'bg-red-100 text-red-600'     },
  rejected:  { label: 'Rechazada',  className: 'bg-red-100 text-red-600'     },
};

// ─── Booking card ─────────────────────────────────────────────────────────────
function BookingCard({ b, onReview }: { b: MockBooking, onReview: (b: MockBooking) => void }) {
  const cfg = STATUS_CONFIG[b.status];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row">
        <div className="relative sm:w-40 h-36 sm:h-auto shrink-0 bg-gray-100">
          <Image
            src={b.imageUrl}
            alt={b.title}
            width={320}
            height={192}
            className="w-full h-full object-cover"
          />
          <span className={`absolute top-2 left-2 text-[11px] font-bold px-2.5 py-1 rounded-full ${cfg?.className || 'bg-gray-100 text-gray-600'}`}>
            • {cfg?.label || b.status}
          </span>
        </div>
        <div className="flex-1 p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-gray-900 text-base leading-snug">{b.title}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="h-5 w-5 rounded-full bg-gradient-to-br from-[#FF6A00] to-pink-400 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {b.artistName.charAt(0)}
                </div>
                <span className="text-xs text-gray-500">con <span className="font-medium text-gray-700">{b.artistName}</span></span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-bold text-[#FF6A00]">${b.price.toFixed(2)}</p>
              <p className="text-[11px] text-gray-400">{b.priceLabel}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            <div className="flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-600">{b.date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ClockIcon2 className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-600">{b.timeStart} – {b.timeEnd}</span>
            </div>
            {b.location && (
              <div className="flex items-center gap-1.5">
                <PinIcon className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-xs text-gray-600">{b.location}</span>
              </div>
            )}
            {b.modality && (
              <div className="flex items-center gap-1.5">
                <VideoIcon className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-xs text-gray-600">{b.modality}</span>
              </div>
            )}
          </div>
          {b.pendingNote && (
            <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
              <InfoIcon className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-700 leading-relaxed">{b.pendingNote}</p>
            </div>
          )}
          {b.cancelReason && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <XCircleIcon className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 leading-relaxed">{b.cancelReason}</p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-auto pt-1">
            {(b.status === 'confirmed' || b.status === 'accepted') && (
              <>
                <Btn variant="primary-outline" icon={<ChatBubbleIcon className="h-4 w-4" />}>Mensaje al Artista</Btn>
                <Btn variant="ghost" href={`/bookings/${b.id}`}>Ver Detalles</Btn>
                {!b.reviewId && (
                  <Btn variant="ghost" className="bg-orange-50 !text-[#FF6A00]" icon={<StarIcon className="h-4 w-4" />} onClick={() => onReview(b)}>Reseñar</Btn>
                )}
              </>
            )}
            {b.status === 'pending' && (
              <>
                <Btn variant="primary-outline" icon={<ChatBubbleIcon className="h-4 w-4" />}>Mensaje al Artista</Btn>
                <Btn variant="ghost" href={`/bookings/${b.id}`}>Ver Detalles</Btn>
                <Btn variant="danger-ghost">Cancelar Solicitud</Btn>
              </>
            )}
            {b.status === 'completed' && (
              <>
                {!b.reviewId && (
                  <Btn 
                    variant="primary-solid" 
                    icon={<StarIcon className="h-4 w-4" />}
                    onClick={() => onReview(b)}
                  >
                    Dejar Reseña
                  </Btn>
                )}
                <Btn variant="ghost" href={`/bookings/${b.id}`}>Ver Recibo</Btn>
                  <Btn variant="ghost" className="ml-auto !text-[#FF6A00]" href={`/services/${b.serviceId || '1'}`} data-serviceid={b.serviceId}>Volver a reservar</Btn>
              </>
            )}
            {(b.status === 'cancelled' || b.status === 'rejected') && (
              <Btn variant="ghost" href={`/bookings/${b.id}`}>Ver Detalles</Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Btn({ children, variant = 'ghost', icon, href, className = '', onClick }: {
  children?: React.ReactNode;
  variant?: 'primary-solid' | 'primary-outline' | 'ghost' | 'danger-ghost';
  icon?: React.ReactNode;
  href?: string;
  className?: string;
  onClick?: () => void;
}) {
  const base = 'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all';
  const v: Record<string, string> = {
    'primary-solid':   'bg-[#FF6A00] text-white hover:bg-orange-600',
    'primary-outline': 'border border-[#FF6A00] text-[#FF6A00] hover:bg-orange-50',
    'ghost':           'text-gray-600 hover:bg-gray-100',
    'danger-ghost':    'text-red-500 hover:bg-red-50',
  };
  const cls = `${base} ${v[variant]} ${className}`;
  if (href) return <Link href={href} className={cls}>{icon}{children}</Link>;
  return <button className={cls} onClick={onClick}>{icon}{children}</button>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BookingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const userName = user?.nombre ?? user?.email ?? 'Usuario';
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');
  const [bookings, setBookings] = useState<MockBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(STATS);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<MockBooking | null>(null);

  const handleOpenReview = (b: MockBooking) => {
    setSelectedBooking(b);
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!selectedBooking) return;
    try {
      await sdk.createReview({
        bookingId: selectedBooking.id,
        rating,
        comment
      });
      setIsReviewModalOpen(false);
      setSelectedBooking(null);
      // Mark booking as reviewed locally
      setBookings(prev => prev.map(b =>
        b.id === selectedBooking.id ? { ...b, reviewId: 'submitted' } : b
      ));
      alert('¡Gracias por tu reseña!');
    } catch (error: any) {
      console.error('Error submitting review:', error);
      alert(error?.message || 'Error al enviar la reseña');
    }
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const data = await sdk.listBookings({ limit: 100 });
        const bookingsList = data?.bookings || [];

        if (Array.isArray(bookingsList)) {
          const mappedBookings: MockBooking[] = bookingsList.map((b: any) => {
            return {
              id: b.id,
              status: (b.status || '').toLowerCase() as BookingStatus,
              title: b.serviceName || 'Servicio Piums',
              artistName: b.artistName || 'Artista Piums',
              imageUrl: b.artistImage || 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&q=80',
              price: Number(b.totalPrice || 0),
              priceLabel: 'total',
              date: b.scheduledDate
                ? new Date(b.scheduledDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
                : '—',
              timeStart: b.scheduledDate
                ? new Date(b.scheduledDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                : '—',
              timeEnd: b.scheduledDate && b.durationMinutes
                ? new Date(new Date(b.scheduledDate).getTime() + b.durationMinutes * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                : '—',
              location: b.location,
              serviceId: b.serviceId,
              artistId: b.artistId,
              reviewId: b.reviewId || undefined,
            };
          });

          setBookings(mappedBookings);

          const newStats = [
            { label: 'Reservas Totales', value: mappedBookings.length,                                              icon: BookIcon,        color: 'text-[#FF6A00] bg-orange-50' },
            { label: 'Próximas',         value: mappedBookings.filter(b => b.status === 'confirmed').length,        icon: ClockIcon,       color: 'text-blue-600 bg-blue-50'   },
            { label: 'Pendientes',       value: mappedBookings.filter(b => b.status === 'pending').length,          icon: BellIcon,        color: 'text-yellow-600 bg-yellow-50'},
            { label: 'Completadas',      value: mappedBookings.filter(b => b.status === 'completed').length,        icon: CheckCircleIcon, color: 'text-green-600 bg-green-50' },
          ];
          setStats(newStats);
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading && user) {
      fetchBookings();
    }
  }, [authLoading, user]);

  const filtered = bookings.filter(b => {
    const matchTab = activeTab === 'all' || b.status === activeTab;
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) ||
                        b.artistName.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="flex min-h-screen bg-[#FAFAFA] overflow-x-hidden">
      <ClientSidebar userName={userName} />
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-4 flex items-center justify-between gap-4 sticky top-0 z-30 mt-14 lg:mt-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mis Reservas</h1>
            <p className="text-sm text-gray-400 mt-0.5">Gestiona tus encuentros con el talento creativo.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Buscar reservas..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] transition w-56" />
            </div>
            <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <BellIcon className="h-5 w-5 text-gray-500" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-[#FF6A00] rounded-full" />
            </button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#FF6A00] to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <div className="flex-1 px-4 lg:px-6 py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-400 leading-tight">{label}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-0.5">
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? 'bg-[#FF6A00] text-white shadow-sm shadow-orange-200'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
          {/* Cards */}
          <div className="space-y-4">
            {loading ? (
              <div className="py-16 text-center text-gray-400">Cargando tus reservas...</div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 py-16 flex flex-col items-center gap-3 text-center">
                <BookIcon className="h-10 w-10 text-gray-200" />
                <p className="text-gray-500 font-medium">No se encontraron reservas</p>
                <Link href="/artists" className="text-sm text-[#FF6A00] hover:underline font-medium">Explorar artistas →</Link>
              </div>
            ) : (
              filtered.map(b => {
                console.log('RENDER BookingCard:', { id: b.id, serviceId: b.serviceId, title: b.title });
                return <BookingCard key={b.id} b={b} onReview={handleOpenReview} />;
              })
            )}
          </div>
        </div>
      </div>
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        artistName={selectedBooking?.artistName ?? ''}
        bookingCode={selectedBooking?.id.substring(0, 8).toUpperCase() ?? ''}
        onSubmit={handleReviewSubmit}
      />
    </div>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────────
function BookIcon({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>; }
function BellIcon({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>; }
function SearchIcon({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>; }
function CalendarIcon({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>; }
function ClockIcon({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function ClockIcon2({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function PinIcon({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>; }
function VideoIcon({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>; }
function InfoIcon({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function XCircleIcon({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function ChatBubbleIcon({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>; }
function StarIcon({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>; }
function CheckCircleIcon({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }

