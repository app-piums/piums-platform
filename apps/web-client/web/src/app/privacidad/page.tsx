import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad | Piums',
  description: 'Política de Privacidad de la plataforma Piums.',
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Política de Privacidad</h1>
          <p className="text-sm text-gray-400">Última actualización: abril 2026</p>
          <p className="mt-4 text-gray-600">
            En <strong>Piums</strong> nos tomamos en serio la privacidad de nuestros usuarios. Esta política
            explica qué datos recopilamos, cómo los usamos y cuáles son tus derechos.
          </p>
        </div>

        <div className="space-y-8 text-gray-700">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Responsable del tratamiento</h2>
            <p>
              <strong>Piums S.A.</strong> es el responsable del tratamiento de tus datos personales.<br />
              Correo de contacto:{' '}
              <a href="mailto:soporte@piums.io" className="text-[#FF6B35] hover:underline">soporte@piums.io</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Datos que recopilamos</h2>
            <p className="mb-3">Recopilamos los siguientes tipos de datos:</p>

            <div className="space-y-3">
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-1">Datos de registro</h3>
                <p className="text-sm">
                  Nombre, correo electrónico, número de teléfono y contraseña (almacenada de forma
                  cifrada). Si te registras mediante Google o TikTok, recibimos el nombre, correo
                  electrónico y foto de perfil públicos que ese servicio nos proporciona.
                </p>
              </div>

              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-1">Datos de perfil del artista</h3>
                <p className="text-sm">
                  Biografía, categoría artística, ciudad, fotos de perfil y portada, precio base,
                  años de experiencia, enlaces a redes sociales (Instagram, Facebook, YouTube, TikTok,
                  sitio web) y portafolio de imágenes.
                </p>
              </div>

              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-1">Datos de transacciones</h3>
                <p className="text-sm">
                  Historial de reservas, servicios contratados, fechas, montos y estado del pago.
                  Los datos completos de tarjetas bancarias los gestiona directamente nuestro procesador
                  de pagos (Stripe) y no son almacenados en los servidores de Piums.
                </p>
              </div>

              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-1">Datos de uso</h3>
                <p className="text-sm">
                  Dirección IP, tipo de navegador, páginas visitadas, duración de la sesión y acciones
                  realizadas en la plataforma, para análisis interno y mejora del servicio.
                </p>
              </div>

              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-1">Archivos multimedia</h3>
                <p className="text-sm">
                  Las imágenes que subes (foto de perfil, foto de portada, portafolio) se almacenan en
                  Cloudinary, un servicio seguro de gestión de medios en la nube.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Inicio de sesión con terceros (OAuth)</h2>
            <p className="mb-3">
              Piums ofrece la opción de iniciar sesión con <strong>Google</strong> y <strong>TikTok</strong>.
              Cuando usas estas opciones:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>TikTok Login:</strong> recibimos únicamente el identificador de usuario de TikTok,
                nombre de pantalla y correo electrónico (si TikTok lo proporciona). <em>No</em> accedemos
                a tus videos, seguidores, mensajes ni a ninguna acción en tu cuenta de TikTok.
              </li>
              <li>
                <strong>Google:</strong> recibimos tu nombre, correo electrónico y foto de perfil pública
                de tu cuenta de Google.
              </li>
              <li>
                En ningún caso publicamos contenido en tus redes sociales sin tu autorización explícita.
              </li>
              <li>
                Puedes revocar el acceso en cualquier momento desde la configuración de seguridad de
                Google o TikTok, o eliminando tu cuenta en Piums.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Finalidades del tratamiento</h2>
            <p>Usamos tus datos para:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Crear y gestionar tu cuenta de usuario.</li>
              <li>Procesar reservas y pagos entre clientes y artistas.</li>
              <li>Enviarte notificaciones transaccionales (confirmaciones, recordatorios, cambios).</li>
              <li>Personalizar los resultados de búsqueda y recomendaciones.</li>
              <li>Mejorar la plataforma mediante análisis estadístico anonimizado.</li>
              <li>
                Enviarte comunicaciones de marketing (solo si has dado tu consentimiento; puedes
                cancelar la suscripción en cualquier momento).
              </li>
              <li>Cumplir con obligaciones legales y resolver disputas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Compartir información con terceros</h2>
            <p className="mb-3">
              <strong>No vendemos ni alquilamos</strong> tus datos personales. Compartimos información únicamente con:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Artistas:</strong> cuando realizas una reserva, el artista recibe tu nombre,
                número de contacto y detalles del evento para poder prestar el servicio.
              </li>
              <li>
                <strong>Stripe:</strong> procesador de pagos. Consulta su política de privacidad en
                stripe.com/privacy.
              </li>
              <li>
                <strong>Cloudinary:</strong> almacenamiento de imágenes. Consulta su política en
                cloudinary.com/privacy.
              </li>
              <li>
                <strong>Proveedores de autenticación (Google, TikTok):</strong> solo el intercambio
                de tokens necesario para autenticar tu sesión.
              </li>
              <li>
                <strong>Autoridades competentes:</strong> cuando la ley lo exija o para proteger
                derechos legítimos de Piums o sus usuarios.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Retención de datos</h2>
            <p>
              Conservamos tus datos mientras tu cuenta esté activa o mientras sea necesario para
              prestar los servicios. Si eliminas tu cuenta, tus datos personales se borran en un plazo
              de 30 días, salvo los registros contables que deban conservarse por obligación legal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Seguridad</h2>
            <p>
              Aplicamos medidas técnicas y organizativas apropiadas (cifrado TLS, contraseñas hasheadas,
              acceso restringido a servidores) para proteger tus datos. Sin embargo, ninguna transmisión
              por internet es 100 % segura. En caso de brecha de seguridad que te afecte, te
              notificaremos en el plazo que exija la normativa aplicable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Tus derechos</h2>
            <p className="mb-3">Tienes los siguientes derechos sobre tus datos personales:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Acceso:</strong> solicitar una copia de los datos que tenemos sobre ti.</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
              <li><strong>Supresión:</strong> pedir que eliminemos tus datos ("derecho al olvido").</li>
              <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado y legible.</li>
              <li>
                <strong>Oposición y limitación:</strong> oponerte a ciertos tratamientos o solicitar
                su limitación.
              </li>
            </ul>
            <p className="mt-3">
              Para ejercer cualquiera de estos derechos, escríbenos a{' '}
              <a href="mailto:soporte@piums.io" className="text-[#FF6B35] hover:underline">soporte@piums.io</a>{' '}
              indicando tu nombre completo y la solicitud. Responderemos en un plazo máximo de 30 días.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Cookies y tecnologías similares</h2>
            <p>
              Usamos cookies propias y de terceros para autenticación, preferencias de usuario y
              análisis de uso. Puedes gestionar las cookies desde la configuración de tu navegador.
              Consulta nuestra{' '}
              <a href="/cookies" className="text-[#FF6B35] hover:underline">Política de Cookies</a>{' '}
              para más detalles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Cambios a esta política</h2>
            <p>
              Podemos actualizar esta política periódicamente. Te notificaremos de cambios
              significativos por correo electrónico o mediante un aviso en la plataforma. La fecha
              de "última actualización" al inicio del documento indica cuándo fue revisada por última vez.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contacto</h2>
            <p>
              Si tienes dudas, preguntas o deseas ejercer tus derechos, contáctanos en:{' '}
              <a href="mailto:soporte@piums.io" className="text-[#FF6B35] hover:underline">soporte@piums.io</a>
            </p>
          </section>

        </div>
      </div>
      <Footer />
    </div>
  );
}
