# Piums Mobile — Agente de Desarrollo iOS y Android

## Propósito del agente

Eres un experto en desarrollo móvil nativo, especializado en construir las **cuatro apps móviles de Piums** — el marketplace para contratar artistas callejeros en Latinoamérica. Dos plataformas (iOS y Android), dos roles (cliente y artista).

### Arquitectura de plataformas

| Plataforma | Repositorio | Usuarios | Canal |
|---|---|---|---|
| **Piums Client** (iOS) | `piums-ios-client` | Clientes que contratan artistas | App Store |
| **Piums Artist** (iOS) | `piums-ios-artist` | Artistas que ofrecen servicios | App Store |
| **Piums Client** (Android) | `piums-android-client` | Clientes que contratan artistas | Google Play |
| **Piums Artist** (Android) | `piums-android-artist` | Artistas que ofrecen servicios | Google Play |
| **Piums Admin** (Web) | `piums-platform` monorepo | Solo equipo interno | Web (no mobile) |

> **Regla clave**: Admin **nunca** se hace en móvil. Solo existe como web en `apps/web-admin`. Las cuatro apps móviles son completamente independientes entre sí — repositorios separados, IDs de app separados, publicaciones separadas en App Store / Google Play.

> **Paridad de funcionalidades**: iOS y Android tienen exactamente los mismos flujos y pantallas. La diferencia es solo de implementación: SwiftUI / Swift en iOS, Jetpack Compose / Kotlin en Android.

---

## Contexto del proyecto

### ¿Qué es Piums?
- Marketplace donde **clientes** descubren y contratan **artistas** (músicos, bailarines, fotógrafos, etc.)
- Backend: microservicios Node.js/TypeScript con API REST
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

## Stack tecnológico — iOS

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

## Stack tecnológico — Android

- **Lenguaje**: Kotlin
- **UI Framework**: Jetpack Compose (Material 3)
- **Arquitectura**: MVVM + Clean Architecture (mismo patrón que iOS)
- **Networking**: Retrofit 2 + OkHttp + `kotlinx.serialization` (o Gson)
- **Async**: Kotlin Coroutines + Flow
- **Inyección de dependencias**: Hilt
- **Autenticación social**: Firebase Auth SDK (Google Sign-In, no Sign in with Apple en Android)
- **Imágenes**: Coil (Compose-friendly)
- **Mapas**: Google Maps Compose
- **Pagos**: Stripe Android SDK
- **Push notifications**: FCM (Firebase Cloud Messaging)
- **Tokens seguros**: Android Keystore + EncryptedSharedPreferences
- **Navegación**: Jetpack Navigation Compose
- **Android Studio**: Hedgehog+, minSdk 26 (Android 8.0), targetSdk 35

---

---

## Estructura de carpetas — iOS (dos proyectos Xcode separados)

### App Cliente (`piums-ios-client`)
```
piums-ios-client/
├── PiumsClient.xcodeproj/
├── PiumsClient.xcworkspace/    ← usar siempre este
├── PiumsClient/
│   ├── App/
│   │   ├── PiumsClientApp.swift    ← @main entry point
│   │   └── AppDelegate.swift
│   ├── Core/                   ← igual en ambas apps (networking, auth, models)
│   │   ├── Network/
│   │   │   ├── APIClient.swift
│   │   │   ├── APIEndpoint.swift
│   │   │   ├── APIError.swift
│   │   │   └── AuthInterceptor.swift
│   │   ├── Auth/
│   │   │   ├── AuthManager.swift
│   │   │   ├── TokenStorage.swift
│   │   │   └── FirebaseAuthProvider.swift
│   │   ├── Models/
│   │   └── Extensions/
│   ├── Features/
│   │   ├── Auth/               ← Login, Registro de cliente, ForgotPassword
│   │   ├── Home/               ← Descubrimiento de artistas, categorías
│   │   ├── Search/             ← Búsqueda con filtros (ciudad, precio, rating)
│   │   ├── ArtistProfile/      ← Perfil del artista + servicios + reviews
│   │   ├── Booking/            ← Flujo: servicio → fecha/hora → confirmación
│   │   ├── Payments/           ← Checkout con Stripe
│   │   ├── MyBookings/         ← Historial de reservas del cliente
│   │   ├── Reviews/            ← Dejar reseñas post-servicio
│   │   ├── Quejas/             ← Disputas/quejas del cliente
│   │   ├── Profile/            ← Perfil del cliente, configuración
│   │   └── Notifications/      ← Centro de notificaciones
│   ├── Components/
│   ├── Resources/
│   │   ├── Assets.xcassets
│   │   ├── Localizable.strings
│   │   └── Info.plist
│   └── Supporting Files/
├── PiumsClientTests/
└── PiumsClientUITests/
```

**Bundle ID**: `com.piums.client`  
**Display Name**: `Piums`

---

### App Artista (`piums-ios-artist`)
```
piums-ios-artist/
├── PiumsArtist.xcodeproj/
├── PiumsArtist.xcworkspace/    ← usar siempre este
├── PiumsArtist/
│   ├── App/
│   │   ├── PiumsArtistApp.swift    ← @main entry point
│   │   └── AppDelegate.swift
│   ├── Core/                   ← mismo patrón que la app cliente
│   │   ├── Network/
│   │   ├── Auth/
│   │   ├── Models/
│   │   └── Extensions/
│   ├── Features/
│   │   ├── Auth/               ← Login, Registro de artista, ForgotPassword
│   │   ├── Dashboard/          ← Resumen: reservas pendientes, ingresos, rating
│   │   ├── MyServices/         ← CRUD de servicios del catálogo del artista
│   │   ├── Bookings/           ← Solicitudes recibidas, aceptar/rechazar/gestionar
│   │   ├── Calendar/           ← Vista de agenda con disponibilidad
│   │   ├── Availability/       ← Configurar horarios disponibles y bloqueos
│   │   ├── Earnings/           ← Ingresos, historial de pagos, retiros
│   │   ├── Reviews/            ← Reviews recibidas de clientes
│   │   ├── Quejas/             ← Disputas/quejas donde el artista es parte
│   │   ├── Profile/            ← Perfil público del artista: bio, galería, redes
│   │   └── Notifications/      ← Centro de notificaciones
│   ├── Components/
│   ├── Resources/
│   │   ├── Assets.xcassets
│   │   ├── Localizable.strings
│   │   └── Info.plist
│   └── Supporting Files/
├── PiumsArtistTests/
└── PiumsArtistUITests/
```

**Bundle ID**: `com.piums.artist`  
**Display Name**: `Piums Artista`

---

> **Admin es solo web**: `apps/web-admin` en el monorepo. No existe app móvil de admin.

---

## Estructura de carpetas — Android (dos proyectos separados)

### App Cliente (`piums-android-client`)
```
piums-android-client/
├── app/
│   ├── src/main/
│   │   ├── java/com/piums/client/
│   │   │   ├── PiumsClientApp.kt         ← Application class (Hilt)
│   │   │   ├── MainActivity.kt
│   │   │   ├── core/
│   │   │   │   ├── network/
│   │   │   │   │   ├── ApiService.kt     ← Retrofit interface
│   │   │   │   │   ├── ApiClient.kt      ← OkHttp + interceptors
│   │   │   │   │   └── AuthInterceptor.kt
│   │   │   │   ├── auth/
│   │   │   │   │   ├── AuthManager.kt
│   │   │   │   │   └── TokenStorage.kt   ← EncryptedSharedPreferences
│   │   │   │   └── models/
│   │   │   ├── features/
│   │   │   │   ├── auth/                 ← Login, Registro, ForgotPassword
│   │   │   │   ├── home/                 ← Descubrimiento de artistas
│   │   │   │   ├── search/               ← Búsqueda con filtros
│   │   │   │   ├── artistProfile/        ← Perfil + servicios + reviews
│   │   │   │   ├── booking/              ← Flujo: servicio → fecha → confirmación
│   │   │   │   ├── payments/             ← Checkout con Stripe
│   │   │   │   ├── myBookings/           ← Historial de reservas
│   │   │   │   ├── reviews/              ← Dejar reseñas
│   │   │   │   ├── quejas/               ← Disputas
│   │   │   │   ├── profile/              ← Perfil del cliente
│   │   │   │   └── notifications/        ← Centro de notificaciones
│   │   │   ├── components/               ← Composables reutilizables
│   │   │   └── navigation/
│   │   │       └── NavGraph.kt
│   │   └── res/
│   └── build.gradle.kts
├── build.gradle.kts
└── google-services.json                  ← NO subir a git
```

**Application ID**: `com.piums.client`  
**App name**: `Piums`

---

### App Artista (`piums-android-artist`)

Misma estructura que `piums-android-client`. Diferencias:
- **Application ID**: `com.piums.artist`
- **App name**: `Piums Artista`
- Features: `dashboard/`, `myServices/`, `bookings/`, `calendar/`, `availability/`, `earnings/`, `reviews/`, `quejas/`, `profile/`, `notifications/`

---

## Convenciones de código — Android

### Naming (Kotlin / Compose)
- Screens: `ArtistProfileScreen`, `BookingDetailScreen`
- ViewModels: `ArtistProfileViewModel`, `BookingDetailViewModel`
- Repositories: `BookingRepository`, `AuthRepository`
- Models: `Artist`, `Booking` (sin sufijo, mismos nombres que iOS)
- UI State: `BookingDetailUiState` (sealed class o data class)

### MVVM pattern (Kotlin)
```kotlin
// UiState
data class BookingDetailUiState(
    val booking: Booking? = null,
    val isLoading: Boolean = false,
    val error: String? = null
)

// ViewModel
@HiltViewModel
class BookingDetailViewModel @Inject constructor(
    private val repository: BookingRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(BookingDetailUiState())
    val uiState: StateFlow<BookingDetailUiState> = _uiState.asStateFlow()

    fun loadBooking(id: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            repository.getBooking(id)
                .onSuccess { booking -> _uiState.update { it.copy(booking = booking, isLoading = false) } }
                .onFailure { e -> _uiState.update { it.copy(error = e.message, isLoading = false) } }
        }
    }
}

// Screen (Composable)
@Composable
fun BookingDetailScreen(
    bookingId: String,
    viewModel: BookingDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(bookingId) { viewModel.loadBooking(bookingId) }

    when {
        uiState.isLoading -> CircularProgressIndicator()
        uiState.error != null -> ErrorView(message = uiState.error!!)
        uiState.booking != null -> BookingDetailContent(booking = uiState.booking!!)
    }
}
```

### Networking (Retrofit)
```kotlin
// ApiService.kt
interface ApiService {
    @GET("artists/{id}")
    suspend fun getArtist(@Path("id") id: String): Response<Artist>

    @GET("bookings")
    suspend fun listBookings(
        @Query("page") page: Int = 1,
        @Query("status") status: String? = null
    ): Response<PaginatedResponse<Booking>>

    @POST("bookings/{id}/cancel")
    suspend fun cancelBooking(@Path("id") id: String): Response<Unit>
}

// AuthInterceptor.kt — añade Bearer token automáticamente
class AuthInterceptor @Inject constructor(
    private val tokenStorage: TokenStorage
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): okhttp3.Response {
        val request = chain.request().newBuilder()
            .addHeader("Authorization", "Bearer ${tokenStorage.accessToken ?: ""}")
            .build()
        return chain.proceed(request)
    }
}
```

### Tokens y seguridad
- **NUNCA** guardar tokens en SharedPreferences plano — usar `EncryptedSharedPreferences` (Jetpack Security)
- Access token en memoria (`AuthManager` Singleton) + EncryptedSharedPreferences
- Refresh token solo en EncryptedSharedPreferences
- Borrar al logout y al detectar 401

---

## Repositorios Android

| App | Repositorio |
|---|---|
| App Cliente | `https://github.com/app-piums/piums-android-client.git` |
| App Artista | `https://github.com/app-piums/piums-android-artist.git` |

### Flujo de ramas (igual que iOS)
```
main          ← producción (protegida)
develop       ← integración/staging
feature/*     ← nuevas funcionalidades
fix/*         ← corrección de bugs
release/*     ← preparación de release a Google Play
```

---

## Variables de entorno — Android (`local.properties` + `BuildConfig`)

```properties
# local.properties (NO subir a git)
API_BASE_URL=http://10.0.2.2:80   # emulador → host.docker.internal
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

```kotlin
// build.gradle.kts — exponer como BuildConfig
android {
    buildFeatures { buildConfig = true }
    defaultConfig {
        buildConfigField("String", "API_BASE_URL",
            "\"${properties["API_BASE_URL"] ?: "https://piums.com"}\"")
    }
}
```

> En el emulador Android `10.0.2.2` apunta a `localhost` del host. En producción usar `https://backend.piums.io`.

---

## Push Notifications — Android (FCM)

```kotlin
// PiumsFcmService.kt
class PiumsFcmService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        CoroutineScope(Dispatchers.IO).launch {
            runCatching {
                apiService.registerPushToken(RegisterPushTokenRequest(token, "android"))
            }
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        val type = message.data["type"] ?: return
        val notificationId = System.currentTimeMillis().toInt()

        val intent = when (type) {
            "BOOKING_CONFIRMED", "BOOKING_CANCELLED" ->
                Intent(this, MainActivity::class.java).apply {
                    putExtra("bookingId", message.data["bookingId"])
                }
            else -> Intent(this, MainActivity::class.java)
        }

        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(message.notification?.title)
            .setContentText(message.notification?.body)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()
            .also { NotificationManagerCompat.from(this).notify(notificationId, it) }
    }

    companion object { const val CHANNEL_ID = "piums_default" }
}
```

---

## Checklist antes de subir a Google Play

> Aplicar para **cada una de las dos apps Android** por separado.

```
□ Application ID registrado (com.piums.client / com.piums.artist)
□ google-services.json de producción en app/ (NO subir a git)
□ Signing keystore configurado y respaldado de forma segura
□ local.properties con claves de producción (nunca en git)
□ versionCode y versionName incrementados
□ Permisos en AndroidManifest.xml declarados y justificados
□ POST_NOTIFICATIONS permission solicitado en runtime (Android 13+)
□ Network Security Config para debug (localhost) vs release (producción)
□ ProGuard/R8 reglas para Retrofit, Kotlin Serialization, Firebase
□ Bundle de release generado: Build → Generate Signed Bundle/APK
□ Probado en dispositivo físico (no solo emulador) antes de publicar
□ Probado en pantalla pequeña (360dp) y pantalla grande (tablet opcional)
□ Internal Testing en Play Console antes de producción
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

## Flujos MVP por app

### App Cliente — flujos prioritarios
1. **Onboarding & Auth** — Splash, login, registro de cliente, Google Sign-In, Sign in with Apple
2. **Home / Descubrimiento** — Lista de artistas por categoría, búsqueda con filtros (ciudad, precio, rating)
3. **Perfil de artista** — Galería, servicios, reviews, botón "Contratar"
4. **Flujo de reserva** — Selección de servicio → fecha/hora → confirmación → pago (Stripe)
5. **Mis reservas** — Historial con estado, detalle de reserva, cancelación
6. **Reviews** — Dejar reseña post-servicio completado
7. **Quejas** — Crear y seguir disputas con mensajería
8. **Perfil** — Editar datos, cambiar contraseña, logout
9. **Notificaciones** — Push APNs para cambios de estado de reserva y mensajes

### App Artista — flujos prioritarios
1. **Onboarding & Auth** — Splash, login, registro de artista, Google Sign-In, Sign in with Apple
2. **Dashboard** — Resumen del día: reservas pendientes, ingresos del mes, rating promedio
3. **Gestión de servicios** — Crear, editar y desactivar servicios del catálogo
4. **Solicitudes de reserva** — Recibir solicitudes, aceptar / rechazar con motivo
5. **Agenda / Calendario** — Vista mensual/semanal de reservas confirmadas
6. **Disponibilidad** — Configurar horarios semanales y bloquear fechas
7. **Ingresos** — Ver historial de pagos recibidos y pendientes
8. **Perfil público** — Editar bio, galería de fotos, enlaces a redes sociales
9. **Quejas** — Ver y responder disputas donde el artista es parte
10. **Notificaciones** — Push APNs para nuevas solicitudes, pagos, reviews y mensajes

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

## Repositorios iOS

Cada app vive en su propio repositorio GitHub, separado del monorepo principal:

| App | Repositorio |
|---|---|
| App Cliente | `https://github.com/app-piums/piums-ios-client.git` |
| App Artista | `https://github.com/app-piums/piums-ios-artist.git` |

### Setup inicial — iOS

```bash
# App Cliente
git clone https://github.com/app-piums/piums-ios-client.git
cd piums-ios-client
open PiumsClient.xcworkspace

# App Artista
git clone https://github.com/app-piums/piums-ios-artist.git
cd piums-ios-artist
open PiumsArtist.xcworkspace
```

### Flujo de ramas (igual en todos los repos)

```
main          ← producción (protegida)
develop       ← integración/staging
feature/*     ← nuevas funcionalidades
fix/*         ← corrección de bugs
release/*     ← preparación de release a App Store / Google Play
```

### Convención de commits

```
feat: agregar pantalla de perfil del artista
fix: corregir token refresh en interceptor
chore: actualizar dependencias SPM / Gradle
style: aplicar colores de brand en HomeView / BookingCard
test: agregar tests de BookingRepository
```

---

## Comandos útiles de desarrollo

```bash
# ── iOS ──────────────────────────────────────────────────────────
# App Cliente — correr tests
xcodebuild test -workspace PiumsClient.xcworkspace \
  -scheme PiumsClient -destination 'platform=iOS Simulator,name=iPhone 16 Pro'

# App Artista — correr tests
xcodebuild test -workspace PiumsArtist.xcworkspace \
  -scheme PiumsArtist -destination 'platform=iOS Simulator,name=iPhone 16 Pro'

# ── Android ───────────────────────────────────────────────────────
# App Cliente — correr tests
./gradlew test                   # unit tests
./gradlew connectedAndroidTest   # instrumented tests (emulador/dispositivo)

# Build de debug
./gradlew assembleDebug

# Build de release (requiere keystore configurado)
./gradlew bundleRelease

# ── Backend (K8s local) ───────────────────────────────────────────
# El backend corre en K8s Docker Desktop; verificar que los pods estén healthy
kubectl get pods -n piums

# URL base en desarrollo:
# iOS Simulator:     http://localhost:80       (accede al host directamente)
# Android Emulator:  http://10.0.2.2:80        (10.0.2.2 = localhost del host en emulador)
# Dispositivo físico: http://<IP-local>:80      (misma red WiFi)
```

---

## Variables de entorno

### iOS — `.xcconfig`
Cada app tiene sus propios `.xcconfig` — nunca compartir el mismo archivo entre repos.

```
// Debug.xcconfig
API_BASE_URL = http://localhost:80
FIREBASE_PROJECT_ID = piums-dev
STRIPE_PUBLISHABLE_KEY = pk_test_...

// Release.xcconfig
API_BASE_URL = https://backend.piums.io
FIREBASE_PROJECT_ID = piums-prod
STRIPE_PUBLISHABLE_KEY = pk_live_...
```

Leer en Swift:
```swift
let apiBase = Bundle.main.infoDictionary?["API_BASE_URL"] as? String ?? "https://backend.piums.io"
```

### Android — `local.properties` + `BuildConfig`
```properties
# local.properties (NO subir a git)
API_BASE_URL_DEBUG=http://10.0.2.2:80
API_BASE_URL_RELEASE=https://backend.piums.io
STRIPE_PUBLISHABLE_KEY_DEBUG=pk_test_...
STRIPE_PUBLISHABLE_KEY_RELEASE=pk_live_...
```

Leer en Kotlin:
```kotlin
val apiBase = BuildConfig.API_BASE_URL
```

---

## Dependencias sugeridas

### iOS — Swift Package Manager
```swift
.package(url: "https://github.com/onevcat/Kingfisher", from: "7.0.0"),
.package(url: "https://github.com/firebase/firebase-ios-sdk", from: "11.0.0"),
.package(url: "https://github.com/stripe/stripe-ios", from: "24.0.0"),
```

### Android — Gradle (`libs.versions.toml`)
```toml
[versions]
retrofit = "2.11.0"
okhttp = "4.12.0"
hilt = "2.51"
coil = "2.6.0"
firebase-bom = "33.0.0"
stripe = "20.47.0"
coroutines = "1.8.0"
compose-bom = "2024.05.00"

[libraries]
retrofit = { module = "com.squareup.retrofit2:retrofit", version.ref = "retrofit" }
retrofit-gson = { module = "com.squareup.retrofit2:converter-gson", version.ref = "retrofit" }
okhttp-logging = { module = "com.squareup.okhttp3:logging-interceptor", version.ref = "okhttp" }
hilt-android = { module = "com.google.dagger:hilt-android", version.ref = "hilt" }
hilt-compiler = { module = "com.google.dagger:hilt-android-compiler", version.ref = "hilt" }
coil-compose = { module = "io.coil-kt:coil-compose", version.ref = "coil" }
firebase-bom = { module = "com.google.firebase:firebase-bom", version.ref = "firebase-bom" }
stripe-android = { module = "com.stripe:stripe-android", version.ref = "stripe" }
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
    // Browsing/listado: /artists/search — sin filtro de isVerified ni servicesCount
    case listArtists(page: Int, limit: Int, category: String?, city: String?, q: String?)
    case getArtist(id: String)
    // Búsqueda full-text con filtros: /search/artists — requiere isVerified=true y servicesCount>0
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
            // ⚠️ Ruta correcta: /artists/search — NO /artists (esa ruta no existe y devuelve 404)
            var p = "/artists/search?page=\(pg)&limit=\(lm)"
            if let cat  = cat  { p += "&category=\(cat)" }
            if let city = city { p += "&city=\(city)" }  // param: city (string), NO cityId
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

> Aplicar para **cada una de las dos apps** por separado.

```
□ Bundle ID registrado en Apple Developer Portal (com.piums.client / com.piums.artist)
□ App Store Connect — app creada por separado con íconos y capturas propias
□ Certificados de distribución y provisioning profile descargados para cada Bundle ID
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

- **Backend API base**:
  - Dev iOS Simulator: `http://localhost:80/api`
  - Dev Android Emulator: `http://10.0.2.2:80/api`
  - Dev dispositivo físico: `http://<IP-local>:80/api`
  - Producción: `https://backend.piums.io/api`
- Spec OpenAPI: `docs/api-contracts/openapi.yaml`
- Tipos compartidos (para referencia de campos): `packages/shared-types/`
- Colores y brand: ver sección Brand & design arriba
- Arquitectura de microservicios: `docs/architecture/`
- Web cliente (referencia de UX/flujos): `apps/web-client/`
- Web artista (referencia de UX/flujos): `apps/web-artist/`
- Admin (solo web, nunca mobile): `apps/web-admin/`

---

## Piums Artist iOS — Contexto Real de la App

> Repo: `piums-ios-artist` — `/Users/piums/Desktop/PiumsArtistaios/PiumsArtist/`
> Última actualización contextual: 2026-05-11

### Stack real

| Capa | Tecnología |
|------|-----------|
| UI | SwiftUI |
| Persistencia local | SwiftData (`@Model`) |
| Networking | URLSession async/await |
| Auth | Firebase Auth + Google Sign-In (SPM) |
| Push | APNs + FCM via Firebase |
| Mínimo iOS | iOS 17 |
| Lenguaje | Swift 5.9+ |

**SPM packages**: `firebase-ios-sdk` (FirebaseAuth, FirebaseMessaging), `GoogleSignIn-iOS`

### Estructura real de archivos

```
PiumsArtist/
├── PiumsArtistApp.swift          # Entry point, AppDelegate, push setup
├── ContentView.swift             # Root: AuthenticatedView → MainTabView
├── Models/
│   └── Models.swift              # SwiftData: Artist, Service, Booking
├── Views/
│   ├── MainTabView.swift         # TabView raíz (5 tabs)
│   ├── DashboardView.swift       # Tab 0 — Inicio
│   ├── BookingsView.swift        # Tab 1 — Reservas
│   ├── CalendarView.swift        # Tab 2 — Agenda
│   ├── MessagesView.swift        # Tab 3 — Mensajes + ChatDetailView
│   ├── MoreMenuView.swift        # Tab 4 — Más (menú secundario)
│   ├── ServicesView.swift        # Sheet desde Dashboard y MoreMenu
│   ├── ProfileView.swift         # Sheet desde MoreMenu
│   ├── ReviewsView.swift         # Sheet desde MoreMenu
│   ├── DisputasView.swift        # Sheet desde MoreMenu
│   ├── AbsencesView.swift        # Sheet desde MoreMenu
│   ├── WalletView.swift          # Sheet desde MoreMenu
│   ├── CouponsView.swift         # Sheet desde MoreMenu
│   ├── VerificacionView.swift    # Sheet desde MoreMenu
│   ├── ArtistOnboardingView.swift
│   ├── TutorialView.swift
│   └── AuthService.swift         # LoginView, RegisterView, ForgotPasswordView
├── ViewModels/
│   └── ViewModels.swift          # TODOS los ViewModels en un archivo (~1300 líneas)
├── Services/
│   ├── APIService.swift          # Cliente HTTP central (singleton)
│   ├── APIModels.swift           # DTOs Codable + extensiones toDomainModel()
│   ├── AuthService.swift         # Auth singleton (@Published state)
│   ├── PushNotificationService.swift
│   └── ErrorHandling.swift
└── Components/
    └── PiumsComponents.swift     # Colores, fonts, componentes reutilizables
```

### Navegación real

```
ContentView
└── AuthenticatedView  (guard: AuthService.shared.isAuthenticated)
    ├── ArtistOnboardingView  ← si !hasSeenArtistOnboarding (UserDefaults)
    └── MainTabView
        ├── Tab 0: NavigationStack → DashboardView
        │   └── Sheet: ServicesView (botón X izquierda)
        ├── Tab 1: NavigationStack → BookingsView
        │   └── Detail: BookingDetailView
        ├── Tab 2: NavigationStack → CalendarView
        ├── Tab 3: NavigationStack → MessagesView
        │   └── Detail: ChatDetailView (push dentro del stack)
        └── Tab 4: NavigationStack → MoreMenuView
            ├── Sheet: ProfileView (X izquierda)
            ├── Sheet: ServicesView (X izquierda)
            ├── Sheet: ReviewsView
            ├── Sheet: DisputasView
            ├── Sheet: AbsencesView
            ├── Sheet: WalletView
            ├── Sheet: CouponsView
            └── Sheet: VerificacionView
```

**Convención UX**: toda sheet tiene `xmark.circle.fill` en `navigationBarLeading`.

### URLs reales

```swift
// DEBUG (simulador/dispositivo en desarrollo)
currentURL = "https://backend.piums.io/api"
// RELEASE (App Store)
currentURL = "https://piums.com/api"
```

### AuthService — propiedades @Published

```swift
isAuthenticated: Bool
currentArtist: Artist?
avatarURL: String?             // reactivo — usar para UI, no SwiftData
isLoading: Bool
errorMessage: String?
needsVerification: Bool
verificationStatus: String?
artistCategory: String         // "MUSICO" | "FOTOGRAFO" | etc.
artistSpecialties: [String]
artistBackendId: String?       // Keychain getter/setter
```

### Almacenamiento de credenciales (iOS)

| Dato | Almacenamiento | Clave |
|------|---------------|-------|
| JWT Bearer | Keychain (`APIService.authToken`) | gestionado por APIService |
| Refresh token | Keychain | `refresh_token` |
| Artist backend ID | Keychain | `artist_backend_id` |
| Avatar URL | Keychain | `user_avatar_url` |
| Email (remember me) | Keychain | `user_email` |
| Onboarding visto | UserDefaults | `hasSeenArtistOnboarding` |

### Endpoints reales — iOS Artist

```
// Auth
POST /auth/login           POST /auth/register      POST /auth/firebase
POST /auth/refresh-token   POST /auth/logout         POST /auth/forgot-password
GET  /auth/me

// Usuario / Artista
GET  /users/profile        PUT /users/profile        POST /users/me/avatar
GET  /artists/dashboard/me
PUT  /artists/profile
GET  /artists/dashboard/me/bookings

// Servicios
GET    /catalog/services?artistId=
POST   /catalog/services
PUT    /catalog/services/:id
DELETE /catalog/services/:id?artistId=
PATCH  /catalog/services/:id/toggle-status
GET    /catalog/categories

// Reservas
GET   /artists/dashboard/me/bookings?status=&page=
GET   /bookings/:id
PATCH /bookings/:id/accept
PATCH /bookings/:id/decline
PATCH /bookings/:id/complete
PATCH /bookings/:id/cancel

// Mensajes
GET   /chat/conversations
GET   /chat/messages/:conversationId
POST  /chat/messages   { conversationId, content, type }
PATCH /chat/conversations/:id/read
PATCH /chat/messages/:id/read

// Disponibilidad / Ausencias
GET    /artists/me/blocked-slots
POST   /artists/me/blocked-slots
DELETE /artists/me/blocked-slots/:id
GET    /artists/me/absences
POST   /artists/me/absences
DELETE /artists/me/absences/:id

// Otros
GET  /disputes/my      POST /disputes
GET  /reviews?artistId=&page=
GET  /payouts/artist?status=&page=
GET  /coupons/artist   POST /coupons
POST /notifications/register-token
```

### Manejo de errores HTTP

```swift
enum APIError {
    case networkError(Error)
    case decodingError(Error)
    case httpError(Int, String)
    case unauthorized          // 401 → borra token
    case forbidden             // 403
    case notFound              // 404
    case serverError           // 5xx
    case rateLimited(String)   // 429
}
```

### Modelos SwiftData reales

```swift
// Artist (@Model)
id: UUID; name, email, phone, profession, specialty, bio: String
rating: Double; totalReviews, yearsOfExperience: Int
isVerified: Bool; avatarURL: String?
instagramURL, facebookURL, youtubeURL, tiktokURL, websiteURL: String?
portfolioPhotos: [String]

// Service (@Model)
id: UUID; remoteId: String           // remoteId → usar para todas las llamadas API
name, serviceDescription: String
duration: Int                        // minutos
price: Double                        // backend guarda centavos Int → dividir /100
isActive: Bool                       // status == "ACTIVE" (NO usar isAvailable)
category, categoryId, slug: String
pricingType: String                  // "FIXED" | "HOURLY"

// Booking (@Model)
id: UUID; remoteId: String
clientName, clientEmail, clientPhone, clientId: String
clientAvatar: String?
scheduledDate: Date; duration: Int
status: BookingStatus; totalPrice: Double
notes, serviceName: String
bookingCode, eventType: String?
```

### ViewModels principales (iOS)

**DashboardViewModel**
- `GET /artists/dashboard/me`
- `profileStrength: Int` (0-100, calculado localmente, se oculta al llegar a 100)
- Checks: avatar (`AuthService.avatarURL`), servicios activos, datos de contacto

**ServicesViewModel**
- Toggle optimista: flip local inmediato → PATCH → revertir solo si error HTTP/red
- En `decodingError`: mantener estado optimista (backend probablemente guardó)
- `cachedArtistId`: evita fetch extra del dashboard en cada operación

**MessagesViewModel**
```swift
@Published conversations: [ConversationItem]
@Published activeMessages: [MessageItem]

startMessagePolling(for conversationId: String)  // cada 3s — cancela inbox polling
stopMessagePolling()
startInboxPolling()   // cada 15s — se pausa con conversación abierta
stopInboxPolling()

sendMessage(_ content: String, conversationId: String)  // optimista inmediato
```

**CalendarViewModel** — reservas confirmadas + slots bloqueados + ausencias

### Reglas críticas iOS Artist

- `isActive` de servicios: usar solo `status == "ACTIVE"` — `isAvailable` en DB es siempre `true`
- Toggle no re-hace `loadServices()` después de PATCH (causa state race)
- Redes sociales: guardar handle solo → app construye URL completa al guardar (`https://instagram.com/handle`) y parsea al cargar
- Precios: backend en **centavos** (Int) → dividir `/100` para mostrar
- Verificación: evaluar `isVerified == true || verificationStatus == "VERIFIED"` (el campo puede ser `null`)
- Real-time chat: polling cada 3s (no WebSocket en iOS aún)

### Decoding defensivo (iOS)

```swift
// Muchos endpoints pueden devolver wrapped o bare array:
if let wrapped = try? decode(ConversationsResponseDTO.self) { use wrapped.conversations }
else { let dtos = try decode([ConversationDTO].self) }
```

### Bugs conocidos (iOS)

| Bug | Causa | Workaround |
|-----|-------|-----------|
| SPM checkouts vacíos | DerivedData corrupto | `rm -rf ~/Library/Developer/Xcode/DerivedData && xcodebuild -resolvePackageDependencies` |
| `isActive` siempre true | `isAvailable` en DB siempre `true` | Usar solo `status == "ACTIVE"` |
| Toggle no persiste | loadServices() tras toggle cargaba estado viejo | Actualización optimista local + no re-fetch |
| Chat no tiempo real | No hay WebSocket | Polling cada 3s en chat activo |

### SourceKit errors en editor (iOS)

Los errores de SourceKit (ej. "Cannot find 'AuthService' in scope") son **falsos positivos cross-module**. El proyecto compila correctamente con `xcodebuild`. Ignorar.

---

## Piums Artist Android — Contexto Real de la App

> Repo: `piums-android-artist`
> Referencia iOS para paridad de funcionalidad: repo `piums-ios-artist`

### Stack real

| Capa | Tecnología |
|---|---|
| UI | Jetpack Compose + Material 3 |
| DI | Hilt (Dagger) + KSP |
| Navegación | Navigation Compose |
| Red | Retrofit 2 + OkHttp 3 + Gson |
| Imágenes | Coil |
| Auth local | EncryptedSharedPreferences (AES256) |
| Firebase | Auth + FCM (push) |
| Google Sign-In | Credential Manager API |
| Video | ExoPlayer (Media3) |
| minSdk / targetSdk | 26 / 35 |
| Kotlin / JVM | 2.x / Java 17 |

### Arquitectura Android Artist

```
MainActivity → PiumsNavGraph
                ├── SplashScreen         (determina ruta inicial)
                ├── OnboardingScreen     (video/intro, solo primera vez)
                ├── Auth: Login / Register / ForgotPassword
                └── MainScreen           (bottom navigation)
                      ├── Dashboard
                      ├── Bookings
                      ├── Calendar
                      ├── Messages
                      └── More (menú extra)
```

**Patrón**: MVVM unidireccional — `ViewModel` expone `StateFlow<UiState>`, pantalla solo observa y dispara eventos.

### Pantallas reales (28 total)

#### Flujo de autenticación
| Archivo | Descripción |
|---|---|
| `SplashScreen` | Evalúa token y redirige (Main / Onboarding / Login) |
| `OnboardingScreen` | Video introductorio con animación |
| `LoginScreen` | Email+contraseña o Google Sign-In |
| `RegisterScreen` | Registro nuevo artista |
| `ForgotPasswordScreen` | Recuperación de contraseña |

#### Tabs principales
| Tab | Route | Descripción |
|---|---|---|
| Dashboard | `tab_dashboard` | Stats, reservas hoy, fuerza de perfil |
| Bookings | `tab_bookings` | Lista con filtros y acciones |
| Calendar | `tab_calendar` | Calendario mensual + bloqueo de días |
| Messages | `tab_messages` | Inbox + chat en tiempo real |
| More | `tab_more` | Menú con acceso al resto |

#### Sub-pantallas (desde More)
`ProfileScreen`, `ServicesScreen`, `WalletScreen`, `ReviewsScreen`,
`NotificationsScreen`, `AbsencesScreen`, `CouponsScreen`, `InvoicesScreen`,
`DisputesScreen`, `VerificationScreen`, `SettingsScreen`, `TutorialOverlay`

### URLs reales (Android)

```kotlin
// BuildEnv.kt
PROD_URL    = "https://piums.com/api/"
STAGING_URL = "https://backend.piums.io/api/"
LOCAL_URL   = "http://10.0.2.2:3000/api/"
// Debug → STAGING, Release → PROD
```

### AuthInterceptor real (Android)

- Añade `Authorization: Bearer <token>` a todas las peticiones no públicas.
- **Refresh proactivo**: renueva el token si expira en menos de 5 minutos.
- **Cooldown**: 30 s entre intentos de refresh fallidos (evita loop 429).
- En 401: reintenta una vez con token renovado; si falla → `clearOnUnauthorized()` → redirige a Login.
- Endpoints públicos (sin Bearer): `login`, `firebase`, `refresh`, `register`, `forgot-password`, `reset-password`.

### TokenStorage (Android)

Almacena en `EncryptedSharedPreferences`:

| Tipo | Campos |
|------|--------|
| Seguro | `accessToken`, `refreshToken` |
| Plano | `artistBackendId`, `avatarUrl`, `userEmail`, `userName`, `onboardingDone`, `darkMode`, `fcmToken`, `tutorialDone`, `emailVerified` |
| Computed | `currentUserId`: extrae `id` del payload JWT via Base64 |

### Repositorios Android Artist

| Repositorio | Responsabilidad |
|---|---|
| `AuthRepository` | Login, register, Google, refresh, logout, me() |
| `DashboardRepository` | Dashboard snapshot, bookings CRUD, datos de sesión en caché |

### Endpoints reales — Android Artist

```
// Auth
auth/login, auth/register, auth/firebase, auth/refresh, auth/logout, auth/forgot-password, auth/reset-password

// Artista
artists/dashboard/me/            (dashboard)
artists/dashboard/me/bookings
artists/dashboard/me/payouts
artists/dashboard/me/absences
artists/{id}/blocked-slots
blocked-slots

// Catálogo
catalog/services

// Notificaciones
notifications

// Chat
chat/conversations
chat/messages/{id}

// Reseñas
reviews/artist/{artistId}

// Disputas
disputes/

// Cupones
coupons/artist
```

### DTOs clave (Android)

**ArtistProfileDto**
- Nombre: campos `nombre`, `name`, `displayName` (computed)
- Teléfono: viene como `telefono` del backend → usar `resolvedPhone`
- Verificación: `isVerified: Boolean?` + `verificationStatus: String?` — verificar **ambos**
- Shadow ban: `shadowBannedAt`, `shadowBanReason`
- `hasSocialLinks: Boolean?`, `reviewsCount: Int?`

**BookingDto**
- Estados activos: `"PENDING"`, `"CONFIRMED"`, `"IN_PROGRESS"`
- Fecha efectiva: `effectiveDate` (computed del DTO, fusiona múltiples campos)

**AbsenceDto**
- Tipo extranjero: `"WORKING_ABROAD"` (no `"ABROAD_WORK"`)

### Polling en Mensajes (Android)

- **Inbox** (conversaciones): cada **15 s** — se pausa mientras hay conversación abierta.
- **Chat activo** (mensajes): cada **8 s** — cancela el inbox polling mientras está activo.
- Mensajes optimistas: se insertan con `id = "tmp-{timestamp}"` y se reemplazan al confirmar.

### Tema y Branding (Android)

```kotlin
// Colores reales
PiumsOrange     = #FF6B35   // primario / CTAs
PiumsOrangeDark = #E85D2F   // pressed
PiumsSuccess    = #10B981
PiumsError      = #EF4444
PiumsInfo       = #3B82F6
PiumsLabel      = #FFFFFF   // texto primario (dark)
PiumsLabelSecondary = #8E8E93
```

Logo: `R.drawable.piums_logo` en `mdpi`/`xhdpi`/`xxhdpi`.
Uso: `Image(painter = painterResource(R.drawable.piums_logo), modifier = Modifier.height(80.dp))`.
Ubicaciones: `DashboardHeader`, `BookingsHeader`, `RegisterScreen`.

App es **dark-first** (fondo `#1C1C1E`). Modo claro activable desde Settings.

### Format.kt (Android)

```kotlin
Format.priceFromNumber(value, currency)  // "Q150.00"
Format.shortDate(iso)                    // "Jue 24 Abr"
Format.time(iso)                         // "14:30"
Format.relativeTime(iso)                 // "hace 5 min", "ayer", "24 abr"
Format.initialsOf(name)                  // "RG"
Format.isSameDayAsToday(iso)
```

Locale: `es_ES`. Símbolos: GTQ→"Q", USD/MXN→"$", EUR→"€".

### Reglas críticas Android Artist

- **Sin mock de DB en tests**: los tests de integración usan backend real.
- **Paridad con iOS**: cuando haya duda de comportamiento, la versión iOS es la referencia.
- **Refresh loop prevention**: el cooldown de 30 s en `AuthInterceptor` es intencional.
- **Verificación**: siempre evaluar `isVerified == true || verificationStatus == "VERIFIED"`.
- **Teléfono**: el backend envía `telefono`, no `phone`. Usar `resolvedPhone` del DTO.
- **Servicios activos**: `status == "ACTIVE"` — no usar `isAvailable` (siempre `true` en DB).
- **ConnectivityObserver**: `Flow<Boolean>` para estado de red en tiempo real.

---

## Piums Cliente iOS — Contexto Real de la App

> Bundle ID: `io.piums.cliente`
> Ruta local de referencia iOS: `/Users/ruben/Documents/piums-los-client/`
> Última actualización contextual: 2026-05-14

### Stack real

| Capa | Tecnología |
|------|-----------|
| UI | SwiftUI |
| Arquitectura | MVVM + `@Observable` / `@MainActor` (Swift 6+) |
| Networking | URLSession async/await + certificate pinning |
| Auth | Firebase Auth + Google Sign-In + Apple + Facebook + TikTok (OAuthWebLogin) |
| Push | APNs + FCM via Firebase |
| Mínimo iOS | iOS 16+ |
| Lenguaje | Swift 5.9+ |
| Chat | Socket.IO (`ChatSocketManager`) |
| Pagos | Stripe SDK + Tilopay (WKWebView) |

**URLs reales:**
- Backend REST: `https://client.piums.io`
- Socket.IO: `https://backend.piums.io`

### Estructura real de archivos

```
PiumsCliente/
├── App/
│   ├── AppDelegate.swift          # Firebase, Google Sign-In, APNs
│   ├── MainTabView.swift          # 5 tabs + deep links via NotificationCenter
│   ├── PiumsClienteApp.swift      # Entry point, validación de keys
│   ├── RootView.swift             # Auth gate: AuthFlowView vs MainTabView
│   └── SplashVideoView.swift
├── Components/
│   ├── SharedComponents.swift     # PiumsTextField, PiumsButton, ErrorBannerView, etc.
│   ├── DayButton.swift
│   └── LocationSearchField.swift
├── Core/
│   ├── Auth/
│   │   ├── AuthManager.swift      # Session management (login, logout, refresh, verify)
│   │   ├── TokenStorage.swift     # Keychain + JWT exp check
│   │   ├── LoginRateLimiter.swift # Rate limit con persistencia UserDefaults
│   │   └── OAuthWebLogin.swift    # ASWebAuthenticationSession para FB/TikTok
│   ├── Extensions/
│   │   ├── JSONCoder+Piums.swift  # snakeCase + ISO 8601
│   │   ├── Color+Piums.swift      # Color(hex:), colores de marca
│   │   ├── LocationStore.swift    # Observable ubicación del usuario
│   │   └── LocationManager.swift
│   ├── Models/
│   │   └── Models.swift           # TODOS los modelos Codable
│   ├── Network/
│   │   ├── APIClient.swift        # HTTP genérico con retry y refresh
│   │   ├── APIEndpoint.swift      # Todos los endpoints
│   │   ├── AppError.swift         # Enum errores en español
│   │   └── NetworkSecurity.swift  # Certificate pinning SHA-256
│   └── ThemeManager.swift
├── Features/
│   ├── ArtistProfile/
│   ├── Auth/                      # Login, Register, ForgotPassword, AuthFlowView
│   ├── Booking/                   # BookingFlowView (4 pasos), ArtistSearchByDateView
│   ├── Chat/
│   │   ├── ChatSocketManager.swift
│   │   └── ChatRealtimeStore.swift
│   ├── Coupons/
│   ├── Events/
│   ├── Favorites/                 # FavoritesView + FavoritesStore (singleton)
│   ├── Home/
│   ├── HowItWorks/                # TourOverlayView, TutorialManager
│   ├── MyBookings/
│   ├── Notifications/             # NotificationsView + NotificationsStore
│   ├── Onboarding/                # 4 pasos: nombre, especialidades, ciudad, docs
│   ├── Payments/                  # PaymentsView, WalletView, TilopayWebView
│   ├── Profile/
│   ├── Quejas/                    # Disputas: lista, detalle, crear
│   ├── Reviews/
│   └── Search/                    # SearchView, TalentPickerView
```

### Navegación real — 5 tabs

| Tab | Vista | Badge |
|-----|-------|-------|
| Inicio (0) | `HomeView` | — |
| Explorar (1) | `SearchView` | — |
| Mi Espacio (2) | `MySpaceView` | — |
| Mensajes (3) | `ChatInboxView` | `ChatRealtimeStore.unreadCount` |
| Perfil (4) | `ProfileView` | — |

**Deep links via NotificationCenter:**
```swift
.navigateToBooking      // Tab Mi Espacio → detalle
.navigateToMySpace      // Tab Mi Espacio
.navigateToProfile      // Tab Perfil
.navigateToConversation // Tab Mensajes
.notificationsNeedRefresh
```

### AuthManager — comportamiento real

`@Observable @MainActor` singleton.

- `login` → `POST /api/auth/login`
- `register` → `POST /api/auth/register/client`
- `loginWithGoogle/Apple` → Firebase → `POST /api/auth/firebase`
- `loginWithFacebook/TikTok` → OAuthWebLogin (ASWebAuthenticationSession) → `POST /api/auth/facebook` / `POST /api/auth/tiktok`
- `forgotPassword` — mínimo 600 ms de respuesta (anti-timing)
- `logout` — limpia Keychain + UserDefaults + Google Sign-Out
- **Inicio persistente**: restaura `currentUser` desde cache UserDefaults (sin red) → si access expirado → `refreshIfNeeded()` → `verify()` en background. Solo cierra sesión en `.unauthorized` explícito — errores de red mantienen sesión.

### TokenStorage (iOS Cliente)

**Keychain** (`kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly`):
- `piums.access_token`, `piums.refresh_token`

**UserDefaults:**
- `hasSeenHowItWorks`, `hasSeenTour`, `hasSeenOnboarding`, `piums_color_scheme`, `piums.currentUser` (JSON cache), `identityVerificationSubmitted`, `identityVerificationApproved`, `rl.lock.{email}` (rate limit)

### LoginRateLimiter

| Intentos fallidos | Bloqueo |
|:-----------------:|---------|
| 3–4 | Advertencia: "X intentos restantes" |
| 5–9 | 5 minutos |
| 10+ | 15 minutos |

Persiste en UserDefaults. Cuenta regresiva live en `AuthViewModel`.

### Certificate Pinning

SHA-256 para `client.piums.io` y `backend.piums.io`:
- Leaf cert (vence 2026-07-21): `bXcinqCEgWfTR8vYpEctiYO9Tq7YLAfUtvWLZJKvNhI=`
- Let's Encrypt E8 Intermediate: `g2JP0zjI2bAjwYpny3qcBRnaQ9EXdbTGy9rUXD2ZfFI=`

Pinning desactivado en DEBUG para Charles Proxy.

```bash
# Rotar certificado:
echo | openssl s_client -connect client.piums.io:443 2>/dev/null \
  | openssl x509 -outform der | openssl dgst -sha256 -binary | base64
```

### Endpoints reales — iOS Cliente

```
// Auth
POST /api/auth/login            POST /api/auth/register/client
POST /api/auth/firebase         POST /api/auth/facebook
POST /api/auth/tiktok           POST /api/auth/refresh
POST /api/auth/logout           GET  /api/auth/me
POST /api/auth/forgot-password  PATCH /api/auth/complete-onboarding
POST /api/auth/change-password  PATCH /api/auth/profile

// Artistas y búsqueda
GET /api/search/artists?q=&page=&limit=&specialty=&city=&minPrice=&maxPrice=&minRating=&isVerified=&sortBy=&sortOrder=
GET /api/search/smart?q=&city=&lat=&lng=&page=&limit=
GET /api/artists/{id}
GET /api/artists/{id}/portfolio

// Catálogo
GET  /api/catalog/services?artistId=
GET  /api/catalog/services/{id}
POST /api/catalog/pricing/calculate

// Reservas
POST  /api/bookings
GET   /api/bookings?page=&limit=20
GET   /api/bookings/{id}
POST  /api/bookings/{id}/cancel
PATCH /api/bookings/{id}/reschedule
GET   /api/availability/time-slots?artistId=&date=
GET   /api/availability/calendar?artistId=&year=&month=
POST  /api/bookings/{bookingId}/no-show

// Reseñas
GET  /api/reviews?artistId=&page=&limit=10
POST /api/reviews   (bookingId obligatorio)

// Notificaciones
GET  /api/notifications?page=&limit=20
POST /api/notifications/read
POST /api/notifications/push-token
GET  /api/notifications/preferences
PUT  /api/notifications/preferences

// Perfil y usuario
POST   /api/users/me/avatar  (multipart)
DELETE /api/users/{userId}
POST   /api/users/documents/upload?folder={front|back|selfie}

// Favoritos
GET    /api/users/me/favorites?page=&limit=50&entityType=
POST   /api/users/me/favorites
DELETE /api/users/me/favorites/{id}
GET    /api/users/me/favorites/check

// Pagos
POST  /api/payments/checkout
POST  /api/payments/tilopay/confirm
GET   /api/payments/credits/me
GET   /api/payments/payments?page=&limit=20
GET   /api/payments/payments/{id}
GET   /api/payments/methods
DELETE /api/payments/methods/{id}
PATCH  /api/payments/methods/{id}/default
POST   /api/payments/methods

// Chat
GET   /api/chat/conversations?page=&limit=20
GET   /api/chat/conversations/{id}
POST  /api/chat/conversations
PATCH /api/chat/conversations/{id}/read
GET   /api/chat/messages/{conversationId}?page=&limit=50
POST  /api/chat/messages
GET   /api/chat/messages/unread-count

// Disputas
GET  /api/disputes/me
POST /api/disputes
GET  /api/disputes/{id}
POST /api/disputes/{id}/messages

// Cupones
GET  /api/coupons/my
POST /api/coupons/validate

// Eventos
GET    /api/events
POST   /api/events
GET    /api/events/{id}
PATCH  /api/events/{id}
DELETE /api/events/{id}
POST   /api/events/{eventId}/bookings/{bookingId}
```

### Chat en tiempo real — Socket.IO (iOS Cliente)

**Conexión:** `https://backend.piums.io` con `auth: ["token": accessToken]`, 10 reintentos, espera inicial 3 s, máx 30 s.

**Eventos out (client → server):**
- `conversation:join`, `conversation:leave`, `conversation:read`, `message:send { conversationId, content, type: "TEXT" }`

**Eventos in (server → client):**
- `message:received` → `ChatMessage`
- `message:sent` → echo propio
- `message:read`, `unread:count { unreadCount }`, `message:error`

**Quirk:** Si llega mensaje de conversación desconocida → `loadConversations()` para refrescar inbox.
**`unread:count`** puede llegar como `{ unreadCount }` o como `Int` directo — manejar ambos.

`ChatRealtimeStore` (singleton) mantiene `unreadCount` para el badge del tab. Auto-conecta al lanzar.

### Flujo de pago (iOS Cliente)

```
POST /api/payments/checkout → PaymentIntentWrapper
    ├── provider == "STRIPE" → clientSecret → Stripe SDK nativo
    └── provider == "TILOPAY" → redirectUrl → TilopayWebView (WKWebView como .sheet)
         └── intercepta callback → POST /api/payments/tilopay/confirm
```

Anticipo: si `booking.anticipoRequired == true` → solo se cobra `anticipoAmount`; resto al completar.

### Flujo de reserva — 4 pasos (iOS Cliente)

```
Paso 1: Fecha → GET /api/availability/calendar + /time-slots
Paso 2: Detalles (ubicación, notas, addons) → POST /api/catalog/pricing/calculate
Paso 3: Confirmación (desglose: base + addons + travel - descuentos)
Paso 4: POST /api/bookings → Booking → checkout (Stripe o Tilopay)
```

`scheduledDate` debe enviarse como ISO 8601 completo: `"2026-06-15T00:00:00.000Z"` (no solo `"YYYY-MM-DD"`).

### Modelos clave (iOS Cliente)

```swift
// AuthUser
id, email, nombre: String   // "nombre", no "name"
role: String                 // "cliente" (minúscula)
avatar: String?
emailVerified, isVerified: Bool
status: String               // "ACTIVE" | "BANNED" | "SUSPENDED"

// Booking — estados
pending, confirmed, paymentPending, paymentCompleted
inProgress, delivered, disputeOpen, disputeResolved, completed
rescheduled, reschedulePendingArtist, reschedulePendingClient
cancelledClient, cancelledArtist, rejected, noShow, unknown

// PaymentStatus
pending, completed, anticipoPaid, depositPaid
chargingRemaining, fullyPaid, frozen
partiallyRefunded, refunded, failed, unknown

// Precios: siempre Int (centavos) → extension Int { var piumsFormatted: String }
// 250000 → "$ 2,500.00"
```

### Quirks críticos del backend (iOS Cliente)

1. **`scheduledDate`** — ISO 8601 completo, no solo fecha.
2. **Favoritos** — `GET` devuelve `{ favorites, pagination }` (no `{ data }`). `POST` devuelve `{ favorite: {...} }`.
3. **Conversaciones** — `participant1Id`/`participant2Id` en lugar de `userId`/`artistId`. `lastMessagePreview` en lugar de `lastMessageContent`.
4. **`getMe`** (`GET /api/auth/me`) — envía token si existe pero no falla si no hay.
5. **Anticipo** — `anticipoRequired: Bool`, `anticipoAmount: Int` centavos, estado `anticipoPaid`.
6. **`refreshToken`** — `POST /api/auth/refresh` — nunca enviar header `Authorization`.
7. **Lazy provisioning** — `getUserByAuthId` en users-service crea perfil si no existe (social login).
8. **`unread:count` socket** — puede llegar como `{ unreadCount }` o como `Int`. Manejar ambos.
9. **Todos los precios** son centavos (`Int`) — nunca confundir con la unidad real.

### Tour interactivo — TutorialManager (iOS Cliente)

- 6 pasos cubriendo los 5 tabs + búsqueda por fecha/lugar
- `@AppStorage("hasSeenTour")` — se muestra solo una vez
- Swipe izquierda/derecha con `DragGesture(minimumDistance: 40)`
- `stepDirection: StepDirection` (.forward/.backward) → `AnyTransition.asymmetric`

### Onboarding — 4 pasos (iOS Cliente)

1. Nombre (confirmar/editar)
2. Especialidades (selección múltiple)
3. Ciudad preferida
4. Verificación de identidad → `uploadDocument(folder:)` → `PATCH /api/auth/complete-onboarding`

---

## Piums Cliente Android — Contexto Real de la App

> Paquete: `com.piums.cliente`
> Ruta local: `/Users/ruben/Desktop/ClientePiums/`
> Referencia iOS para paridad: `/Users/ruben/Documents/piums-los-client/`
> Última actualización contextual: 2026-05-14

### Stack real

| Capa | Tecnología |
|---|---|
| Lenguaje | Kotlin 2.0, `jvmTarget = 17`, `minSdk = 26` |
| UI | Jetpack Compose + Material 3 |
| Arquitectura | MVVM — `@HiltViewModel` + `mutableStateOf` (no StateFlow en VMs) |
| DI | Hilt (`@AndroidEntryPoint`, `@Singleton`, `@ApplicationContext`) |
| Red | Retrofit + OkHttp + Gson, `AuthInterceptor` (Bearer), `setLenient()` |
| Auth | Firebase Auth + Google Sign-In (Credential Manager), `role = "cliente"` |
| Push | Firebase Cloud Messaging — `PiumsFcmService` |
| Imágenes | Coil (`AsyncImage`) |
| Storage | `EncryptedSharedPreferences` (tokens) + `SharedPreferences` plain |
| Ubicación | `FusedLocationProviderClient` → `LocationHelper` |
| Chat | Socket.IO `2.1.0` → `ChatSocketManager` (`@Singleton`) |

**URLs reales:**
- Prod REST: `https://api.piums.com/`
- Prod WebSocket: `https://backend.piums.io/`
- Dev (emulador): `http://10.0.2.2:3005/`

### Navegación real (Android Cliente)

```
NavGraph (outer)
├── splash
├── auth        → AuthScreen (login / registro / forgot password)
├── onboarding  → OnboardingScreen (3 págs: Welcome + Intereses + Ready)
└── main        → MainScaffold (inner NavController)
    ├── TABS (bottom bar)
    │   ├── home
    │   ├── search
    │   ├── myspace
    │   ├── inbox
    │   └── profile
    └── DETAIL ROUTES
        ├── artist/{artistId}
        ├── booking/{artistId}
        ├── booking-detail/{bookingId}
        ├── dispute/{disputeId}
        ├── notifications
        ├── payments
        ├── tutorial
        ├── how-it-works
        └── my-disputes
```

Bottom bar y FAB se ocultan cuando `currentRoute !in TAB_ROUTES`.
Tutorial se auto-muestra si `tokenStorage.tutorialDone == false`.

### Estado de la app — 17/17 fases completas

1. Scaffold (NavGraph, MainScaffold, offline banner, FCM, TokenStorage)
2. Auth (email/password + Google Sign-In, `role = "cliente"`)
3. Onboarding (HorizontalPager 3 págs)
4. Home (getMe + getBookings + searchArtists en paralelo, MiniCalendar, shimmer)
5. Search/Explorar (debounce 400 ms, FilterSheet, CategoryGrid, geoloc)
6. Perfil del Artista (paralelo artist+services+reviews+portfolio+favCheck, toggleFavorite optimista)
7. Booking Flow (4 steps: Service/Date/Details/Confirm, time slots, `calculatePricing`)
8. Mi Espacio (HorizontalPager: Reservas + Eventos + Favoritos)
9. Inbox (Conversaciones con WebSocket + Quejas)
10. Notificaciones (paginado, markAllRead, íconos por tipo)
11. Reseñas (`ReviewDialog` 5 estrellas en BookingCard)
12. Pagos (`PaymentsScreen` status-coloreado)
13. Tutorial (`TourOverlay` canvas spotlight + pulsing ring)
14. Perfil/Ajustes (editName, changePassword, logout)
15. Eventos (CRUD en Mi Espacio)
16. Geoloc (`LocationHelper`, "Cerca de mí" toggle)
17. Polish (`DeepLinkManager`, FCM local notifications, deep links `onNewIntent`)

### TokenStorage (Android Cliente)

| Campo | Almacén |
|---|---|
| `accessToken`, `refreshToken` | `EncryptedSharedPreferences` (`piums_cliente_secure`) |
| `userId`, `userName`, `userEmail`, `avatarUrl`, `fcmToken` | `SharedPreferences` plain |
| `onboardingDone`, `tutorialDone` | `SharedPreferences` plain |
| `isLoggedIn` | computed: `accessToken != null` |

`clear()` limpia ambos stores al hacer logout.

### WebSocket — ChatSocketManager (Android Cliente)

- `@Singleton` en Hilt
- Conecta a `https://backend.piums.io` con `IO.Options().auth = mapOf("token" to accessToken)`
- **Eventos in**: `message:received` → `SharedFlow<ChatMessageDto>`, `unread:count`
- **Eventos out**: `conversation:join`, `conversation:leave`, `conversation:read`
- Send sigue por REST (no socket) para fiabilidad
- `InboxViewModel` conecta en `init`, join al abrir conversación, leave al cerrar
- Deduplicación por `message.id` (evita duplicados REST+socket)

### Deep Links FCM (Android Cliente)

`DeepLinkManager` → `SharedFlow<DeepLinkTarget>`: `Artist(id)`, `Booking(id)`, `Inbox`, `Notifications`

| Tipo FCM | Destino |
|----------|---------|
| `NEW_MESSAGE` / `CHAT` | Inbox |
| `BOOKING_*` | MySpace |
| `NEW_REVIEW` / `ARTIST_PROFILE` | Artist |

`MainActivity` (`singleTop`) → `onNewIntent` → `deepLinkManager.dispatchFromExtras(type, entityId)`

### Colores de marca (Android Cliente)

```kotlin
PiumsOrange    = Color(0xFFFF6B35)   // naranja primario
PiumsInfo      = Color(0xFF3B82F6)   // azul (CONFIRMED)
PiumsSuccess   = Color(0xFF22C55E)   // verde
PiumsWarning   = Color(0xFFF59E0B)   // amarillo
PiumsError     = Color(0xFFEF4444)   // rojo
PageBackground = Color(0xFF1C1C1E)   // fondo oscuro
```

**Colores de estado en BookingCard:**

| Status | Color |
|--------|-------|
| PENDING | `PiumsWarning` |
| CONFIRMED | `PiumsInfo` (azul) |
| PAYMENT_PENDING | `PiumsWarning` |
| COMPLETED | `PiumsSuccess` |
| CANCELLED_* / REJECTED | `PiumsError` |
| RESCHEDULED | `0xFF8B5CF6` (púrpura) |

### Archivos clave (Android Cliente)

```
app/src/main/java/com/piums/cliente/
├── data/
│   ├── local/TokenStorage.kt
│   └── remote/
│       ├── PiumsApiService.kt
│       └── dto/
│           ├── BookingDtos.kt       # BookingDto, BookingStatus, BookingsListResponse
│           ├── ArtistDtos.kt
│           ├── ChatDtos.kt          # ConversationDto, ChatMessageDto
│           └── OtherDtos.kt
├── ui/
│   ├── navigation/
│   │   ├── NavGraph.kt
│   │   ├── MainScaffold.kt
│   │   └── MainViewModel.kt        # unreadCount, tourManager, socketManager
│   ├── screens/
│   │   ├── home/HomeScreen.kt
│   │   ├── search/SearchScreen.kt
│   │   ├── myspace/MySpaceScreen.kt  # BookingCard, EventCard, FavoriteCard
│   │   ├── inbox/InboxScreen.kt      # chat, disputes
│   │   ├── profile/ProfileScreen.kt
│   │   ├── artist/ArtistProfileScreen.kt
│   │   ├── booking/BookingScreen.kt
│   │   └── reviews/ReviewScreen.kt
│   ├── components/
│   │   └── TourOverlay.kt          # spotlight Canvas + pulsing ring
│   └── theme/
│       └── Color.kt
└── utils/
    ├── ChatSocketManager.kt
    ├── DeepLinkManager.kt
    ├── TourManager.kt
    └── LocationHelper.kt
```

### Quirks críticos del backend (Android Cliente)

- `role = "cliente"` **en minúscula** → error 400 si se envía en mayúsculas
- Precios en **centavos enteros** (`Int`) → dividir entre 100 para mostrar
- `GET /api/artists/{id}` → responde `{"artist": {...}}` → usar `ArtistDetailResponse.resolved`
- `SearchArtistsResponse` / `SmartSearchResponse` → campos `artists` y `data` ambos nullable → usar `.list` accessor
- `UnreadCountResponse` → tiene `count` y `unreadCount` → usar computed `val count`
- `ConversationDto` → `participant1Id`/`participant2Id` con `@SerializedName` (no `userId`)
- `ChatMessageDto.status` → `String` ("SENT"/"DELIVERED"/"READ"), no `Boolean`
- `isOwn` en mensajes → comparar `senderId == tokenStorage.userId`
- `bookingId` **obligatorio** al crear reseña
- API devuelve mensajes de chat **oldest-first** — **no invertir** el orden
- `sortBy`/`sortOrder` **no pasar** en carga inicial del home (iOS no los usa)
- Backend puede devolver camelCase o snake_case → Android asume camelCase (Gson default)

### Fixes y mejoras recientes (2026-05-14)

- **HTTP 429 en reopen**: `MainViewModel.setSocketActive()` solo gestiona WebSocket — no lanza API calls en cada `ON_RESUME`.
- **Orden mensajes chat**: eliminado `.reversed()` en `InboxScreen` — la API ya devuelve oldest-first.
- **TourOverlay**: reescrito con Canvas spotlight (`BlendMode.Clear`) + pulsing ring (`infiniteRepeatable`) + triángulo Canvas apuntando al tab activo.
- **MySpaceScreen filtros**: añadido chip "Pago pend." (`PAYMENT_PENDING`); reservas ordenadas por `scheduledDate` ascending.
- **BookingCard rediseñado** (estilo iOS `BookingRowView`): ícono de estado (48dp, rounded 12dp) con fondo `statusColor.copy(0.12f)`, precio naranja bold, sin elevación (`Box` plano).
