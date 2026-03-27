'use client';

import React, { useState } from 'react';

type Section = {
  id: string;
  title: string;
  icon: string;
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
          <span className="text-xl">{section.icon}</span>
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
    icon: '📋',
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
    icon: '🔒',
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
          <span className="font-medium text-[#FF6A00]">privacidad@piums.com</span>.
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Política de Cookies',
    icon: '🍪',
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
    icon: '💬',
    content: (
      <>
        <p>¿Tienes preguntas sobre nuestros términos o privacidad? Contáctanos:</p>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2 mt-2">
          <div className="flex items-center gap-2 text-sm">
            <span>📧</span>
            <span className="font-medium text-[#FF6A00]">soporte@piums.com</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>⚖️</span>
            <span className="font-medium text-[#FF6A00]">privacidad@piums.com</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>🕐</span>
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
