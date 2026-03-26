import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const categories = [
  { name: 'Música en Vivo', icon: '🎵', desc: 'Bandas, guitarristas, pianistas y más.' },
  { name: 'DJ & Electrónica', icon: '🎧', desc: 'Para fiestas y eventos nocturnos.' },
  { name: 'Magia & Humor', icon: '🪄', desc: 'Magos, comediantes y animadores.' },
  { name: 'Danza', icon: '💃', desc: 'Ballet, contemporáneo, folklórico y más.' },
  { name: 'Fotografía', icon: '📸', desc: 'Captura cada momento especial.' },
  { name: 'Circo & Acrobacia', icon: '🎪', desc: 'Shows impactantes y únicos.' },
  { name: 'Arte & Pintura', icon: '🎨', desc: 'Artistas plásticos y performance en vivo.' },
  { name: 'Ceremonias', icon: '🎤', desc: 'Maestros de ceremonia y oficiales.' },
];

export default function CategoriasPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Categorías</h1>
          <p className="text-gray-500 text-lg">Encuentra el tipo de talento que necesitas para tu evento.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map(({ name, icon, desc }) => (
            <Link
              key={name}
              href={`/artists?category=${encodeURIComponent(name)}`}
              className="bg-white rounded-2xl border border-gray-200 p-6 text-center hover:shadow-md hover:border-[#FF6A00]/30 transition group"
            >
              <div className="text-4xl mb-3">{icon}</div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-[#FF6A00] transition">{name}</h3>
              <p className="text-xs text-gray-400 leading-snug">{desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/artists" className="inline-block bg-[#FF6A00] text-white font-semibold px-8 py-3 rounded-xl hover:bg-orange-600 transition">
            Ver todos los artistas
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
