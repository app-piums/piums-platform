# @piums/sdk

SDK de TypeScript para la plataforma Piums. Cliente HTTP para interactuar con el API Gateway.

## Instalación

```bash
pnpm add @piums/sdk
```

## Uso

```typescript
import { PiumsSDK } from '@piums/sdk';

// Crear instancia
const sdk = new PiumsSDK('http://localhost:3000/api/v1');

// Login
const { user, token } = await sdk.login({
  email: 'user@piums.com',
  password: 'password123'
});

// Buscar artistas
const artists = await sdk.getArtists({ page: 1, limit: 20 });

// Obtener perfil de artista
const artist = await sdk.getArtistById('artist-id');

// Crear reserva
const booking = await sdk.createBooking({
  artistId: 'artist-id',
  serviceId: 'service-id',
  scheduledAt: '2026-03-01T10:00:00Z'
});
```

## API

### Authentication
- `login(data)` - Iniciar sesión
- `register(data)` - Registrarse
- `logout()` - Cerrar sesión
- `getMe()` - Obtener usuario actual

### Artists
- `getArtists(params)` - Listar artistas
- `getArtistById(id)` - Obtener artista por ID
- `getArtistBySlug(slug)` - Obtener artista por slug
- `searchArtists(params)` - Buscar artistas

### Bookings
- `createBooking(data)` - Crear reserva
- `getBookings(params)` - Listar mis reservas
- `getBookingById(id)` - Obtener reserva por ID
- `cancelBooking(id, reason)` - Cancelar reserva

### Reviews
- `getReviewsByArtist(artistId)` - Obtener reviews de un artista
- `createReview(data)` - Crear review

## TypeScript Support

El SDK incluye tipos completos para toda la API.

```typescript
import type { Artist, Booking, Review } from '@piums/sdk';
```
