# ADR-0003: Separación de Aplicaciones Web por Dominio y Rol

**Date**: 2026-03-09  
**Status**: ✅ Accepted  
**Deciders**: Engineering Team  

## Context

La plataforma Piums inicialmente tenía una aplicación web monolítica (`apps/web`) que servía tanto a clientes como a artistas en un solo dominio. Esta estructura presentaba varios problemas:

1. **Confusión de rutas**: URLs como `/dashboard` podían apuntar a diferentes interfaces según el rol del usuario
2. **Seguridad**: Mayor superficie de ataque al tener todas las funcionalidades en una sola app
3. **Performance**: Bundles más grandes al incluir código para ambos tipos de usuarios
4. **UX inconsistente**: Difícil mantener experiencias separadas y optimizadas
5. **Despliegue**: Cambios en funcionalidades de clientes afectaban a artistas y viceversa

## Decision

Dividir la aplicación web monolítica en **dos aplicaciones Next.js separadas**:

### 1. **web-client** (piums.com)
- **Puerto**: 3000
- **Audiencia**: Clientes que buscan contratar artistas
- **Rutas principales**:
  - `/` - Landing page
  - `/search` - Búsqueda de artistas
  - `/artists` - Catálogo de artistas
  - `/booking` - Nueva reserva
  - `/bookings` - Mis reservas
  - `/dashboard` - Dashboard del cliente
  - `/profile` - Perfil del cliente
  - `/chat` - Mensajería

### 2. **web-artist** (artist.piums.com)
- **Puerto**: 3001
- **Audiencia**: Artistas que gestionan su negocio
- **Rutas principales**:
  - `/` - Landing (redirect a dashboard)
  - `/artist/dashboard` - Dashboard principal
  - `/artist/dashboard/bookings` - Gestión de reservas
  - `/artist/dashboard/calendar` - Calendario
  - `/artist/dashboard/services` - Gestión de servicios
  - `/artist/dashboard/reviews` - Reseñas
  - `/artist/dashboard/settings` - Configuración
  - `/profile` - Perfil del artista
  - `/chat` - Mensajería con clientes

## Implementation Details

### Arquitectura de Redirección

```
┌─────────────────────────────────────────────────────────────┐
│                         Nginx                                │
│                   (Reverse Proxy)                            │
└─────────────────────────────────────────────────────────────┘
                    │                      │
     piums.com      │                      │   artist.piums.com
                    ▼                      ▼
          ┌─────────────────┐    ┌─────────────────┐
          │  web-client     │    │  web-artist     │
          │  (Port 3000)    │    │  (Port 3001)    │
          └─────────────────┘    └─────────────────┘
                    │                      │
                    └──────────┬───────────┘
                               ▼
                    ┌─────────────────┐
                    │  API Gateway    │
                    │  (Port 3000)    │
                    └─────────────────┘
                               │
                    ┌──────────┼──────────┐
                    ▼          ▼          ▼
              ┌─────────┐ ┌─────────┐ ┌─────────┐
              │  Auth   │ │ Users   │ │ Artists │
              │ Service │ │ Service │ │ Service │
              └─────────┘ └─────────┘ └─────────┘
```

### Middleware de Redirección

Cada app tiene un middleware de Next.js que redirige automáticamente:

**web-client middleware**:
```typescript
// Si el usuario es artista → artist.piums.com
if (userRole === 'artist') {
  return NextResponse.redirect(artistUrl);
}
```

**web-artist middleware**:
```typescript
// Si el usuario NO es artista → piums.com
if (userRole !== 'artist') {
  return NextResponse.redirect(clientUrl);
}
```

### Auth Service - Redirect por Rol

El auth service ahora devuelve la URL de redirección correcta según el rol:

```typescript
// Login response
{
  token: "...",
  refreshToken: "...",
  redirectUrl: "https://artist.piums.com",  // ← NEW
  user: {
    id: "...",
    role: "artist",
    ...
  }
}
```

### CORS Multi-origen

Gateway actualizado para permitir ambas apps:

```typescript
const allowedOrigins = [
  "http://localhost:3000",    // Client app
  "http://localhost:3001",    // Artist app
  "http://localhost:3002",    // Admin app (future)
];
```

## Consequences

### Positive

✅ **Seguridad Mejorada**: Cada app solo expone las rutas necesarias para su audiencia  
✅ **Performance**: Bundles más pequeños (40% reducción estimada)  
✅ **UX Optimizado**: Interfaces diseñadas específicamente para cada tipo de usuario  
✅ **Despliegue Independiente**: Cambios en cliente no afectan a artistas  
✅ **Escalabilidad**: Pods separados, escalar solo lo necesario  
✅ **SEO Separado**: Dominios distintos para diferentes keywords  
✅ **Desarrollo Paralelo**: Equipos pueden trabajar sin conflictos  

### Negative

⚠️ **Duplicación de Código**: Algunos componentes compartidos (mitigado con packages/)  
⚠️ **Complejidad de Infrastructure**: Dos apps Next.js + nginx + load balancer  
⚠️ **CORS Complexity**: Cookies deben funcionar cross-domain  
⚠️ **CI/CD Más Complejo**: Builds y deploys separados  

### Neutral

📊 **Doble Mantenimiento**: Dos apps = dos package.json, dos configs  
📊 **Testing**: Necesidad de tests E2E para ambas apps  
📊 **Monitoring**: Métricas separadas por app  

## Migration Strategy

### Phase 1: Preparation ✅
1. Crear estructura de `apps/web-artist/`
2. Copiar código base de `apps/web/`
3. Limpiar rutas según audiencia

### Phase 2: Configuration ✅
1. Crear middlewares de redirección
2. Actualizar auth service para redirect_url
3. Actualizar CORS en gateway
4. Configurar .env para ambas apps

### Phase 3: Infrastructure ✅
1. Crear Dockerfiles
2. Actualizar docker-compose (dev, staging, prod)
3. Configurar nginx reverse proxy
4. Actualizar CI/CD workflows

### Phase 4: Documentation ✅
1. READMEs para cada app
2. Actualizar arquitectura docs
3. Deployment guides

### Phase 5: Testing & Launch 🔄
1. Test manual de flujos
2. E2E tests automatizados
3. Staging deployment
4. Production deployment
5. Monitor & optimize

## Alternatives Considered

### Alternative 1: Monolito con Routing Dinámico
**Pros**: Cero duplicación de código  
**Cons**: Bundles grandes, UX limitada, seguridad comprometida  
**Verdict**: ❌ Rechazado - No escala

### Alternative 2: Micro-frontends con Module Federation
**Pros**: Máxima modularidad  
**Cons**: Complejidad extrema, overhead de comunicación  
**Verdict**: ❌ Rechazado - Overkill para nuestra escala

### Alternative 3: SPA única con lazy loading
**Pros**: Reducción de bundle inicial  
**Cons**: Sigue siendo monolítica, mismos problemas de seguridad  
**Verdict**: ❌ Rechazado - No resuelve el problema core

### Alternative 4: Apps Separadas ✅ (ELEGIDA)
**Pros**: Balance perfecto entre simplicidad y beneficios  
**Cons**: Duplicación controlable  
**Verdict**: ✅ Aceptado - Mejor opción

## References

- [Next.js Multi-tenancy](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [ADR-0002: Monorepo Structure](./adr-0002-monorepo.md)
- [Separation Implementation PR](https://github.com/app-piums/piums-platform/pull/XX)

## Notes

Esta decisión fue tomada después de Sprint 5 cuando se completó el MVP funcional. La separación permite una mejor experiencia de usuario y prepara la plataforma para escalar en producción.

**Próximos pasos**:
- Admin app separada (`admin.piums.com`) - Q2 2026
- Mobile apps nativas con la misma arquitectura de roles
