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
          <p className="text-sm text-gray-400">Última actualización: julio 2026</p>
          <p className="mt-4 text-gray-600">
            Bienvenido a <strong>Piums</strong>. Al acceder o utilizar nuestra plataforma, aceptas quedar vinculado
            por los presentes Términos y Condiciones y por nuestra{' '}
            <a href="/privacidad" className="text-[#FF6B35] hover:underline">Política de Privacidad</a>. Léelos
            detenidamente antes de usar el servicio. Si no estás de acuerdo, no utilices la plataforma.
          </p>
        </div>

        <div className="space-y-8 text-gray-700">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Información de la empresa</h2>
            <p>
              Piums es una plataforma digital operada por <strong>[RAZÓN SOCIAL]</strong>, con NIT{' '}
              <strong>[NIT]</strong> y domicilio en <strong>[DIRECCIÓN]</strong>, República de Guatemala
              (en adelante, &ldquo;Piums&rdquo;, &ldquo;nosotros&rdquo; o &ldquo;la plataforma&rdquo;). Para
              cualquier consulta legal o de privacidad puedes escribirnos a{' '}
              <a href="mailto:soporte@piums.io" className="text-[#FF6B35] hover:underline">soporte@piums.io</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Aceptación y cambios a estos Términos</h2>
            <p>
              El uso de la plataforma implica la aceptación plena de estos Términos. Piums puede modificarlos en
              cualquier momento para reflejar cambios en el servicio, la ley o nuestras prácticas. Los cambios
              materiales se notificarán por correo electrónico o mediante aviso visible en la plataforma con al
              menos <strong>15 días de anticipación</strong> a su entrada en vigor. La fecha de
              &ldquo;Última actualización&rdquo; al inicio indica la versión vigente. El uso continuado del
              servicio tras la entrada en vigor de los cambios constituye tu aceptación de los nuevos Términos;
              si no los aceptas, debes dejar de usar la plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Descripción del servicio</h2>
            <p>
              Piums es una plataforma en línea que conecta a clientes con artistas y prestadores de servicios
              creativos (músicos, DJ, fotógrafos, videógrafos, diseñadores, entre otros) para la contratación de
              servicios. Piums actúa <strong>únicamente como intermediario tecnológico</strong> que facilita el
              contacto, la reserva y el pago: no es parte del contrato de servicios entre el cliente y el artista,
              no emplea a los artistas ni garantiza la calidad, seguridad o legalidad de los servicios prestados
              por ellos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Elegibilidad y registro</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Debes tener al menos <strong>18 años</strong> de edad y capacidad legal para contratar.</li>
              <li>
                Proporcionas información veraz, completa y actualizada. El uso de datos falsos puede resultar en la
                suspensión inmediata de tu cuenta.
              </li>
              <li>
                Puedes registrarte con correo electrónico o mediante servicios de terceros como{' '}
                <strong>Google, Facebook o TikTok</strong>. Al usarlos, también aceptas sus términos respectivos.
              </li>
              <li>
                Los artistas deben completar un proceso de <strong>verificación de identidad (KYC)</strong>, que
                incluye documento de identidad (DPI, pasaporte o carné de residencia) y una fotografía de
                verificación. Ver el tratamiento de estos datos en la{' '}
                <a href="/privacidad" className="text-[#FF6B35] hover:underline">Política de Privacidad</a>.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Cuenta y seguridad</h2>
            <p>
              Eres el único responsable de mantener la confidencialidad de tus credenciales y de toda actividad
              que ocurra en tu cuenta. Debes notificarnos de inmediato cualquier uso no autorizado. Piums puede
              suspender o cerrar cuentas que incumplan estos Términos, sin perjuicio de las acciones legales
              correspondientes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Reservas y pagos</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Una reserva se confirma cuando el artista la acepta expresamente y el pago es autorizado
                correctamente.
              </li>
              <li>
                Los pagos con tarjeta son procesados por proveedores externos: <strong>Tilopay</strong>{' '}
                (procesador principal en Guatemala y Latinoamérica) y <strong>Stripe</strong> (respaldo y pagos
                internacionales). <strong>Piums no almacena el número completo ni el CVV de tu tarjeta</strong>;
                los datos se tokenizan de forma segura en el proveedor.
              </li>
              <li>
                Al reservar, el importe puede <strong>pre-autorizarse</strong> en tu tarjeta y capturarse
                (cobrarse) una vez cumplidas las condiciones de la reserva. Los detalles del cobro y de la
                comisión se muestran antes de confirmar.
              </li>
              <li>
                Los precios se expresan en <strong>dólares estadounidenses (USD)</strong> salvo indicación
                contraria.
              </li>
              <li>
                Piums cobra una <strong>comisión de servicio</strong> sobre las transacciones, que se especifica
                antes de confirmar la reserva. Los pagos a los artistas se liquidan conforme a las políticas de
                pago de la plataforma.
              </li>
            </ul>
          </section>

          <section>
            <h2 id="cancelacion" className="text-xl font-semibold text-gray-900 mb-3">7. Cancelación y reembolsos</h2>
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
                    <td className="p-3 border border-gray-200">El cliente cancela dentro de las primeras 48 horas desde la creación de la reserva</td>
                    <td className="p-3 border border-gray-200 text-green-700 font-medium">Cancelación gratuita — sin cargo</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-3 border border-gray-200">El cliente cancela pasadas las 48 horas (reserva ya cobrada)</td>
                    <td className="p-3 border border-gray-200 text-yellow-700 font-medium">Reembolso del 50% del total pagado</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-gray-200">El artista cancela la reserva</td>
                    <td className="p-3 border border-gray-200 text-green-700 font-medium">Reembolso completo + crédito de compensación en la plataforma</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              El período de cancelación gratuita de 48 horas corre desde el momento en que se crea la reserva,
              independientemente de si el artista ya la confirmó. Los reembolsos se procesan a través del mismo
              medio de pago original y pueden tardar varios días hábiles según el proveedor y el banco emisor.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Reclamos y disputas</h2>
            <p>
              Si tienes un problema con un servicio reservado (incumplimiento, ausencia, calidad, cobros), puedes
              abrir un reclamo desde la plataforma. Al abrir una disputa sobre una reserva, el pago al artista
              queda <strong>retenido</strong> hasta su resolución. Las disputas son <strong>revisadas y
              resueltas por personal humano de Piums</strong> (no de forma automatizada). El procedimiento
              completo, plazos y posibles resultados (reembolso total o parcial, crédito, advertencia, suspensión
              o baneo del artista) se describen en nuestra{' '}
              <a href="/reclamos" className="text-[#FF6B35] hover:underline">Política de Reclamos y Disputas</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Resolución de controversias y arbitraje</h2>
            <p>
              Antes de acudir a cualquier instancia formal, las partes procurarán resolver de buena fe cualquier
              controversia a través del sistema de reclamos de la plataforma y del contacto directo con Piums.
            </p>
            <p className="mt-3">
              Cualquier controversia derivada de estos Términos que no se resuelva de forma amistosa se someterá,
              a elección de Piums, a <strong>arbitraje de derecho</strong> administrado por un centro de arbitraje
              reconocido en Guatemala (p. ej. el Centro de Resolución de Conflictos correspondiente), conforme a
              su reglamento, con sede en la ciudad de Guatemala y en idioma español; o bien a los{' '}
              <strong>tribunales competentes de la ciudad de Guatemala</strong>. En todo caso, las partes renuncian
              a cualquier otro fuero que pudiera corresponderles.
            </p>
            <p className="mt-3 text-sm text-gray-500">
              Nota: la elección de arbitraje y la sede específica deben ser confirmadas por asesoría legal antes
              de su publicación definitiva.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Obligaciones del artista</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Proporcionar información veraz sobre sus servicios, precios, experiencia y disponibilidad.</li>
              <li>Prestar el servicio acordado con profesionalismo y en las condiciones pactadas.</li>
              <li>No subcontratar el servicio sin previo aviso y consentimiento del cliente.</li>
              <li>
                Cumplir con las leyes tributarias y laborales aplicables. Piums no es el empleador del artista ni
                retiene impuestos por cuenta de él.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Conducta del usuario</h2>
            <p>Al usar Piums te comprometes a:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>No publicar contenido falso, engañoso, ofensivo, discriminatorio o que infrinja derechos de terceros.</li>
              <li>No intentar acceder sin autorización a sistemas, datos o cuentas ajenas.</li>
              <li>No utilizar la plataforma para actividades ilegales o fraudulentas.</li>
              <li>No usar herramientas automatizadas (bots, scrapers) sin autorización escrita de Piums.</li>
              <li>No eludir las comisiones ni trasladar la transacción fuera de la plataforma para evitar tarifas.</li>
            </ul>
            <p className="mt-3">
              El incumplimiento puede resultar en la censura del contenido, sanciones (strikes), suspensión o
              eliminación permanente de tu cuenta, sin perjuicio de las acciones legales correspondientes. Ver
              cómo operan nuestros sistemas de moderación y recomendación en el{' '}
              <a href="/automatizacion" className="text-[#FF6B35] hover:underline">Aviso de Sistemas Automatizados</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Contenido de usuario y propiedad intelectual</h2>
            <p>
              Todo el contenido propio de la plataforma (diseño, código, logotipos, textos) es propiedad de Piums
              o sus licenciantes y está protegido por las leyes de propiedad intelectual.
            </p>
            <p className="mt-3">
              Los usuarios y artistas <strong>conservan la titularidad</strong> del contenido que suben (fotos,
              videos, portafolios, reseñas). Al subirlo, otorgan a Piums una <strong>licencia mundial, no
              exclusiva, libre de regalías</strong> para alojarlo, mostrarlo y promocionarlo dentro de la
              plataforma y sus canales de difusión, con fines operativos y promocionales. Declaras que cuentas con
              los derechos necesarios sobre el contenido que publicas.
            </p>
            <p className="mt-3">
              <strong>Reclamos por infracción de derechos de autor.</strong> Si consideras que contenido en la
              plataforma infringe tus derechos de propiedad intelectual, escríbenos a{' '}
              <a href="mailto:soporte@piums.io" className="text-[#FF6B35] hover:underline">soporte@piums.io</a>{' '}
              indicando: (i) tu identificación y datos de contacto; (ii) la obra presuntamente infringida; (iii) la
              URL o ubicación del contenido reportado; y (iv) una declaración de buena fe. Piums revisará el
              reclamo y podrá retirar o restringir el contenido correspondiente. La plataforma también dispone de
              mecanismos de reporte y de retiro de contenido por parte de los administradores.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Limitación de responsabilidad</h2>
            <p>
              Piums no garantiza la disponibilidad ininterrumpida del servicio ni la exactitud de todo el
              contenido publicado por los artistas. Al ser un intermediario, Piums no es responsable por el
              cumplimiento, la calidad o la seguridad de los servicios contratados entre usuarios. En la máxima
              medida permitida por la ley, Piums no será responsable por daños indirectos, incidentales,
              especiales o consecuentes derivados del uso de la plataforma o de la relación entre usuarios.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Indemnización</h2>
            <p>
              Aceptas mantener indemne a Piums, sus directores y colaboradores frente a cualquier reclamo, pérdida
              o gasto (incluidos honorarios legales razonables) derivado de tu uso de la plataforma, del contenido
              que publiques o del incumplimiento de estos Términos o de la ley.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">15. Ley aplicable</h2>
            <p>
              Estos Términos se rigen por las leyes de la República de Guatemala, sin perjuicio de lo previsto en
              la cláusula 9 sobre resolución de controversias.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">16. Contacto</h2>
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
