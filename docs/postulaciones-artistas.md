# Postulaciones de Artistas — Tablero de Vacantes

## Concepto

El sistema de **Postulaciones** permite que un artista publique una vacante cuando necesita un colaborador para un evento (ej. "Busco guitarrista para boda el 15 de junio"). Otros artistas de la plataforma pueden ver las vacantes en un tablero y enviar su aplicación con un mensaje y links de portfolio.

El artista que publicó la vacante revisa cada aplicación, puede ver el perfil público del solicitante, y decide aceptar o rechazar. Al aceptar, la vacante se cierra automáticamente y se crea un chat grupal de coordinación entre los dos artistas.

---

## Modelos de datos

**Servicio:** `catalog-service`  
**Base de datos:** `piums_catalog`  
**Schema:** `services/catalog-service/prisma/schema.prisma`

### `ArtistPosting`

```prisma
model ArtistPosting {
  id               String        @id @default(uuid())
  artistId         String        // Artista que publicó la vacante
  title            String        // "Busco guitarrista para boda"
  description      String        // Descripción del evento y lo que se necesita
  role             String        // "Guitarrista", "Baterista", "DJ", etc.
  category         String?       // Género musical u otro contexto
  eventDate        DateTime?     // Fecha del evento
  cityId           String?       // Ubicación opcional
  budgetMin        Int?          // Presupuesto mínimo en centavos
  budgetMax        Int?          // Presupuesto máximo en centavos
  currency         String        @default("GTQ")
  status           PostingStatus @default(OPEN)
  applicationCount Int           @default(0)  // Contador denormalizado
  closedAt         DateTime?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  applications     PostingApplication[]
}

enum PostingStatus {
  OPEN       // Aceptando aplicaciones
  CLOSED     // Cerrada manualmente
  FILLED     // Cubierta (alguien fue aceptado)
  CANCELLED  // Cancelada
}
```

### `PostingApplication`

```prisma
model PostingApplication {
  id             String            @id @default(uuid())
  postingId      String
  posting        ArtistPosting     @relation(...)
  artistId       String            // Artista que aplica
  message        String            // Presentación y experiencia
  portfolioLinks String[]          // URLs de trabajos previos
  status         ApplicationStatus @default(PENDING)
  respondedAt    DateTime?
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  @@unique([postingId, artistId])  // Un artista aplica una sola vez
}

enum ApplicationStatus {
  PENDING    // Enviada, no vista
  REVIEWED   // El publicador abrió el perfil del solicitante
  ACCEPTED   // Seleccionado
  REJECTED   // No seleccionado
  WITHDRAWN  // El solicitante la retiró
}
```

---

## Backend — catalog-service

### Rutas

**Postings:**

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/postings` | Artista | Crear vacante |
| `GET` | `/api/postings` | Opcional | Tablero público (filtros: status, role, category, cityId) |
| `GET` | `/api/postings/mine` | Artista | Mis vacantes publicadas |
| `GET` | `/api/postings/:id` | Opcional | Detalle de una vacante |
| `PATCH` | `/api/postings/:id` | Artista | Editar / cerrar vacante |
| `DELETE` | `/api/postings/:id` | Artista | Eliminar vacante |

**Aplicaciones:**

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/postings/:id/apply` | Artista | Aplicar a una vacante |
| `GET` | `/api/postings/:id/applications` | Publicador | Ver aplicaciones recibidas |
| `PATCH` | `/api/applications/:id/review` | Publicador | Marcar aplicación como revisada |
| `PATCH` | `/api/applications/:id/respond` | Publicador | Aceptar o rechazar aplicación |
| `DELETE` | `/api/applications/:id/withdraw` | Solicitante | Retirar propia aplicación |
| `GET` | `/api/applications/mine` | Artista | Mis aplicaciones enviadas |

### Reglas de negocio implementadas

- Un artista no puede aplicar a su propia vacante
- Máximo **10 aplicaciones activas** (PENDING + REVIEWED) simultáneas por artista
- Al aceptar una aplicación:
  - La vacante pasa a `FILLED` y se cierra
  - Las demás aplicaciones quedan en su estado actual (no se rechazan automáticamente)
  - Se crea un `GroupConversation` en chat-service con ambos artistas
- **Auto-expiración:** vacantes `OPEN` con más de 30 días se cierran automáticamente (job cada 6 horas en el arranque del servicio)

### Gateway routing

Las rutas se exponen via:
```
/api/catalog/postings/*     → catalog-service /api/postings/*
/api/catalog/applications/* → catalog-service /api/applications/*
```

---

## Notificaciones

Todos los eventos generan notificaciones **in-app + email**:

| Evento | Destinatario | Tipo |
|--------|-------------|------|
| Alguien aplica a una vacante | Publicador | `APPLICATION_RECEIVED` |
| Aplicación aceptada | Solicitante | `APPLICATION_ACCEPTED` |
| Aplicación rechazada | Solicitante | `APPLICATION_REJECTED` |

Los emails se envían cuando el artista tiene email registrado. Se usan los campos `emailTo` y `emailSubject` del `NotificationsClient`.

---

## Chat de coordinación post-aceptación

Al aceptar una aplicación, `catalog-service` llama internamente a `chat-service` para crear un `GroupConversation`:

```typescript
chatClient.createOrGetGroupConversation({
  bookingId: applicationId,   // applicationId usado como clave de idempotencia
  createdBy: postingArtistId,
  participantIds: [postingArtistId, applicantArtistId],
  name: `Coordinación: ${posting.title}`,
})
```

Se usa el `applicationId` en el campo `bookingId` del grupo para garantizar que solo se cree un grupo por aceptación. Al regresar el `chatGroupId`, el publicador es redirigido automáticamente al chat.

---

## SDK

**Archivo:** `packages/sdk/src/index.ts`

```typescript
// Gestión de vacantes (publicador)
sdk.createPosting({ title, description, role, category?, eventDate?, budgetMin?, budgetMax? })
sdk.getMyPostings()
sdk.updatePosting(id, { title?, description?, role?, status?, ... })
sdk.deletePosting(id)
sdk.getPostingApplications(postingId)
sdk.markApplicationReviewed(appId)
sdk.respondToApplication(appId, accept: boolean)  // retorna { application, chatGroupId? }

// Tablero (solicitante)
sdk.getPostings({ status?, role?, category?, page?, limit? })
sdk.getPosting(id)
sdk.applyToPosting(postingId, { message, portfolioLinks? })
sdk.withdrawApplication(appId)
sdk.getMyApplications()
```

---

## Frontend — web-artist

### `/artist/dashboard/postulaciones` — Mis Vacantes

- Lista de vacantes propias con estado, contador de aplicaciones y badge "X nuevas" para las no leídas
- Crear vacante → modal con: título, rol (selector + campo libre), descripción, fecha del evento, presupuesto mín/máx, categoría
- Expandir vacante → lista de solicitantes con nombre, categoría y preview del mensaje
- Click en solicitante → `ApplicationDetailModal`:
  - Nombre, categoría, avatar del artista
  - Enlace "Ver perfil público" → abre `client.piums.io/artists/{id}` en nueva pestaña
  - Mensaje completo
  - Links de portfolio (clickeables)
  - Botones **Rechazar** / **Aceptar artista**
  - Al abrir: se marca automáticamente como `REVIEWED`
- Aceptar → redirige al chat grupal de coordinación

### `/artist/dashboard/postulaciones/tablero` — Tablero de Vacantes

- **Sección "Para ti":** vacantes cuyo rol coincide con la categoría del artista (sugeridas automáticamente)
- **Todas las vacantes:** listado general de postings `OPEN`
- Filtro por rol + búsqueda de texto libre
- Banner de aviso si el perfil está incompleto (sin foto, bio o categoría)
- Click en vacante → `ApplyModal`: campo de mensaje + links de portfolio (uno por línea)
- Vacantes propias no aparecen en el tablero
- Al alcanzar el límite de 10 aplicaciones activas: error banner con instrucciones

---

## Flujo completo

```
1. Artista A publica vacante
   → "Busco guitarrista para boda — 15 junio — Q500-Q800"
   → status: OPEN

2. Artista B entra al Tablero
   → ve la sección "Para ti" si su categoría coincide
   → abre la vacante → envía aplicación con mensaje y portfolio

3. Notificación in-app + email → Artista A: "Nueva postulación recibida"

4. Artista A abre "Mis Vacantes"
   → badge amarillo "1 nueva" en la vacante
   → expande → click en Artista B
   → ApplicationDetailModal se abre, aplicación pasa a REVIEWED
   → Artista A revisa el perfil público de B
   → Artista A acepta

5. Automáticamente:
   → application.status → ACCEPTED
   → posting.status → FILLED
   → GroupConversation creado en chat-service
   → Artista A redirigido al chat de coordinación
   → Notificación in-app + email → Artista B: "Tu postulación fue aceptada"

6. Si nadie aplica en 30 días:
   → job automático cierra la vacante (OPEN → CLOSED)
```

---

## Estados de una aplicación

```
PENDING   → enviada, no vista por el publicador
    ↓
REVIEWED  → publicador abrió el perfil del solicitante
    ↓
ACCEPTED  → seleccionado (cierra la vacante como FILLED)
REJECTED  → no seleccionado

(desde PENDING o REVIEWED)
WITHDRAWN → el solicitante retiró la aplicación
```

---

## Archivos clave

| Archivo | Descripción |
|---------|-------------|
| `services/catalog-service/prisma/schema.prisma` | Modelos `ArtistPosting` y `PostingApplication` |
| `services/catalog-service/src/services/posting.service.ts` | Toda la lógica de negocio |
| `services/catalog-service/src/controller/posting.controller.ts` | Controller HTTP |
| `services/catalog-service/src/routes/posting.routes.ts` | Definición de rutas |
| `services/catalog-service/src/clients/chat.client.ts` | Llamada interna a chat-service al aceptar |
| `services/catalog-service/src/clients/notifications.client.ts` | Notificaciones in-app + email |
| `services/catalog-service/src/index.ts` | Registro de rutas + job de auto-expiración |
| `apps/web-artist/web/src/app/artist/dashboard/postulaciones/page.tsx` | Mis Vacantes |
| `apps/web-artist/web/src/app/artist/dashboard/postulaciones/tablero/page.tsx` | Tablero de Vacantes |
| `packages/sdk/src/index.ts` | Tipos `ArtistPosting`, `PostingApplication` + todos los métodos |
