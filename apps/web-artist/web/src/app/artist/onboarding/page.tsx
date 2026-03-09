'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Disciplinas creativas disponibles
const creativeDisciplines = [
  { id: 'musician',        name: 'Músico',            subtitle: 'Compositor, Intérprete',    icon: '🎵' },
  { id: 'graphic-designer',name: 'Diseñador Gráfico', subtitle: 'Marca, Editorial',          icon: '🎨' },
  { id: 'filmmaker',       name: 'Cineasta',           subtitle: 'Director, Editor',          icon: '🎦' },
  { id: 'photographer',    name: 'Fotógrafo',         subtitle: 'Retrato, Producto',         icon: '📷' },
  { id: 'illustrator',     name: 'Ilustrador',         subtitle: 'Digital, Tradicional',      icon: '✏️' },
  { id: 'fashion-designer',name: 'Diseñador de Moda', subtitle: 'Ropa, Textil',             icon: '👗' },
  { id: 'architect',       name: 'Arquitecto',         subtitle: 'Urbano, Interior',          icon: '🏛️' },
  { id: 'writer',          name: 'Escritor',           subtitle: 'Copywriter, Guionista',    icon: '📝' },
  { id: 'developer',       name: 'Desarrollador',      subtitle: 'Web, Móvil',               icon: '💻' },
  { id: 'other',           name: 'Otro',               subtitle: '',                          icon: '⚡' },
];

// Opciones de categorías para servicios
const serviceCategories = [
  'Fotografía',
  'Videografía',
  'Producción Musical',
  'Diseño Gráfico',
  'Desarrollo Web',
  'Redacción de Contenidos',
  'Diseño de Moda',
  'Arquitectura',
  'Ilustración',
  'Otro',
];

export default function ArtistOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Step 2: Creative Superpower
  const [selectedDiscipline, setSelectedDiscipline] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Step 3: Portfolio & Profile
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [shortBio, setShortBio] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [extraLinks, setExtraLinks] = useState<string[]>([]);

  // Step 4: Service Setup
  const [serviceName, setServiceName] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [availabilityType, setAvailabilityType] = useState<'immediate' | 'quote'>('immediate');

  const [isLoading, setIsLoading] = useState(false);

  const progressPercentage = (currentStep / totalSteps) * 100;

  const filteredDisciplines = creativeDisciplines.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddExtraLink = () => {
    setExtraLinks([...extraLinks, '']);
  };

  const handleExtraLinkChange = (index: number, value: string) => {
    const newLinks = [...extraLinks];
    newLinks[index] = value;
    setExtraLinks(newLinks);
  };

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      // TODO: Enviar datos del onboarding al backend
      // await sdk.completeOnboarding({...datos})
      
      // Simular delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Marcar onboarding como completado (cookie)
      document.cookie = 'onboarding_completed=true; path=/; max-age=31536000'; // 1 año

      // Redirigir al dashboard
      router.push('/artist/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('Hubo un error. Por favor intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const canContinueStep2 = selectedDiscipline !== null;
  const canContinueStep3 = shortBio.trim().length > 0;
  const canContinueStep4 = serviceName.trim().length > 0 && serviceCategory && serviceDescription.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">PIUMS</span>
          </div>
          {currentStep < 4 && (
            <button className="text-gray-600 hover:text-gray-900 text-sm font-medium">
              Centro de Ayuda
            </button>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Progress bar */}
        {currentStep > 1 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                {currentStep === 2 && 'PASO 2 DE 4'}
                {currentStep === 3 && 'Portafolio y Perfil · Paso 3 de 4'}
                {currentStep === 4 && 'PASO 4 DE 4: CONFIGURAR SERVICIO'}
              </span>
              <span className="text-sm font-semibold text-orange-600">
                {Math.round(progressPercentage)}% Completado
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Step 1: Welcome */}
        {currentStep === 1 && (
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-4 py-1.5 bg-orange-100 text-orange-600 text-xs font-semibold rounded-full mb-6">
                BIENVENIDA AL ECOSISTEMA
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
                Lleva tu{' '}
                <span className="text-orange-600">Carrera Creativa</span>
                <br />
                al Siguiente Nivel
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Bienvenido a PIUMS, el ecosistema de la Economía Naranja. Monetiza tu talento único,
                protege tu propiedad intelectual y conectáte con una red global de oportunidades que te esperan.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-8 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-full hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 flex items-center gap-2"
                >
                  Crear Mi Perfil
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <button className="px-6 py-3.5 text-gray-700 font-medium hover:text-gray-900 transition-colors">
                  Saber más primero
                </button>
              </div>

              {/* Progress indicator */}
              <div className="mt-12 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <span className="font-medium text-gray-900">Bienvenida</span>
                </div>
                <span className="text-sm text-gray-400">Paso 1 de 4</span>
              </div>
            </div>

            {/* Visual showcase */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-orange-400 via-red-400 to-purple-500 rounded-2xl h-64 overflow-hidden shadow-xl">
                    <div className="p-4 text-white">
                      <p className="text-sm font-semibold">Artes Visuales</p>
                      <p className="text-xs opacity-90">Monetiza Obras Originales</p>
                    </div>
                  </div>
                  <div className="bg-gray-900 rounded-2xl h-48 overflow-hidden shadow-xl relative">
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-sm font-semibold text-white">Producción Musical</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl h-48 overflow-hidden shadow-xl"></div>
                  <div className="bg-gray-100 rounded-2xl h-56 overflow-hidden shadow-xl p-6">
                    <div className="bg-white rounded-xl p-4 mb-3">
                      <p className="text-sm font-semibold text-gray-900">Moda & Diseño</p>
                      <p className="text-xs text-gray-600">Acceso a talento único</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Creative Superpower */}
        {currentStep === 2 && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">
              ¿Cuál es tu <span className="text-orange-600">superpoder creativo</span>?
            </h2>
            <p className="text-gray-600 mb-8">
              Selecciona la disciplina que mejor describe tu enfoque profesional principal.
              No te preocupes, podrás agregar habilidades secundarias más adelante.
            </p>

            {/* Search bar */}
            <div className="mb-8">
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar roles (ej: Diseñador UI, Baterista, Guionista)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Discipline grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {filteredDisciplines.map((discipline) => (
                <button
                  key={discipline.id}
                  onClick={() => setSelectedDiscipline(discipline.id)}
                  className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
                    selectedDiscipline === discipline.id
                      ? 'border-orange-500 bg-orange-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  {selectedDiscipline === discipline.id && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="text-3xl mb-3">{discipline.icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-1">{discipline.name}</h3>
                  {discipline.subtitle && <p className="text-xs text-gray-500">{discipline.subtitle}</p>}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Atrás
              </button>
              <button
                onClick={() => canContinueStep2 && setCurrentStep(3)}
                disabled={!canContinueStep2}
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-full hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Continuar
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Portfolio & Profile */}
        {currentStep === 3 && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">Muestra tu mejor trabajo</h2>
            <p className="text-gray-600 mb-8">
              Conecta tus perfiles profesionales y súbe una foto para que los clientes sepan quién eres.
            </p>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8">
              {/* Profile Photo */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-4">Foto de Perfil</label>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                      {profilePhotoPreview ? (
                        <img src={profilePhotoPreview} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <label
                      htmlFor="profile-photo"
                      className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </label>
                    <input
                      id="profile-photo"
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhotoChange}
                      className="hidden"
                    />
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor="profile-photo"
                      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <span className="text-blue-500 font-semibold">Haz clic para subir</span>
                      <span className="text-gray-500">o arrastra y suelta</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-2">SVG, PNG, JPG o GIF (máx. 800x400px)</p>
                  </div>
                </div>
              </div>

              {/* Short Bio */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="bio" className="block text-sm font-semibold text-gray-900">
                    Bio Breve
                  </label>
                  <span className="text-xs text-gray-500">{shortBio.length}/300</span>
                </div>
                <textarea
                  id="bio"
                  rows={4}
                  maxLength={300}
                  value={shortBio}
                  onChange={(e) => setShortBio(e.target.value)}
                  placeholder="Cuéntanos sobre tu trayectoria creativa, habilidades clave y qué hace único tu trabajo..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Resalta tu experiencia en los sectores de la Economía Naranja (Artes, Diseño, Música, etc.)
                </p>
              </div>

              {/* Social & Portfolio Links */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-900">Redes Sociales y Portafolio</label>

                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="URL de LinkedIn"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Usuario de Instagram"
                    value={instagramHandle}
                    onChange={(e) => setInstagramHandle(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Link de Portafolio (Behance, Dribbble, Adobe Portfolio, etc.)"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                {extraLinks.map((link, index) => (
                  <input
                    key={index}
                    type="text"
                    placeholder="Enlace adicional (Spotify, SoundCloud, etc.)"
                    value={link}
                    onChange={(e) => handleExtraLinkChange(index, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                ))}

                <button
                  onClick={handleAddExtraLink}
                  className="text-blue-500 text-sm font-semibold hover:text-blue-600 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar otro enlace (Spotify, SoundCloud, etc.)
                </button>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Atrás
              </button>
              <button
                onClick={() => canContinueStep3 && setCurrentStep(4)}
                disabled={!canContinueStep3}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-full hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Continuar al Último Paso
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Service Setup */}
        {currentStep === 4 && (
          <div className="grid md:grid-cols-2 gap-12">
            {/* Left side: Instructions */}
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Configura tu
                <br />
                <span className="text-orange-600">primer servicio</span>
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Define tu oferta principal para que los clientes puedan reservarte de inmediato.
                Este será el destaque principal en tu perfil.
              </p>

              <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-lg">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-orange-900 mb-1">Consejo Pro</h3>
                    <p className="text-sm text-orange-800 leading-relaxed">
                      Empieza con un servicio simple y popular. Siempre podrás agregar paquetes complejos
                      o cotizaciones personalizadas desde tu dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Form */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <div className="space-y-6">
                {/* Service Name & Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="serviceName" className="block text-sm font-semibold text-gray-900 mb-2">
                      Nombre del Servicio
                    </label>
                    <input
                      id="serviceName"
                      type="text"
                      placeholder="ej: Sesión de fotos 1 hora"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="category" className="block text-sm font-semibold text-gray-900 mb-2">
                      Categoría
                    </label>
                    <select
                      id="category"
                      value={serviceCategory}
                      onChange={(e) => setServiceCategory(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
                    >
                      <option value="">Seleccionar categoría</option>
                      {serviceCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="description" className="block text-sm font-semibold text-gray-900">
                      Descripción
                    </label>
                    <span className="text-xs text-gray-500">{serviceDescription.length}/500 caracteres</span>
                  </div>
                  <textarea
                    id="description"
                    rows={4}
                    maxLength={500}
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    placeholder="Describe qué incluye este servicio..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
                  />
                </div>

                {/* Pricing & Availability */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Precio y Disponibilidad</label>

                  <div className="mb-4">
                    <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700 mb-2">
                      Precio Base
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                      <input
                        id="basePrice"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value)}
                        className="w-full pl-8 pr-16 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">USD</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Monto inicial por este servicio</p>
                  </div>

                  {/* Availability options */}
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setAvailabilityType('immediate')}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        availabilityType === 'immediate'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            availabilityType === 'immediate' ? 'border-orange-500' : 'border-gray-300'
                          }`}
                        >
                          {availabilityType === 'immediate' && (
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="font-semibold text-gray-900">Disponible para reserva inmediata</span>
                          </div>
                          <p className="text-sm text-gray-600">Los clientes pueden reservar directamente según tu calendario.</p>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAvailabilityType('quote')}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        availabilityType === 'quote'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            availabilityType === 'quote' ? 'border-orange-500' : 'border-gray-300'
                          }`}
                        >
                          {availabilityType === 'quote' && <div className="w-3 h-3 bg-orange-500 rounded-full"></div>}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                              <path
                                fillRule="evenodd"
                                d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="font-semibold text-gray-900">Cotización requerida</span>
                          </div>
                          <p className="text-sm text-gray-600">Revisas las solicitudes y envías una propuesta de precio.</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Atrás
                </button>
                <button
                  onClick={handleFinish}
                  disabled={!canContinueStep4 || isLoading}
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-full hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      Finalizar e Ir al Dashboard
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
