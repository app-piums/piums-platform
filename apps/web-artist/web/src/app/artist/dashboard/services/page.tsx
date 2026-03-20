'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/artist/DashboardSidebar';
import { sdk, Service, ServiceCategory } from '@piums/sdk';
import { getErrorMessage, isUnauthorizedError } from '@/lib/errors';

type PricingType = 'FIXED' | 'HOURLY' | 'PER_SESSION' | 'CUSTOM';

interface ServiceForm {
  name: string;
  description: string;
  categoryId: string;
  pricingType: PricingType;
  basePrice: string;
  durationMin: string;
}

const PRICING_LABELS: Record<PricingType, string> = {
  FIXED: 'Precio fijo',
  HOURLY: 'Por hora',
  PER_SESSION: 'Por sesión',
  CUSTOM: 'Personalizado',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function isServiceActive(service: Service): boolean {
  if (service.status) return service.status === 'ACTIVE';
  return service.isActive ?? true;
}

export default function ArtistServicesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [artistId, setArtistId] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggling status
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const emptyForm: ServiceForm = {
    name: '',
    description: '',
    categoryId: '',
    pricingType: 'FIXED',
    basePrice: '',
    durationMin: '',
  };
  const [form, setForm] = useState<ServiceForm>(emptyForm);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [artistProfile, cats] = await Promise.all([
        sdk.getArtistProfile(),
        sdk.getServiceCategories(),
      ]);
      setArtistId(artistProfile.id);
      setCategories(cats);

      const artistServices = await sdk.getArtistServices(artistProfile.id);
      setServices(artistServices);
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      console.error('Error loading services:', message);
      setError(message || 'Error al cargar los servicios');
      if (isUnauthorizedError(err)) {
        router.push('/login?redirect=/artist/dashboard/services');
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditingService(null);
    setForm(emptyForm);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (service: Service) => {
    setEditingService(service);
    setForm({
      name: service.name,
      description: service.description,
      categoryId: service.categoryId || '',
      pricingType: (service.pricingType as PricingType) || 'FIXED',
      basePrice: String(service.basePrice),
      durationMin: String(service.durationMin || service.duration || ''),
    });
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setShowModal(false);
    setEditingService(null);
    setForm(emptyForm);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistId) return;

    setFormError(null);
    setIsSubmitting(true);

    try {
      const price = parseInt(form.basePrice, 10);
      if (isNaN(price) || price < 0) throw new Error('El precio debe ser un número válido');

      if (editingService) {
        const updated = await sdk.updateService(editingService.id, {
          artistId,
          name: form.name,
          description: form.description,
          categoryId: form.categoryId || undefined,
          pricingType: form.pricingType,
          basePrice: price,
          durationMin: form.durationMin ? parseInt(form.durationMin, 10) : undefined,
        });
        setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        const slug = slugify(form.name);
        const created = await sdk.createService({
          artistId,
          name: form.name,
          slug,
          description: form.description,
          categoryId: form.categoryId,
          pricingType: form.pricingType,
          basePrice: price,
          durationMin: form.durationMin ? parseInt(form.durationMin, 10) : undefined,
        });
        setServices((prev) => [created, ...prev]);
      }
      closeModal();
    } catch (err: unknown) {
      setFormError(getErrorMessage(err) || 'Error al guardar el servicio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (service: Service) => {
    if (!artistId || togglingId) return;
    setTogglingId(service.id);
    try {
      const updated = await sdk.toggleServiceStatus(service.id, artistId);
      setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Error al cambiar el estado');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!artistId || !deletingId) return;
    setIsDeleting(true);
    try {
      await sdk.deleteService(deletingId, artistId);
      setServices((prev) => prev.filter((s) => s.id !== deletingId));
      setDeletingId(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Error al eliminar el servicio');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar />

      <main className="flex-1 p-4 pt-20 sm:p-6 lg:p-8 lg:pt-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Mis Servicios</h1>
              <p className="text-gray-500 text-sm">Administra los servicios que ofreces</p>
            </div>
            <button
              onClick={openCreate}
              className="self-start sm:self-auto px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm"
            >
              + Nuevo Servicio
            </button>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando servicios...</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center mb-6">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadData}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Services List */}
          {!isLoading && (
            <>
              {services.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {services.map((service) => {
                    const active = isServiceActive(service);
                    const isToggling = togglingId === service.id;
                    const duration = service.durationMin || service.duration;
                    return (
                      <div
                        key={service.id}
                        className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 pr-2">{service.name}</h3>
                          <span
                            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium ${
                              active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.description}</p>

                        <div className="flex items-center gap-6 mb-4">
                          <div>
                            <p className="text-xs text-gray-500">Precio base</p>
                            <p className="text-xl font-bold text-gray-900">Q{service.basePrice.toLocaleString('es-GT')}</p>
                          </div>
                          {duration ? (
                            <div>
                              <p className="text-xs text-gray-500">Duración</p>
                              <p className="text-xl font-bold text-gray-900">{duration} min</p>
                            </div>
                          ) : null}
                          {service.pricingType && (
                            <div>
                              <p className="text-xs text-gray-500">Tipo</p>
                              <p className="text-sm font-medium text-gray-700">{PRICING_LABELS[service.pricingType as PricingType] || service.pricingType}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(service)}
                            className="flex-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleToggle(service)}
                            disabled={isToggling}
                            className={`flex-1 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                              active
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            } disabled:opacity-60`}
                          >
                            {isToggling ? '...' : active ? '⏸ Desactivar' : '▶ Activar'}
                          </button>
                          <button
                            onClick={() => setDeletingId(service.id)}
                            className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                !error && (
                  <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                    <div className="text-6xl mb-4">⚙️</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No tienes servicios registrados</h3>
                    <p className="text-gray-600 mb-6">Comienza creando tu primer servicio</p>
                    <button
                      onClick={openCreate}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      + Crear mi primer servicio
                    </button>
                  </div>
                )
              )}
            </>
          )}

          {/* Info Box */}
          {!isLoading && services.length > 0 && (
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">💡 Gestión de Servicios</h3>
              <p className="text-blue-800 text-sm">
                Los servicios activos aparecen en tu perfil público y están disponibles para reserva.
                Los servicios inactivos permanecen guardados pero no son visibles para los clientes.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del servicio <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Fotografía de bodas"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  minLength={10}
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe qué incluye tu servicio..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none"
                />
              </div>

              {categories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white"
                  >
                    <option value="">Selecciona una categoría</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de precio <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.pricingType}
                    onChange={(e) => setForm({ ...form, pricingType: e.target.value as PricingType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white"
                  >
                    {(Object.keys(PRICING_LABELS) as PricingType[]).map((type) => (
                      <option key={type} value={type}>{PRICING_LABELS[type]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio base (Q) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.basePrice}
                    onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duración mínima (minutos)
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.durationMin}
                  onChange={(e) => setForm({ ...form, durationMin: e.target.value })}
                  placeholder="Ej: 60"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-60"
                >
                  {isSubmitting ? 'Guardando...' : editingService ? 'Guardar cambios' : 'Crear servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar servicio?</h2>
            <p className="text-gray-600 text-sm mb-6">
              Esta acción no se puede deshacer. El servicio será eliminado permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-60"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

