import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function NosotrosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-4">Sobre <span className="text-[#FF6A00]">Piums</span></h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Conectamos el talento artístico con quienes buscan crear experiencias únicas e inolvidables.
          </p>
        </div>
      </section>

      {/* Misión */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nuestra Misión</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Creemos que cada evento merece el mejor talento. Piums nació para eliminar las barreras entre artistas profesionales y las personas que quieren hacer de sus celebraciones algo especial.
            </p>
          </div>
          <div className="bg-orange-50 rounded-2xl p-8 text-center">
            <p className="text-6xl font-bold text-[#FF6A00]">+500</p>
            <p className="text-gray-600 mt-2">Artistas verificados</p>
            <p className="text-6xl font-bold text-[#FF6A00] mt-6">+2,000</p>
            <p className="text-gray-600 mt-2">Eventos realizados</p>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Nuestros Valores</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Confianza', desc: 'Todos los artistas pasan por un proceso de verificación para garantizar la calidad y profesionalismo.' },
              { title: 'Transparencia', desc: 'Precios claros, sin sorpresas. Sabes exactamente lo que pagas antes de confirmar.' },
              { title: 'Comunidad', desc: 'Apoyamos el crecimiento de artistas locales y fomentamos conexiones duraderas.' },
            ].map(({ title, desc }) => (
              <div key={title} className="text-center p-6 rounded-xl border border-gray-100">
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="h-5 w-5 bg-[#FF6A00] rounded-full" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#FF6A00] py-16 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">¿Listo para crear algo memorable?</h2>
          <p className="text-orange-100 mb-8">Explora nuestro catálogo de artistas y encuentra el talento perfecto para tu próximo evento.</p>
          <a href="/artists" className="inline-block bg-white text-[#FF6A00] font-semibold px-8 py-3 rounded-xl hover:bg-orange-50 transition">
            Explorar Artistas
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
