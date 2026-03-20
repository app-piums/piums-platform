'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Lightbox } from '@/components/Lightbox';
import { Loading } from '@/components/Loading';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle, CardContent } from '@/components/ui/Card';
import ClientSidebar from '@/components/ClientSidebar';
import { useAuth } from '@/contexts/AuthContext';
import type { ArtistProfile, Review, Service } from '@piums/sdk';
import { getMockArtist, getMockServices, getMockReviews } from '@/lib/mockData';

export default function ArtistProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const artistId = params.id as string;
  
  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'services' | 'portfolio' | 'reviews'>('about');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    loadArtistData();
  }, [artistId]);

  useEffect(() => {
    if (activeTab === 'reviews' && reviews.length === 0) {
      loadReviews(1);
    }
  }, [activeTab]);

  const loadArtistData = async () => {
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
  };

  const loadReviews = async (page: number) => {
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

  const portfolioImages = artist.portfolio?.map(item => ({
    url: item.imageUrl || '/placeholder-image.jpg',
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

      <div className="flex-1 min-w-0 overflow-y-auto p-4 pt-20 lg:p-0 lg:pt-0 pb-20 lg:pb-0">
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
        <div className="relative h-48 lg:h-64 bg-gradient-to-br from-violet-400 via-purple-500 to-pink-500 rounded-none lg:rounded-2xl overflow-hidden mb-8">
          {artist.coverPhoto && (
            <img src={artist.coverPhoto} alt={artist.nombre} className="w-full h-full object-cover" />
          )}
        </div>

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
                <svg className="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
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

            <Button onClick={handleBookNow} size="lg">
              Reservar Ahora
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6 px-4 lg:px-0">
          <nav className="flex space-x-8">
            {['about', 'services', 'portfolio', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-[#FF6A00] text-[#FF6A00]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'about' && 'Acerca de'}
                {tab === 'services' && 'Servicios'}
                {tab === 'portfolio' && 'Portafolio'}
                {tab === 'reviews' && 'Reseñas'}
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
                    <Card key={service.id}>
                      <CardContent>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-[#FF6A00]">${service.basePrice.toLocaleString()}</p>
                            <p className="text-sm text-gray-500">{Math.floor((service.duration ?? 0) / 60)} horas</p>
                          </div>
                        </div>
                        <Button onClick={() => router.push(`/booking?artistId=${artist.id}&serviceId=${service.id}`)} fullWidth>
                          Reservar
                        </Button>
                      </CardContent>
                    </Card>
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
                          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
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
                              {new Date(review.createdAt).toLocaleDateString('es-MX', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-gray-700">{review.comment}</p>
                          )}
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
                <Button fullWidth variant="outline">
                  Enviar Mensaje
                </Button>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">Tiempo de Respuesta</h4>
                  <p className="text-sm text-gray-600">Generalmente responde en menos de 2 horas</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
