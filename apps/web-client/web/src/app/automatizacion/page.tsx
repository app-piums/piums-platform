import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sistemas Automatizados e Inteligencia Artificial | Piums',
  description: 'Cómo Piums usa sistemas automatizados (moderación y recomendaciones) y su postura sobre inteligencia artificial.',
};

export default function AutomatizacionPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Sistemas Automatizados e Inteligencia Artificial</h1>
          <p className="text-sm text-gray-400">Última actualización: julio 2026</p>
          <p className="mt-4 text-gray-600">
            En Piums creemos en la transparencia sobre cómo funciona la plataforma. Aquí te explicamos qué procesos
            automáticos usamos, cómo pueden afectarte y cuál es nuestra postura respecto a la inteligencia
            artificial (IA).
          </p>
        </div>

        <div className="space-y-8 text-gray-700">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Uso de inteligencia artificial</h2>
            <p>
              <strong>Actualmente Piums no utiliza inteligencia artificial ni modelos de aprendizaje automático
              (machine learning) para operar el servicio.</strong> Los procesos automáticos que describimos abajo
              se basan en <strong>reglas deterministas</strong> (por ejemplo, comparación de palabras o un cálculo
              de puntaje), no en IA.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Moderación de contenido</h2>
            <p>
              Para mantener un entorno seguro, revisamos automáticamente ciertos textos que publicas (mensajes,
              reseñas, biografías, nombres de usuario, notas) comparándolos con una <strong>lista de palabras
              prohibidas</strong> administrada por nuestro equipo. Según la gravedad, el sistema puede, de forma
              automática:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Censurar</strong> palabras (reemplazándolas por asteriscos).</li>
              <li><strong>Rechazar</strong> la publicación del contenido.</li>
              <li>Registrar una <strong>sanción (strike)</strong> en tu cuenta.</li>
              <li>Enviar los casos más graves a <strong>revisión de un administrador (humano)</strong>.</li>
            </ul>
            <p className="mt-3">
              La suspensión o baneo de una cuenta <strong>no es automática</strong>: la decide una persona de
              nuestro equipo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Recomendación de artistas</h2>
            <p>
              La sección de artistas recomendados ordena a los artistas mediante un <strong>puntaje
              automático</strong> que combina, aproximadamente: <strong>cercanía</strong> a tu ubicación,
              coincidencia con tus <strong>intereses</strong> y <strong>calidad</strong> (calificaciones, reseñas y
              reservas del artista). También aplicamos filtros básicos (por ejemplo, mostrar solo artistas
              verificados y activos, con servicios disponibles). Este orden influye en qué artistas ves primero.
              No es una decisión con efectos legales sobre ti y no reemplaza tu criterio al elegir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Reclamos y disputas: siempre revisión humana</h2>
            <p>
              Las decisiones importantes que afectan derechos —como resolver un reclamo, aprobar reembolsos o
              suspender una cuenta— <strong>las toman personas</strong>, no un sistema automático. Consulta el
              proceso en nuestra{' '}
              <a href="/reclamos" className="text-[#FF6B35] hover:underline">Política de Reclamos y Disputas</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Uso futuro de IA</h2>
            <p>
              Es posible que en el futuro incorporemos <strong>inteligencia artificial, incluida IA
              generativa</strong>, para mejorar funciones como recomendaciones, búsqueda, moderación, generación
              de contenido de apoyo o atención al usuario. Si lo hacemos, nos comprometemos a:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Informarlo y actualizar este aviso y, cuando corresponda, nuestra Política de Privacidad.</li>
              <li>Mantener <strong>supervisión humana</strong> en las decisiones que afecten derechos de las personas.</li>
              <li>No tomar decisiones con efectos legales o similarmente significativos <strong>únicamente</strong> de forma automatizada sin posibilidad de revisión.</li>
              <li>Ser claros sobre qué datos se utilizan si la IA los procesa o se usa para entrenarla.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Tus opciones</h2>
            <p>
              Si consideras que un proceso automático te afectó de forma incorrecta (por ejemplo, contenido
              rechazado por error), puedes solicitar una <strong>revisión humana</strong> escribiéndonos a{' '}
              <a href="mailto:soporte@piums.io" className="text-[#FF6B35] hover:underline">soporte@piums.io</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Cambios a este aviso</h2>
            <p>
              Podemos actualizar este aviso conforme evolucione la plataforma. La fecha de &ldquo;Última
              actualización&rdquo; indica la versión vigente.
            </p>
          </section>

        </div>
      </div>
      <Footer />
    </div>
  );
}
