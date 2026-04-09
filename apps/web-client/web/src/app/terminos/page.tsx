import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Términos y Condiciones</h1>
        <p className="text-sm text-gray-400 mb-10">Última actualización: marzo 2026</p>

        <div className="space-y-8 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Aceptación de los términos</h2>
            <p>Al acceder y utilizar Piums, aceptas quedar vinculado por estos Términos y Condiciones. Si no estás de acuerdo con alguna parte de estas condiciones, no podrás utilizar nuestros servicios.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Descripción del servicio</h2>
            <p>Piums es una plataforma que conecta a clientes con artistas profesionales para la contratación de servicios creativos y de entretenimiento. Actuamos como intermediarios y no somos responsables directos de la calidad del servicio prestado por los artistas.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Registro y cuentas</h2>
            <p>Para realizar reservas debes crear una cuenta con información veraz y actualizada. Eres responsable de mantener la confidencialidad de tus credenciales de acceso y de todas las actividades realizadas desde tu cuenta.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Reservas y pagos</h2>
            <p>Las reservas se confirman una vez que el artista las acepta. Los pagos se procesan de forma segura a través de nuestros proveedores. Al confirmar una reserva, aceptas nuestra política de cancelación aplicable.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Política de cancelación</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Cancelación gratuita hasta 48 horas antes del evento.</li>
              <li>Cargo del 25% entre 24 y 48 horas antes.</li>
              <li>Sin reembolso con menos de 24 horas de anticipación.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Conducta del usuario</h2>
            <p>Los usuarios se comprometen a utilizar la plataforma de manera respetuosa, no publicar contenido falso o engañoso, y no realizar actividades fraudulentas. Nos reservamos el derecho de suspender cuentas que violen estas normas.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Limitación de responsabilidad</h2>
            <p>Piums no es responsable por daños indirectos, incidentales o consecuentes derivados del uso de la plataforma o de los servicios contratados a través de ella.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Contacto</h2>
            <p>Para cualquier consulta sobre estos términos, escríbenos a <a href="mailto:legal@piums.com" className="text-[#FF6A00] hover:underline">legal@piums.com</a>.</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
