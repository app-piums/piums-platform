import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const posts = [
  {
    slug: 'como-contratar-artista',
    title: 'Cómo elegir al artista perfecto para tu evento',
    excerpt: 'Te compartimos los factores clave que debes considerar al buscar un artista: presupuesto, estilo, experiencia y más.',
    date: '15 de marzo, 2026',
    category: 'Consejos',
    readTime: '4 min',
  },
  {
    slug: 'tendencias-eventos-2026',
    title: 'Tendencias en eventos y entretenimiento para 2026',
    excerpt: 'Desde shows inmersivos hasta experiencias interactivas, descubre qué está marcando la pauta este año.',
    date: '8 de marzo, 2026',
    category: 'Tendencias',
    readTime: '6 min',
  },
  {
    slug: 'artistas-bodas',
    title: '5 tipos de artistas que no pueden faltar en una boda',
    excerpt: 'Más allá de la música, hay muchas formas de sorprender a tus invitados. Aquí nuestras recomendaciones.',
    date: '1 de marzo, 2026',
    category: 'Bodas',
    readTime: '5 min',
  },
  {
    slug: 'tips-artistas-piums',
    title: 'Cómo destacar tu perfil como artista en Piums',
    excerpt: 'Optimiza tu perfil, agrega fotos de calidad y consigue más reservas con estos consejos prácticos.',
    date: '20 de febrero, 2026',
    category: 'Para Artistas',
    readTime: '3 min',
  },
];

const categoryColors: Record<string, string> = {
  'Consejos': 'bg-blue-100 text-blue-700',
  'Tendencias': 'bg-purple-100 text-purple-700',
  'Bodas': 'bg-pink-100 text-pink-700',
  'Para Artistas': 'bg-orange-100 text-[#FF6B35]',
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Blog de Piums</h1>
          <p className="text-gray-500 text-lg">Consejos, tendencias e inspiración para clientes y artistas.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post) => (
            <article key={post.slug} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition group">
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${categoryColors[post.category] || 'bg-gray-100 text-gray-600'}`}>
                  {post.category}
                </span>
                <span className="text-xs text-gray-400">{post.readTime} de lectura</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[#FF6B35] transition leading-snug">
                {post.title}
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{post.excerpt}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{post.date}</span>
                <span className="text-sm font-medium text-[#FF6B35] group-hover:underline">Leer más →</span>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-400 text-sm">Más artículos próximamente.</p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
