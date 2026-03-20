# 🎨 Piums Artist Dashboard

> Dashboard para artistas - Gestiona tu negocio artístico

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)

## 📋 Descripción

Aplicación web para artistas de Piums Platform. Panel de control completo para gestionar servicios, reservas, calendario, reseñas y  pagos.

**Dominio**: `artist.piums.com` | **Puerto dev**: `3001`

## ✨ Características

- 📊 Dashboard con métricas y analytics
- 📅 Calendario de reservas
- 💼 Gestión de servicios artísticos
- ⭐ Sistema de reseñas
- 💰 Gestión de pagos e ingresos
- 💬 Chat con clientes
- 🔔 Notificaciones de nuevas reservas

## 🚀 Inicio Rápido

```bash
cd apps/web-artist/web
pnpm install
cp .env.example .env.local
pnpm dev  # http://localhost:3001
```

## 🏗️ Rutas Principales

```
/                           # Landing (redirect a /artist/dashboard si está autenticado)
/login                      # Login para artistas
/register                   # Registro de artista
/artist/dashboard           # Dashboard principal
/artist/dashboard/bookings  # Gestión de reservas
/artist/dashboard/calendar  # Calendario
/artist/dashboard/services  # Gestión de servicios
/artist/dashboard/reviews   # Reseñas recibidas
/artist/dashboard/settings  # Configuración
```

## 🛡️ Seguridad

El middleware automáticamente redirige:
- **Clientes → piums.com**: Si un cliente intenta acceder
- **No autenticados → /login**: En rutas protegidas
- **Solo artistas**: Verificación de rol en cada request

Ver documentación completa en [docs/](../../docs/)
