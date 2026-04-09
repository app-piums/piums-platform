"use client";

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  userName: string;
  onNavigateAttempt?: (href: string) => boolean;
}

type IconComponent = ({ className }: { className?: string }) => React.ReactElement;

type NavItem = {
  href: string;
  icon: IconComponent;
  label: string;
  badge?: number;
};

type SidebarContentProps = {
  userName: string;
  pathname: string;
  navItems: NavItem[];
  onLinkClick: (event: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
  onClose: () => void;
  onLogout: () => void;
};

export default function ClientSidebar({ userName, onNavigateAttempt }: Props) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();

  const navItems: NavItem[] = [
    { href: '/dashboard',        icon: HomeIcon,     label: 'Inicio' },
    { href: '/artists',          icon: SearchIcon,   label: 'Artistas' },
    { href: '/bookings',         icon: CalIcon,      label: 'Reservas' },
    { href: '/events',           icon: EventsIcon,   label: 'Eventos' },
    { href: '/bookmarks',        icon: HeartIcon,    label: 'Favoritos' },
    { href: '/chat',             icon: ChatIcon,     label: 'Mensajes', badge: 3 },
    { href: '/quejas',           icon: AlertIcon,    label: 'Quejas' },
    { href: '/tutorial',         icon: TutorialIcon, label: 'Tutorial' },
  ];

  const handleLinkClick = useCallback((event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (onNavigateAttempt && onNavigateAttempt(href) === false) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    setIsOpen(false);
  }, [onNavigateAttempt]);

  return (
    <>
      <aside className="hidden lg:flex flex-col w-56 min-h-screen bg-white border-r border-gray-100 shrink-0">
        <SidebarContent
          userName={userName}
          pathname={pathname}
          navItems={navItems}
          onLinkClick={handleLinkClick}
          onClose={() => setIsOpen(false)}
          onLogout={logout}
        />
      </aside>

      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 h-16 flex items-center justify-between">
        <Link href="/dashboard" onClick={(event) => handleLinkClick(event, '/dashboard')}>
          <Image src="/logo.png" alt="PIUMS" width={64} height={64} className="h-16 w-auto" unoptimized priority />
        </Link>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Abrir menú"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <aside className="relative w-72 max-w-[85vw] bg-white flex flex-col h-full shadow-xl">
            <SidebarContent
              userName={userName}
              pathname={pathname}
              navItems={navItems}
              onLinkClick={handleLinkClick}
              onClose={() => setIsOpen(false)}
              onLogout={logout}
            />
          </aside>
        </div>
      )}
    </>
  );
}

function SidebarContent({ userName, pathname, navItems, onLinkClick, onClose, onLogout }: SidebarContentProps) {
  return (
    <>
      <div className="px-5 py-2 border-b border-gray-100 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={(event) => onLinkClick(event, '/dashboard')}>
          <Image src="/logo.png" alt="PIUMS" width={64} height={64} className="h-16 w-auto" unoptimized priority />
        </Link>
        <button
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          onClick={onClose}
          aria-label="Cerrar menú"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 px-4 py-5 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Menú</p>
        <nav className="space-y-0.5">
          {navItems.map(({ href, icon: Icon, label, badge }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            const navId = `nav-${href.replace(/^\//, '')}`;
            return (
              <Link
                key={href}
                id={navId}
                href={href}
                onClick={(event) => onLinkClick(event, href)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? 'bg-[#FF6A00]/10 text-[#FF6A00]' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-[#FF6A00]' : 'text-gray-400'}`} />
                  {label}
                </div>
                {badge && (
                  <span className="bg-[#FF6A00] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Cuenta</p>
          <nav className="space-y-0.5">
            <Link
              id="nav-profile"
              href="/profile"
              onClick={(event) => onLinkClick(event, '/profile')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                pathname.startsWith('/profile') ? 'bg-[#FF6A00]/10 text-[#FF6A00]' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <SettingsIcon className={`h-5 w-5 shrink-0 ${pathname.startsWith('/profile') ? 'text-[#FF6A00]' : 'text-gray-400'}`} />
              Configuración
            </Link>
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg className="h-5 w-5 shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar Sesión
            </button>
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-gray-100">
        <Link
          href="/profile"
          onClick={(event) => onLinkClick(event, '/profile')}
          className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#FF6A00] to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
            <p className="text-xs text-gray-400">Cliente</p>
          </div>
        </Link>
      </div>
    </>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function HomeIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
}
function SearchIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
}
function CalIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}
function HeartIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
}
function ChatIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
}
function AlertIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
}
function EventsIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function SettingsIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function TutorialIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
}
