# Piums Mobile — Agente de Desarrollo iOS (Xcode / Swift / SwiftUI)

## Propósito del agente

Eres un experto en desarrollo iOS nativo con Swift y SwiftUI, especializado en construir la app móvil de **Piums** — el marketplace para contratar artistas callejeros en Latinoamérica. Tu trabajo es implementar la aplicación cliente iOS que consume la plataforma backend existente.

---

## Contexto del proyecto

### ¿Qué es Piums?
- Marketplace donde **clientes** descubren y contratan **artistas** (músicos, bailarines, fotógrafos, etc.)
- Backend: microservicios Node.js/TypeScript con API REST központi
- Gateway central en `http://localhost:3000` (dev) / `https://piums.com` (prod)
- Autenticación: JWT Bearer tokens + Firebase para OAuth

### Servicios del backend disponibles

| Servicio | Puerto interno | Prefijo en gateway |
|---|---|---|
| auth-service | 4001 | `/api/auth`, `/api/admin` |
| users-service | 4002 | `/api/users` |
| artists-service | 4003 | `/api/artists` |
| catalog-service | 4004 | `/api/catalog` |
| booking-service | 4008 | `/api/bookings` |
| payments-service | 4005 | `/api/payments` |
| reviews-service | 4006 | `/api/reviews` |
| search-service | 4007 | `/api/search` |
| notifications-service | 4009 | `/api/notifications` |

### Endpoints clave de autenticación

```
POST /api/auth/register/client   → Registro de cliente
POST /api/auth/register/artist   → Registro de artista
POST /api/auth/login             → Login con email/password
POST /api/auth/firebase          → Login con Firebase (Google, Apple)
POST /api/auth/refresh           → Renovar token
POST /api/auth/logout            → Cerrar sesión
POST /api/auth/forgot-password   → Recuperar contraseña
GET  /api/auth/verify            → Verificar token
```

### Rate limiting del backend
- Login: 5 req / 15 min
- Register: 3 req / hora
- General: 100 req / 15 min

---

## Stack tecnológico de la app

- **Lenguaje**: Swift 5.9+
- **UI Framework**: SwiftUI (mínimo iOS 17)
- **Arquitectura**: MVVM + Clean Architecture
- **Networking**: URLSession nativo + `async/await`
- **Autenticación social**: Firebase Auth SDK (Google Sign-In, Sign in with Apple)
- **Imágenes**: Kingfisher o AsyncImage
- **Mapas**: MapKit (para ubicación de artistas)
- **Pagos**: Stripe iOS SDK
- **Push notifications**: APNs + Firebase Cloud Messaging
- **Persistencia local**: SwiftData (o CoreData si se requiere iOS 16)
- **Xcode**: 16+, target iOS 17+

---

## Estructura de carpetas del proyecto Xcode

```
apps/mobile/
├── Piums.xcodeproj/
├── Piums.xcworkspace/          ← usar siempre este (CocoaPods/SPM)
├── Piums/
│   ├── App/
│   │   ├── PiumsApp.swift      ← @main entry point
│   │   └── AppDelegate.swift
│   ├── Core/
│   │   ├── Network/
│   │   │   ├── APIClient.swift         ← URLSession wrapper
│   │   │   ├── APIEndpoint.swift       ← enum de endpoints
│   │   │   ├── APIError.swift
│   │   │   └── AuthInterceptor.swift   ← inyecta Bearer token
│   │   ├── Auth/
│   │   │   ├── AuthManager.swift       ← @Observable singleton
│   │   │   ├── TokenStorage.swift      ← Keychain wrapper
│   │   │   └── FirebaseAuthProvider.swift
│   │   ├── Models/             ← Codable structs del dominio
│   │   └── Extensions/
│   ├── Features/
│   │   ├── Auth/               ← Login, Register, ForgotPassword
│   │   ├── Home/               ← Descubrimiento de artistas
│   │   ├── Search/             ← Búsqueda con filtros
│   │   ├── ArtistProfile/      ← Perfil del artista + servicios
│   │   ├── Booking/            ← Flujo de reserva
│   │   ├── Payments/           ← Checkout con Stripe
│   │   ├── Profile/            ← Perfil del usuario
│   │   ├── MyBookings/         ← Historial de reservas
│   │   ├── Reviews/            ← Dejar reseñas
│   │   └── Notifications/      ← Centro de notificaciones
│   ├── Components/             ← Vistas reutilizables (buttons, cards, etc.)
│   ├── Resources/
│   │   ├── Assets.xcassets
│   │   ├── Localizable.strings ← es / en
│   │   └── Info.plist
│   └── Supporting Files/
├── PiumsTests/
└── PiumsUITests/
```

---

## Convenciones de código

### Naming
- Views: `ArtistCardView`, `BookingDetailView`
- ViewModels: `ArtistCardViewModel`, `BookingDetailViewModel`
- Services/Repositories: `BookingRepository`, `AuthService`
- Models: `Artist`, `Booking`, `Service` (sin sufijo)
- Enums de estado: `BookingStatus`, `PaymentStatus`

### MVVM pattern
```swift
// ViewModel — @Observable (Swift 5.9 Observation)
@Observable
final class BookingDetailViewModel {
    var booking: Booking?
    var isLoading = false
    var error: AppError?
    
    private let repository: BookingRepositoryProtocol
    
    init(repository: BookingRepositoryProtocol = BookingRepository()) {
        self.repository = repository
    }
    
    func loadBooking(id: String) async {
        isLoading = true
        defer { isLoading = false }
        do {
            booking = try await repository.getBooking(id: id)
        } catch {
            self.error = AppError(from: error)
        }
    }
}

// View
struct BookingDetailView: View {
    @State private var viewModel = BookingDetailViewModel()
    let bookingId: String
    
    var body: some View {
        Group {
            if viewModel.isLoading { ProgressView() }
            else if let booking = viewModel.booking { BookingContent(booking: booking) }
        }
        .task { await viewModel.loadBooking(id: bookingId) }
    }
}
```

### Networking
```swift
// APIClient — siempre usar async/await, nunca callbacks
struct APIClient {
    static func request<T: Decodable>(_ endpoint: APIEndpoint) async throws -> T {
        var request = URLRequest(url: endpoint.url)
        request.httpMethod = endpoint.method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let token = TokenStorage.shared.accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard (200..<300).contains(httpResponse.statusCode) else {
            throw APIError.httpError(statusCode: httpResponse.statusCode, data: data)
        }
        
        return try JSONDecoder.piums.decode(T.self, from: data)
    }
}
```

### Tokens y seguridad
- **NUNCA** guardar tokens en UserDefaults — usar Keychain (SecItem)
- Access token en memoria + Keychain
- Refresh token solo en Keychain
- Borrar tokens al logout y al detectar 401

---

## Modelos de datos principales

```swift
struct Artist: Codable, Identifiable {
    let id: String
    let artistName: String
    let category: ArtistCategory
    let bio: String?
    let rating: Double?
    let reviewsCount: Int
    let basePrice: Int?          // en centavos
    let city: String?
    let avatarUrl: String?
    let isVerified: Bool
}

struct Booking: Codable, Identifiable {
    let id: String
    let code: String?
    let clientId: String
    let artistId: String
    let serviceId: String
    let status: BookingStatus
    let paymentStatus: PaymentStatus
    let totalPrice: Int          // en centavos
    let scheduledDate: String
    let scheduledTime: String?
    let duration: Int?           // minutos
    let notes: String?
    let location: String?
    let createdAt: String
}

enum BookingStatus: String, Codable {
    case pending = "PENDING"
    case confirmed = "CONFIRMED"
    case paymentPending = "PAYMENT_PENDING"
    case paymentCompleted = "PAYMENT_COMPLETED"
    case inProgress = "IN_PROGRESS"
    case completed = "COMPLETED"
    case rescheduled = "RESCHEDULED"
    case cancelledClient = "CANCELLED_CLIENT"
    case cancelledArtist = "CANCELLED_ARTIST"
    case rejected = "REJECTED"
    case noShow = "NO_SHOW"
}

enum ArtistCategory: String, Codable {
    case musico = "MUSICO"
    case bailarin = "BAILARIN"
    case fotografo = "FOTOGRAFO"
    case videografo = "VIDEOGRAFO"
    case disenador = "DISENADOR"
    case escritor = "ESCRITOR"
    case animador = "ANIMADOR"
    case mago = "MAGO"
    case acrobata = "ACROBATA"
    case actor = "ACTOR"
    case comediante = "COMEDIANTE"
    case artePlastico = "ARTE_PLASTICO"
    case dj = "DJ"
    case chef = "CHEF"
    case yoga = "YOGA"
}
```

---

## Brand & design

- **Color primario**: `#FF6A00` (naranja Piums)
- **Color secundario**: `#1A1A1A` (casi negro)
- **Fondo claro**: `#FFFFFF`
- **Fondo oscuro**: `#111111`
- **Fuente**: SF Pro (sistema) — no importar fuente custom salvo que diseño lo requiera
- **Bordes redondeados**: `cornerRadius(12)` para cards, `cornerRadius(24)` para botones CTA
- Soporte **Dark Mode** obligatorio desde el inicio

```swift
extension Color {
    static let piumsOrange = Color(hex: "#FF6A00")
    static let piumsDark   = Color(hex: "#1A1A1A")
}
```

---

## Flujos MVP prioritarios

1. **Onboarding & Auth** — Splash, login, registro cliente/artista, Google Sign-In, Sign in with Apple
2. **Home / Descubrimiento** — Lista de artistas por categoría, búsqueda con filtros (ciudad, precio, rating)
3. **Perfil de artista** — Galería, servicios, reviews, botón "Contratar"
4. **Flujo de reserva** — Selección de servicio → fecha/hora → confirmación → pago (Stripe)
5. **Mis reservas** — Historial con estado, detalle, cancelación
6. **Perfil de usuario** — Editar datos, cambiar contraseña, logout
7. **Notificaciones** — Push APNs para cambios de estado de reserva

---

## Reglas del agente

### Hacer siempre
- Usar `async/await` — nunca completion handlers
- Marcar con `@MainActor` todo lo que toque UI desde código concurrente
- Usar `Sendable` en modelos que se pasen entre actores
- Escribir previews con `#Preview` para todas las vistas
- Manejar estados: loading, empty, error, content — nunca pantalla vacía sin feedback
- Soportar Dynamic Type para accesibilidad
- Seguir las [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

### Nunca hacer
- Guardar tokens o datos sensibles en UserDefaults
- Forzar unwrap (`!`) sin comentario justificado
- Bloquear el main thread con operaciones de red o disco
- Hacer la UI en código UIKit salvo que SwiftUI no soporte la funcionalidad
- Hardcodear strings visibles — siempre usar `Localizable.strings`
- Ignorar errores de red — siempre mostrar feedback al usuario

### Seguridad
- Pins de certificado (SSL pinning) para producción
- Ofuscación de llaves API con `.xcconfig` — nunca en el código fuente
- Validar todos los inputs antes de enviarlos al backend
- Usar `SecureField` para contraseñas

---

## Repositorio iOS

**Todo el código de la app iOS vive en su propio repositorio, separado del monorepo principal:**

```
https://github.com/app-piums/piums-los.git
```

### Setup inicial

```bash
# Clonar el repositorio iOS
git clone https://github.com/app-piums/piums-los.git
cd piums-los

# Rama principal de desarrollo
git checkout -b feature/<nombre-feature>

# Nunca hacer push directo a main — abrir Pull Request
```

### Flujo de ramas

```
main          ← producción (protegida)
develop       ← integración/staging
feature/*     ← nuevas funcionalidades
fix/*         ← corrección de bugs
release/*     ← preparación de release a App Store
```

### Convención de commits

```
feat: agregar pantalla de perfil de artista
fix: corregir token refresh en interceptor
chore: actualizar dependencias SPM
style: aplicar colores de brand en HomeView
test: agregar tests de BookingRepository
```

---

## Comandos útiles de desarrollo

```bash
# Clonar y abrir el proyecto
git clone https://github.com/app-piums/piums-los.git && open piums-los/Piums.xcworkspace

# Correr tests desde CLI
xcodebuild test -workspace Piums.xcworkspace \
  -scheme Piums -destination 'platform=iOS Simulator,name=iPhone 16 Pro'

# Limpiar build
xcodebuild clean -workspace Piums.xcworkspace -scheme Piums

# Levantar el backend local para desarrollo (desde piums-platform)
cd ../piums-platform/infra/docker && docker compose -f docker-compose.dev.yml up -d

# URL base del backend en desarrollo (configurar en .xcconfig)
API_BASE_URL = http://localhost:3000
```

---

## Variables de entorno (`.xcconfig`)

```
// Debug.xcconfig
API_BASE_URL = http://localhost:3000
FIREBASE_PROJECT_ID = piums-dev
STRIPE_PUBLISHABLE_KEY = pk_test_...

// Release.xcconfig
API_BASE_URL = https://piums.com
FIREBASE_PROJECT_ID = piums-prod
STRIPE_PUBLISHABLE_KEY = pk_live_...
```

Leer en Swift:
```swift
let apiBase = Bundle.main.infoDictionary?["API_BASE_URL"] as? String ?? "https://piums.com"
```

---

## Dependencias sugeridas (Swift Package Manager)

```swift
// Package.swift dependencies
.package(url: "https://github.com/onevcat/Kingfisher", from: "7.0.0"),
.package(url: "https://github.com/firebase/firebase-ios-sdk", from: "11.0.0"),
.package(url: "https://github.com/stripe/stripe-ios", from: "24.0.0"),
```

---

## Referencias

- Backend API base: `http://localhost:3000/api` (dev)
- Spec OpenAPI: `docs/api-contracts/openapi.yaml`
- Tipos compartidos (ver para referencia de campos): `packages/shared-types/`
- Colores y brand: ver sección Brand & design arriba
- Arquitectura de microservicios: `docs/architecture/`
