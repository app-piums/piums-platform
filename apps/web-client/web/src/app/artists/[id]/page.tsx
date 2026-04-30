'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { cImg } from '@/lib/cloudinaryImg';
import { useParams, useRouter } from 'next/navigation';
import { Lightbox } from '@/components/Lightbox';
import { Loading } from '@/components/Loading';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle, CardContent } from '@/components/ui/Card';
import ClientSidebar from '@/components/ClientSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { ReportModal } from '@/components/ReportModal';
import type { ArtistProfile, Review, Service } from '@piums/sdk';
import { getMockArtist, getMockServices, getMockReviews } from '@/lib/mockData';
import { toast } from '@/lib/toast';

export default function ArtistProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const artistId = params.id as string;
  
  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState('');
  // Write-review form
  const [completedBookings, setCompletedBookings] = useState<{ id: string; code: string }[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewBookingId, setReviewBookingId] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'services' | 'portfolio' | 'reviews'>('services');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [hoveredServiceId, setHoveredServiceId] = useState<string | null>(null);
  const startingPrice = useMemo(() => {
    if (services.length > 0) {
      const validPrices = services
        .map((service) => (service.basePrice ?? 0) / 100)
        .filter((amount) => amount && amount > 0);
      if (validPrices.length) {
        return Math.min(...validPrices);
      }
    }

    if (artist?.hourlyRateMin) {
      return Math.round(artist.hourlyRateMin / 100);
    }

    return null;
  }, [services, artist?.hourlyRateMin]);

  const highlightedServiceName = useMemo(() => services[0]?.name ?? null, [services]);
  const tabItems: Array<{ key: typeof activeTab; label: string }> = [
    { key: 'services', label: 'Servicios' },
    { key: 'portfolio', label: 'Portafolio' },
    { key: 'reviews', label: 'Reseñas' },
    { key: 'about', label: 'Acerca de' },
  ];

  const loadArtistData = useCallback(async () => {
    try {
      setLoading(true);
      // Try API first, fall back to mock
      let artistData: ArtistProfile | null = null;
      let servicesData: Service[] = [];
      try {
        const { sdk } = await import('@piums/sdk');
        artistData = await sdk.getArtist(artistId);
        servicesData = await sdk.getArtistServices(artistId);
      } catch {
        artistData = getMockArtist(artistId);
        servicesData = getMockServices(artistId);
      }
      setArtist(artistData);
      setServices(servicesData);
    } catch (error) {
      console.error('Error loading artist:', error);
      setArtist(getMockArtist(artistId));
      setServices(getMockServices(artistId));
    } finally {
      setLoading(false);
    }
  }, [artistId]);

  useEffect(() => {
    loadArtistData();
  }, [loadArtistData]);

  const loadReviews = useCallback(async (page: number) => {
    try {
      setLoadingReviews(true);
      let reviewsData: Review[] = [];
      let total = 0;
      let totalPages = 1;
      try {
        const { sdk } = await import('@piums/sdk');
        const result = await sdk.getArtistReviews(artistId, page, 5);
        reviewsData = result.reviews;
        total = result.total;
        totalPages = result.totalPages;
      } catch {
        reviewsData = getMockReviews(artistId);
        total = reviewsData.length;
        totalPages = 1;
      }
      if (page === 1) {
        setReviews(reviewsData);
      } else {
        setReviews(prev => [...prev, ...reviewsData]);
      }
      setReviewsTotal(total);
      setReviewsPage(page);
      setReviewsTotalPages(totalPages);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  }, [artistId]);

  useEffect(() => {
    if (activeTab === 'reviews' && reviews.length === 0) {
      loadReviews(1);
    }
  }, [activeTab, loadReviews, reviews.length]);

  // Load completed bookings for this artist so the user can leave a review
  useEffect(() => {
    if (activeTab !== 'reviews' || !user) return;
    (async () => {
      try {
        const { sdk } = await import('@piums/sdk');
        const result = await sdk.listBookings({ status: 'COMPLETED', artistId, limit: 20 });
        const mapped = (result.bookings ?? []).map((b: any) => ({
          id: b.id,
          code: b.bookingCode ?? b.id.slice(0, 8),
        }));
        setCompletedBookings(mapped);
        if (mapped.length > 0) setReviewBookingId(mapped[0].id);
      } catch {
        // silently ignore — user may not be logged in or no bookings
      }
    })();
  }, [activeTab, artistId, user]);

  const handleSubmitReview = async () => {
    if (reviewRating === 0) return;
    if (!reviewBookingId) {
      setReviewError('Necesitas una reserva completada con este artista para dejar una reseña.');
      return;
    }
    const trimmedComment = reviewComment.trim();
    if (trimmedComment && trimmedComment.length < 3) {
      setReviewError('El comentario debe tener al menos 3 caracteres.');
      return;
    }
    try {
      setReviewSubmitting(true);
      setReviewError(null);
      const { sdk } = await import('@piums/sdk');
      await sdk.createReview({
        bookingId: reviewBookingId,
        rating: reviewRating,
        comment: trimmedComment || undefined,
      });
      setReviewSuccess(true);
      setShowReviewForm(false);
      setReviewComment('');
      setReviewRating(5);
      // Reload reviews
      setReviews([]);
      loadReviews(1);
    } catch (err: any) {
      setReviewError(err?.message ?? 'Error al enviar la reseña');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleLoadMoreReviews = () => {
    if (reviewsPage < reviewsTotalPages) {
      loadReviews(reviewsPage + 1);
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };
  const handleOpenReport = (reviewId: string) => {
    setSelectedReviewId(reviewId);
    setIsReportModalOpen(true);
  };

  const handleReportSubmit = async (reviewId: string, reason: string, description: string) => {
    try {
      const { sdk } = await import('@piums/sdk');
      await sdk.reportReview(reviewId, { reason, description });
      toast.success('Reporte enviado correctamente. Los administradores lo revisarán pronto.');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Error al enviar el reporte.');
    }
  };

  const nextImage = () => {
    if (artist?.portfolio && lightboxIndex < artist.portfolio.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  };

  const prevImage = () => {
    if (lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  const handleBookNow = () => {
    if (artist) {
      router.push(`/booking?artistId=${artist.id}`);
    }
  };

  const handleSendMessage = async () => {
    if (!artist) return;
    try {
      const { sdk } = await import('@piums/sdk');
      const { conversation } = await sdk.createConversation({ artistId: artist.id });
      router.push(`/chat?conversationId=${conversation.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al abrir el chat';
      toast.error(msg);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!artist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Artista no encontrado</h2>
          <Button onClick={() => router.push('/artists')}>Volver a Artistas</Button>
        </div>
      </div>
    );
  }

  const artistIsFavorite = isFavorite(artist.id);
  const handleFavoriteToggle = () => {
    toggleFavorite({
      id: artist.id,
      nombre: artist.nombre,
      category: artist.category,
      cityId: artist.cityId,
      avatar: artist.avatar,
      coverPhoto: artist.coverPhoto,
      rating: artist.rating ?? null,
      startingPrice,
      highlightedService: highlightedServiceName,
    });
  };

  const portfolioImages = artist.portfolio?.map(item => ({
    url: cImg(item.imageUrl) || '/placeholder-image.jpg',
    title: item.title,
    description: item.description
  })) || [];

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      <ClientSidebar userName={user?.nombre ?? 'Usuario'} />

      {/* Lightbox */}
      {lightboxOpen && portfolioImages.length > 0 && (
        <Lightbox
          images={portfolioImages}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onNext={nextImage}
          onPrev={prevImage}
        />
      )}

      <div className="flex-1 min-w-0 overflow-y-auto p-4 pt-20 lg:p-0 lg:pt-0">
      <div className="max-w-5xl mx-auto px-0 lg:px-6 py-0 lg:py-8">
        {/* go back */}
        <button
          onClick={() => router.push('/artists')}
          className="hidden lg:flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Volver a Artistas
        </button>
        {/* Mobile back */}
        <button
          onClick={() => router.push('/artists')}
          className="lg:hidden flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Artistas
        </button>
        {/* Cover Photo */}
        {(() => {
          const CAT_GRAD: Record<string, [string, string]> = {
            MUSICO:     ['#FF6A00', '#F59E0B'],
            DJ:         ['#FF6A00', '#C026D3'],
            FOTOGRAFO:  ['#00AEEF', '#1D4ED8'],
            VIDEOGRAFO: ['#4F46E5', '#C026D3'],
            DISENADOR:  ['#00AEEF', '#10B981'],
            BAILARIN:   ['#FF6A00', '#EF4444'],
            ANIMADOR:   ['#F59E0B', '#FF6A00'],
            TATUADOR:   ['#1E1B4B', '#7C3AED'],
            MAQUILLADOR:['#EC4899', '#9D174D'],
            PINTOR:     ['#0891B2', '#059669'],
            ESCULTOR:   ['#475569', '#1E293B'],
            ESCRITOR:   ['#4F46E5', '#00AEEF'],
            MAGO:       ['#7C3AED', '#4F46E5'],
            ACROBATA:   ['#FF6A00', '#F59E0B'],
          };
          const [a, b] = CAT_GRAD[artist.category ?? ''] ?? ['#FF6A00', '#00AEEF'];
          return (
            <div className="relative h-48 lg:h-64 rounded-none lg:rounded-2xl overflow-hidden mb-8" style={{ background: `linear-gradient(135deg, ${a} 0%, ${b} 100%)` }}>
              {!artist.coverPhoto && (
                <>
                  <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                    <span className="text-white font-black" style={{ fontSize: '12rem', lineHeight: 1, opacity: 0.1 }}>
                      {(artist.nombre?.[0] ?? '?').toUpperCase()}
                    </span>
                  </div>
                </>
              )}
              {artist.coverPhoto && (
                <img src={cImg(artist.coverPhoto)} alt={artist.nombre} className="w-full h-full object-cover" />
              )}
            </div>
          );
        })()}


        {/* Profile Header */}
        <div className="flex flex-col md:flex-row md:items-start md:space-x-6 mb-8 px-4 lg:px-0">
          <div className="flex-shrink-0 -mt-16 mb-4 md:mb-0">
            <Avatar
              src={artist.avatar}
              fallback={artist.nombre}
              size="xl"
              className="h-32 w-32 border-4 border-white shadow-lg"
            />
          </div>

          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{artist.nombre}</h1>
              {artist.isVerified && (
                <svg className="h-6 w-6 text-[#FF6A00]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {artist.isPremium && (
                <Badge variant="warning">Premium</Badge>
              )}
            </div>

            <p className="text-lg text-gray-600 mb-2">{artist.category}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
              {artist.cityId && (
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span>{artist.cityId}</span>
                </div>
              )}
              {artist.rating && (
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-medium">{artist.rating.toFixed(1)}</span>
                  <span className="ml-1">({artist.reviewsCount} reseñas)</span>
                </div>
              )}
              {artist.experienceYears && (
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{artist.experienceYears} años de experiencia</span>
                </div>
              )}
              {artist.bookingsCount && (
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{artist.bookingsCount} reservas completadas</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleBookNow} size="lg">
                Reservar Ahora
              </Button>
              <button
                type="button"
                onClick={handleFavoriteToggle}
                aria-pressed={artistIsFavorite}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors shadow-sm ${
                  artistIsFavorite
                    ? 'border-[#FF6A00] text-[#FF6A00] bg-[#FF6A00]/5'
                    : 'border-gray-200 text-gray-600 hover:border-[#FF6A00]/60 hover:text-[#FF6A00]'
                }`}
              >
                <svg
                  className={`h-5 w-5 ${artistIsFavorite ? 'fill-[#FF6A00]' : ''}`}
                  fill={artistIsFavorite ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                {artistIsFavorite ? 'Guardado' : 'Guardar'}
              </button>
            </div>
            {artistIsFavorite && (
              <p className="flex items-center gap-1 mt-2 text-xs text-[#FF6A00]">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Añadido a tus favoritos
              </p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6 px-4 lg:px-0">
          <nav className="flex space-x-8">
            {tabItems.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === key
                    ? 'border-[#FF6A00] text-[#FF6A00]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 lg:px-0 pb-8">
          <div className="lg:col-span-2">
            {activeTab === 'about' && (
              <Card>
                <CardTitle className="mb-4">Acerca de</CardTitle>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed mb-6">{artist.bio}</p>
                  
                  {artist.certifications && artist.certifications.length > 0 && (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Certificaciones</h3>
                      <div className="space-y-2">
                        {artist.certifications.map((cert) => (
                          <div key={cert.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                            <svg className="h-6 w-6 text-[#00AEEF] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                            <div>
                              <p className="font-medium text-gray-900">{cert.name}</p>
                              <p className="text-sm text-gray-600">{cert.issuer} • {new Date(cert.issueDate).getFullYear()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'services' && (
              <div className="space-y-4">
                {services.length === 0 ? (
                  <Card>
                    <CardContent>
                      <p className="text-gray-600 text-center py-8">
                        Este artista aún no ha publicado servicios
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  services.map((service) => (
                    <div
                      key={service.id}
                      onMouseEnter={() => setHoveredServiceId(service.id)}
                      onMouseLeave={() => setHoveredServiceId(null)}
                    >
                    <Card>
                      <CardContent>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                            {/* What's included — revealed on hover with smooth animation */}
                            {(service.whatIsIncluded?.length ?? 0) > 0 && (
                              <div className={`grid transition-all duration-300 ease-in-out ${
                                hoveredServiceId === service.id
                                  ? 'grid-rows-[1fr] opacity-100 mt-3'
                                  : 'grid-rows-[0fr] opacity-0 mt-0'
                              }`}>
                                <div className="overflow-hidden">
                                  <div className="pt-3 border-t border-gray-100 space-y-1.5">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Incluye</p>
                                    {service.whatIsIncluded!.map((item, i) => (
                                      <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                                        <svg className="h-3.5 w-3.5 text-[#FF6A00] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M12 2l1.8 5.4 5.7.4-4.4 3.3 1.6 5.5L12 13.5l-4.7 3.1 1.6-5.5L4.5 7.8l5.7-.4z" />
                                        </svg>
                                        <span>{item}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-right ml-4 shrink-0">
                            <p className="text-2xl font-bold text-[#FF6A00]">${(service.basePrice / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                            <p className="text-sm text-gray-500">{Math.floor((service.duration ?? 0) / 60)} horas</p>
                          </div>
                        </div>
                        <Button onClick={() => router.push(`/booking?artistId=${artist.id}&serviceId=${service.id}`)} fullWidth>
                          Reservar
                        </Button>
                      </CardContent>
                    </Card>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'portfolio' && (
              <div className="grid grid-cols-2 gap-4">
                {artist.portfolio && artist.portfolio.length > 0 ? (
                  artist.portfolio.map((item, index) => (
                    <Card 
                      key={item.id} 
                      padding="none" 
                      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => openLightbox(index)}
                    >
                      <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        {item.imageUrl ? (
                          <img
                            src={cImg(item.imageUrl)}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="font-medium text-gray-900">{item.title}</p>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="col-span-2">
                    <CardContent>
                      <p className="text-gray-600 text-center py-8">
                        Este artista aún no ha publicado trabajos en su portafolio
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">

                {/* Write-a-review block */}
                {user && !reviewSuccess && (
                  <Card>
                    <CardContent>
                      {!showReviewForm ? (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600">¿Ya trabajaste con este artista?</p>
                          <button
                            onClick={() => setShowReviewForm(true)}
                            className="flex items-center gap-2 rounded-xl bg-[#FF6A00] px-4 py-2 text-sm font-semibold text-white hover:bg-[#E65F00] transition-colors"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                            Escribir reseña
                          </button>
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-base font-semibold text-gray-900 mb-4">Escribe tu reseña</h3>

                          {/* Booking selector */}
                          {completedBookings.length > 1 && (
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Reserva</label>
                              <select
                                value={reviewBookingId}
                                onChange={e => setReviewBookingId(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#FF6A00] focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20"
                              >
                                {completedBookings.map(b => (
                                  <option key={b.id} value={b.id}>{b.code}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Star rating */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Calificación</label>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map(star => (
                                <button
                                  key={star}
                                  type="button"
                                  onMouseEnter={() => setReviewHover(star)}
                                  onMouseLeave={() => setReviewHover(0)}
                                  onClick={() => setReviewRating(star)}
                                  className="text-2xl transition-transform hover:scale-110"
                                >
                                  <svg
                                    className={`h-8 w-8 ${
                                      star <= (reviewHover || reviewRating)
                                        ? 'text-yellow-400'
                                        : 'text-gray-300'
                                    } transition-colors`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                </button>
                              ))}
                              <span className="ml-2 self-center text-sm text-gray-500">
                                {['', 'Pésimo', 'Malo', 'Regular', 'Bueno', 'Excelente'][reviewRating]}
                              </span>
                            </div>
                          </div>

                          {/* Comment */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Comentario <span className="text-gray-400 font-normal">(opcional)</span>
                            </label>
                            <textarea
                              rows={4}
                              value={reviewComment}
                              onChange={e => setReviewComment(e.target.value)}
                              placeholder="Cuéntanos tu experiencia con este artista…"
                              maxLength={2000}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-[#FF6A00] focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 resize-none"
                            />
                            <div className="mt-1 flex justify-between text-xs text-gray-400">
                              <span>{reviewComment.trim().length > 0 && reviewComment.trim().length < 3 ? <span className="text-red-500">Mínimo 3 caracteres</span> : null}</span>
                              <span>{reviewComment.length}/2000</span>
                            </div>
                          </div>

                          {reviewError && (
                            <p className="mb-3 text-sm text-red-500">{reviewError}</p>
                          )}

                          <div className="flex gap-3">
                            <button
                              onClick={() => { setShowReviewForm(false); setReviewError(null); }}
                              className="flex-1 rounded-xl border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={handleSubmitReview}
                              disabled={reviewSubmitting || reviewRating === 0}
                              className="flex-1 rounded-xl bg-[#FF6A00] py-2 text-sm font-semibold text-white hover:bg-[#E65F00] disabled:opacity-60 transition-colors"
                            >
                              {reviewSubmitting ? 'Enviando…' : 'Publicar reseña'}
                            </button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Success banner */}
                {reviewSuccess && (
                  <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
                    <svg className="h-5 w-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm text-green-700 font-medium">¡Reseña publicada! Gracias por tu opinión.</p>
                  </div>
                )}

                {loadingReviews && reviews.length === 0 ? (
                  <Card>
                    <CardContent>
                      <div className="flex justify-center py-8">
                        <Loading />
                      </div>
                    </CardContent>
                  </Card>
                ) : reviews.length === 0 ? (
                  <Card>
                    <CardContent>
                      <p className="text-gray-600 text-center py-8">
                        Este artista aún no tiene reseñas
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {reviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent>
                          <div className="flex items-center space-x-3 mb-3">
                            <Avatar fallback="U" size="sm" />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">Usuario</p>
                              <div className="flex items-center mt-1">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <svg
                                    key={i}
                                    className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString('es-GT', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-gray-700">{review.comment}</p>
                          )}
                          <div className="flex justify-end mt-2">
                            <button
                              onClick={() => handleOpenReport(review.id)}
                              className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              Reportar
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {/* Load More Button */}
                    {reviewsPage < reviewsTotalPages && (
                      <div className="text-center pt-4">
                        <Button 
                          variant="outline" 
                          onClick={handleLoadMoreReviews}
                          disabled={loadingReviews}
                        >
                          {loadingReviews ? 'Cargando...' : `Ver más reseñas (${reviewsTotal - reviews.length} restantes)`}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <Card className="sticky top-8">
              <CardTitle className="mb-4">Información de Contacto</CardTitle>
              <CardContent>
                <Button fullWidth size="lg" onClick={handleBookNow} className="mb-3">
                  Reservar Ahora
                </Button>
                <Button fullWidth variant="outline" onClick={handleSendMessage}>
                  Enviar Mensaje
                </Button>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">Tiempo de Respuesta</h4>
                  <p className="text-sm text-gray-600">Generalmente responde en menos de 2 horas</p>
                </div>

                {(artist.instagram || artist.facebook || artist.youtube || artist.tiktok || artist.website) && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Redes Sociales</h4>
                    <div className="flex flex-wrap gap-3">
                      {artist.instagram && (
                        <a href={artist.instagram.startsWith('http') ? artist.instagram : `https://instagram.com/${artist.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-pink-600 transition-colors">
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                          Instagram
                        </a>
                      )}
                      {artist.facebook && (
                        <a href={artist.facebook.startsWith('http') ? artist.facebook : `https://facebook.com/${artist.facebook}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-700 transition-colors">
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                          Facebook
                        </a>
                      )}
                      {artist.youtube && (
                        <a href={artist.youtube.startsWith('http') ? artist.youtube : `https://youtube.com/${artist.youtube}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 transition-colors">
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                          YouTube
                        </a>
                      )}
                      {artist.tiktok && (
                        <a href={artist.tiktok.startsWith('http') ? artist.tiktok : `https://tiktok.com/${artist.tiktok.startsWith('@') ? artist.tiktok : '@' + artist.tiktok}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                          TikTok
                        </a>
                      )}
                      {artist.website && (
                        <a href={artist.website.startsWith('http') ? artist.website : `https://${artist.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#FF6A00] transition-colors">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
                          Sitio web
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reviewId={selectedReviewId}
        onSubmit={handleReportSubmit}
      />
    </div>
  );
}
