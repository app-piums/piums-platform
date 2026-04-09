import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Política de Cookies</h1>
        <p className="text-sm text-gray-400 mb-10">Última actualización: marzo 2026</p>

        <div className="space-y-8 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">¿Qué son las cookies?</h2>
            <p>Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. Nos ayudan a recordar tus preferencias y mejorar tu experiencia de navegación.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Tipos de cookies que usamos</h2>
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-1">Cookies esenciales</h3>
                <p className="text-sm">Necesarias para el funcionamiento básico de la plataforma: autenticación, sesión de usuario y seguridad. No pueden desactivarse.</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-1">Cookies de preferencias</h3>
                <p className="text-sm">Recuerdan tus configuraciones (idioma, región, etc.) para personalizar tu experiencia.</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-1">Cookies analíticas</h3>
                <p className="text-sm">Nos permiten entender cómo los usuarios interactúan con la plataforma para mejorar nuestros servicios. Usamos datos anonimizados.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Cómo controlar las cookies</h2>
            <p>Puedes configurar tu navegador para rechazar o eliminar cookies. Ten en cuenta que deshabilitar ciertas cookies puede afectar el funcionamiento de la plataforma. Consulta la ayuda de tu navegador para más información.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Contacto</h2>
            <p>Para más información, escríbenos a <a href="mailto:privacidad@piums.com" className="text-[#FF6A00] hover:underline">privacidad@piums.com</a>.</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
