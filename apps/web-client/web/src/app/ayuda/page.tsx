import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function AyudaPage() {
  const faqs = [
    {
      q: '¿Cómo funciona Piums?',
      a: 'Piums conecta clientes con artistas profesionales. Busca el artista o servicio que necesitas, elige fecha y hora, y confirma tu reserva en minutos. El artista recibirá una notificación y aceptará tu solicitud.',
    },
    {
      q: '¿Cómo confirmo mi reserva?',
      a: 'Una vez que selecciones servicio, fecha y proporciones tu ubicación, podrás revisar todos los detalles y confirmar. Recibirás un correo de confirmación con el código de tu reserva.',
    },
    {
      q: '¿Puedo cancelar una reserva?',
      a: 'Sí. Puedes cancelar gratuitamente hasta 48 horas antes del evento. Entre 24 y 48 horas se aplica un cargo del 25%. No hay reembolso con menos de 24 horas.',
    },
    {
      q: '¿Cómo me registro como artista?',
      a: 'Ve a "Registrarse como Artista" en el footer o en la página de registro. Completa tu perfil, agrega tus servicios y precios. Revisamos cada perfil antes de publicarlo.',
    },
    {
      q: '¿Los pagos son seguros?',
      a: 'Sí. Los pagos se procesan a través de pasarelas de pago certificadas con cifrado SSL. Nunca almacenamos tus datos de tarjeta en nuestros servidores.',
    },
    {
      q: '¿Cómo puedo dejar una reseña?',
      a: 'Una vez que el servicio se haya completado, podrás dejar una reseña desde la sección "Mis Reservas" en tu perfil.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Centro de Ayuda</h1>
        <p className="text-gray-500 mb-12">Encuentra respuestas a las preguntas más frecuentes sobre la plataforma.</p>

        {/* How it works */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">¿Cómo funciona?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Busca', desc: 'Encuentra artistas por categoría, disponibilidad y ubicación.' },
              { step: '2', title: 'Reserva', desc: 'Elige fecha, hora y confirma los detalles de tu evento.' },
              { step: '3', title: 'Disfruta', desc: 'El artista se presenta y crea una experiencia inolvidable.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                <div className="h-12 w-12 bg-[#FF6B35] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  {step}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Preguntas Frecuentes</h2>
          <div className="space-y-4">
            {faqs.map(({ q, a }) => (
              <div key={q} className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{q}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact CTA */}
        <div className="mt-12 bg-orange-50 border border-orange-100 rounded-xl p-6 text-center">
          <p className="text-gray-700 font-medium mb-2">¿No encontraste lo que buscabas?</p>
          <p className="text-gray-500 text-sm mb-4">Nuestro equipo está disponible para ayudarte.</p>
          <a href="/contacto" className="inline-block bg-[#FF6B35] text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-orange-600 transition text-sm">
            Contactar soporte
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
