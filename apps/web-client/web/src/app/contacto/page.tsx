import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function ContactoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Contáctanos</h1>
          <p className="text-gray-500 text-lg">Estamos aquí para ayudarte. Elige el canal que prefieras.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {[
            {
              icon: (
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              ),
              title: 'Email',
              value: 'hola@piums.com',
              href: 'mailto:hola@piums.com',
              sub: 'Respuesta en menos de 24h',
            },
            {
              icon: (
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              ),
              title: 'Chat en vivo',
              value: 'Abrir chat',
              href: '/chat',
              sub: 'Lun–Vie, 9:00–18:00',
            },
            {
              icon: (
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
              ),
              title: 'Centro de ayuda',
              value: 'Ver preguntas frecuentes',
              href: '/ayuda',
              sub: 'Disponible 24/7',
            },
          ].map(({ icon, title, value, href, sub }) => (
            <a key={title} href={href} className="bg-white rounded-xl border border-gray-200 p-6 text-center hover:shadow-md transition group">
              <div className="h-14 w-14 bg-orange-50 text-[#FF6B35] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#FF6B35] group-hover:text-white transition">
                {icon}
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
              <p className="text-[#FF6B35] font-medium text-sm mb-1">{value}</p>
              <p className="text-gray-400 text-xs">{sub}</p>
            </a>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Envíanos un mensaje</h2>
          <form className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input type="text" placeholder="Tu nombre" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
                <input type="email" placeholder="tu@email.com" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
              <input type="text" placeholder="¿En qué podemos ayudarte?" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
              <textarea rows={4} placeholder="Cuéntanos más sobre tu consulta..." className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] resize-none" />
            </div>
            <button type="submit" className="w-full bg-[#FF6B35] text-white font-semibold py-3 rounded-xl hover:bg-orange-600 transition">
              Enviar mensaje
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
