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

## Boilerplate listo para copiar

### `JSONDecoder+Piums.swift`
```swift
extension JSONDecoder {
    static let piums: JSONDecoder = {
        let d = JSONDecoder()
        d.keyDecodingStrategy = .convertFromSnakeCase
        d.dateDecodingStrategy = .iso8601
        return d
    }()
}

extension JSONEncoder {
    static let piums: JSONEncoder = {
        let e = JSONEncoder()
        e.keyEncodingStrategy = .convertToSnakeCase
        e.dateEncodingStrategy = .iso8601
        return e
    }()
}
```

### `Color+Piums.swift`
```swift
import SwiftUI

extension Color {
    static let piumsOrange = Color(hex: "#FF6A00")
    static let piumsDark   = Color(hex: "#1A1A1A")

    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8)  & 0xFF) / 255
        let b = Double(int & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}
```

### `AppError.swift`
```swift
enum AppError: LocalizedError {
    case network(URLError)
    case http(statusCode: Int, message: String)
    case decoding(Error)
    case unauthorized          // 401 → cerrar sesión
    case notFound              // 404
    case serverError           // 5xx
    case unknown(Error)

    var errorDescription: String? {
        switch self {
        case .network:        return "Sin conexión a internet"
        case .http(_, let m): return m
        case .decoding:       return "Error al procesar la respuesta"
        case .unauthorized:   return "Sesión expirada. Inicia sesión de nuevo"
        case .notFound:       return "Recurso no encontrado"
        case .serverError:    return "Error del servidor. Intenta más tarde"
        case .unknown(let e): return e.localizedDescription
        }
    }

    init(from error: Error) {
        if let e = error as? AppError { self = e; return }
        if let e = error as? URLError { self = .network(e); return }
        self = .unknown(error)
    }
}
```

### `TokenStorage.swift` (Keychain)
```swift
import Foundation
import Security

final class TokenStorage {
    static let shared = TokenStorage()
    private init() {}

    private let accessKey  = "piums.access_token"
    private let refreshKey = "piums.refresh_token"

    var accessToken: String? {
        get { read(key: accessKey) }
        set { newValue == nil ? delete(key: accessKey) : save(key: accessKey, value: newValue!) }
    }
    var refreshToken: String? {
        get { read(key: refreshKey) }
        set { newValue == nil ? delete(key: refreshKey) : save(key: refreshKey, value: newValue!) }
    }

    func clearAll() {
        delete(key: accessKey)
        delete(key: refreshKey)
    }

    private func save(key: String, value: String) {
        let data = Data(value.utf8)
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrAccount: key,
            kSecValueData: data,
            kSecAttrAccessible: kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
        ]
        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }

    private func read(key: String) -> String? {
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrAccount: key,
            kSecReturnData: true,
            kSecMatchLimit: kSecMatchLimitOne,
        ]
        var result: AnyObject?
        SecItemCopyMatching(query as CFDictionary, &result)
        guard let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    private func delete(key: String) {
        let query: [CFString: Any] = [kSecClass: kSecClassGenericPassword, kSecAttrAccount: key]
        SecItemDelete(query as CFDictionary)
    }
}
```

### `AuthManager.swift`
```swift
import Foundation

@Observable
@MainActor
final class AuthManager {
    static let shared = AuthManager()
    private init() { loadFromStorage() }

    var currentUser: AuthUser?
    var isAuthenticated: Bool { currentUser != nil }

    private func loadFromStorage() {
        // Si hay token guardado, verificar con el backend al iniciar
        guard TokenStorage.shared.accessToken != nil else { return }
        Task { await verify() }
    }

    func login(email: String, password: String) async throws {
        let response: AuthResponse = try await APIClient.request(.login(email: email, password: password))
        store(response)
    }

    func logout() async {
        try? await APIClient.request(.logout) as EmptyResponse
        TokenStorage.shared.clearAll()
        currentUser = nil
    }

    func refreshIfNeeded() async throws {
        guard let refresh = TokenStorage.shared.refreshToken else { throw AppError.unauthorized }
        let response: AuthResponse = try await APIClient.request(.refreshToken(token: refresh))
        store(response)
    }

    private func verify() async {
        do {
            let user: AuthUser = try await APIClient.request(.verifyToken)
            currentUser = user
        } catch {
            TokenStorage.shared.clearAll()
        }
    }

    private func store(_ response: AuthResponse) {
        TokenStorage.shared.accessToken  = response.accessToken
        TokenStorage.shared.refreshToken = response.refreshToken
        currentUser = response.user
    }
}

struct AuthResponse: Decodable {
    let accessToken: String
    let refreshToken: String
    let user: AuthUser
}

struct AuthUser: Codable, Identifiable {
    let id: String
    let email: String
    let nombre: String?
    let role: String      // "CLIENT" | "ARTIST" | "ADMIN"
    let avatarUrl: String?
}

struct EmptyResponse: Decodable {}
```

### `APIEndpoint.swift` — todos los endpoints
```swift
import Foundation

enum APIEndpoint {
    // ── Auth ──────────────────────────────────────────────
    case login(email: String, password: String)
    case registerClient(name: String, email: String, password: String)
    case registerArtist(name: String, email: String, password: String)
    case firebaseAuth(token: String)
    case refreshToken(token: String)
    case logout
    case verifyToken
    case forgotPassword(email: String)

    // ── Artists ───────────────────────────────────────────
    case listArtists(page: Int, limit: Int, category: String?, cityId: String?, q: String?)
    case getArtist(id: String)
    case searchArtists(q: String, page: Int)
    case busyArtistsOnDate(date: String)   // YYYY-MM-DD

    // ── Catalog ───────────────────────────────────────────
    case listServices(artistId: String)
    case getService(id: String)

    // ── Bookings ──────────────────────────────────────────
    case createBooking(payload: [String: Any])
    case listMyBookings(status: String?, page: Int)
    case getBooking(id: String)
    case cancelBooking(id: String)
    case checkAvailability(artistId: String, startTime: String, endTime: String)
    case getAvailableSlots(artistId: String, date: String)

    // ── Events ────────────────────────────────────────────
    case listEvents(page: Int)
    case createEvent(payload: [String: Any])
    case getEvent(id: String)
    case updateEvent(id: String, payload: [String: Any])
    case cancelEvent(id: String)
    case addBookingToEvent(eventId: String, bookingId: String)
    case removeBookingFromEvent(eventId: String, bookingId: String)

    // ── Reviews ───────────────────────────────────────────
    case listReviews(artistId: String, page: Int)
    case createReview(payload: [String: Any])

    // ── Notifications ─────────────────────────────────────
    case listNotifications(page: Int)
    case markNotificationRead(id: String)
    case registerPushToken(token: String, platform: String)

    // ── Users ─────────────────────────────────────────────
    case getMyProfile
    case updateMyProfile(payload: [String: Any])
    case changePassword(current: String, new: String)
}

extension APIEndpoint {
    private static var base: String {
        Bundle.main.infoDictionary?["API_BASE_URL"] as? String ?? "https://piums.com"
    }

    var url: URL { URL(string: "\(Self.base)/api\(path)")! }

    var method: String {
        switch self {
        case .login, .registerClient, .registerArtist, .firebaseAuth,
             .createBooking, .createEvent, .createReview, .registerPushToken,
             .addBookingToEvent, .forgotPassword:
            return "POST"
        case .updateEvent, .updateMyProfile:
            return "PUT"
        case .cancelBooking, .cancelEvent, .removeBookingFromEvent:
            return "DELETE"
        default:
            return "GET"
        }
    }

    var body: Data? {
        switch self {
        case .login(let e, let p):
            return try? JSONSerialization.data(withJSONObject: ["email": e, "password": p])
        case .registerClient(let n, let e, let p):
            return try? JSONSerialization.data(withJSONObject: ["nombre": n, "email": e, "password": p])
        case .registerArtist(let n, let e, let p):
            return try? JSONSerialization.data(withJSONObject: ["nombre": n, "email": e, "password": p, "role": "ARTIST"])
        case .firebaseAuth(let t):
            return try? JSONSerialization.data(withJSONObject: ["firebaseToken": t])
        case .refreshToken(let t):
            return try? JSONSerialization.data(withJSONObject: ["refreshToken": t])
        case .forgotPassword(let e):
            return try? JSONSerialization.data(withJSONObject: ["email": e])
        case .createBooking(let p), .createEvent(let p), .createReview(let p):
            return try? JSONSerialization.data(withJSONObject: p)
        case .updateEvent(_, let p), .updateMyProfile(let p):
            return try? JSONSerialization.data(withJSONObject: p)
        case .registerPushToken(let t, let pl):
            return try? JSONSerialization.data(withJSONObject: ["token": t, "platform": pl])
        case .changePassword(let cur, let new):
            return try? JSONSerialization.data(withJSONObject: ["currentPassword": cur, "newPassword": new])
        default: return nil
        }
    }

    private var path: String {
        switch self {
        case .login:                        return "/auth/login"
        case .registerClient:               return "/auth/register/client"
        case .registerArtist:               return "/auth/register/artist"
        case .firebaseAuth:                 return "/auth/firebase"
        case .refreshToken:                 return "/auth/refresh"
        case .logout:                       return "/auth/logout"
        case .verifyToken:                  return "/auth/verify"
        case .forgotPassword:               return "/auth/forgot-password"
        case .listArtists(let pg, let lm, let cat, let city, let q):
            var p = "/artists?page=\(pg)&limit=\(lm)"
            if let cat  = cat  { p += "&category=\(cat)" }
            if let city = city { p += "&cityId=\(city)" }
            if let q    = q    { p += "&q=\(q.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? q)" }
            return p
        case .getArtist(let id):            return "/artists/\(id)"
        case .searchArtists(let q, let pg): return "/search?q=\(q)&page=\(pg)"
        case .busyArtistsOnDate(let date):  return "/bookings/availability/busy-artists?date=\(date)"
        case .listServices(let artistId):   return "/catalog/services?artistId=\(artistId)"
        case .getService(let id):           return "/catalog/services/\(id)"
        case .createBooking:                return "/bookings"
        case .listMyBookings(let s, let pg):
            var p = "/bookings?page=\(pg)&limit=20"
            if let s = s { p += "&status=\(s)" }
            return p
        case .getBooking(let id):           return "/bookings/\(id)"
        case .cancelBooking(let id):        return "/bookings/\(id)/cancel"
        case .checkAvailability(let a, let s, let e):
            return "/bookings/availability/check?artistId=\(a)&startTime=\(s)&endTime=\(e)"
        case .getAvailableSlots(let a, let d):
            return "/bookings/availability/slots?artistId=\(a)&startDate=\(d)&endDate=\(d)"
        case .listEvents(let pg):           return "/bookings/events?page=\(pg)&limit=20"
        case .createEvent:                  return "/bookings/events"
        case .getEvent(let id):             return "/bookings/events/\(id)"
        case .updateEvent(let id, _):       return "/bookings/events/\(id)"
        case .cancelEvent(let id):          return "/bookings/events/\(id)/cancel"
        case .addBookingToEvent(let eid, let bid): return "/bookings/events/\(eid)/bookings/\(bid)"
        case .removeBookingFromEvent(let eid, let bid): return "/bookings/events/\(eid)/bookings/\(bid)"
        case .listReviews(let a, let pg):   return "/reviews?artistId=\(a)&page=\(pg)"
        case .createReview:                 return "/reviews"
        case .listNotifications(let pg):    return "/notifications?page=\(pg)&limit=20"
        case .markNotificationRead(let id): return "/notifications/\(id)/read"
        case .registerPushToken:            return "/notifications/push-token"
        case .getMyProfile:                 return "/users/me"
        case .updateMyProfile:              return "/users/me"
        case .changePassword:               return "/users/me/password"
        }
    }
}
```

### `APIClient.swift` — con refresh automático en 401
```swift
import Foundation

struct APIClient {
    @discardableResult
    static func request<T: Decodable>(
        _ endpoint: APIEndpoint,
        retryOnUnauthorized: Bool = true
    ) async throws -> T {
        let data = try await rawRequest(endpoint)
        do {
            return try JSONDecoder.piums.decode(T.self, from: data)
        } catch {
            throw AppError.decoding(error)
        }
    }

    private static func rawRequest(
        _ endpoint: APIEndpoint,
        retryOnUnauthorized: Bool = true
    ) async throws -> Data {
        var urlRequest = URLRequest(url: endpoint.url)
        urlRequest.httpMethod = endpoint.method
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.httpBody = endpoint.body

        if let token = TokenStorage.shared.accessToken {
            urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await URLSession.shared.data(for: urlRequest)

        guard let http = response as? HTTPURLResponse else { throw AppError.unknown(URLError(.badServerResponse)) }

        switch http.statusCode {
        case 200..<300:
            return data
        case 401 where retryOnUnauthorized:
            // Intentar renovar el token y reintentar una vez
            try await AuthManager.shared.refreshIfNeeded()
            return try await rawRequest(endpoint, retryOnUnauthorized: false)
        case 401:
            await AuthManager.shared.logout()
            throw AppError.unauthorized
        case 404:
            throw AppError.notFound
        case 500..<600:
            throw AppError.serverError
        default:
            let msg = (try? JSONDecoder().decode(APIErrorBody.self, from: data))?.message ?? HTTPURLResponse.localizedString(forStatusCode: http.statusCode)
            throw AppError.http(statusCode: http.statusCode, message: msg)
        }
    }
}

private struct APIErrorBody: Decodable { let message: String }
```

---

## Modelos de datos completos

```swift
// ── Service (Catalog) ─────────────────────────────────────
struct ArtistService: Codable, Identifiable {
    let id: String
    let artistId: String
    let name: String
    let description: String?
    let price: Int           // centavos
    let currency: String     // "USD" | "GTQ"
    let duration: Int        // minutos
    let category: String?
    let isActive: Bool
}

// ── Event ─────────────────────────────────────────────────
struct Event: Codable, Identifiable {
    let id: String
    let code: String
    let name: String
    let description: String?
    let location: String?
    let notes: String?
    let eventDate: String?   // ISO8601
    let status: EventStatus
    let bookings: [Booking]?
    let createdAt: String
}

enum EventStatus: String, Codable {
    case draft = "DRAFT"
    case active = "ACTIVE"
    case completed = "COMPLETED"
    case cancelled = "CANCELLED"
}

// ── Review ────────────────────────────────────────────────
struct Review: Codable, Identifiable {
    let id: String
    let artistId: String
    let clientId: String
    let bookingId: String
    let rating: Int          // 1-5
    let comment: String?
    let createdAt: String
}

// ── Notification ──────────────────────────────────────────
struct PiumsNotification: Codable, Identifiable {
    let id: String
    let title: String
    let body: String
    let type: String
    let isRead: Bool
    let data: [String: String]?
    let createdAt: String
}

// ── Paginación genérica ───────────────────────────────────
struct PaginatedResponse<T: Codable>: Codable {
    let data: [T]
    let total: Int
    let page: Int
    let totalPages: Int
    let hasMore: Bool
}
```

---

## Navegación principal

```swift
// RootView.swift — punto de entrada según estado de auth
struct RootView: View {
    @State private var auth = AuthManager.shared

    var body: some View {
        if auth.isAuthenticated {
            MainTabView()
        } else {
            AuthFlowView()
        }
    }
}

// MainTabView.swift
struct MainTabView: View {
    var body: some View {
        TabView {
            NavigationStack { HomeView() }
                .tabItem { Label("Inicio", systemImage: "house.fill") }

            NavigationStack { SearchView() }
                .tabItem { Label("Buscar", systemImage: "magnifyingglass") }

            NavigationStack { MyBookingsView() }
                .tabItem { Label("Reservas", systemImage: "calendar") }

            NavigationStack { NotificationsView() }
                .tabItem { Label("Alertas", systemImage: "bell.fill") }

            NavigationStack { ProfileView() }
                .tabItem { Label("Perfil", systemImage: "person.fill") }
        }
        .tint(.piumsOrange)
    }
}
```

---

## Paginación / infinite scroll

```swift
@Observable
final class ArtistListViewModel {
    var artists: [Artist] = []
    var isLoading = false
    var hasMore = true
    private var currentPage = 1

    func loadInitial() async {
        currentPage = 1
        artists = []
        hasMore = true
        await loadNext()
    }

    func loadNextIfNeeded(currentItem: Artist) async {
        guard let last = artists.last, last.id == currentItem.id, hasMore, !isLoading else { return }
        await loadNext()
    }

    private func loadNext() async {
        guard !isLoading else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            let res: PaginatedResponse<Artist> = try await APIClient.request(
                .listArtists(page: currentPage, limit: 20, category: nil, cityId: nil, q: nil)
            )
            artists.append(contentsOf: res.data)
            hasMore = res.hasMore
            currentPage += 1
        } catch { /* manejar error */ }
    }
}

// En la vista:
List(viewModel.artists) { artist in
    ArtistCardView(artist: artist)
        .task { await viewModel.loadNextIfNeeded(currentItem: artist) }
}
.task { await viewModel.loadInitial() }
```

---

## Push Notifications — setup completo

```swift
// En AppDelegate.swift
func application(_ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
    Task {
        try? await APIClient.request(
            .registerPushToken(token: token, platform: "ios")
        ) as EmptyResponse
    }
}

// En PiumsApp.swift
.onReceive(NotificationCenter.default.publisher(for: UIApplication.didBecomeActiveNotification)) { _ in
    UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, _ in
        if granted { DispatchQueue.main.async { UIApplication.shared.registerForRemoteNotifications() } }
    }
}
```

### Deep links desde notificación push
```swift
// Payload esperado del backend:
// { "type": "BOOKING_CONFIRMED", "bookingId": "xxx" }
// { "type": "NEW_MESSAGE",       "chatId": "xxx" }

func handleNotificationTap(userInfo: [AnyHashable: Any]) {
    guard let type = userInfo["type"] as? String else { return }
    switch type {
    case "BOOKING_CONFIRMED", "BOOKING_CANCELLED":
        if let id = userInfo["bookingId"] as? String {
            router.navigate(to: .bookingDetail(id))
        }
    case "NEW_REVIEW":
        router.navigate(to: .myProfile)
    default: break
    }
}
```

---

## Testing — protocolo de repositorio + mock

```swift
// Protocol — permite inyectar mock en tests
protocol BookingRepositoryProtocol {
    func listBookings(status: String?, page: Int) async throws -> PaginatedResponse<Booking>
    func getBooking(id: String) async throws -> Booking
    func cancelBooking(id: String) async throws
}

// Implementación real
final class BookingRepository: BookingRepositoryProtocol {
    func listBookings(status: String?, page: Int) async throws -> PaginatedResponse<Booking> {
        try await APIClient.request(.listMyBookings(status: status, page: page))
    }
    func getBooking(id: String) async throws -> Booking {
        try await APIClient.request(.getBooking(id: id))
    }
    func cancelBooking(id: String) async throws {
        let _: EmptyResponse = try await APIClient.request(.cancelBooking(id: id))
    }
}

// Mock para tests
final class MockBookingRepository: BookingRepositoryProtocol {
    var mockBookings: [Booking] = []
    var shouldThrow = false

    func listBookings(status: String?, page: Int) async throws -> PaginatedResponse<Booking> {
        if shouldThrow { throw AppError.serverError }
        return PaginatedResponse(data: mockBookings, total: mockBookings.count, page: 1, totalPages: 1, hasMore: false)
    }
    func getBooking(id: String) async throws -> Booking { mockBookings[0] }
    func cancelBooking(id: String) async throws {}
}

// Test
@Test func testCancelBookingUpdatesState() async throws {
    let repo = MockBookingRepository()
    let vm = MyBookingsViewModel(repository: repo)
    await vm.cancelBooking(id: "test-id")
    #expect(vm.error == nil)
}
```

---

## Checklist antes de subir a App Store / TestFlight

```
□ Bundle ID registrado en Apple Developer Portal
□ App Store Connect — app creada con íconos y capturas
□ Certificados de distribución y provisioning profile descargados
□ Release.xcconfig con claves de producción (nunca en git)
□ .gitignore incluye *.xcconfig con secretos, GoogleService-Info.plist
□ Versión (CFBundleShortVersionString) y build (CFBundleVersion) incrementados
□ Privacy manifest (PrivacyInfo.xcprivacy) declarando APIs usadas
□ NSCameraUsageDescription, NSPhotoLibraryUsageDescription en Info.plist
□ Sign in with Apple configurado en Capabilities
□ Push Notifications configurado en Capabilities + certificado APNs subido a Firebase
□ SSL Pinning activo para builds de Release
□ Todas las pantallas probadas en iPhone SE (pantalla pequeña) y en modo accesibilidad
□ xcodebuild archive corriendo sin warnings críticos
□ TestFlight build subido y probado antes de publicar
```

---

## Referencias

- Backend API base: `http://localhost:3000/api` (dev)
- Spec OpenAPI: `docs/api-contracts/openapi.yaml`
- Tipos compartidos (ver para referencia de campos): `packages/shared-types/`
- Colores y brand: ver sección Brand & design arriba
- Arquitectura de microservicios: `docs/architecture/`
