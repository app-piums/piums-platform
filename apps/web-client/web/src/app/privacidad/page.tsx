import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad | Piums',
  description: 'Política de Privacidad de la plataforma Piums: qué datos recopilamos, cómo los usamos y tus derechos.',
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Política de Privacidad</h1>
          <p className="text-sm text-gray-400">Última actualización: julio 2026</p>
          <p className="mt-4 text-gray-600">
            En <strong>Piums</strong> respetamos tu privacidad. Esta política explica qué datos recopilamos, con
            qué finalidad, con quién los compartimos y qué derechos tienes. Aplica a nuestro sitio web y
            aplicaciones. Al usar la plataforma, aceptas las prácticas aquí descritas.
          </p>
        </div>

        <div className="space-y-8 text-gray-700">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Responsable del tratamiento</h2>
            <p>
              El responsable del tratamiento de tus datos es <strong>[RAZÓN SOCIAL]</strong>, NIT{' '}
              <strong>[NIT]</strong>, con domicilio en <strong>[DIRECCIÓN]</strong>, Guatemala. Para ejercer tus
              derechos o realizar consultas de privacidad, escríbenos a{' '}
              <a href="mailto:soporte@piums.io" className="text-[#FF6B35] hover:underline">soporte@piums.io</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Cambios a esta política</h2>
            <p>
              Podemos actualizar esta Política de Privacidad para reflejar cambios en el servicio o en la ley. Los
              cambios materiales se notificarán por correo o mediante aviso en la plataforma. La fecha de
              &ldquo;Última actualización&rdquo; indica la versión vigente; el uso continuado tras un cambio
              implica su aceptación.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Datos que recopilamos</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Identidad y perfil:</strong> nombre, nombre artístico, foto de perfil y portada,
                biografía, categorías/especialidades e intereses seleccionados al registrarte.
              </li>
              <li>
                <strong>Contacto:</strong> correo electrónico, teléfono (incluido WhatsApp de artistas), ciudad y país.
              </li>
              <li className="text-gray-900">
                <strong>Verificación de identidad (KYC) — datos sensibles:</strong> para verificar a los artistas
                recopilamos el <strong>tipo y número de documento</strong> (DPI, pasaporte o carné de residencia),
                <strong> imágenes del documento</strong> (frente y reverso), una <strong>fotografía de
                verificación (selfie)</strong> y la <strong>fecha de nacimiento</strong>. Estos datos se tratan con
                especial protección y las imágenes se almacenan como archivos privados de acceso restringido.
              </li>
              <li>
                <strong>Ubicación:</strong> direcciones que guardas, ciudad y, cuando lo autorizas,{' '}
                <strong>coordenadas GPS precisas</strong> (por ejemplo, la ubicación del evento al reservar o la
                ubicación en tiempo real del artista desde la app, usada para el cálculo de cobertura y cercanía).
              </li>
              <li>
                <strong>Datos de pago:</strong> marca de tarjeta, últimos 4 dígitos y fecha de vencimiento, además
                de un <strong>token del proveedor de pagos</strong>. <strong>No almacenamos el número completo de
                la tarjeta ni el CVV.</strong> Para artistas, la información necesaria para liquidar sus pagos.
              </li>
              <li>
                <strong>Datos de uso técnico y seguridad:</strong> dirección IP, tipo de navegador (user-agent),
                identificadores de dispositivo y de sesión, tokens de notificaciones push (FCM), fechas de inicio
                de sesión e historial de búsquedas dentro de la plataforma. Los usamos para operar el servicio,
                prevenir fraude y mantener registros de seguridad.
              </li>
              <li>
                <strong>Contenido que generas:</strong> mensajes de chat, reseñas y fotos de reseñas, portafolios
                (imágenes, video, audio), notas de reservas y evidencia en disputas.
              </li>
              <li>
                <strong>Datos de redes sociales:</strong> si inicias sesión con un tercero (ver sección 4) o los
                enlaces sociales que agregues a tu perfil.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Inicio de sesión con terceros (OAuth)</h2>
            <p>
              Puedes registrarte o iniciar sesión con <strong>Google</strong>, <strong>Facebook</strong> o{' '}
              <strong>TikTok</strong>. Según el proveedor, recibimos datos básicos como tu identificador de cuenta,
              nombre, correo (TikTok no comparte correo) y foto de perfil. Si conectas <strong>Google
              Calendar</strong>, almacenamos los tokens necesarios para sincronizar tus reservas; puedes revocar
              este acceso en cualquier momento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Finalidades del tratamiento</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Crear y administrar tu cuenta y perfil.</li>
              <li>Verificar la identidad de los artistas (KYC) y prevenir fraude.</li>
              <li>Facilitar reservas, pagos, mensajería, reseñas y liquidaciones.</li>
              <li>Mostrar artistas relevantes según cercanía e intereses (ver sección 6 y el Aviso de Sistemas Automatizados).</li>
              <li>Enviarte notificaciones y correos transaccionales (verificación, confirmaciones, recordatorios).</li>
              <li>Cumplir obligaciones legales, contables y tributarias.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Con quién compartimos tus datos</h2>
            <p className="mb-3">
              No vendemos tus datos. Los compartimos únicamente con proveedores que nos ayudan a operar el
              servicio (encargados del tratamiento), y solo lo necesario para su función:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-3 border border-gray-200">Proveedor</th>
                    <th className="text-left p-3 border border-gray-200">Para qué</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="p-3 border border-gray-200">Tilopay, Stripe</td><td className="p-3 border border-gray-200">Procesamiento de pagos y liquidaciones (tarjeta tokenizada)</td></tr>
                  <tr className="bg-gray-50"><td className="p-3 border border-gray-200">Cloudinary</td><td className="p-3 border border-gray-200">Alojamiento de imágenes y videos, incluidos los documentos de verificación (privados)</td></tr>
                  <tr><td className="p-3 border border-gray-200">Firebase / FCM (Google)</td><td className="p-3 border border-gray-200">Notificaciones push e inicio de sesión con Google</td></tr>
                  <tr className="bg-gray-50"><td className="p-3 border border-gray-200">Resend / SendGrid</td><td className="p-3 border border-gray-200">Envío de correos transaccionales</td></tr>
                  <tr><td className="p-3 border border-gray-200">Twilio</td><td className="p-3 border border-gray-200">Envío de mensajes SMS (cuando aplica)</td></tr>
                  <tr className="bg-gray-50"><td className="p-3 border border-gray-200">Google, Facebook, TikTok</td><td className="p-3 border border-gray-200">Inicio de sesión con terceros (OAuth)</td></tr>
                  <tr><td className="p-3 border border-gray-200">OpenStreetMap / Nominatim</td><td className="p-3 border border-gray-200">Geocodificación y mapas de ubicación</td></tr>
                  <tr className="bg-gray-50"><td className="p-3 border border-gray-200">Proveedores de infraestructura y respaldos</td><td className="p-3 border border-gray-200">Alojamiento de la plataforma y copias de seguridad cifradas</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3">
              También podemos divulgar datos cuando la ley lo exija o para proteger derechos, seguridad o prevenir
              fraude. Algunos proveedores pueden procesar datos fuera de Guatemala; en tales casos procuramos
              salvaguardas adecuadas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Retención de datos</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Datos de tu cuenta: mientras la cuenta esté activa y hasta <strong>30 días</strong> después de solicitar su eliminación.</li>
              <li>Documentos de verificación (KYC) y registros de pagos/facturación: por el plazo que exijan las obligaciones contables y tributarias de Guatemala (por lo general varios años).</li>
              <li>Registros de seguridad y auditoría: por el tiempo necesario para fines de seguridad y prevención de fraude.</li>
            </ul>
            <p className="mt-3 text-sm text-gray-500">
              Al eliminar tu cuenta, anonimizamos o borramos tus datos personales salvo aquello que debamos
              conservar por obligación legal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Seguridad</h2>
            <p>
              Aplicamos medidas técnicas y organizativas razonables: cifrado en tránsito (HTTPS), tokenización de
              datos de tarjeta, acceso restringido a documentos de verificación, contraseñas con hash y controles
              de acceso. Ningún sistema es 100% infalible, pero trabajamos para proteger tu información.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Tus derechos</h2>
            <p>
              Puedes solicitar acceder, rectificar, actualizar o eliminar tus datos, así como oponerte a ciertos
              tratamientos o solicitar una copia de tu información. Puedes eliminar tu cuenta desde la aplicación o
              escribiendo a{' '}
              <a href="mailto:soporte@piums.io" className="text-[#FF6B35] hover:underline">soporte@piums.io</a>.
              Atenderemos tu solicitud conforme a la ley aplicable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Menores de edad</h2>
            <p>
              La plataforma está dirigida a personas mayores de <strong>18 años</strong>. No recopilamos
              intencionalmente datos de menores; si detectamos una cuenta de un menor, la eliminaremos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Cookies y tecnologías similares</h2>
            <p>
              Utilizamos cookies y almacenamiento local <strong>estrictamente necesarios</strong> para el
              funcionamiento del servicio: mantener tu sesión iniciada, seguridad y preferencias. Actualmente{' '}
              <strong>no utilizamos cookies de analítica ni de publicidad de terceros</strong>. Si esto cambia,
              actualizaremos esta política y, cuando corresponda, solicitaremos tu consentimiento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Contacto</h2>
            <p>
              Para consultas sobre privacidad o para ejercer tus derechos, escríbenos a{' '}
              <a href="mailto:soporte@piums.io" className="text-[#FF6B35] hover:underline">soporte@piums.io</a>.
            </p>
          </section>

        </div>
      </div>
      <Footer />
    </div>
  );
}
