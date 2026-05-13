import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Columna 1: Sobre Piums */}
          <div>
            <div className="mb-4">
              <Image 
                src="/logo-white.png" 
                alt="Piúms" 
                width={56} 
                height={56}
                className="h-14 w-auto"
                unoptimized
              />
            </div>
            <p className="text-sm text-gray-400 mb-4">
              La plataforma que conecta artistas profesionales con clientes que buscan servicios excepcionales para sus eventos.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>

          {/* Columna 2: Para Clientes */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Para Clientes</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/artists" className="text-sm hover:text-white transition-colors">
                  Buscar Artistas
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-sm hover:text-white transition-colors">
                  Crear Cuenta
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm hover:text-white transition-colors">
                  Mis Reservas
                </Link>
              </li>
              <li>
                <Link href="/ayuda" className="text-sm hover:text-white transition-colors">
                  Cómo Funciona
                </Link>
              </li>
              <li>
                <Link href="/categorias" className="text-sm hover:text-white transition-colors">
                  Categorías
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Para Artistas */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Para Artistas</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/register?role=artista" className="text-sm hover:text-white transition-colors">
                  Registrarse como Artista
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm hover:text-white transition-colors">
                  Panel de Control
                </Link>
              </li>
              <li>
                <Link href="/servicios" className="text-sm hover:text-white transition-colors">
                  Gestionar Servicios
                </Link>
              </li>
              <li>
                <Link href="/calendario" className="text-sm hover:text-white transition-colors">
                  Disponibilidad
                </Link>
              </li>
              <li>
                <Link href="/estadisticas" className="text-sm hover:text-white transition-colors">
                  Estadísticas
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Empresa */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Empresa</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/nosotros" className="text-sm hover:text-white transition-colors">
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="text-sm hover:text-white transition-colors">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="text-sm hover:text-white transition-colors">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="text-sm hover:text-white transition-colors">
                  Política de Privacidad
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* App Download */}
        <div className="border-t border-gray-800 mt-8 pt-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="text-white font-semibold text-sm mb-1">Descarga la app Piums Artista</h3>
              <p className="text-xs text-gray-400">Gestiona reservas, disponibilidad y pagos desde tu móvil. iOS y Android.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <a
                href={process.env.NEXT_PUBLIC_ARTIST_APP_IOS || 'https://apps.apple.com/app/piums-artista'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5 text-white shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                <div className="text-left">
                  <div className="text-[9px] text-gray-400 leading-none">Disponible en</div>
                  <div className="text-xs font-semibold text-white leading-tight">App Store</div>
                </div>
              </a>
              <a
                href={process.env.NEXT_PUBLIC_ARTIST_APP_ANDROID || 'https://play.google.com/store/apps/details?id=io.piums.artista'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5 text-white shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 23.76c.3.17.64.19.96.07l11.37-6.57-2.39-2.39-9.94 8.89zm-1.76-20.1C1.16 3.96 1 4.34 1 4.8v14.4c0 .46.16.84.42 1.14l.06.06 8.07-8.07v-.19L1.42 3.6l-.06.06zm17.16 8.67l-2.3-1.33-2.67 2.67 2.67 2.67 2.31-1.33c.66-.38.66-1.01 0-1.68h-.01zm-15.4 9.28L14.55 13l-2.39-2.39L3.18 2.24C2.86 2.12 2.52 2.14 2.22 2.31c-.61.35-.61 1.31 0 1.68l.14.08L14.55 12 2.36 20.43l-.14.08c-.61.37-.61 1.33 0 1.68.3.17.64.19.96.07l-.14-.08.14.08z"/></svg>
                <div className="text-left">
                  <div className="text-[9px] text-gray-400 leading-none">Disponible en</div>
                  <div className="text-xs font-semibold text-white leading-tight">Google Play</div>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Línea divisora */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Piums. Todos los derechos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/terminos" className="text-sm text-gray-400 hover:text-white transition-colors">
                Términos
              </Link>
              <Link href="/privacidad" className="text-sm text-gray-400 hover:text-white transition-colors">
                Privacidad
              </Link>
              <Link href="/cookies" className="text-sm text-gray-400 hover:text-white transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
