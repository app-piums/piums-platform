import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos y Condiciones | Piums',
  description: 'Términos y Condiciones de uso de la plataforma Piums.',
  other: {
    'tiktok-developers-site-verification': 'N0gsVgRuu2gFzosWOzjbgTcl7vtYOPGP',
  },
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* TikTok domain verification — do not remove */}
      <span style={{ display: 'none' }}>tiktok-developers-site-verification=N0gsVgRuu2gFzosWOzjbgTcl7vtYOPGP</span>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Términos y Condiciones</h1>
          <p className="text-sm text-gray-400">Última actualización: abril 2026</p>
          <p className="mt-4 text-gray-600">
            Bienvenido a <strong>Piums</strong>. Al acceder o utilizar nuestra plataforma, aceptas quedar vinculado
            por los presentes Términos y Condiciones. Léelos detenidamente antes de usar el servicio.
          </p>
        </div>

        <div className="space-y-8 text-gray-700">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Información de la empresa</h2>
            <p>
              Piums es una plataforma digital operada por <strong>Piums S.A.</strong>, con domicilio en Guatemala.
              Para consultas legales, puedes contactarnos en{' '}
              <a href="mailto:soporte@piums.io" className="text-[#FF6B35] hover:underline">soporte@piums.io</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Descripción del servicio</h2>
            <p>
              Piums es una plataforma en línea que conecta a clientes con artistas y prestadores de servicios
              creativos (músicos, DJ, fotógrafos, videógrafos, diseñadores, entre otros) para la contratación
              de servicios. Piums actúa únicamente como intermediario tecnológico y no es parte del contrato
              de servicios entre el cliente y el artista.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Elegibilidad y registro</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Debes tener al menos 18 años de edad para utilizar la plataforma.</li>
              <li>
                Al registrarte, proporcionas información veraz, completa y actualizada. El uso de datos
                falsos puede resultar en la suspensión inmediata de tu cuenta.
              </li>
              <li>
                Eres el único responsable de mantener la confidencialidad de tus credenciales de acceso
                (usuario y contraseña).
              </li>
              <li>
                Puedes registrarte mediante correo electrónico o a través de servicios de inicio de sesión
                de terceros como Google o TikTok. Al usar estos servicios, también aceptas sus términos
                de uso respectivos.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Reservas y pagos</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Las reservas se confirman únicamente cuando el artista las acepta expresamente y el pago
                es procesado correctamente.
              </li>
              <li>
                Los pagos son procesados por proveedores externos (Stripe) de forma segura. Piums no
                almacena datos completos de tarjetas de crédito.
              </li>
              <li>
                Los precios mostrados están expresados en dólares estadounidenses (USD) salvo indicación
                contraria.
              </li>
              <li>
                Piums puede cobrar una comisión de servicio al cliente y/o al artista, la cual se
                especificará antes de confirmar la reserva.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Política de cancelación</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-3 border border-gray-200">Momento de cancelación</th>
                    <th className="text-left p-3 border border-gray-200">Reembolso</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border border-gray-200">Más de 48 horas antes del evento</td>
                    <td className="p-3 border border-gray-200 text-green-700 font-medium">100 %</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-3 border border-gray-200">Entre 24 y 48 horas antes</td>
                    <td className="p-3 border border-gray-200 text-yellow-700 font-medium">75 %</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-gray-200">Menos de 24 horas antes</td>
                    <td className="p-3 border border-gray-200 text-red-700 font-medium">Sin reembolso</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              Las cancelaciones realizadas por el artista dan derecho al cliente a un reembolso completo
              más un crédito de compensación en la plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Obligaciones del artista</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Proporcionar información veraz sobre sus servicios, precios, experiencia y disponibilidad.</li>
              <li>Prestar el servicio acordado con profesionalismo y en las condiciones pactadas.</li>
              <li>No subcontratar el servicio sin previo aviso y consentimiento del cliente.</li>
              <li>
                Cumplir con las leyes tributarias y laborales aplicables. Piums no es el empleador del
                artista.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Conducta del usuario</h2>
            <p>Al usar Piums te comprometes a:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>No publicar contenido falso, engañoso, ofensivo o que infrinja derechos de terceros.</li>
              <li>No intentar acceder sin autorización a sistemas, datos o cuentas ajenas.</li>
              <li>No utilizar la plataforma para actividades ilegales o fraudulentas.</li>
              <li>No usar herramientas automatizadas (bots, scrapers) sin autorización escrita de Piums.</li>
            </ul>
            <p className="mt-3">
              El incumplimiento puede resultar en la suspensión o eliminación permanente de tu cuenta,
              sin perjuicio de las acciones legales correspondientes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Propiedad intelectual</h2>
            <p>
              Todo el contenido de la plataforma (diseño, código, logotipos, textos) es propiedad de
              Piums o sus licenciantes y está protegido por las leyes de propiedad intelectual. Los
              artistas conservan los derechos sobre su contenido, pero otorgan a Piums una licencia
              no exclusiva para mostrarlo en la plataforma con fines operativos y promocionales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Limitación de responsabilidad</h2>
            <p>
              Piums no garantiza la disponibilidad ininterrumpida del servicio ni la exactitud de todo
              el contenido publicado por los artistas. En ningún caso Piums será responsable por daños
              indirectos, incidentales, especiales o consecuentes derivados del uso de la plataforma o
              de la prestación de servicios entre usuarios.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Modificaciones</h2>
            <p>
              Piums se reserva el derecho de modificar estos Términos en cualquier momento. Los cambios
              materiales se notificarán por correo electrónico o mediante aviso en la plataforma con al
              menos 15 días de anticipación. El uso continuado del servicio tras la entrada en vigor de
              los cambios implica la aceptación de los nuevos términos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Ley aplicable y jurisdicción</h2>
            <p>
              Estos Términos se rigen por las leyes de la República de Guatemala. Cualquier controversia
              será sometida a los tribunales competentes de la ciudad de Guatemala, renunciando las partes
              a cualquier otro fuero que pudiera corresponderles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Contacto</h2>
            <p>
              Para cualquier consulta sobre estos términos, escríbenos a{' '}
              <a href="mailto:soporte@piums.io" className="text-[#FF6B35] hover:underline">soporte@piums.io</a>{' '}
              o visita{' '}
              <a href="/contacto" className="text-[#FF6B35] hover:underline">nuestro formulario de contacto</a>.
            </p>
          </section>

        </div>
      </div>
      <Footer />
    </div>
  );
}
