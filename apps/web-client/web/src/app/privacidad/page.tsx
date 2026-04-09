import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Política de Privacidad</h1>
        <p className="text-sm text-gray-400 mb-10">Última actualización: marzo 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Información que recopilamos</h2>
            <p>Recopilamos información que nos proporcionas directamente al registrarte, reservar un servicio o comunicarte con nosotros. Esto incluye nombre, correo electrónico, número de teléfono y datos de pago procesados de forma segura.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Uso de la información</h2>
            <p>Usamos tu información para operar y mejorar la plataforma, procesar reservas y pagos, enviarte notificaciones relevantes sobre tus servicios y personalizar tu experiencia dentro de Piums.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Compartir información</h2>
            <p>No vendemos ni alquilamos tu información personal a terceros. Compartimos datos únicamente con artistas involucrados en tus reservas y con proveedores de servicios que nos ayudan a operar la plataforma (procesadores de pago, servicios de email, etc.).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Seguridad</h2>
            <p>Implementamos medidas técnicas y organizativas para proteger tu información contra acceso no autorizado, pérdida o alteración. Sin embargo, ningún sistema es 100% seguro.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Tus derechos</h2>
            <p>Tienes derecho a acceder, corregir o eliminar tus datos personales en cualquier momento. Para ejercer estos derechos, contáctanos en <a href="mailto:privacidad@piums.com" className="text-[#FF6A00] hover:underline">privacidad@piums.com</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Cookies</h2>
            <p>Usamos cookies propias y de terceros para mejorar la experiencia de usuario. Puedes consultar nuestra <a href="/cookies" className="text-[#FF6A00] hover:underline">Política de Cookies</a> para más detalles.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Contacto</h2>
            <p>Si tienes preguntas sobre esta política, escríbenos a <a href="mailto:privacidad@piums.com" className="text-[#FF6A00] hover:underline">privacidad@piums.com</a>.</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
