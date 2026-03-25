'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/artist/DashboardSidebar';
import { sdk, ReviewDetailed } from '@piums/sdk';
import { getErrorMessage, isUnauthorizedError } from '@/lib/errors';
import { ReportModal } from '@/components/ReportModal';

export default function ArtistReviewsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<ReviewDetailed[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [respondingToReviewId, setRespondingToReviewId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState('');

  const loadReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Obtener perfil del artista
      const artistProfile = await sdk.getArtistProfile();

      // Cargar reviews del artista
      const result = await sdk.listReviews({
        artistId: artistProfile.id,
        page: currentPage,
        limit: 10,
        sortBy: 'recent',
      });

      setReviews(result.reviews);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      console.error('Error loading reviews:', message);
      setError(message || 'Error al cargar las reviews');

      if (isUnauthorizedError(err)) {
        router.push('/login?redirect=/artist/dashboard/reviews');
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, router]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const handleRespond = async (reviewId: string) => {
    if (!responseText.trim()) {
      alert('Por favor escribe una respuesta');
      return;
    }

    try {
      await sdk.respondToReview(reviewId, responseText);
      alert('Respuesta publicada exitosamente');
      
      // Recargar reviews
      await loadReviews();
      
      setRespondingToReviewId(null);
      setResponseText('');
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      console.error('Error responding to review:', message);
      alert(message || 'Error al responder la review');
    }
  };

  const handleOpenReport = (reviewId: string) => {
    setSelectedReviewId(reviewId);
    setIsReportModalOpen(true);
  };

  const handleReportSubmit = async (reviewId: string, reason: string, description: string) => {
    try {
      await sdk.reportReview(reviewId, { reason, description });
      alert('Reporte enviado correctamente. El equipo de moderación lo revisará.');
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      console.error('Error reporting review:', message);
      alert(message || 'Error al enviar el reporte');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}>
            ⭐
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reviews</h1>
            <p className="text-gray-600">Reviews recibidas de tus clientes</p>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando reviews...</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadReviews}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Reviews List */}
          {!isLoading && !error && (
            <>
              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          {renderStars(review.rating)}
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(review.createdAt).toLocaleDateString('es-MX', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            review.status === 'PUBLISHED'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {review.status}
                        </span>
                      </div>

                      {review.comment && (
                        <p className="text-gray-800 mb-4">{review.comment}</p>
                      )}

                      {review.photos && review.photos.length > 0 && (
                        <div className="flex gap-2 mb-4">
                          {review.photos.map((photo) => (
                            <Image
                              key={photo.id}
                              src={photo.url}
                              alt={photo.caption || 'Foto de la reseña'}
                              width={80}
                              height={80}
                              className="w-20 h-20 object-cover rounded"
                              sizes="80px"
                            />
                          ))}
                        </div>
                      )}

                      {/* Artist Response */}
                      {review.response ? (
                        <div className="mt-4 p-4 bg-purple-50 border-l-4 border-purple-600 rounded">
                          <p className="text-xs font-medium text-purple-900 uppercase mb-1">
                            Tu respuesta
                          </p>
                          <p className="text-gray-800">{review.response.message}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(review.response.createdAt).toLocaleDateString('es-MX')}
                          </p>
                        </div>
                      ) : (
                        <>
                          {respondingToReviewId === review.id ? (
                            <div className="mt-4 p-4 bg-gray-50 rounded">
                              <textarea
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                placeholder="Escribe tu respuesta..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2"
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleRespond(review.id)}
                                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                >
                                  Publicar respuesta
                                </button>
                                <button
                                  onClick={() => {
                                    setRespondingToReviewId(null);
                                    setResponseText('');
                                  }}
                                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setRespondingToReviewId(review.id)}
                              className="mt-4 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
                            >
                              💬 Responder
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenReport(review.id)}
                            className="mt-4 px-4 py-2 text-red-500 hover:text-red-600 transition-colors text-sm font-medium flex items-center gap-1"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Reportar
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                  <div className="text-6xl mb-4">⭐</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No tienes reviews todavía
                  </h3>
                  <p className="text-gray-600">
                    Las reviews de tus clientes aparecerán aquí
                  </p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8">
                  <p className="text-sm text-gray-600">
                    Mostrando {reviews.length} de {total} reviews
                  </p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reviewId={selectedReviewId}
        onSubmit={handleReportSubmit}
      />
    </div>
  );
}
