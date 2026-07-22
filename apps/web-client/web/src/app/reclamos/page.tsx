import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Reclamos y Disputas | Piums',
  description: 'Cómo presentar un reclamo o disputa sobre una reserva en Piums y cómo se resuelve.',
};

export default function ReclamosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Política de Reclamos y Disputas</h1>
          <p className="text-sm text-gray-400">Última actualización: julio 2026</p>
          <p className="mt-4 text-gray-600">
            Queremos que cada reserva salga bien. Si algo no cumple lo acordado, puedes abrir un reclamo desde la
            plataforma. Aquí te explicamos cómo funciona el proceso, quién lo resuelve y qué resultados son
            posibles. Esta política complementa nuestros{' '}
            <a href="/terminos" className="text-[#FF6B35] hover:underline">Términos y Condiciones</a>.
          </p>
        </div>

        <div className="space-y-8 text-gray-700">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Quién puede abrir un reclamo</h2>
            <p>
              El <strong>cliente</strong> que realizó la reserva puede abrir un reclamo o disputa sobre esa
              reserva, siempre que el servicio ya haya sido entregado o completado (o esté marcado como en
              disputa). Solo puede existir <strong>una disputa activa por reserva</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Motivos frecuentes</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Ausencia del artista (no se presentó).</li>
              <li>Cancelación indebida.</li>
              <li>Calidad del servicio distinta a lo ofrecido.</li>
              <li>Problemas con el reembolso o el cobro.</li>
              <li>Diferencias de precio o conducta inapropiada.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Cómo presentar un reclamo</h2>
            <p>
              Desde la reserva correspondiente en la aplicación, abre un reclamo indicando el <strong>asunto</strong>,
              una <strong>descripción</strong> del problema y, si la tienes, <strong>evidencia</strong> (fotos o
              documentos). También puedes escribirnos a{' '}
              <a href="mailto:soporte@piums.io" className="text-[#FF6B35] hover:underline">soporte@piums.io</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Qué ocurre al abrir la disputa</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>La reserva pasa a estado <strong>&ldquo;en disputa&rdquo;</strong>.</li>
              <li>
                El <strong>pago al artista queda retenido</strong> automáticamente mientras la disputa está
                abierta, para proteger a ambas partes.
              </li>
              <li>Nuestro equipo es alertado para revisar el caso.</li>
              <li>Cliente, artista y el equipo de Piums pueden intercambiar mensajes y evidencia dentro de la disputa.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Estados de la disputa</h2>
            <p>
              Una disputa avanza por los estados: <strong>Abierta → En revisión / Esperando información →
              Resuelta o Cerrada</strong>. Un caso complejo puede <strong>escalarse</strong> con mayor prioridad.
              Cada cambio de estado queda registrado.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Quién resuelve (revisión humana)</h2>
            <p>
              Las disputas son <strong>revisadas y resueltas por personal humano de Piums</strong>. No usamos
              decisiones automatizadas ni inteligencia artificial para resolver reclamos. El equipo valora la
              información y la evidencia de ambas partes antes de decidir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Posibles resultados</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-3 border border-gray-200">Resultado</th>
                    <th className="text-left p-3 border border-gray-200">Qué significa</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="p-3 border border-gray-200">Reembolso total</td><td className="p-3 border border-gray-200">Se devuelve el 100% del pago</td></tr>
                  <tr className="bg-gray-50"><td className="p-3 border border-gray-200">Reembolso parcial</td><td className="p-3 border border-gray-200">Se devuelve una parte del pago</td></tr>
                  <tr><td className="p-3 border border-gray-200">Crédito en la plataforma</td><td className="p-3 border border-gray-200">Compensación como saldo para futuras reservas</td></tr>
                  <tr className="bg-gray-50"><td className="p-3 border border-gray-200">Sin reembolso</td><td className="p-3 border border-gray-200">La reserva se resuelve a favor del artista</td></tr>
                  <tr><td className="p-3 border border-gray-200">Advertencia / suspensión / baneo</td><td className="p-3 border border-gray-200">Sanción al artista según la gravedad</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              Los reembolsos y créditos se procesan a través del proveedor de pagos original y pueden tardar
              varios días hábiles. Una vez resuelta la disputa, el pago retenido al artista se libera si
              corresponde.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Cambios a esta política</h2>
            <p>
              Podemos actualizar esta Política de Reclamos y Disputas. Los cambios materiales se notificarán en la
              plataforma; la fecha de &ldquo;Última actualización&rdquo; indica la versión vigente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Contacto</h2>
            <p>
              ¿Dudas sobre un reclamo? Escríbenos a{' '}
              <a href="mailto:soporte@piums.io" className="text-[#FF6B35] hover:underline">soporte@piums.io</a>.
            </p>
          </section>

        </div>
      </div>
      <Footer />
    </div>
  );
}
