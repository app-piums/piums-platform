'use client';

import React, { useState } from 'react';

type Section = {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
};

function Accordion({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-[#FF6B35]">{section.icon}</span>
          <span className="font-semibold text-gray-900 text-sm">{section.title}</span>
        </div>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 text-sm text-gray-600 leading-relaxed space-y-3 border-t border-gray-100">
          {section.content}
        </div>
      )}
    </div>
  );
}

const SECTIONS: Section[] = [
  {
    id: 'terms',
    title: 'Términos y Condiciones de Uso',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    content: (
      <>
        <p>
          Al usar Piums aceptas estos Términos y Condiciones. Piums es una plataforma que conecta a
          artistas y creativos con personas que requieren sus servicios.
        </p>
        <p className="font-medium text-gray-800">1. Uso de la plataforma</p>
        <p>
          Debes ser mayor de 18 años para crear una cuenta. Eres responsable de mantener la
          confidencialidad de tu contraseña y de todas las actividades realizadas con tu cuenta.
        </p>
        <p className="font-medium text-gray-800">2. Reservas y pagos</p>
        <p>
          Piums actúa como intermediario facilitando el contacto entre clientes y artistas. El pago
          se procesa a través de nuestra plataforma y Piums puede retener una comisión por el
          servicio. Los precios son establecidos por los artistas.
        </p>
        <p className="font-medium text-gray-800">3. Cancelaciones</p>
        <p>
          Las políticas de cancelación varían por artista. Consulta los términos específicos al
          momento de hacer tu reserva. Los reembolsos se procesan según la política vigente del
          artista.
        </p>
        <p className="font-medium text-gray-800">4. Responsabilidad</p>
        <p>
          Piums no es responsable de disputas entre clientes y artistas. Sin embargo, contamos con
          un equipo de soporte disponible para mediar en caso de inconvenientes.
        </p>
        <p className="font-medium text-gray-800">5. Modificaciones</p>
        <p>
          Nos reservamos el derecho de modificar estos Términos en cualquier momento. Te
          notificaremos por correo electrónico ante cambios relevantes.
        </p>
      </>
    ),
  },
  {
    id: 'privacy',
    title: 'Política de Privacidad',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    content: (
      <>
        <p>
          Tu privacidad es importante para nosotros. Esta política describe cómo recopilamos, usamos
          y protegemos tu información personal.
        </p>
        <p className="font-medium text-gray-800">Datos que recopilamos</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Nombre, correo electrónico y fotografía de perfil</li>
          <li>Historial de reservas y valoraciones</li>
          <li>Información de pago (procesada de forma segura por Stripe)</li>
          <li>Ubicación aproximada para mostrar artistas cercanos</li>
        </ul>
        <p className="font-medium text-gray-800">Cómo usamos tus datos</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Para gestionar tu cuenta y reservas</li>
          <li>Para enviarte notificaciones sobre tu actividad</li>
          <li>Para mejorar nuestros servicios y personalizar tu experiencia</li>
          <li>Para cumplir con obligaciones legales</li>
        </ul>
        <p className="font-medium text-gray-800">Compartir información</p>
        <p>
          No vendemos tus datos a terceros. Compartimos información únicamente con artistas
          involucrados en tus reservas y con proveedores de pago para procesar transacciones.
        </p>
        <p className="font-medium text-gray-800">Tus derechos</p>
        <p>
          Puedes solicitar acceso, rectificación o eliminación de tus datos en cualquier momento
          escribiéndonos a{' '}
          <span className="font-medium text-[#FF6B35]">soporte@piums.io</span>.
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Política de Cookies',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    content: (
      <>
        <p>
          Usamos cookies para mejorar tu experiencia de navegación. Las cookies son pequeños
          archivos de texto almacenados en tu dispositivo.
        </p>
        <p className="font-medium text-gray-800">Tipos de cookies que usamos</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <span className="font-medium">Esenciales:</span> necesarias para el funcionamiento de la
            plataforma (sesión, autenticación).
          </li>
          <li>
            <span className="font-medium">Analíticas:</span> nos ayudan a entender cómo se usa la
            plataforma para mejorarla.
          </li>
          <li>
            <span className="font-medium">Preferencias:</span> recuerdan tus ajustes (idioma,
            región).
          </li>
        </ul>
        <p>
          Puedes desactivar las cookies no esenciales en la configuración de tu navegador. Ten en
          cuenta que esto puede afectar algunas funcionalidades.
        </p>
      </>
    ),
  },
  {
    id: 'contact',
    title: 'Contacto y Soporte',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    content: (
      <>
        <p>¿Tienes preguntas sobre nuestros términos o privacidad? Contáctanos:</p>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2 mt-2">
          <div className="flex items-center gap-2 text-sm">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="font-medium text-[#FF6B35]">soporte@piums.io</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            <span className="font-medium text-[#FF6B35]">soporte@piums.io</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-600">Lunes a viernes, 9:00 – 18:00 (GMT-6)</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Última actualización: marzo 2026 · Versión 1.0
        </p>
      </>
    ),
  },
];

export default function LegalTab() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Legal</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Términos, privacidad y políticas de uso de la plataforma.
        </p>
      </div>

      <div className="space-y-2">
        {SECTIONS.map((section) => (
          <Accordion key={section.id} section={section} />
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center pt-2">
        Al usar Piums confirmas que has leído y aceptas nuestros términos y políticas.
      </p>
    </div>
  );
}
