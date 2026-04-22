# Code Citations

## License: Apache-2.0
https://github.com/Catherine22/Frontend-Development/blob/45f10023c0a5466a9f65a146acb856421f14da36/Vue/vue-pwa/nginx/nginx.conf

```
# 🏗️ **ARQUITECTURA COMPLETA + CLEAN ARCHITECTURE + INFRA + DEPLOYMENT**

---

## 📋 **RESUMEN EJECUTIVO**

```
╔═══════════════════════════════════════════════════════╗
║  PIUMS PLATFORM - ARQUITECTURA COMPLETA               ║
║                                                        ║
║  Patrón:           Clean Architecture ✅              ║
║  Infra:            Docker + Nginx + CI/CD ✅          ║
║  Deploy:           GitHub Actions (automatizado) ✅   ║
║  Estado:           Production-Ready 🚀                ║
╚═══════════════════════════════════════════════════════╝
```

---

## 🎯 **PARTE 1: CLEAN ARCHITECTURE**

### **¿Se sigue usando Clean Architecture?** ✅ **SÍ, AL 100%**

---

### **Estructura por Microservicio (Ejemplo: booking-service)**

````
services/booking-service/
├── src/
│   ├── application/              # CAPA DE APLICACIÓN
│   │   ├── dtos/                 # Data Transfer Objects
│   │   │   ├── create-booking.dto.ts
│   │   │   ├── update-booking.dto.ts
│   │   │   └── booking-response.dto.ts
│   │   │
│   │   ├── use-cases/            # Casos de Uso (Lógica de negocio)
│   │   │   ├── create-booking.usecase.ts
│   │   │   ├── reschedule-booking.usecase.ts
│   │   │   ├── cancel-booking.usecase.ts
│   │   │   ├── verify-code.usecase.ts
│   │   │   └── calculate-price.usecase.ts
│   │   │
│   │   └── interfaces/           # Contratos de infra
│   │       ├── booking.repository.interface.ts
│   │       ├── payment.service.interface.ts
│   │       └── notification.service.interface.ts
│   │
│   ├── domain/                   # CAPA DE DOMINIO (Core Business)
│   │   ├── entities/             # Entidades de negocio
│   │   │   ├── booking.entity.ts
│   │   │   ├── booking-code.entity.ts
│   │   │   └── booking-item.entity.ts
│   │   │
│   │   ├── value-objects/        # Objetos de valor
│   │   │   ├── price.vo.ts
│   │   │   ├── date-range.vo.ts
│   │   │   └── booking-status.vo.ts
│   │   │
│   │   ├── aggregates/           # Agregados
│   │   │   └── booking.aggregate.ts
│   │   │
│   │   ├── events/               # Domain Events
│   │   │   ├── booking-created.event.ts
│   │   │   ├── booking-confirmed.event.ts
│   │   │   └── booking-cancelled.event.ts
│   │   │
│   │   └── exceptions/           # Excepciones de dominio
│   │       ├── booking-not-found.exception.ts
│   │       ├── invalid-booking-status.exception.ts
│   │       └── unavailable-slot.exception.ts
│   │
│   ├── infrastructure/           # CAPA DE INFRAESTRUCTURA
│   │   ├── database/             # Persistencia
│   │   │   ├── prisma/
│   │   │   │   ├── schema.prisma
│   │   │   │   └── migrations/
│   │   │   │
│   │   │   └── repositories/    # Implementaciones de repos
│   │   │       ├── booking.repository.ts
│   │   │       └── booking-code.repository.ts
│   │   │
│   │   ├── http/                 # Clientes HTTP
│   │   │   ├── payment.client.ts
│   │   │   ├── artist.client.ts
│   │   │   └── notification.client.ts
│   │   │
│   │   ├── cache/                # Redis
│   │   │   └── booking-cache.service.ts
│   │   │
│   │   └── messaging/            # Event Bus (RabbitMQ/Redis Pub/Sub)
│   │       ├── event-publisher.ts
│   │       └── event-subscriber.ts
│   │
│   ├── presentation/             # CAPA DE PRESENTACIÓN (API Layer)
│   │   ├── controllers/          # REST Controllers
│   │   │   ├── booking.controller.ts
│   │   │   └── booking-admin.controller.ts
│   │   │
│   │   ├── guards/               # Auth guards
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   │
│   │   ├── interceptors/         # Response transformation
│   │   │   └── transform.interceptor.ts
│   │   │
│   │   └── filters/              # Exception handling
│   │       └── http-exception.filter.ts
│   │
│   ├── shared/                   # SHARED (Cross-cutting)
│   │   ├── config/               # Configuración
│   │   │   └── booking.config.ts
│   │   │
│   │   ├── decorators/           # Custom decorators
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   │
│   │   ├── utils/                # Utilidades
│   │   │   ├── date.utils.ts
│   │   │   └── code-generator.utils.ts
│   │   │
│   │   └── constants/            # Constantes
│   │       └── booking-status.constants.ts
│   │
│   ├── booking.module.ts         # Módulo raíz
│   └── main.ts                   # Bootstrap
│
├── test/                         # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── prisma/
│   └── schema.prisma
│
├── Dockerfile
├── package.json
└── tsconfig.json
````

---

### **Flujo de Datos (Clean Architecture)**

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT REQUEST                          │
│               (POST /api/bookings)                           │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (API Gateway)                            │
│  ├─ booking.controller.ts                                    │
│  ├─ Validación DTO (class-validator)                        │
│  ├─ Guards (JWT auth, RBAC)                                 │
│  └─ Interceptors (logging, transform)                       │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  APPLICATION LAYER (Use Cases)                               │
│  ├─ create-booking.usecase.ts                               │
│  │  ├─ 1. Validar disponibilidad                            │
│  │  ├─ 2. Crear entidad Booking                             │
│  │  ├─ 3. Calcular precio total                             │
│  │  ├─ 4. Generar código 6 dígitos                          │
│  │  ├─ 5. Llamar payment service                            │
│  │  ├─ 6. Guardar en BD (via repository)                    │
│  │  └─ 7. Publicar evento BookingCreated                    │
│  └─ Orchestration + Business logic                          │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  DOMAIN LAYER (Core Business)                                │
│  ├─ booking.entity.ts                                        │
│  │  ├─ Business rules                                        │
│  │  ├─ Validaciones de negocio                              │
│  │  ├─ State machine (status transitions)                   │
│  │  └─ Domain events dispatch                               │
│  ├─ value-objects/                                           │
│  │  ├─ Price (validación, operaciones)                      │
│  │  └─ DateRange (validación, overlaps)                     │
│  └─ Pure business logic (NO dependencies)                   │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE LAYER (Detalles técnicos)                    │
│  ├─ database/repositories/                                   │
│  │  └─ booking.repository.ts                                │
│  │     └─ Prisma implementation                             │
│  ├─ http/                                                    │
│  │  ├─ payment.client.ts (Stripe)                           │
│  │  ├─ artist.client.ts                                     │
│  │  └─ notification.client.ts                               │
│  ├─ cache/                                                   │
│  │  └─ Redis client                                         │
│  └─ messaging/                                               │
│     └─ Event bus (RabbitMQ)                                 │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL SERVICES                                           │
│  ├─ PostgreSQL (Booking data)                               │
│  ├─ Redis (Cache + Pub/Sub)                                 │
│  ├─ Stripe API (Payments)                                   │
│  └─ Notification Service (SendGrid)                         │
└─────────────────────────────────────────────────────────────┘
```

---

### **Principios Clean Architecture Aplicados:**

````typescript
// ✅ EJEMPLO REAL: create-booking.usecase.ts

import { Injectable } from '@nestjs/common';
import { CreateBookingDto } from '../dtos/create-booking.dto';
import { Booking } from '../../domain/entities/booking.entity';
import { IBookingRepository } from '../interfaces/booking.repository.interface';
import { IPaymentService } from '../interfaces/payment.service.interface';
import { INotificationService } from '../interfaces/notification.service.interface';
import { BookingCreatedEvent } from '../../domain/events/booking-created.event';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CreateBookingUseCase {
  constructor(
    // ⭐ DEPENDENCY INVERSION: Depende de INTERFACES, no implementaciones
    private readonly bookingRepository: IBookingRepository,
    private readonly paymentService: IPaymentService,
    private readonly notificationService: INotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: CreateBookingDto, userId: string): Promise<Booking> {
    // 1. Validar disponibilidad (Domain logic)
    const isAvailable = await this.bookingRepository.checkAvailability(
      dto.artistId,
      dto.date,
      dto.timeSlot,
    );

    if (!isAvailable) {
      throw new UnavailableSlotException();
    }

    // 2. Crear entidad de dominio (Domain layer)
    const booking = Booking.create({
      userId,
      artistId: dto.artistId,
      serviceId: dto.serviceId,
      date: dto.date,
      timeSlot: dto.timeSlot,
      addOns: dto.addOns || [],
    });

    // 3. Calcular precio (Domain logic - value object)
    const totalPrice = booking.calculateTotalPrice();

    // 4. Generar código único (Domain logic)
    booking.generateCode();

    // 5. Crear payment intent (Infrastructure)
    const paymentIntent = await this.paymentService.createIntent({
      amount: totalPrice.toNumber(),
      currency: 'usd',
      customerId: userId,
      metadata: {
        bookingId: booking.id,
      },
    });

    booking.setPaymentIntentId(paymentIntent.id);

    // 6. Persistir (Infrastructure - repository)
    const savedBooking = await this.bookingRepository.save(booking);

    // 7. Publicar evento de dominio (Event-driven)
    const event = new BookingCreatedEvent(savedBooking);
    this.eventEmitter.emit('booking.created', event);

    // 8. Notificar (async - infrastructure)
    await this.notificationService.send({
      to: userId,
      type: 'booking_created',
      data: { bookingId: savedBooking.id },
    });

    return savedBooking;
  }
}
````

---

### **Ventajas Clean Architecture en Piums:**

```
✅ 1. Testabilidad
   └─ Usar cases independientes
   └─ Mocks de interfaces (no implementaciones)
   └─ Tests unitarios rápidos

✅ 2. Mantenibilidad
   └─ Business logic aislada (domain/)
   └─ Cambios en infra no afectan dominio
   └─ Código expresivo y legible

✅ 3. Escalabilidad
   └─ Agregar nuevos use cases fácilmente
   └─ Cambiar BD sin tocar business logic
   └─ Swap de servicios externos sin impacto

✅ 4. Desacoplamiento
   └─ Domain no conoce infrastructure
   └─ Application no conoce DB details
   └─ Presentation no conoce business rules

✅ 5. Reusabilidad
   └─ Domain entities reutilizables
   └─ Value objects compartidos
   └─ Use cases componibles

= Clean Architecture al 100% ✅
```

---

## 📦 **PARTE 2: INFRA - ¿DE QUÉ SE ENCARGA?**

### **Estructura [`infra/`](infra/ ):**

````
infra/
├── docker/                       # DOCKER ORCHESTRATION
│   ├── docker-compose.dev.yml    # Development
│   ├── docker-compose.prod.yml   # Production
│   ├── docker-compose.staging.yml # Staging
│   └── .env.example              # Template
│
├── kubernetes/                   # KUBERNETES (Optional)
│   ├── deployments/
│   │   ├── web-client.yaml
│   │   ├── web-artist.yaml
│   │   ├── gateway.yaml
│   │   └── services/
│   │       ├── auth.yaml
│   │       ├── users.yaml
│   │       └── ...
│   ├── services/
│   ├── ingress/
│   └── configmaps/
│
├── nginx/                        # REVERSE PROXY
│   ├── nginx.conf                # Main config
│   ├── conf.d/
│   │   ├── client-app.conf       # piums.com
│   │   ├── artist-app.conf       # artist.piums.com
│   │   └── api.conf              # api.piums.com
│   └── ssl/                      # SSL certificates
│       ├── cert.pem
│       └── key.pem
│
├── terraform/                    # INFRASTRUCTURE AS CODE (IaC)
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── modules/
│   │   ├── vpc/
│   │   ├── rds/
│   │   ├── elasticache/
│   │   └── ecs/
│   └── environments/
│       ├── dev/
│       ├── staging/
│       └── prod/
│
├── monitoring/                   # OBSERVABILITY
│   ├── prometheus/
│   │   └── prometheus.yml
│   ├── grafana/
│   │   └── dashboards/
│   └── alerts/
│
├── scripts/                      # AUTOMATION SCRIPTS
│   ├── setup-dev.sh              # Setup local development
│   ├── deploy.sh                 # Deploy script
│   ├── backup-db.sh              # Database backup
│   ├── restore-db.sh             # Database restore
│   └── health-check.sh           # Health monitoring
│
└── ci/                          # CI/CD CONFIGS
    ├── github-actions/
    │   └── templates/
    └── gitlab-ci/
        └── .gitlab-ci.yml
````

---

### **Responsabilidades de `infra/`:**

---

#### **1. Docker Orchestration** 🐳

````yaml
# infra/docker/docker-compose.prod.yml

version: '3.8'

services:
  # ======================
  # FRONTEND APPS
  # ======================
  web-client:
    image: ghcr.io/piums/piums-web-client:${VERSION:-latest}
    container_name: piums-web-client
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.piums.com
      - NEXT_PUBLIC_ARTIST_APP_URL=https://artist.piums.com
    networks:
      - piums-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web-artist:
    image: ghcr.io/piums/piums-web-artist:${VERSION:-latest}
    container_name: piums-web-artist
    restart: always
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.piums.com
      - NEXT_PUBLIC_CLIENT_APP_URL=https://piums.com
    networks:
      - piums-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M

  # ======================
  # API GATEWAY
  # ======================
  gateway:
    image: ghcr.io/piums/piums-gateway:${VERSION:-latest}
    container_name: piums-gateway
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - CLIENT_APP_URL=https://piums.com
      - ARTIST_APP_URL=https://artist.piums.com
    networks:
      - piums-network
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 1G

  # ======================
  # MICROSERVICES
  # ======================
  auth-service:
    image: ghcr.io/piums/piums-auth-service:${VERSION:-latest}
    restart: always
    environment:
      - DATABASE_URL=${AUTH_DB_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - FACEBOOK_APP_ID=${FACEBOOK_APP_ID}
    networks:
      - piums-network
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 2

  # ... (otros 9 microservices similares)

  # ======================
  # DATABASES
  # ======================
  postgres:
    image: postgres:15-alpine
    container_name: piums-postgres
    restart: always
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=piums
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    networks:
      - piums-network
    ports:
      - "5432:5432"
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  redis:
    image: redis:7-alpine
    container_name: piums-redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - piums-network
    ports:
      - "6379:6379"
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

  # ======================
  # NGINX (Reverse Proxy)
  # ======================
  nginx:
    image: nginx:alpine
    container_name: piums-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ../nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ../nginx/conf.d:/etc/nginx/conf.d:ro
      - ../nginx/ssl:/etc/nginx/ssl:ro
      - nginx-cache:/var/cache/nginx
    networks:
      - piums-network
    depends_on:
      - web-client
      - web-artist
      - gateway

  # ======================
  # MONITORING
  # ======================
  prometheus:
    image: prom/prometheus:latest
    container_name: piums-prometheus
    restart: always
    volumes:
      - ../monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - piums-network
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    container_name: piums-grafana
    restart: always
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - ../monitoring/grafana/dashboards:/var/lib/grafana/dashboards
      - grafana-data:/var/lib/grafana
    networks:
      - piums-network
    ports:
      - "3003:3000"

networks:
  piums-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
  nginx-cache:
  prometheus-data:
  grafana-data:
````

**Responsabilidad:** 
- ✅ Orquestación de 13+ contenedores
- ✅ Networking entre servicios
- ✅ Persistencia de datos
- ✅ Resource limits
- ✅ Health checks
- ✅ Auto-restart policies

---

#### **2. Nginx Configuration** 🔀

````nginx
# infra/nginx/nginx.conf

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote
```


## License: unknown
https://github.com/m-ezaki/chef-repo/blob/40a4f83440a5ac8a8f67913b0f5d190061aecaed/site-cookbooks/nginx/templates/default/nginx.conf.erb

```
# 🏗️ **ARQUITECTURA COMPLETA + CLEAN ARCHITECTURE + INFRA + DEPLOYMENT**

---

## 📋 **RESUMEN EJECUTIVO**

```
╔═══════════════════════════════════════════════════════╗
║  PIUMS PLATFORM - ARQUITECTURA COMPLETA               ║
║                                                        ║
║  Patrón:           Clean Architecture ✅              ║
║  Infra:            Docker + Nginx + CI/CD ✅          ║
║  Deploy:           GitHub Actions (automatizado) ✅   ║
║  Estado:           Production-Ready 🚀                ║
╚═══════════════════════════════════════════════════════╝
```

---

## 🎯 **PARTE 1: CLEAN ARCHITECTURE**

### **¿Se sigue usando Clean Architecture?** ✅ **SÍ, AL 100%**

---

### **Estructura por Microservicio (Ejemplo: booking-service)**

````
services/booking-service/
├── src/
│   ├── application/              # CAPA DE APLICACIÓN
│   │   ├── dtos/                 # Data Transfer Objects
│   │   │   ├── create-booking.dto.ts
│   │   │   ├── update-booking.dto.ts
│   │   │   └── booking-response.dto.ts
│   │   │
│   │   ├── use-cases/            # Casos de Uso (Lógica de negocio)
│   │   │   ├── create-booking.usecase.ts
│   │   │   ├── reschedule-booking.usecase.ts
│   │   │   ├── cancel-booking.usecase.ts
│   │   │   ├── verify-code.usecase.ts
│   │   │   └── calculate-price.usecase.ts
│   │   │
│   │   └── interfaces/           # Contratos de infra
│   │       ├── booking.repository.interface.ts
│   │       ├── payment.service.interface.ts
│   │       └── notification.service.interface.ts
│   │
│   ├── domain/                   # CAPA DE DOMINIO (Core Business)
│   │   ├── entities/             # Entidades de negocio
│   │   │   ├── booking.entity.ts
│   │   │   ├── booking-code.entity.ts
│   │   │   └── booking-item.entity.ts
│   │   │
│   │   ├── value-objects/        # Objetos de valor
│   │   │   ├── price.vo.ts
│   │   │   ├── date-range.vo.ts
│   │   │   └── booking-status.vo.ts
│   │   │
│   │   ├── aggregates/           # Agregados
│   │   │   └── booking.aggregate.ts
│   │   │
│   │   ├── events/               # Domain Events
│   │   │   ├── booking-created.event.ts
│   │   │   ├── booking-confirmed.event.ts
│   │   │   └── booking-cancelled.event.ts
│   │   │
│   │   └── exceptions/           # Excepciones de dominio
│   │       ├── booking-not-found.exception.ts
│   │       ├── invalid-booking-status.exception.ts
│   │       └── unavailable-slot.exception.ts
│   │
│   ├── infrastructure/           # CAPA DE INFRAESTRUCTURA
│   │   ├── database/             # Persistencia
│   │   │   ├── prisma/
│   │   │   │   ├── schema.prisma
│   │   │   │   └── migrations/
│   │   │   │
│   │   │   └── repositories/    # Implementaciones de repos
│   │   │       ├── booking.repository.ts
│   │   │       └── booking-code.repository.ts
│   │   │
│   │   ├── http/                 # Clientes HTTP
│   │   │   ├── payment.client.ts
│   │   │   ├── artist.client.ts
│   │   │   └── notification.client.ts
│   │   │
│   │   ├── cache/                # Redis
│   │   │   └── booking-cache.service.ts
│   │   │
│   │   └── messaging/            # Event Bus (RabbitMQ/Redis Pub/Sub)
│   │       ├── event-publisher.ts
│   │       └── event-subscriber.ts
│   │
│   ├── presentation/             # CAPA DE PRESENTACIÓN (API Layer)
│   │   ├── controllers/          # REST Controllers
│   │   │   ├── booking.controller.ts
│   │   │   └── booking-admin.controller.ts
│   │   │
│   │   ├── guards/               # Auth guards
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   │
│   │   ├── interceptors/         # Response transformation
│   │   │   └── transform.interceptor.ts
│   │   │
│   │   └── filters/              # Exception handling
│   │       └── http-exception.filter.ts
│   │
│   ├── shared/                   # SHARED (Cross-cutting)
│   │   ├── config/               # Configuración
│   │   │   └── booking.config.ts
│   │   │
│   │   ├── decorators/           # Custom decorators
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   │
│   │   ├── utils/                # Utilidades
│   │   │   ├── date.utils.ts
│   │   │   └── code-generator.utils.ts
│   │   │
│   │   └── constants/            # Constantes
│   │       └── booking-status.constants.ts
│   │
│   ├── booking.module.ts         # Módulo raíz
│   └── main.ts                   # Bootstrap
│
├── test/                         # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── prisma/
│   └── schema.prisma
│
├── Dockerfile
├── package.json
└── tsconfig.json
````

---

### **Flujo de Datos (Clean Architecture)**

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT REQUEST                          │
│               (POST /api/bookings)                           │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (API Gateway)                            │
│  ├─ booking.controller.ts                                    │
│  ├─ Validación DTO (class-validator)                        │
│  ├─ Guards (JWT auth, RBAC)                                 │
│  └─ Interceptors (logging, transform)                       │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  APPLICATION LAYER (Use Cases)                               │
│  ├─ create-booking.usecase.ts                               │
│  │  ├─ 1. Validar disponibilidad                            │
│  │  ├─ 2. Crear entidad Booking                             │
│  │  ├─ 3. Calcular precio total                             │
│  │  ├─ 4. Generar código 6 dígitos                          │
│  │  ├─ 5. Llamar payment service                            │
│  │  ├─ 6. Guardar en BD (via repository)                    │
│  │  └─ 7. Publicar evento BookingCreated                    │
│  └─ Orchestration + Business logic                          │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  DOMAIN LAYER (Core Business)                                │
│  ├─ booking.entity.ts                                        │
│  │  ├─ Business rules                                        │
│  │  ├─ Validaciones de negocio                              │
│  │  ├─ State machine (status transitions)                   │
│  │  └─ Domain events dispatch                               │
│  ├─ value-objects/                                           │
│  │  ├─ Price (validación, operaciones)                      │
│  │  └─ DateRange (validación, overlaps)                     │
│  └─ Pure business logic (NO dependencies)                   │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE LAYER (Detalles técnicos)                    │
│  ├─ database/repositories/                                   │
│  │  └─ booking.repository.ts                                │
│  │     └─ Prisma implementation                             │
│  ├─ http/                                                    │
│  │  ├─ payment.client.ts (Stripe)                           │
│  │  ├─ artist.client.ts                                     │
│  │  └─ notification.client.ts                               │
│  ├─ cache/                                                   │
│  │  └─ Redis client                                         │
│  └─ messaging/                                               │
│     └─ Event bus (RabbitMQ)                                 │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL SERVICES                                           │
│  ├─ PostgreSQL (Booking data)                               │
│  ├─ Redis (Cache + Pub/Sub)                                 │
│  ├─ Stripe API (Payments)                                   │
│  └─ Notification Service (SendGrid)                         │
└─────────────────────────────────────────────────────────────┘
```

---

### **Principios Clean Architecture Aplicados:**

````typescript
// ✅ EJEMPLO REAL: create-booking.usecase.ts

import { Injectable } from '@nestjs/common';
import { CreateBookingDto } from '../dtos/create-booking.dto';
import { Booking } from '../../domain/entities/booking.entity';
import { IBookingRepository } from '../interfaces/booking.repository.interface';
import { IPaymentService } from '../interfaces/payment.service.interface';
import { INotificationService } from '../interfaces/notification.service.interface';
import { BookingCreatedEvent } from '../../domain/events/booking-created.event';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CreateBookingUseCase {
  constructor(
    // ⭐ DEPENDENCY INVERSION: Depende de INTERFACES, no implementaciones
    private readonly bookingRepository: IBookingRepository,
    private readonly paymentService: IPaymentService,
    private readonly notificationService: INotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: CreateBookingDto, userId: string): Promise<Booking> {
    // 1. Validar disponibilidad (Domain logic)
    const isAvailable = await this.bookingRepository.checkAvailability(
      dto.artistId,
      dto.date,
      dto.timeSlot,
    );

    if (!isAvailable) {
      throw new UnavailableSlotException();
    }

    // 2. Crear entidad de dominio (Domain layer)
    const booking = Booking.create({
      userId,
      artistId: dto.artistId,
      serviceId: dto.serviceId,
      date: dto.date,
      timeSlot: dto.timeSlot,
      addOns: dto.addOns || [],
    });

    // 3. Calcular precio (Domain logic - value object)
    const totalPrice = booking.calculateTotalPrice();

    // 4. Generar código único (Domain logic)
    booking.generateCode();

    // 5. Crear payment intent (Infrastructure)
    const paymentIntent = await this.paymentService.createIntent({
      amount: totalPrice.toNumber(),
      currency: 'usd',
      customerId: userId,
      metadata: {
        bookingId: booking.id,
      },
    });

    booking.setPaymentIntentId(paymentIntent.id);

    // 6. Persistir (Infrastructure - repository)
    const savedBooking = await this.bookingRepository.save(booking);

    // 7. Publicar evento de dominio (Event-driven)
    const event = new BookingCreatedEvent(savedBooking);
    this.eventEmitter.emit('booking.created', event);

    // 8. Notificar (async - infrastructure)
    await this.notificationService.send({
      to: userId,
      type: 'booking_created',
      data: { bookingId: savedBooking.id },
    });

    return savedBooking;
  }
}
````

---

### **Ventajas Clean Architecture en Piums:**

```
✅ 1. Testabilidad
   └─ Usar cases independientes
   └─ Mocks de interfaces (no implementaciones)
   └─ Tests unitarios rápidos

✅ 2. Mantenibilidad
   └─ Business logic aislada (domain/)
   └─ Cambios en infra no afectan dominio
   └─ Código expresivo y legible

✅ 3. Escalabilidad
   └─ Agregar nuevos use cases fácilmente
   └─ Cambiar BD sin tocar business logic
   └─ Swap de servicios externos sin impacto

✅ 4. Desacoplamiento
   └─ Domain no conoce infrastructure
   └─ Application no conoce DB details
   └─ Presentation no conoce business rules

✅ 5. Reusabilidad
   └─ Domain entities reutilizables
   └─ Value objects compartidos
   └─ Use cases componibles

= Clean Architecture al 100% ✅
```

---

## 📦 **PARTE 2: INFRA - ¿DE QUÉ SE ENCARGA?**

### **Estructura [`infra/`](infra/ ):**

````
infra/
├── docker/                       # DOCKER ORCHESTRATION
│   ├── docker-compose.dev.yml    # Development
│   ├── docker-compose.prod.yml   # Production
│   ├── docker-compose.staging.yml # Staging
│   └── .env.example              # Template
│
├── kubernetes/                   # KUBERNETES (Optional)
│   ├── deployments/
│   │   ├── web-client.yaml
│   │   ├── web-artist.yaml
│   │   ├── gateway.yaml
│   │   └── services/
│   │       ├── auth.yaml
│   │       ├── users.yaml
│   │       └── ...
│   ├── services/
│   ├── ingress/
│   └── configmaps/
│
├── nginx/                        # REVERSE PROXY
│   ├── nginx.conf                # Main config
│   ├── conf.d/
│   │   ├── client-app.conf       # piums.com
│   │   ├── artist-app.conf       # artist.piums.com
│   │   └── api.conf              # api.piums.com
│   └── ssl/                      # SSL certificates
│       ├── cert.pem
│       └── key.pem
│
├── terraform/                    # INFRASTRUCTURE AS CODE (IaC)
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── modules/
│   │   ├── vpc/
│   │   ├── rds/
│   │   ├── elasticache/
│   │   └── ecs/
│   └── environments/
│       ├── dev/
│       ├── staging/
│       └── prod/
│
├── monitoring/                   # OBSERVABILITY
│   ├── prometheus/
│   │   └── prometheus.yml
│   ├── grafana/
│   │   └── dashboards/
│   └── alerts/
│
├── scripts/                      # AUTOMATION SCRIPTS
│   ├── setup-dev.sh              # Setup local development
│   ├── deploy.sh                 # Deploy script
│   ├── backup-db.sh              # Database backup
│   ├── restore-db.sh             # Database restore
│   └── health-check.sh           # Health monitoring
│
└── ci/                          # CI/CD CONFIGS
    ├── github-actions/
    │   └── templates/
    └── gitlab-ci/
        └── .gitlab-ci.yml
````

---

### **Responsabilidades de `infra/`:**

---

#### **1. Docker Orchestration** 🐳

````yaml
# infra/docker/docker-compose.prod.yml

version: '3.8'

services:
  # ======================
  # FRONTEND APPS
  # ======================
  web-client:
    image: ghcr.io/piums/piums-web-client:${VERSION:-latest}
    container_name: piums-web-client
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.piums.com
      - NEXT_PUBLIC_ARTIST_APP_URL=https://artist.piums.com
    networks:
      - piums-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web-artist:
    image: ghcr.io/piums/piums-web-artist:${VERSION:-latest}
    container_name: piums-web-artist
    restart: always
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.piums.com
      - NEXT_PUBLIC_CLIENT_APP_URL=https://piums.com
    networks:
      - piums-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M

  # ======================
  # API GATEWAY
  # ======================
  gateway:
    image: ghcr.io/piums/piums-gateway:${VERSION:-latest}
    container_name: piums-gateway
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - CLIENT_APP_URL=https://piums.com
      - ARTIST_APP_URL=https://artist.piums.com
    networks:
      - piums-network
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 1G

  # ======================
  # MICROSERVICES
  # ======================
  auth-service:
    image: ghcr.io/piums/piums-auth-service:${VERSION:-latest}
    restart: always
    environment:
      - DATABASE_URL=${AUTH_DB_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - FACEBOOK_APP_ID=${FACEBOOK_APP_ID}
    networks:
      - piums-network
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 2

  # ... (otros 9 microservices similares)

  # ======================
  # DATABASES
  # ======================
  postgres:
    image: postgres:15-alpine
    container_name: piums-postgres
    restart: always
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=piums
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    networks:
      - piums-network
    ports:
      - "5432:5432"
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  redis:
    image: redis:7-alpine
    container_name: piums-redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - piums-network
    ports:
      - "6379:6379"
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

  # ======================
  # NGINX (Reverse Proxy)
  # ======================
  nginx:
    image: nginx:alpine
    container_name: piums-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ../nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ../nginx/conf.d:/etc/nginx/conf.d:ro
      - ../nginx/ssl:/etc/nginx/ssl:ro
      - nginx-cache:/var/cache/nginx
    networks:
      - piums-network
    depends_on:
      - web-client
      - web-artist
      - gateway

  # ======================
  # MONITORING
  # ======================
  prometheus:
    image: prom/prometheus:latest
    container_name: piums-prometheus
    restart: always
    volumes:
      - ../monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - piums-network
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    container_name: piums-grafana
    restart: always
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - ../monitoring/grafana/dashboards:/var/lib/grafana/dashboards
      - grafana-data:/var/lib/grafana
    networks:
      - piums-network
    ports:
      - "3003:3000"

networks:
  piums-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
  nginx-cache:
  prometheus-data:
  grafana-data:
````

**Responsabilidad:** 
- ✅ Orquestación de 13+ contenedores
- ✅ Networking entre servicios
- ✅ Persistencia de datos
- ✅ Resource limits
- ✅ Health checks
- ✅ Auto-restart policies

---

#### **2. Nginx Configuration** 🔀

````nginx
# infra/nginx/nginx.conf

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
```


## License: Apache-2.0
https://github.com/Catherine22/Frontend-Development/blob/45f10023c0a5466a9f65a146acb856421f14da36/Vue/vue-pwa/nginx/nginx.conf

```
# 🏗️ **ARQUITECTURA COMPLETA + CLEAN ARCHITECTURE + INFRA + DEPLOYMENT**

---

## 📋 **RESUMEN EJECUTIVO**

```
╔═══════════════════════════════════════════════════════╗
║  PIUMS PLATFORM - ARQUITECTURA COMPLETA               ║
║                                                        ║
║  Patrón:           Clean Architecture ✅              ║
║  Infra:            Docker + Nginx + CI/CD ✅          ║
║  Deploy:           GitHub Actions (automatizado) ✅   ║
║  Estado:           Production-Ready 🚀                ║
╚═══════════════════════════════════════════════════════╝
```

---

## 🎯 **PARTE 1: CLEAN ARCHITECTURE**

### **¿Se sigue usando Clean Architecture?** ✅ **SÍ, AL 100%**

---

### **Estructura por Microservicio (Ejemplo: booking-service)**

````
services/booking-service/
├── src/
│   ├── application/              # CAPA DE APLICACIÓN
│   │   ├── dtos/                 # Data Transfer Objects
│   │   │   ├── create-booking.dto.ts
│   │   │   ├── update-booking.dto.ts
│   │   │   └── booking-response.dto.ts
│   │   │
│   │   ├── use-cases/            # Casos de Uso (Lógica de negocio)
│   │   │   ├── create-booking.usecase.ts
│   │   │   ├── reschedule-booking.usecase.ts
│   │   │   ├── cancel-booking.usecase.ts
│   │   │   ├── verify-code.usecase.ts
│   │   │   └── calculate-price.usecase.ts
│   │   │
│   │   └── interfaces/           # Contratos de infra
│   │       ├── booking.repository.interface.ts
│   │       ├── payment.service.interface.ts
│   │       └── notification.service.interface.ts
│   │
│   ├── domain/                   # CAPA DE DOMINIO (Core Business)
│   │   ├── entities/             # Entidades de negocio
│   │   │   ├── booking.entity.ts
│   │   │   ├── booking-code.entity.ts
│   │   │   └── booking-item.entity.ts
│   │   │
│   │   ├── value-objects/        # Objetos de valor
│   │   │   ├── price.vo.ts
│   │   │   ├── date-range.vo.ts
│   │   │   └── booking-status.vo.ts
│   │   │
│   │   ├── aggregates/           # Agregados
│   │   │   └── booking.aggregate.ts
│   │   │
│   │   ├── events/               # Domain Events
│   │   │   ├── booking-created.event.ts
│   │   │   ├── booking-confirmed.event.ts
│   │   │   └── booking-cancelled.event.ts
│   │   │
│   │   └── exceptions/           # Excepciones de dominio
│   │       ├── booking-not-found.exception.ts
│   │       ├── invalid-booking-status.exception.ts
│   │       └── unavailable-slot.exception.ts
│   │
│   ├── infrastructure/           # CAPA DE INFRAESTRUCTURA
│   │   ├── database/             # Persistencia
│   │   │   ├── prisma/
│   │   │   │   ├── schema.prisma
│   │   │   │   └── migrations/
│   │   │   │
│   │   │   └── repositories/    # Implementaciones de repos
│   │   │       ├── booking.repository.ts
│   │   │       └── booking-code.repository.ts
│   │   │
│   │   ├── http/                 # Clientes HTTP
│   │   │   ├── payment.client.ts
│   │   │   ├── artist.client.ts
│   │   │   └── notification.client.ts
│   │   │
│   │   ├── cache/                # Redis
│   │   │   └── booking-cache.service.ts
│   │   │
│   │   └── messaging/            # Event Bus (RabbitMQ/Redis Pub/Sub)
│   │       ├── event-publisher.ts
│   │       └── event-subscriber.ts
│   │
│   ├── presentation/             # CAPA DE PRESENTACIÓN (API Layer)
│   │   ├── controllers/          # REST Controllers
│   │   │   ├── booking.controller.ts
│   │   │   └── booking-admin.controller.ts
│   │   │
│   │   ├── guards/               # Auth guards
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   │
│   │   ├── interceptors/         # Response transformation
│   │   │   └── transform.interceptor.ts
│   │   │
│   │   └── filters/              # Exception handling
│   │       └── http-exception.filter.ts
│   │
│   ├── shared/                   # SHARED (Cross-cutting)
│   │   ├── config/               # Configuración
│   │   │   └── booking.config.ts
│   │   │
│   │   ├── decorators/           # Custom decorators
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   │
│   │   ├── utils/                # Utilidades
│   │   │   ├── date.utils.ts
│   │   │   └── code-generator.utils.ts
│   │   │
│   │   └── constants/            # Constantes
│   │       └── booking-status.constants.ts
│   │
│   ├── booking.module.ts         # Módulo raíz
│   └── main.ts                   # Bootstrap
│
├── test/                         # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── prisma/
│   └── schema.prisma
│
├── Dockerfile
├── package.json
└── tsconfig.json
````

---

### **Flujo de Datos (Clean Architecture)**

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT REQUEST                          │
│               (POST /api/bookings)                           │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (API Gateway)                            │
│  ├─ booking.controller.ts                                    │
│  ├─ Validación DTO (class-validator)                        │
│  ├─ Guards (JWT auth, RBAC)                                 │
│  └─ Interceptors (logging, transform)                       │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  APPLICATION LAYER (Use Cases)                               │
│  ├─ create-booking.usecase.ts                               │
│  │  ├─ 1. Validar disponibilidad                            │
│  │  ├─ 2. Crear entidad Booking                             │
│  │  ├─ 3. Calcular precio total                             │
│  │  ├─ 4. Generar código 6 dígitos                          │
│  │  ├─ 5. Llamar payment service                            │
│  │  ├─ 6. Guardar en BD (via repository)                    │
│  │  └─ 7. Publicar evento BookingCreated                    │
│  └─ Orchestration + Business logic                          │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  DOMAIN LAYER (Core Business)                                │
│  ├─ booking.entity.ts                                        │
│  │  ├─ Business rules                                        │
│  │  ├─ Validaciones de negocio                              │
│  │  ├─ State machine (status transitions)                   │
│  │  └─ Domain events dispatch                               │
│  ├─ value-objects/                                           │
│  │  ├─ Price (validación, operaciones)                      │
│  │  └─ DateRange (validación, overlaps)                     │
│  └─ Pure business logic (NO dependencies)                   │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE LAYER (Detalles técnicos)                    │
│  ├─ database/repositories/                                   │
│  │  └─ booking.repository.ts                                │
│  │     └─ Prisma implementation                             │
│  ├─ http/                                                    │
│  │  ├─ payment.client.ts (Stripe)                           │
│  │  ├─ artist.client.ts                                     │
│  │  └─ notification.client.ts                               │
│  ├─ cache/                                                   │
│  │  └─ Redis client                                         │
│  └─ messaging/                                               │
│     └─ Event bus (RabbitMQ)                                 │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL SERVICES                                           │
│  ├─ PostgreSQL (Booking data)                               │
│  ├─ Redis (Cache + Pub/Sub)                                 │
│  ├─ Stripe API (Payments)                                   │
│  └─ Notification Service (SendGrid)                         │
└─────────────────────────────────────────────────────────────┘
```

---

### **Principios Clean Architecture Aplicados:**

````typescript
// ✅ EJEMPLO REAL: create-booking.usecase.ts

import { Injectable } from '@nestjs/common';
import { CreateBookingDto } from '../dtos/create-booking.dto';
import { Booking } from '../../domain/entities/booking.entity';
import { IBookingRepository } from '../interfaces/booking.repository.interface';
import { IPaymentService } from '../interfaces/payment.service.interface';
import { INotificationService } from '../interfaces/notification.service.interface';
import { BookingCreatedEvent } from '../../domain/events/booking-created.event';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CreateBookingUseCase {
  constructor(
    // ⭐ DEPENDENCY INVERSION: Depende de INTERFACES, no implementaciones
    private readonly bookingRepository: IBookingRepository,
    private readonly paymentService: IPaymentService,
    private readonly notificationService: INotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: CreateBookingDto, userId: string): Promise<Booking> {
    // 1. Validar disponibilidad (Domain logic)
    const isAvailable = await this.bookingRepository.checkAvailability(
      dto.artistId,
      dto.date,
      dto.timeSlot,
    );

    if (!isAvailable) {
      throw new UnavailableSlotException();
    }

    // 2. Crear entidad de dominio (Domain layer)
    const booking = Booking.create({
      userId,
      artistId: dto.artistId,
      serviceId: dto.serviceId,
      date: dto.date,
      timeSlot: dto.timeSlot,
      addOns: dto.addOns || [],
    });

    // 3. Calcular precio (Domain logic - value object)
    const totalPrice = booking.calculateTotalPrice();

    // 4. Generar código único (Domain logic)
    booking.generateCode();

    // 5. Crear payment intent (Infrastructure)
    const paymentIntent = await this.paymentService.createIntent({
      amount: totalPrice.toNumber(),
      currency: 'usd',
      customerId: userId,
      metadata: {
        bookingId: booking.id,
      },
    });

    booking.setPaymentIntentId(paymentIntent.id);

    // 6. Persistir (Infrastructure - repository)
    const savedBooking = await this.bookingRepository.save(booking);

    // 7. Publicar evento de dominio (Event-driven)
    const event = new BookingCreatedEvent(savedBooking);
    this.eventEmitter.emit('booking.created', event);

    // 8. Notificar (async - infrastructure)
    await this.notificationService.send({
      to: userId,
      type: 'booking_created',
      data: { bookingId: savedBooking.id },
    });

    return savedBooking;
  }
}
````

---

### **Ventajas Clean Architecture en Piums:**

```
✅ 1. Testabilidad
   └─ Usar cases independientes
   └─ Mocks de interfaces (no implementaciones)
   └─ Tests unitarios rápidos

✅ 2. Mantenibilidad
   └─ Business logic aislada (domain/)
   └─ Cambios en infra no afectan dominio
   └─ Código expresivo y legible

✅ 3. Escalabilidad
   └─ Agregar nuevos use cases fácilmente
   └─ Cambiar BD sin tocar business logic
   └─ Swap de servicios externos sin impacto

✅ 4. Desacoplamiento
   └─ Domain no conoce infrastructure
   └─ Application no conoce DB details
   └─ Presentation no conoce business rules

✅ 5. Reusabilidad
   └─ Domain entities reutilizables
   └─ Value objects compartidos
   └─ Use cases componibles

= Clean Architecture al 100% ✅
```

---

## 📦 **PARTE 2: INFRA - ¿DE QUÉ SE ENCARGA?**

### **Estructura [`infra/`](infra/ ):**

````
infra/
├── docker/                       # DOCKER ORCHESTRATION
│   ├── docker-compose.dev.yml    # Development
│   ├── docker-compose.prod.yml   # Production
│   ├── docker-compose.staging.yml # Staging
│   └── .env.example              # Template
│
├── kubernetes/                   # KUBERNETES (Optional)
│   ├── deployments/
│   │   ├── web-client.yaml
│   │   ├── web-artist.yaml
│   │   ├── gateway.yaml
│   │   └── services/
│   │       ├── auth.yaml
│   │       ├── users.yaml
│   │       └── ...
│   ├── services/
│   ├── ingress/
│   └── configmaps/
│
├── nginx/                        # REVERSE PROXY
│   ├── nginx.conf                # Main config
│   ├── conf.d/
│   │   ├── client-app.conf       # piums.com
│   │   ├── artist-app.conf       # artist.piums.com
│   │   └── api.conf              # api.piums.com
│   └── ssl/                      # SSL certificates
│       ├── cert.pem
│       └── key.pem
│
├── terraform/                    # INFRASTRUCTURE AS CODE (IaC)
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── modules/
│   │   ├── vpc/
│   │   ├── rds/
│   │   ├── elasticache/
│   │   └── ecs/
│   └── environments/
│       ├── dev/
│       ├── staging/
│       └── prod/
│
├── monitoring/                   # OBSERVABILITY
│   ├── prometheus/
│   │   └── prometheus.yml
│   ├── grafana/
│   │   └── dashboards/
│   └── alerts/
│
├── scripts/                      # AUTOMATION SCRIPTS
│   ├── setup-dev.sh              # Setup local development
│   ├── deploy.sh                 # Deploy script
│   ├── backup-db.sh              # Database backup
│   ├── restore-db.sh             # Database restore
│   └── health-check.sh           # Health monitoring
│
└── ci/                          # CI/CD CONFIGS
    ├── github-actions/
    │   └── templates/
    └── gitlab-ci/
        └── .gitlab-ci.yml
````

---

### **Responsabilidades de `infra/`:**

---

#### **1. Docker Orchestration** 🐳

````yaml
# infra/docker/docker-compose.prod.yml

version: '3.8'

services:
  # ======================
  # FRONTEND APPS
  # ======================
  web-client:
    image: ghcr.io/piums/piums-web-client:${VERSION:-latest}
    container_name: piums-web-client
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.piums.com
      - NEXT_PUBLIC_ARTIST_APP_URL=https://artist.piums.com
    networks:
      - piums-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web-artist:
    image: ghcr.io/piums/piums-web-artist:${VERSION:-latest}
    container_name: piums-web-artist
    restart: always
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.piums.com
      - NEXT_PUBLIC_CLIENT_APP_URL=https://piums.com
    networks:
      - piums-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M

  # ======================
  # API GATEWAY
  # ======================
  gateway:
    image: ghcr.io/piums/piums-gateway:${VERSION:-latest}
    container_name: piums-gateway
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - CLIENT_APP_URL=https://piums.com
      - ARTIST_APP_URL=https://artist.piums.com
    networks:
      - piums-network
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 1G

  # ======================
  # MICROSERVICES
  # ======================
  auth-service:
    image: ghcr.io/piums/piums-auth-service:${VERSION:-latest}
    restart: always
    environment:
      - DATABASE_URL=${AUTH_DB_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - FACEBOOK_APP_ID=${FACEBOOK_APP_ID}
    networks:
      - piums-network
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 2

  # ... (otros 9 microservices similares)

  # ======================
  # DATABASES
  # ======================
  postgres:
    image: postgres:15-alpine
    container_name: piums-postgres
    restart: always
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=piums
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    networks:
      - piums-network
    ports:
      - "5432:5432"
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  redis:
    image: redis:7-alpine
    container_name: piums-redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - piums-network
    ports:
      - "6379:6379"
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

  # ======================
  # NGINX (Reverse Proxy)
  # ======================
  nginx:
    image: nginx:alpine
    container_name: piums-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ../nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ../nginx/conf.d:/etc/nginx/conf.d:ro
      - ../nginx/ssl:/etc/nginx/ssl:ro
      - nginx-cache:/var/cache/nginx
    networks:
      - piums-network
    depends_on:
      - web-client
      - web-artist
      - gateway

  # ======================
  # MONITORING
  # ======================
  prometheus:
    image: prom/prometheus:latest
    container_name: piums-prometheus
    restart: always
    volumes:
      - ../monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - piums-network
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    container_name: piums-grafana
    restart: always
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - ../monitoring/grafana/dashboards:/var/lib/grafana/dashboards
      - grafana-data:/var/lib/grafana
    networks:
      - piums-network
    ports:
      - "3003:3000"

networks:
  piums-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
  nginx-cache:
  prometheus-data:
  grafana-data:
````

**Responsabilidad:** 
- ✅ Orquestación de 13+ contenedores
- ✅ Networking entre servicios
- ✅ Persistencia de datos
- ✅ Resource limits
- ✅ Health checks
- ✅ Auto-restart policies

---

#### **2. Nginx Configuration** 🔀

````nginx
# infra/nginx/nginx.conf

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote
```


## License: unknown
https://github.com/m-ezaki/chef-repo/blob/40a4f83440a5ac8a8f67913b0f5d190061aecaed/site-cookbooks/nginx/templates/default/nginx.conf.erb

```
# 🏗️ **ARQUITECTURA COMPLETA + CLEAN ARCHITECTURE + INFRA + DEPLOYMENT**

---

## 📋 **RESUMEN EJECUTIVO**

```
╔═══════════════════════════════════════════════════════╗
║  PIUMS PLATFORM - ARQUITECTURA COMPLETA               ║
║                                                        ║
║  Patrón:           Clean Architecture ✅              ║
║  Infra:            Docker + Nginx + CI/CD ✅          ║
║  Deploy:           GitHub Actions (automatizado) ✅   ║
║  Estado:           Production-Ready 🚀                ║
╚═══════════════════════════════════════════════════════╝
```

---

## 🎯 **PARTE 1: CLEAN ARCHITECTURE**

### **¿Se sigue usando Clean Architecture?** ✅ **SÍ, AL 100%**

---

### **Estructura por Microservicio (Ejemplo: booking-service)**

````
services/booking-service/
├── src/
│   ├── application/              # CAPA DE APLICACIÓN
│   │   ├── dtos/                 # Data Transfer Objects
│   │   │   ├── create-booking.dto.ts
│   │   │   ├── update-booking.dto.ts
│   │   │   └── booking-response.dto.ts
│   │   │
│   │   ├── use-cases/            # Casos de Uso (Lógica de negocio)
│   │   │   ├── create-booking.usecase.ts
│   │   │   ├── reschedule-booking.usecase.ts
│   │   │   ├── cancel-booking.usecase.ts
│   │   │   ├── verify-code.usecase.ts
│   │   │   └── calculate-price.usecase.ts
│   │   │
│   │   └── interfaces/           # Contratos de infra
│   │       ├── booking.repository.interface.ts
│   │       ├── payment.service.interface.ts
│   │       └── notification.service.interface.ts
│   │
│   ├── domain/                   # CAPA DE DOMINIO (Core Business)
│   │   ├── entities/             # Entidades de negocio
│   │   │   ├── booking.entity.ts
│   │   │   ├── booking-code.entity.ts
│   │   │   └── booking-item.entity.ts
│   │   │
│   │   ├── value-objects/        # Objetos de valor
│   │   │   ├── price.vo.ts
│   │   │   ├── date-range.vo.ts
│   │   │   └── booking-status.vo.ts
│   │   │
│   │   ├── aggregates/           # Agregados
│   │   │   └── booking.aggregate.ts
│   │   │
│   │   ├── events/               # Domain Events
│   │   │   ├── booking-created.event.ts
│   │   │   ├── booking-confirmed.event.ts
│   │   │   └── booking-cancelled.event.ts
│   │   │
│   │   └── exceptions/           # Excepciones de dominio
│   │       ├── booking-not-found.exception.ts
│   │       ├── invalid-booking-status.exception.ts
│   │       └── unavailable-slot.exception.ts
│   │
│   ├── infrastructure/           # CAPA DE INFRAESTRUCTURA
│   │   ├── database/             # Persistencia
│   │   │   ├── prisma/
│   │   │   │   ├── schema.prisma
│   │   │   │   └── migrations/
│   │   │   │
│   │   │   └── repositories/    # Implementaciones de repos
│   │   │       ├── booking.repository.ts
│   │   │       └── booking-code.repository.ts
│   │   │
│   │   ├── http/                 # Clientes HTTP
│   │   │   ├── payment.client.ts
│   │   │   ├── artist.client.ts
│   │   │   └── notification.client.ts
│   │   │
│   │   ├── cache/                # Redis
│   │   │   └── booking-cache.service.ts
│   │   │
│   │   └── messaging/            # Event Bus (RabbitMQ/Redis Pub/Sub)
│   │       ├── event-publisher.ts
│   │       └── event-subscriber.ts
│   │
│   ├── presentation/             # CAPA DE PRESENTACIÓN (API Layer)
│   │   ├── controllers/          # REST Controllers
│   │   │   ├── booking.controller.ts
│   │   │   └── booking-admin.controller.ts
│   │   │
│   │   ├── guards/               # Auth guards
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   │
│   │   ├── interceptors/         # Response transformation
│   │   │   └── transform.interceptor.ts
│   │   │
│   │   └── filters/              # Exception handling
│   │       └── http-exception.filter.ts
│   │
│   ├── shared/                   # SHARED (Cross-cutting)
│   │   ├── config/               # Configuración
│   │   │   └── booking.config.ts
│   │   │
│   │   ├── decorators/           # Custom decorators
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   │
│   │   ├── utils/                # Utilidades
│   │   │   ├── date.utils.ts
│   │   │   └── code-generator.utils.ts
│   │   │
│   │   └── constants/            # Constantes
│   │       └── booking-status.constants.ts
│   │
│   ├── booking.module.ts         # Módulo raíz
│   └── main.ts                   # Bootstrap
│
├── test/                         # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── prisma/
│   └── schema.prisma
│
├── Dockerfile
├── package.json
└── tsconfig.json
````

---

### **Flujo de Datos (Clean Architecture)**

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT REQUEST                          │
│               (POST /api/bookings)                           │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (API Gateway)                            │
│  ├─ booking.controller.ts                                    │
│  ├─ Validación DTO (class-validator)                        │
│  ├─ Guards (JWT auth, RBAC)                                 │
│  └─ Interceptors (logging, transform)                       │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  APPLICATION LAYER (Use Cases)                               │
│  ├─ create-booking.usecase.ts                               │
│  │  ├─ 1. Validar disponibilidad                            │
│  │  ├─ 2. Crear entidad Booking                             │
│  │  ├─ 3. Calcular precio total                             │
│  │  ├─ 4. Generar código 6 dígitos                          │
│  │  ├─ 5. Llamar payment service                            │
│  │  ├─ 6. Guardar en BD (via repository)                    │
│  │  └─ 7. Publicar evento BookingCreated                    │
│  └─ Orchestration + Business logic                          │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  DOMAIN LAYER (Core Business)                                │
│  ├─ booking.entity.ts                                        │
│  │  ├─ Business rules                                        │
│  │  ├─ Validaciones de negocio                              │
│  │  ├─ State machine (status transitions)                   │
│  │  └─ Domain events dispatch                               │
│  ├─ value-objects/                                           │
│  │  ├─ Price (validación, operaciones)                      │
│  │  └─ DateRange (validación, overlaps)                     │
│  └─ Pure business logic (NO dependencies)                   │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE LAYER (Detalles técnicos)                    │
│  ├─ database/repositories/                                   │
│  │  └─ booking.repository.ts                                │
│  │     └─ Prisma implementation                             │
│  ├─ http/                                                    │
│  │  ├─ payment.client.ts (Stripe)                           │
│  │  ├─ artist.client.ts                                     │
│  │  └─ notification.client.ts                               │
│  ├─ cache/                                                   │
│  │  └─ Redis client                                         │
│  └─ messaging/                                               │
│     └─ Event bus (RabbitMQ)                                 │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL SERVICES                                           │
│  ├─ PostgreSQL (Booking data)                               │
│  ├─ Redis (Cache + Pub/Sub)                                 │
│  ├─ Stripe API (Payments)                                   │
│  └─ Notification Service (SendGrid)                         │
└─────────────────────────────────────────────────────────────┘
```

---

### **Principios Clean Architecture Aplicados:**

````typescript
// ✅ EJEMPLO REAL: create-booking.usecase.ts

import { Injectable } from '@nestjs/common';
import { CreateBookingDto } from '../dtos/create-booking.dto';
import { Booking } from '../../domain/entities/booking.entity';
import { IBookingRepository } from '../interfaces/booking.repository.interface';
import { IPaymentService } from '../interfaces/payment.service.interface';
import { INotificationService } from '../interfaces/notification.service.interface';
import { BookingCreatedEvent } from '../../domain/events/booking-created.event';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CreateBookingUseCase {
  constructor(
    // ⭐ DEPENDENCY INVERSION: Depende de INTERFACES, no implementaciones
    private readonly bookingRepository: IBookingRepository,
    private readonly paymentService: IPaymentService,
    private readonly notificationService: INotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: CreateBookingDto, userId: string): Promise<Booking> {
    // 1. Validar disponibilidad (Domain logic)
    const isAvailable = await this.bookingRepository.checkAvailability(
      dto.artistId,
      dto.date,
      dto.timeSlot,
    );

    if (!isAvailable) {
      throw new UnavailableSlotException();
    }

    // 2. Crear entidad de dominio (Domain layer)
    const booking = Booking.create({
      userId,
      artistId: dto.artistId,
      serviceId: dto.serviceId,
      date: dto.date,
      timeSlot: dto.timeSlot,
      addOns: dto.addOns || [],
    });

    // 3. Calcular precio (Domain logic - value object)
    const totalPrice = booking.calculateTotalPrice();

    // 4. Generar código único (Domain logic)
    booking.generateCode();

    // 5. Crear payment intent (Infrastructure)
    const paymentIntent = await this.paymentService.createIntent({
      amount: totalPrice.toNumber(),
      currency: 'usd',
      customerId: userId,
      metadata: {
        bookingId: booking.id,
      },
    });

    booking.setPaymentIntentId(paymentIntent.id);

    // 6. Persistir (Infrastructure - repository)
    const savedBooking = await this.bookingRepository.save(booking);

    // 7. Publicar evento de dominio (Event-driven)
    const event = new BookingCreatedEvent(savedBooking);
    this.eventEmitter.emit('booking.created', event);

    // 8. Notificar (async - infrastructure)
    await this.notificationService.send({
      to: userId,
      type: 'booking_created',
      data: { bookingId: savedBooking.id },
    });

    return savedBooking;
  }
}
````

---

### **Ventajas Clean Architecture en Piums:**

```
✅ 1. Testabilidad
   └─ Usar cases independientes
   └─ Mocks de interfaces (no implementaciones)
   └─ Tests unitarios rápidos

✅ 2. Mantenibilidad
   └─ Business logic aislada (domain/)
   └─ Cambios en infra no afectan dominio
   └─ Código expresivo y legible

✅ 3. Escalabilidad
   └─ Agregar nuevos use cases fácilmente
   └─ Cambiar BD sin tocar business logic
   └─ Swap de servicios externos sin impacto

✅ 4. Desacoplamiento
   └─ Domain no conoce infrastructure
   └─ Application no conoce DB details
   └─ Presentation no conoce business rules

✅ 5. Reusabilidad
   └─ Domain entities reutilizables
   └─ Value objects compartidos
   └─ Use cases componibles

= Clean Architecture al 100% ✅
```

---

## 📦 **PARTE 2: INFRA - ¿DE QUÉ SE ENCARGA?**

### **Estructura [`infra/`](infra/ ):**

````
infra/
├── docker/                       # DOCKER ORCHESTRATION
│   ├── docker-compose.dev.yml    # Development
│   ├── docker-compose.prod.yml   # Production
│   ├── docker-compose.staging.yml # Staging
│   └── .env.example              # Template
│
├── kubernetes/                   # KUBERNETES (Optional)
│   ├── deployments/
│   │   ├── web-client.yaml
│   │   ├── web-artist.yaml
│   │   ├── gateway.yaml
│   │   └── services/
│   │       ├── auth.yaml
│   │       ├── users.yaml
│   │       └── ...
│   ├── services/
│   ├── ingress/
│   └── configmaps/
│
├── nginx/                        # REVERSE PROXY
│   ├── nginx.conf                # Main config
│   ├── conf.d/
│   │   ├── client-app.conf       # piums.com
│   │   ├── artist-app.conf       # artist.piums.com
│   │   └── api.conf              # api.piums.com
│   └── ssl/                      # SSL certificates
│       ├── cert.pem
│       └── key.pem
│
├── terraform/                    # INFRASTRUCTURE AS CODE (IaC)
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── modules/
│   │   ├── vpc/
│   │   ├── rds/
│   │   ├── elasticache/
│   │   └── ecs/
│   └── environments/
│       ├── dev/
│       ├── staging/
│       └── prod/
│
├── monitoring/                   # OBSERVABILITY
│   ├── prometheus/
│   │   └── prometheus.yml
│   ├── grafana/
│   │   └── dashboards/
│   └── alerts/
│
├── scripts/                      # AUTOMATION SCRIPTS
│   ├── setup-dev.sh              # Setup local development
│   ├── deploy.sh                 # Deploy script
│   ├── backup-db.sh              # Database backup
│   ├── restore-db.sh             # Database restore
│   └── health-check.sh           # Health monitoring
│
└── ci/                          # CI/CD CONFIGS
    ├── github-actions/
    │   └── templates/
    └── gitlab-ci/
        └── .gitlab-ci.yml
````

---

### **Responsabilidades de `infra/`:**

---

#### **1. Docker Orchestration** 🐳

````yaml
# infra/docker/docker-compose.prod.yml

version: '3.8'

services:
  # ======================
  # FRONTEND APPS
  # ======================
  web-client:
    image: ghcr.io/piums/piums-web-client:${VERSION:-latest}
    container_name: piums-web-client
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.piums.com
      - NEXT_PUBLIC_ARTIST_APP_URL=https://artist.piums.com
    networks:
      - piums-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web-artist:
    image: ghcr.io/piums/piums-web-artist:${VERSION:-latest}
    container_name: piums-web-artist
    restart: always
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.piums.com
      - NEXT_PUBLIC_CLIENT_APP_URL=https://piums.com
    networks:
      - piums-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M

  # ======================
  # API GATEWAY
  # ======================
  gateway:
    image: ghcr.io/piums/piums-gateway:${VERSION:-latest}
    container_name: piums-gateway
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - CLIENT_APP_URL=https://piums.com
      - ARTIST_APP_URL=https://artist.piums.com
    networks:
      - piums-network
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 1G

  # ======================
  # MICROSERVICES
  # ======================
  auth-service:
    image: ghcr.io/piums/piums-auth-service:${VERSION:-latest}
    restart: always
    environment:
      - DATABASE_URL=${AUTH_DB_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - FACEBOOK_APP_ID=${FACEBOOK_APP_ID}
    networks:
      - piums-network
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 2

  # ... (otros 9 microservices similares)

  # ======================
  # DATABASES
  # ======================
  postgres:
    image: postgres:15-alpine
    container_name: piums-postgres
    restart: always
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=piums
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    networks:
      - piums-network
    ports:
      - "5432:5432"
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  redis:
    image: redis:7-alpine
    container_name: piums-redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - piums-network
    ports:
      - "6379:6379"
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

  # ======================
  # NGINX (Reverse Proxy)
  # ======================
  nginx:
    image: nginx:alpine
    container_name: piums-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ../nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ../nginx/conf.d:/etc/nginx/conf.d:ro
      - ../nginx/ssl:/etc/nginx/ssl:ro
      - nginx-cache:/var/cache/nginx
    networks:
      - piums-network
    depends_on:
      - web-client
      - web-artist
      - gateway

  # ======================
  # MONITORING
  # ======================
  prometheus:
    image: prom/prometheus:latest
    container_name: piums-prometheus
    restart: always
    volumes:
      - ../monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - piums-network
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    container_name: piums-grafana
    restart: always
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - ../monitoring/grafana/dashboards:/var/lib/grafana/dashboards
      - grafana-data:/var/lib/grafana
    networks:
      - piums-network
    ports:
      - "3003:3000"

networks:
  piums-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
  nginx-cache:
  prometheus-data:
  grafana-data:
````

**Responsabilidad:** 
- ✅ Orquestación de 13+ contenedores
- ✅ Networking entre servicios
- ✅ Persistencia de datos
- ✅ Resource limits
- ✅ Health checks
- ✅ Auto-restart policies

---

#### **2. Nginx Configuration** 🔀

````nginx
# infra/nginx/nginx.conf

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
```


## License: unknown
https://github.com/thisissoon/SaltLondonMeetup/blob/c2bcdd6735a7b4b016c55b991be91a82be985110/states/nginx.conf

```
# 🏗️ **ARQUITECTURA COMPLETA + CLEAN ARCHITECTURE + INFRA + DEPLOYMENT**

---

## 📋 **RESUMEN EJECUTIVO**

```
╔═══════════════════════════════════════════════════════╗
║  PIUMS PLATFORM - ARQUITECTURA COMPLETA               ║
║                                                        ║
║  Patrón:           Clean Architecture ✅              ║
║  Infra:            Docker + Nginx + CI/CD ✅          ║
║  Deploy:           GitHub Actions (automatizado) ✅   ║
║  Estado:           Production-Ready 🚀                ║
╚═══════════════════════════════════════════════════════╝
```

---

## 🎯 **PARTE 1: CLEAN ARCHITECTURE**

### **¿Se sigue usando Clean Architecture?** ✅ **SÍ, AL 100%**

---

### **Estructura por Microservicio (Ejemplo: booking-service)**

````
services/booking-service/
├── src/
│   ├── application/              # CAPA DE APLICACIÓN
│   │   ├── dtos/                 # Data Transfer Objects
│   │   │   ├── create-booking.dto.ts
│   │   │   ├── update-booking.dto.ts
│   │   │   └── booking-response.dto.ts
│   │   │
│   │   ├── use-cases/            # Casos de Uso (Lógica de negocio)
│   │   │   ├── create-booking.usecase.ts
│   │   │   ├── reschedule-booking.usecase.ts
│   │   │   ├── cancel-booking.usecase.ts
│   │   │   ├── verify-code.usecase.ts
│   │   │   └── calculate-price.usecase.ts
│   │   │
│   │   └── interfaces/           # Contratos de infra
│   │       ├── booking.repository.interface.ts
│   │       ├── payment.service.interface.ts
│   │       └── notification.service.interface.ts
│   │
│   ├── domain/                   # CAPA DE DOMINIO (Core Business)
│   │   ├── entities/             # Entidades de negocio
│   │   │   ├── booking.entity.ts
│   │   │   ├── booking-code.entity.ts
│   │   │   └── booking-item.entity.ts
│   │   │
│   │   ├── value-objects/        # Objetos de valor
│   │   │   ├── price.vo.ts
│   │   │   ├── date-range.vo.ts
│   │   │   └── booking-status.vo.ts
│   │   │
│   │   ├── aggregates/           # Agregados
│   │   │   └── booking.aggregate.ts
│   │   │
│   │   ├── events/               # Domain Events
│   │   │   ├── booking-created.event.ts
│   │   │   ├── booking-confirmed.event.ts
│   │   │   └── booking-cancelled.event.ts
│   │   │
│   │   └── exceptions/           # Excepciones de dominio
│   │       ├── booking-not-found.exception.ts
│   │       ├── invalid-booking-status.exception.ts
│   │       └── unavailable-slot.exception.ts
│   │
│   ├── infrastructure/           # CAPA DE INFRAESTRUCTURA
│   │   ├── database/             # Persistencia
│   │   │   ├── prisma/
│   │   │   │   ├── schema.prisma
│   │   │   │   └── migrations/
│   │   │   │
│   │   │   └── repositories/    # Implementaciones de repos
│   │   │       ├── booking.repository.ts
│   │   │       └── booking-code.repository.ts
│   │   │
│   │   ├── http/                 # Clientes HTTP
│   │   │   ├── payment.client.ts
│   │   │   ├── artist.client.ts
│   │   │   └── notification.client.ts
│   │   │
│   │   ├── cache/                # Redis
│   │   │   └── booking-cache.service.ts
│   │   │
│   │   └── messaging/            # Event Bus (RabbitMQ/Redis Pub/Sub)
│   │       ├── event-publisher.ts
│   │       └── event-subscriber.ts
│   │
│   ├── presentation/             # CAPA DE PRESENTACIÓN (API Layer)
│   │   ├── controllers/          # REST Controllers
│   │   │   ├── booking.controller.ts
│   │   │   └── booking-admin.controller.ts
│   │   │
│   │   ├── guards/               # Auth guards
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   │
│   │   ├── interceptors/         # Response transformation
│   │   │   └── transform.interceptor.ts
│   │   │
│   │   └── filters/              # Exception handling
│   │       └── http-exception.filter.ts
│   │
│   ├── shared/                   # SHARED (Cross-cutting)
│   │   ├── config/               # Configuración
│   │   │   └── booking.config.ts
│   │   │
│   │   ├── decorators/           # Custom decorators
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   │
│   │   ├── utils/                # Utilidades
│   │   │   ├── date.utils.ts
│   │   │   └── code-generator.utils.ts
│   │   │
│   │   └── constants/            # Constantes
│   │       └── booking-status.constants.ts
│   │
│   ├── booking.module.ts         # Módulo raíz
│   └── main.ts                   # Bootstrap
│
├── test/                         # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── prisma/
│   └── schema.prisma
│
├── Dockerfile
├── package.json
└── tsconfig.json
````

---

### **Flujo de Datos (Clean Architecture)**

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT REQUEST                          │
│               (POST /api/bookings)                           │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (API Gateway)                            │
│  ├─ booking.controller.ts                                    │
│  ├─ Validación DTO (class-validator)                        │
│  ├─ Guards (JWT auth, RBAC)                                 │
│  └─ Interceptors (logging, transform)                       │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  APPLICATION LAYER (Use Cases)                               │
│  ├─ create-booking.usecase.ts                               │
│  │  ├─ 1. Validar disponibilidad                            │
│  │  ├─ 2. Crear entidad Booking                             │
│  │  ├─ 3. Calcular precio total                             │
│  │  ├─ 4. Generar código 6 dígitos                          │
│  │  ├─ 5. Llamar payment service                            │
│  │  ├─ 6. Guardar en BD (via repository)                    │
│  │  └─ 7. Publicar evento BookingCreated                    │
│  └─ Orchestration + Business logic                          │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  DOMAIN LAYER (Core Business)                                │
│  ├─ booking.entity.ts                                        │
│  │  ├─ Business rules                                        │
│  │  ├─ Validaciones de negocio                              │
│  │  ├─ State machine (status transitions)                   │
│  │  └─ Domain events dispatch                               │
│  ├─ value-objects/                                           │
│  │  ├─ Price (validación, operaciones)                      │
│  │  └─ DateRange (validación, overlaps)                     │
│  └─ Pure business logic (NO dependencies)                   │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE LAYER (Detalles técnicos)                    │
│  ├─ database/repositories/                                   │
│  │  └─ booking.repository.ts                                │
│  │     └─ Prisma implementation                             │
│  ├─ http/                                                    │
│  │  ├─ payment.client.ts (Stripe)                           │
│  │  ├─ artist.client.ts                                     │
│  │  └─ notification.client.ts                               │
│  ├─ cache/                                                   │
│  │  └─ Redis client                                         │
│  └─ messaging/                                               │
│     └─ Event bus (RabbitMQ)                                 │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL SERVICES                                           │
│  ├─ PostgreSQL (Booking data)                               │
│  ├─ Redis (Cache + Pub/Sub)                                 │
│  ├─ Stripe API (Payments)                                   │
│  └─ Notification Service (SendGrid)                         │
└─────────────────────────────────────────────────────────────┘
```

---

### **Principios Clean Architecture Aplicados:**

````typescript
// ✅ EJEMPLO REAL: create-booking.usecase.ts

import { Injectable } from '@nestjs/common';
import { CreateBookingDto } from '../dtos/create-booking.dto';
import { Booking } from '../../domain/entities/booking.entity';
import { IBookingRepository } from '../interfaces/booking.repository.interface';
import { IPaymentService } from '../interfaces/payment.service.interface';
import { INotificationService } from '../interfaces/notification.service.interface';
import { BookingCreatedEvent } from '../../domain/events/booking-created.event';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CreateBookingUseCase {
  constructor(
    // ⭐ DEPENDENCY INVERSION: Depende de INTERFACES, no implementaciones
    private readonly bookingRepository: IBookingRepository,
    private readonly paymentService: IPaymentService,
    private readonly notificationService: INotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: CreateBookingDto, userId: string): Promise<Booking> {
    // 1. Validar disponibilidad (Domain logic)
    const isAvailable = await this.bookingRepository.checkAvailability(
      dto.artistId,
      dto.date,
      dto.timeSlot,
    );

    if (!isAvailable) {
      throw new UnavailableSlotException();
    }

    // 2. Crear entidad de dominio (Domain layer)
    const booking = Booking.create({
      userId,
      artistId: dto.artistId,
      serviceId: dto.serviceId,
      date: dto.date,
      timeSlot: dto.timeSlot,
      addOns: dto.addOns || [],
    });

    // 3. Calcular precio (Domain logic - value object)
    const totalPrice = booking.calculateTotalPrice();

    // 4. Generar código único (Domain logic)
    booking.generateCode();

    // 5. Crear payment intent (Infrastructure)
    const paymentIntent = await this.paymentService.createIntent({
      amount: totalPrice.toNumber(),
      currency: 'usd',
      customerId: userId,
      metadata: {
        bookingId: booking.id,
      },
    });

    booking.setPaymentIntentId(paymentIntent.id);

    // 6. Persistir (Infrastructure - repository)
    const savedBooking = await this.bookingRepository.save(booking);

    // 7. Publicar evento de dominio (Event-driven)
    const event = new BookingCreatedEvent(savedBooking);
    this.eventEmitter.emit('booking.created', event);

    // 8. Notificar (async - infrastructure)
    await this.notificationService.send({
      to: userId,
      type: 'booking_created',
      data: { bookingId: savedBooking.id },
    });

    return savedBooking;
  }
}
````

---

### **Ventajas Clean Architecture en Piums:**

```
✅ 1. Testabilidad
   └─ Usar cases independientes
   └─ Mocks de interfaces (no implementaciones)
   └─ Tests unitarios rápidos

✅ 2. Mantenibilidad
   └─ Business logic aislada (domain/)
   └─ Cambios en infra no afectan dominio
   └─ Código expresivo y legible

✅ 3. Escalabilidad
   └─ Agregar nuevos use cases fácilmente
   └─ Cambiar BD sin tocar business logic
   └─ Swap de servicios externos sin impacto

✅ 4. Desacoplamiento
   └─ Domain no conoce infrastructure
   └─ Application no conoce DB details
   └─ Presentation no conoce business rules

✅ 5. Reusabilidad
   └─ Domain entities reutilizables
   └─ Value objects compartidos
   └─ Use cases componibles

= Clean Architecture al 100% ✅
```

---

## 📦 **PARTE 2: INFRA - ¿DE QUÉ SE ENCARGA?**

### **Estructura [`infra/`](infra/ ):**

````
infra/
├── docker/                       # DOCKER ORCHESTRATION
│   ├── docker-compose.dev.yml    # Development
│   ├── docker-compose.prod.yml   # Production
│   ├── docker-compose.staging.yml # Staging
│   └── .env.example              # Template
│
├── kubernetes/                   # KUBERNETES (Optional)
│   ├── deployments/
│   │   ├── web-client.yaml
│   │   ├── web-artist.yaml
│   │   ├── gateway.yaml
│   │   └── services/
│   │       ├── auth.yaml
│   │       ├── users.yaml
│   │       └── ...
│   ├── services/
│   ├── ingress/
│   └── configmaps/
│
├── nginx/                        # REVERSE PROXY
│   ├── nginx.conf                # Main config
│   ├── conf.d/
│   │   ├── client-app.conf       # piums.com
│   │   ├── artist-app.conf       # artist.piums.com
│   │   └── api.conf              # api.piums.com
│   └── ssl/                      # SSL certificates
│       ├── cert.pem
│       └── key.pem
│
├── terraform/                    # INFRASTRUCTURE AS CODE (IaC)
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── modules/
│   │   ├── vpc/
│   │   ├── rds/
│   │   ├── elasticache/
│   │   └── ecs/
│   └── environments/
│       ├── dev/
│       ├── staging/
│       └── prod/
│
├── monitoring/                   # OBSERVABILITY
│   ├── prometheus/
│   │   └── prometheus.yml
│   ├── grafana/
│   │   └── dashboards/
│   └── alerts/
│
├── scripts/                      # AUTOMATION SCRIPTS
│   ├── setup-dev.sh              # Setup local development
│   ├── deploy.sh                 # Deploy script
│   ├── backup-db.sh              # Database backup
│   ├── restore-db.sh             # Database restore
│   └── health-check.sh           # Health monitoring
│
└── ci/                          # CI/CD CONFIGS
    ├── github-actions/
    │   └── templates/
    └── gitlab-ci/
        └── .gitlab-ci.yml
````

---

### **Responsabilidades de `infra/`:**

---

#### **1. Docker Orchestration** 🐳

````yaml
# infra/docker/docker-compose.prod.yml

version: '3.8'

services:
  # ======================
  # FRONTEND APPS
  # ======================
  web-client:
    image: ghcr.io/piums/piums-web-client:${VERSION:-latest}
    container_name: piums-web-client
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.piums.com
      - NEXT_PUBLIC_ARTIST_APP_URL=https://artist.piums.com
    networks:
      - piums-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web-artist:
    image: ghcr.io/piums/piums-web-artist:${VERSION:-latest}
    container_name: piums-web-artist
    restart: always
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.piums.com
      - NEXT_PUBLIC_CLIENT_APP_URL=https://piums.com
    networks:
      - piums-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M

  # ======================
  # API GATEWAY
  # ======================
  gateway:
    image: ghcr.io/piums/piums-gateway:${VERSION:-latest}
    container_name: piums-gateway
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - CLIENT_APP_URL=https://piums.com
      - ARTIST_APP_URL=https://artist.piums.com
    networks:
      - piums-network
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 1G

  # ======================
  # MICROSERVICES
  # ======================
  auth-service:
    image: ghcr.io/piums/piums-auth-service:${VERSION:-latest}
    restart: always
    environment:
      - DATABASE_URL=${AUTH_DB_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - FACEBOOK_APP_ID=${FACEBOOK_APP_ID}
    networks:
      - piums-network
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 2

  # ... (otros 9 microservices similares)

  # ======================
  # DATABASES
  # ======================
  postgres:
    image: postgres:15-alpine
    container_name: piums-postgres
    restart: always
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=piums
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    networks:
      - piums-network
    ports:
      - "5432:5432"
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  redis:
    image: redis:7-alpine
    container_name: piums-redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - piums-network
    ports:
      - "6379:6379"
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

  # ======================
  # NGINX (Reverse Proxy)
  # ======================
  nginx:
    image: nginx:alpine
    container_name: piums-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ../nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ../nginx/conf.d:/etc/nginx/conf.d:ro
      - ../nginx/ssl:/etc/nginx/ssl:ro
      - nginx-cache:/var/cache/nginx
    networks:
      - piums-network
    depends_on:
      - web-client
      - web-artist
      - gateway

  # ======================
  # MONITORING
  # ======================
  prometheus:
    image: prom/prometheus:latest
    container_name: piums-prometheus
    restart: always
    volumes:
      - ../monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - piums-network
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    container_name: piums-grafana
    restart: always
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - ../monitoring/grafana/dashboards:/var/lib/grafana/dashboards
      - grafana-data:/var/lib/grafana
    networks:
      - piums-network
    ports:
      - "3003:3000"

networks:
  piums-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
  nginx-cache:
  prometheus-data:
  grafana-data:
````

**Responsabilidad:** 
- ✅ Orquestación de 13+ contenedores
- ✅ Networking entre servicios
- ✅ Persistencia de datos
- ✅ Resource limits
- ✅ Health checks
- ✅ Auto-restart policies

---

#### **2. Nginx Configuration** 🔀

````nginx
# infra/nginx/nginx.conf

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_
```


## License: unknown
https://github.com/m-ezaki/chef-repo/blob/40a4f83440a5ac8a8f67913b0f5d190061aecaed/site-cookbooks/nginx/templates/default/nginx.conf.erb

```
# 🏗️ **ARQUITECTURA COMPLETA + CLEAN ARCHITECTURE + INFRA + DEPLOYMENT**

---

## 📋 **RESUMEN EJECUTIVO**

```
╔═══════════════════════════════════════════════════════╗
║  PIUMS PLATFORM - ARQUITECTURA COMPLETA               ║
║                                                        ║
║  Patrón:           Clean Architecture ✅              ║
║  Infra:            Docker + Nginx + CI/CD ✅          ║
║  Deploy:           GitHub Actions (automatizado) ✅   ║
║  Estado:           Production-Ready 🚀                ║
╚═══════════════════════════════════════════════════════╝
```

---

## 🎯 **PARTE 1: CLEAN ARCHITECTURE**

### **¿Se sigue usando Clean Architecture?** ✅ **SÍ, AL 100%**

---

### **Estructura por Microservicio (Ejemplo: booking-service)**

````
services/booking-service/
├── src/
│   ├── application/              # CAPA DE APLICACIÓN
│   │   ├── dtos/                 # Data Transfer Objects
│   │   │   ├── create-booking.dto.ts
│   │   │   ├── update-booking.dto.ts
│   │   │   └── booking-response.dto.ts
│   │   │
│   │   ├── use-cases/            # Casos de Uso (Lógica de negocio)
│   │   │   ├── create-booking.usecase.ts
│   │   │   ├── reschedule-booking.usecase.ts
│   │   │   ├── cancel-booking.usecase.ts
│   │   │   ├── verify-code.usecase.ts
│   │   │   └── calculate-price.usecase.ts
│   │   │
│   │   └── interfaces/           # Contratos de infra
│   │       ├── booking.repository.interface.ts
│   │       ├── payment.service.interface.ts
│   │       └── notification.service.interface.ts
│   │
│   ├── domain/                   # CAPA DE DOMINIO (Core Business)
│   │   ├── entities/             # Entidades de negocio
│   │   │   ├── booking.entity.ts
│   │   │   ├── booking-code.entity.ts
│   │   │   └── booking-item.entity.ts
│   │   │
│   │   ├── value-objects/        # Objetos de valor
│   │   │   ├── price.vo.ts
│   │   │   ├── date-range.vo.ts
│   │   │   └── booking-status.vo.ts
│   │   │
│   │   ├── aggregates/           # Agregados
│   │   │   └── booking.aggregate.ts
│   │   │
│   │   ├── events/               # Domain Events
│   │   │   ├── booking-created.event.ts
│   │   │   ├── booking-confirmed.event.ts
│   │   │   └── booking-cancelled.event.ts
│   │   │
│   │   └── exceptions/           # Excepciones de dominio
│   │       ├── booking-not-found.exception.ts
│   │       ├── invalid-booking-status.exception.ts
│   │       └── unavailable-slot.exception.ts
│   │
│   ├── infrastructure/           # CAPA DE INFRAESTRUCTURA
│   │   ├── database/             # Persistencia
│   │   │   ├── prisma/
│   │   │   │   ├── schema.prisma
│   │   │   │   └── migrations/
│   │   │   │
│   │   │   └── repositories/    # Implementaciones de repos
│   │   │       ├── booking.repository.ts
│   │   │       └── booking-code.repository.ts
│   │   │
│   │   ├── http/                 # Clientes HTTP
│   │   │   ├── payment.client.ts
│   │   │   ├── artist.client.ts
│   │   │   └── notification.client.ts
│   │   │
│   │   ├── cache/                # Redis
│   │   │   └── booking-cache.service.ts
│   │   │
│   │   └── messaging/            # Event Bus (RabbitMQ/Redis Pub/Sub)
│   │       ├── event-publisher.ts
│   │       └── event-subscriber.ts
│   │
│   ├── presentation/             # CAPA DE PRESENTACIÓN (API Layer)
│   │   ├── controllers/          # REST Controllers
│   │   │   ├── booking.controller.ts
│   │   │   └── booking-admin.controller.ts
│   │   │
│   │   ├── guards/               # Auth guards
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   │
│   │   ├── interceptors/         # Response transformation
│   │   │   └── transform.interceptor.ts
│   │   │
│   │   └── filters/              # Exception handling
│   │       └── http-exception.filter.ts
│   │
│   ├── shared/                   # SHARED (Cross-cutting)
│   │   ├── config/               # Configuración
│   │   │   └── booking.config.ts
│   │   │
│   │   ├── decorators/           # Custom decorators
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   │
│   │   ├── utils/                # Utilidades
│   │   │   ├── date.utils.ts
│   │   │   └── code-generator.utils.ts
│   │   │
│   │   └── constants/            # Constantes
│   │       └── booking-status.constants.ts
│   │
│   ├── booking.module.ts         # Módulo raíz
│   └── main.ts                   # Bootstrap
│
├── test/                         # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── prisma/
│   └── schema.prisma
│
├── Dockerfile
├── package.json
└── tsconfig.json
````

---

### **Flujo de Datos (Clean Architecture)**

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT REQUEST                          │
│               (POST /api/bookings)                           │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (API Gateway)                            │
│  ├─ booking.controller.ts                                    │
│  ├─ Validación DTO (class-validator)                        │
│  ├─ Guards (JWT auth, RBAC)                                 │
│  └─ Interceptors (logging, transform)                       │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  APPLICATION LAYER (Use Cases)                               │
│  ├─ create-booking.usecase.ts                               │
│  │  ├─ 1. Validar disponibilidad                            │
│  │  ├─ 2. Crear entidad Booking                             │
│  │  ├─ 3. Calcular precio total                             │
│  │  ├─ 4. Generar código 6 dígitos                          │
│  │  ├─ 5. Llamar payment service                            │
│  │  ├─ 6. Guardar en BD (via repository)                    │
│  │  └─ 7. Publicar evento BookingCreated                    │
│  └─ Orchestration + Business logic                          │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  DOMAIN LAYER (Core Business)                                │
│  ├─ booking.entity.ts                                        │
│  │  ├─ Business rules                                        │
│  │  ├─ Validaciones de negocio                              │
│  │  ├─ State machine (status transitions)                   │
│  │  └─ Domain events dispatch                               │
│  ├─ value-objects/                                           │
│  │  ├─ Price (validación, operaciones)                      │
│  │  └─ DateRange (validación, overlaps)                     │
│  └─ Pure business logic (NO dependencies)                   │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE LAYER (Detalles técnicos)                    │
│  ├─ database/repositories/                                   │
│  │  └─ booking.repository.ts                                │
│  │     └─ Prisma implementation                             │
│  ├─ http/                                                    │
│  │  ├─ payment.client.ts (Stripe)                           │
│  │  ├─ artist.client.ts                                     │
│  │  └─ notification.client.ts                               │
│  ├─ cache/                                                   │
│  │  └─ Redis client                                         │
│  └─ messaging/                                               │
│     └─ Event bus (RabbitMQ)                                 │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL SERVICES                                           │
│  ├─ PostgreSQL (Booking data)                               │
│  ├─ Redis (Cache + Pub/Sub)                                 │
│  ├─ Stripe API (Payments)                                   │
│  └─ Notification Service (SendGrid)                         │
└─────────────────────────────────────────────────────────────┘
```

---

### **Principios Clean Architecture Aplicados:**

````typescript
// ✅ EJEMPLO REAL: create-booking.usecase.ts

import { Injectable } from '@nestjs/common';
import { CreateBookingDto } from '../dtos/create-booking.dto';
import { Booking } from '../../domain/entities/booking.entity';
import { IBookingRepository } from '../interfaces/booking.repository.interface';
import { IPaymentService } from '../interfaces/payment.service.interface';
import { INotificationService } from '../interfaces/notification.service.interface';
import { BookingCreatedEvent } from '../../domain/events/booking-created.event';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CreateBookingUseCase {
  constructor(
    // ⭐ DEPENDENCY INVERSION: Depende de INTERFACES, no implementaciones
    private readonly bookingRepository: IBookingRepository,
    private readonly paymentService: IPaymentService,
    private readonly notificationService: INotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: CreateBookingDto, userId: string): Promise<Booking> {
    // 1. Validar disponibilidad (Domain logic)
    const isAvailable = await this.bookingRepository.checkAvailability(
      dto.artistId,
      dto.date,
      dto.timeSlot,
    );

    if (!isAvailable) {
      throw new UnavailableSlotException();
    }

    // 2. Crear entidad de dominio (Domain layer)
    const booking = Booking.create({
      userId,
      artistId: dto.artistId,
      serviceId: dto.serviceId,
      date: dto.date,
      timeSlot: dto.timeSlot,
      addOns: dto.addOns || [],
    });

    // 3. Calcular precio (Domain logic - value object)
    const totalPrice = booking.calculateTotalPrice();

    // 4. Generar código único (Domain logic)
    booking.generateCode();

    // 5. Crear payment intent (Infrastructure)
    const paymentIntent = await this.paymentService.createIntent({
      amount: totalPrice.toNumber(),
      currency: 'usd',
      customerId: userId,
      metadata: {
        bookingId: booking.id,
      },
    });

    booking.setPaymentIntentId(paymentIntent.id);

    // 6. Persistir (Infrastructure - repository)
    const savedBooking = await this.bookingRepository.save(booking);

    // 7. Publicar evento de dominio (Event-driven)
    const event = new BookingCreatedEvent(savedBooking);
    this.eventEmitter.emit('booking.created', event);

    // 8. Notificar (async - infrastructure)
    await this.notificationService.send({
      to: userId,
      type: 'booking_created',
      data: { bookingId: savedBooking.id },
    });

    return savedBooking;
  }
}
````

---

### **Ventajas Clean Architecture en Piums:**

```
✅ 1. Testabilidad
   └─ Usar cases independientes
   └─ Mocks de interfaces (no implementaciones)
   └─ Tests unitarios rápidos

✅ 2. Mantenibilidad
   └─ Business logic aislada (domain/)
   └─ Cambios en infra no afectan dominio
   └─ Código expresivo y legible

✅ 3. Escalabilidad
   └─ Agregar nuevos use cases fácilmente
   └─ Cambiar BD sin tocar business logic
   └─ Swap de servicios externos sin impacto

✅ 4. Desacoplamiento
   └─ Domain no conoce infrastructure
   └─ Application no conoce DB details
   └─ Presentation no conoce business rules

✅ 5. Reusabilidad
   └─ Domain entities reutilizables
   └─ Value objects compartidos
   └─ Use cases componibles

= Clean Architecture al 100% ✅
```

---

## 📦 **PARTE 2: INFRA - ¿DE QUÉ SE ENCARGA?**

### **Estructura [`infra/`](infra/ ):**

````
infra/
├── docker/                       # DOCKER ORCHESTRATION
│   ├── docker-compose.dev.yml    # Development
│   ├── docker-compose.prod.yml   # Production
│   ├── docker-compose.staging.yml # Staging
│   └── .env.example              # Template
│
├── kubernetes/                   # KUBERNETES (Optional)
│   ├── deployments/
│   │   ├── web-client.yaml
│   │   ├── web-artist.yaml
│   │   ├── gateway.yaml
│   │   └── services/
│   │       ├── auth.yaml
│   │       ├── users.yaml
│   │       └── ...
│   ├── services/
│   ├── ingress/
│   └── configmaps/
│
├── nginx/                        # REVERSE PROXY
│   ├── nginx.conf                # Main config
│   ├── conf.d/
│   │   ├── client-app.conf       # piums.com
│   │   ├── artist-app.conf       # artist.piums.com
│   │   └── api.conf              # api.piums.com
│   └── ssl/                      # SSL certificates
│       ├── cert.pem
│       └── key.pem
│
├── terraform/                    # INFRASTRUCTURE AS CODE (IaC)
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── modules/
│   │   ├── vpc/
│   │   ├── rds/
│   │   ├── elasticache/
│   │   └── ecs/
│   └── environments/
│       ├── dev/
│       ├── staging/
│       └── prod/
│
├── monitoring/                   # OBSERVABILITY
│   ├── prometheus/
│   │   └── prometheus.yml
│   ├── grafana/
│   │   └── dashboards/
│   └── alerts/
│
├── scripts/                      # AUTOMATION SCRIPTS
│   ├── setup-dev.sh              # Setup local development
│   ├── deploy.sh                 # Deploy script
│   ├── backup-db.sh              # Database backup
│   ├── restore-db.sh             # Database restore
│   └── health-check.sh           # Health monitoring
│
└── ci/                          # CI/CD CONFIGS
    ├── github-actions/
    │   └── templates/
    └── gitlab-ci/
        └── .gitlab-ci.yml
````

---

### **Responsabilidades de `infra/`:**

---

#### **1. Docker Orchestration** 🐳

````yaml
# infra/docker/docker-compose.prod.yml

version: '3.8'

services:
  # ======================
  # FRONTEND APPS
  # ======================
  web-client:
    image: ghcr.io/piums/piums-web-client:${VERSION:-latest}
    container_name: piums-web-client
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.piums.com
      - NEXT_PUBLIC_ARTIST_APP_URL=https://artist.piums.com
    networks:
      - piums-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web-artist:
    image: ghcr.io/piums/piums-web-artist:${VERSION:-latest}
    container_name: piums-web-artist
    restart: always
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.piums.com
      - NEXT_PUBLIC_CLIENT_APP_URL=https://piums.com
    networks:
      - piums-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M

  # ======================
  # API GATEWAY
  # ======================
  gateway:
    image: ghcr.io/piums/piums-gateway:${VERSION:-latest}
    container_name: piums-gateway
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - CLIENT_APP_URL=https://piums.com
      - ARTIST_APP_URL=https://artist.piums.com
    networks:
      - piums-network
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 1G

  # ======================
  # MICROSERVICES
  # ======================
  auth-service:
    image: ghcr.io/piums/piums-auth-service:${VERSION:-latest}
    restart: always
    environment:
      - DATABASE_URL=${AUTH_DB_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - FACEBOOK_APP_ID=${FACEBOOK_APP_ID}
    networks:
      - piums-network
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 2

  # ... (otros 9 microservices similares)

  # ======================
  # DATABASES
  # ======================
  postgres:
    image: postgres:15-alpine
    container_name: piums-postgres
    restart: always
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=piums
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    networks:
      - piums-network
    ports:
      - "5432:5432"
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  redis:
    image: redis:7-alpine
    container_name: piums-redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - piums-network
    ports:
      - "6379:6379"
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

  # ======================
  # NGINX (Reverse Proxy)
  # ======================
  nginx:
    image: nginx:alpine
    container_name: piums-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ../nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ../nginx/conf.d:/etc/nginx/conf.d:ro
      - ../nginx/ssl:/etc/nginx/ssl:ro
      - nginx-cache:/var/cache/nginx
    networks:
      - piums-network
    depends_on:
      - web-client
      - web-artist
      - gateway

  # ======================
  # MONITORING
  # ======================
  prometheus:
    image: prom/prometheus:latest
    container_name: piums-prometheus
    restart: always
    volumes:
      - ../monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - piums-network
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    container_name: piums-grafana
    restart: always
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - ../monitoring/grafana/dashboards:/var/lib/grafana/dashboards
      - grafana-data:/var/lib/grafana
    networks:
      - piums-network
    ports:
      - "3003:3000"

networks:
  piums-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
  nginx-cache:
  prometheus-data:
  grafana-data:
````

**Responsabilidad:** 
- ✅ Orquestación de 13+ contenedores
- ✅ Networking entre servicios
- ✅ Persistencia de datos
- ✅ Resource limits
- ✅ Health checks
- ✅ Auto-restart policies

---

#### **2. Nginx Configuration** 🔀

````nginx
# infra/nginx/nginx.conf

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
```


## License: Apache-2.0
https://github.com/Catherine22/Frontend-Development/blob/45f10023c0a5466a9f65a146acb856421f14da36/Vue/vue-pwa/nginx/nginx.conf

```
# 🏗️ **ARQUITECTURA COMPLETA + CLEAN ARCHITECTURE + INFRA + DEPLOYMENT**

---

## 📋 **RESUMEN EJECUTIVO**

```
╔═══════════════════════════════════════════════════════╗
║  PIUMS PLATFORM - ARQUITECTURA COMPLETA               ║
║                                                        ║
║  Patrón:           Clean Architecture ✅              ║
║  Infra:            Docker + Nginx + CI/CD ✅          ║
║  Deploy:           GitHub Actions (automatizado) ✅   ║
║  Estado:           Production-Ready 🚀                ║
╚═══════════════════════════════════════════════════════╝
```

---

## 🎯 **PARTE 1: CLEAN ARCHITECTURE**

### **¿Se sigue usando Clean Architecture?** ✅ **SÍ, AL 100%**

---

### **Estructura por Microservicio (Ejemplo: booking-service)**

````
services/booking-service/
├── src/
│   ├── application/              # CAPA DE APLICACIÓN
│   │   ├── dtos/                 # Data Transfer Objects
│   │   │   ├── create-booking.dto.ts
│   │   │   ├── update-booking.dto.ts
│   │   │   └── booking-response.dto.ts
│   │   │
│   │   ├── use-cases/            # Casos de Uso (Lógica de negocio)
│   │   │   ├── create-booking.usecase.ts
│   │   │   ├── reschedule-booking.usecase.ts
│   │   │   ├── cancel-booking.usecase.ts
│   │   │   ├── verify-code.usecase.ts
│   │   │   └── calculate-price.usecase.ts
│   │   │
│   │   └── interfaces/           # Contratos de infra
│   │       ├── booking.repository.interface.ts
│   │       ├── payment.service.interface.ts
│   │       └── notification.service.interface.ts
│   │
│   ├── domain/                   # CAPA DE DOMINIO (Core Business)
│   │   ├── entities/             # Entidades de negocio
│   │   │   ├── booking.entity.ts
│   │   │   ├── booking-code.entity.ts
│   │   │   └── booking-item.entity.ts
│   │   │
│   │   ├── value-objects/        # Objetos de valor
│   │   │   ├── price.vo.ts
│   │   │   ├── date-range.vo.ts
│   │   │   └── booking-status.vo.ts
│   │   │
│   │   ├── aggregates/           # Agregados
│   │   │   └── booking.aggregate.ts
│   │   │
│   │   ├── events/               # Domain Events
│   │   │   ├── booking-created.event.ts
│   │   │   ├── booking-confirmed.event.ts
│   │   │   └── booking-cancelled.event.ts
│   │   │
│   │   └── exceptions/           # Excepciones de dominio
│   │       ├── booking-not-found.exception.ts
│   │       ├── invalid-booking-status.exception.ts
│   │       └── unavailable-slot.exception.ts
│   │
│   ├── infrastructure/           # CAPA DE INFRAESTRUCTURA
│   │   ├── database/             # Persistencia
│   │   │   ├── prisma/
│   │   │   │   ├── schema.prisma
│   │   │   │   └── migrations/
│   │   │   │
│   │   │   └── repositories/    # Implementaciones de repos
│   │   │       ├── booking.repository.ts
│   │   │       └── booking-code.repository.ts
│   │   │
│   │   ├── http/                 # Clientes HTTP
│   │   │   ├── payment.client.ts
│   │   │   ├── artist.client.ts
│   │   │   └── notification.client.ts
│   │   │
│   │   ├── cache/                # Redis
│   │   │   └── booking-cache.service.ts
│   │   │
│   │   └── messaging/            # Event Bus (RabbitMQ/Redis Pub/Sub)
│   │       ├── event-publisher.ts
│   │       └── event-subscriber.ts
│   │
│   ├── presentation/             # CAPA DE PRESENTACIÓN (API Layer)
│   │   ├── controllers/          # REST Controllers
│   │   │   ├── booking.controller.ts
│   │   │   └── booking-admin.controller.ts
│   │   │
│   │   ├── guards/               # Auth guards
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   │
│   │   ├── interceptors/         # Response transformation
│   │   │   └── transform.interceptor.ts
│   │   │
│   │   └── filters/              # Exception handling
│   │       └── http-exception.filter.ts
│   │
│   ├── shared/                   # SHARED (Cross-cutting)
│   │   ├── config/               # Configuración
│   │   │   └── booking.config.ts
│   │   │
│   │   ├── decorators/           # Custom decorators
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   │
│   │   ├── utils/                # Utilidades
│   │   │   ├── date.utils.ts
│   │   │   └── code-generator.utils.ts
│   │   │
│   │   └── constants/            # Constantes
│   │       └── booking-status.constants.ts
│   │
│   ├── booking.module.ts         # Módulo raíz
│   └── main.ts                   # Bootstrap
│
├── test/                         # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── prisma/
│   └── schema.prisma
│
├── Dockerfile
├── package.json
└── tsconfig.json
````

---

### **Flujo de Datos (Clean Architecture)**

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT REQUEST                          │
│               (POST /api/bookings)                           │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (API Gateway)                            │
│  ├─ booking.controller.ts                                    │
│  ├─ Validación DTO (class-validator)                        │
│  ├─ Guards (JWT auth, RBAC)                                 │
│  └─ Interceptors (logging, transform)                       │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  APPLICATION LAYER (Use Cases)                               │
│  ├─ create-booking.usecase.ts                               │
│  │  ├─ 1. Validar disponibilidad                            │
│  │  ├─ 2. Crear entidad Booking                             │
│  │  ├─ 3. Calcular precio total                             │
│  │  ├─ 4. Generar código 6 dígitos                          │
│  │  ├─ 5. Llamar payment service                            │
│  │  ├─ 6. Guardar en BD (via repository)                    │
│  │  └─ 7. Publicar evento BookingCreated                    │
│  └─ Orchestration + Business logic                          │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  DOMAIN LAYER (Core Business)                                │
│  ├─ booking.entity.ts                                        │
│  │  ├─ Business rules                                        │
│  │  ├─ Validaciones de negocio                              │
│  │  ├─ State machine (status transitions)                   │
│  │  └─ Domain events dispatch                               │
│  ├─ value-objects/                                           │
│  │  ├─ Price (validación, operaciones)                      │
│  │  └─ DateRange (validación, overlaps)                     │
│  └─ Pure business logic (NO dependencies)                   │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE LAYER (Detalles técnicos)                    │
│  ├─ database/repositories/                                   │
│  │  └─ booking.repository.ts                                │
│  │     └─ Prisma implementation                             │
│  ├─ http/                                                    │
│  │  ├─ payment.client.ts (Stripe)                           │
│  │  ├─ artist.client.ts                                     │
│  │  └─ notification.client.ts                               │
│  ├─ cache/                                                   │
│  │  └─ Redis client                                         │
│  └─ messaging/                                               │
│     └─ Event bus (RabbitMQ)                                 │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL SERVICES                                           │
│  ├─ PostgreSQL (Booking data)                               │
│  ├─ Redis (Cache + Pub/Sub)                                 │
│  ├─ Stripe API (Payments)                                   │
│  └─ Notification Service (SendGrid)                         │
└─────────────────────────────────────────────────────────────┘
```

---

### **Principios Clean Architecture Aplicados:**

````typescript
// ✅ EJEMPLO REAL: create-booking.usecase.ts

import { Injectable } from '@nestjs/common';
import { CreateBookingDto } from '../dtos/create-booking.dto';
import { Booking } from '../../domain/entities/booking.entity';
import { IBookingRepository } from '../interfaces/booking.repository.interface';
import { IPaymentService } from '../interfaces/payment.service.interface';
import { INotificationService } from '../interfaces/notification.service.interface';
import { BookingCreatedEvent } from '../../domain/events/booking-created.event';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CreateBookingUseCase {
  constructor(
    // ⭐ DEPENDENCY INVERSION: Depende de INTERFACES, no implementaciones
    private readonly bookingRepository: IBookingRepository,
    private readonly paymentService: IPaymentService,
    private readonly notificationService: INotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: CreateBookingDto, userId: string): Promise<Booking> {
    // 1. Validar disponibilidad (Domain logic)
    const isAvailable = await this.bookingRepository.checkAvailability(
      dto.artistId,
      dto.date,
      dto.timeSlot,
    );

    if (!isAvailable) {
      throw new UnavailableSlotException();
    }

    // 2. Crear entidad de dominio (Domain layer)
    const booking = Booking.create({
      userId,
      artistId: dto.artistId,
      serviceId: dto.serviceId,
      date: dto.date,
      timeSlot: dto.timeSlot,
      addOns: dto.addOns || [],
    });

    // 3. Calcular precio (Domain logic - value object)
    const totalPrice = booking.calculateTotalPrice();

    // 4. Generar código único (Domain logic)
    booking.generateCode();

    // 5. Crear payment intent (Infrastructure)
    const paymentIntent = await this.paymentService.createIntent({
      amount: totalPrice.toNumber(),
      currency: 'usd',
      customerId: userId,
      metadata: {
        bookingId: booking.id,
      },
    });

    booking.setPaymentIntentId(paymentIntent.id);

    // 6. Persistir (Infrastructure - repository)
    const savedBooking = await this.bookingRepository.save(booking);

    // 7. Publicar evento de dominio (Event-driven)
    const event = new BookingCreatedEvent(savedBooking);
    this.eventEmitter.emit('booking.created', event);

    // 8. Notificar (async - infrastructure)
    await this.notificationService.send({
      to: userId,
      type: 'booking_created',
      data: { bookingId: savedBooking.id },
    });

    return savedBooking;
  }
}
````

---

### **Ventajas Clean Architecture en Piums:**

```
✅ 1. Testabilidad
   └─ Usar cases independientes
   └─ Mocks de interfaces (no implementaciones)
   └─ Tests unitarios rápidos

✅ 2. Mantenibilidad
   └─ Business logic aislada (domain/)
   └─ Cambios en infra no afectan dominio
   └─ Código expresivo y legible

✅ 3. Escalabilidad
   └─ Agregar nuevos use cases fácilmente
   └─ Cambiar BD sin tocar business logic
   └─ Swap de servicios externos sin impacto

✅ 4. Desacoplamiento
   └─ Domain no conoce infrastructure
   └─ Application no conoce DB details
   └─ Presentation no conoce business rules

✅ 5. Reusabilidad
   └─ Domain entities reutilizables
   └─ Value objects compartidos
   └─ Use cases componibles

= Clean Architecture al 100% ✅
```

---

## 📦 **PARTE 2: INFRA - ¿DE QUÉ SE ENCARGA?**

### **Estructura [`infra/`](infra/ ):**

````
infra/
├── docker/                       # DOCKER ORCHESTRATION
│   ├── docker-compose.dev.yml    # Development
│   ├── docker-compose.prod.yml   # Production
│   ├── docker-compose.staging.yml # Staging
│   └── .env.example              # Template
│
├── kubernetes/                   # KUBERNETES (Optional)
│   ├── deployments/
│   │   ├── web-client.yaml
│   │   ├── web-artist.yaml
│   │   ├── gateway.yaml
│   │   └── services/
│   │       ├── auth.yaml
│   │       ├── users.yaml
│   │       └── ...
│   ├── services/
│   ├── ingress/
│   └── configmaps/
│
├── nginx/                        # REVERSE PROXY
│   ├── nginx.conf                # Main config
│   ├── conf.d/
│   │   ├── client-app.conf       # piums.com
│   │   ├── artist-app.conf       # artist.piums.com
│   │   └── api.conf              # api.piums.com
│   └── ssl/                      # SSL certificates
│       ├── cert.pem
│       └── key.pem
│
├── terraform/                    # INFRASTRUCTURE AS CODE (IaC)
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── modules/
│   │   ├── vpc/
│   │   ├── rds/
│   │   ├── elasticache/
│   │   └── ecs/
│   └── environments/
│       ├── dev/
│       ├── staging/
│       └── prod/
│
├── monitoring/                   # OBSERVABILITY
│   ├── prometheus/
│   │   └── prometheus.yml
│   ├── grafana/
│   │   └── dashboards/
│   └── alerts/
│
├── scripts/                      # AUTOMATION SCRIPTS
│   ├── setup-dev.sh              # Setup local development
│   ├── deploy.sh                 # Deploy script
│   ├── backup-db.sh              # Database backup
│   ├── restore-db.sh             # Database restore
│   └── health-check.sh           # Health monitoring
│
└── ci/                          # CI/CD CONFIGS
    ├── github-actions/
    │   └── templates/
    └── gitlab-ci/
        └── .gitlab-ci.yml
````

---

### **Responsabilidades de `infra/`:**

---

#### **1. Docker Orchestration** 🐳

````yaml
# infra/docker/docker-compose.prod.yml

version: '3.8'

services:
  # ======================
  # FRONTEND APPS
  # ======================
  web-client:
    image: ghcr.io/piums/piums-web-client:${VERSION:-latest}
    container_name: piums-web-client
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.piums.com
      - NEXT_PUBLIC_ARTIST_APP_URL=https://artist.piums.com
    networks:
      - piums-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web-artist:
    image: ghcr.io/piums/piums-web-artist:${VERSION:-latest}
    container_name: piums-web-artist
    restart: always
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.piums.com
      - NEXT_PUBLIC_CLIENT_APP_URL=https://piums.com
    networks:
      - piums-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M

  # ======================
  # API GATEWAY
  # ======================
  gateway:
    image: ghcr.io/piums/piums-gateway:${VERSION:-latest}
    container_name: piums-gateway
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - CLIENT_APP_URL=https://piums.com
      - ARTIST_APP_URL=https://artist.piums.com
    networks:
      - piums-network
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 1G

  # ======================
  # MICROSERVICES
  # ======================
  auth-service:
    image: ghcr.io/piums/piums-auth-service:${VERSION:-latest}
    restart: always
    environment:
      - DATABASE_URL=${AUTH_DB_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - FACEBOOK_APP_ID=${FACEBOOK_APP_ID}
    networks:
      - piums-network
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 2

  # ... (otros 9 microservices similares)

  # ======================
  # DATABASES
  # ======================
  postgres:
    image: postgres:15-alpine
    container_name: piums-postgres
    restart: always
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=piums
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    networks:
      - piums-network
    ports:
      - "5432:5432"
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  redis:
    image: redis:7-alpine
    container_name: piums-redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - piums-network
    ports:
      - "6379:6379"
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

  # ======================
  # NGINX (Reverse Proxy)
  # ======================
  nginx:
    image: nginx:alpine
    container_name: piums-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ../nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ../nginx/conf.d:/etc/nginx/conf.d:ro
      - ../nginx/ssl:/etc/nginx/ssl:ro
      - nginx-cache:/var/cache/nginx
    networks:
      - piums-network
    depends_on:
      - web-client
      - web-artist
      - gateway

  # ======================
  # MONITORING
  # ======================
  prometheus:
    image: prom/prometheus:latest
    container_name: piums-prometheus
    restart: always
    volumes:
      - ../monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - piums-network
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    container_name: piums-grafana
    restart: always
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - ../monitoring/grafana/dashboards:/var/lib/grafana/dashboards
      - grafana-data:/var/lib/grafana
    networks:
      - piums-network
    ports:
      - "3003:3000"

networks:
  piums-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
  nginx-cache:
  prometheus-data:
  grafana-data:
````

**Responsabilidad:** 
- ✅ Orquestación de 13+ contenedores
- ✅ Networking entre servicios
- ✅ Persistencia de datos
- ✅ Resource limits
- ✅ Health checks
- ✅ Auto-restart policies

---

#### **2. Nginx Configuration** 🔀

````nginx
# infra/nginx/nginx.conf

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
```


## License: unknown
https://github.com/thisissoon/SaltLondonMeetup/blob/c2bcdd6735a7b4b016c55b991be91a82be985110/states/nginx.conf

```
# 🏗️ **ARQUITECTURA COMPLETA + CLEAN ARCHITECTURE + INFRA + DEPLOYMENT**

---

## 📋 **RESUMEN EJECUTIVO**

```
╔═══════════════════════════════════════════════════════╗
║  PIUMS PLATFORM - ARQUITECTURA COMPLETA               ║
║                                                        ║
║  Patrón:           Clean Architecture ✅              ║
║  Infra:            Docker + Nginx + CI/CD ✅          ║
║  Deploy:           GitHub Actions (automatizado) ✅   ║
║  Estado:           Production-Ready 🚀                ║
╚═══════════════════════════════════════════════════════╝
```

---

## 🎯 **PARTE 1: CLEAN ARCHITECTURE**

### **¿Se sigue usando Clean Architecture?** ✅ **SÍ, AL 100%**

---

### **Estructura por Microservicio (Ejemplo: booking-service)**

````
services/booking-service/
├── src/
│   ├── application/              # CAPA DE APLICACIÓN
│   │   ├── dtos/                 # Data Transfer Objects
│   │   │   ├── create-booking.dto.ts
│   │   │   ├── update-booking.dto.ts
│   │   │   └── booking-response.dto.ts
│   │   │
│   │   ├── use-cases/            # Casos de Uso (Lógica de negocio)
│   │   │   ├── create-booking.usecase.ts
│   │   │   ├── reschedule-booking.usecase.ts
│   │   │   ├── cancel-booking.usecase.ts
│   │   │   ├── verify-code.usecase.ts
│   │   │   └── calculate-price.usecase.ts
│   │   │
│   │   └── interfaces/           # Contratos de infra
│   │       ├── booking.repository.interface.ts
│   │       ├── payment.service.interface.ts
│   │       └── notification.service.interface.ts
│   │
│   ├── domain/                   # CAPA DE DOMINIO (Core Business)
│   │   ├── entities/             # Entidades de negocio
│   │   │   ├── booking.entity.ts
│   │   │   ├── booking-code.entity.ts
│   │   │   └── booking-item.entity.ts
│   │   │
│   │   ├── value-objects/        # Objetos de valor
│   │   │   ├── price.vo.ts
│   │   │   ├── date-range.vo.ts
│   │   │   └── booking-status.vo.ts
│   │   │
│   │   ├── aggregates/           # Agregados
│   │   │   └── booking.aggregate.ts
│   │   │
│   │   ├── events/               # Domain Events
│   │   │   ├── booking-created.event.ts
│   │   │   ├── booking-confirmed.event.ts
│   │   │   └── booking-cancelled.event.ts
│   │   │
│   │   └── exceptions/           # Excepciones de dominio
│   │       ├── booking-not-found.exception.ts
│   │       ├── invalid-booking-status.exception.ts
│   │       └── unavailable-slot.exception.ts
│   │
│   ├── infrastructure/           # CAPA DE INFRAESTRUCTURA
│   │   ├── database/             # Persistencia
│   │   │   ├── prisma/
│   │   │   │   ├── schema.prisma
│   │   │   │   └── migrations/
│   │   │   │
│   │   │   └── repositories/    # Implementaciones de repos
│   │   │       ├── booking.repository.ts
│   │   │       └── booking-code.repository.ts
│   │   │
│   │   ├── http/                 # Clientes HTTP
│   │   │   ├── payment.client.ts
│   │   │   ├── artist.client.ts
│   │   │   └── notification.client.ts
│   │   │
│   │   ├── cache/                # Redis
│   │   │   └── booking-cache.service.ts
│   │   │
│   │   └── messaging/            # Event Bus (RabbitMQ/Redis Pub/Sub)
│   │       ├── event-publisher.ts
│   │       └── event-subscriber.ts
│   │
│   ├── presentation/             # CAPA DE PRESENTACIÓN (API Layer)
│   │   ├── controllers/          # REST Controllers
│   │   │   ├── booking.controller.ts
│   │   │   └── booking-admin.controller.ts
│   │   │
│   │   ├── guards/               # Auth guards
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   │
│   │   ├── interceptors/         # Response transformation
│   │   │   └── transform.interceptor.ts
│   │   │
│   │   └── filters/              # Exception handling
│   │       └── http-exception.filter.ts
│   │
│   ├── shared/                   # SHARED (Cross-cutting)
│   │   ├── config/               # Configuración
│   │   │   └── booking.config.ts
│   │   │
│   │   ├── decorators/           # Custom decorators
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   │
│   │   ├── utils/                # Utilidades
│   │   │   ├── date.utils.ts
│   │   │   └── code-generator.utils.ts
│   │   │
│   │   └── constants/            # Constantes
│   │       └── booking-status.constants.ts
│   │
│   ├── booking.module.ts         # Módulo raíz
│   └── main.ts                   # Bootstrap
│
├── test/                         # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── prisma/
│   └── schema.prisma
│
├── Dockerfile
├── package.json
└── tsconfig.json
````

---

### **Flujo de Datos (Clean Architecture)**

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT REQUEST                          │
│               (POST /api/bookings)                           │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (API Gateway)                            │
│  ├─ booking.controller.ts                                    │
│  ├─ Validación DTO (class-validator)                        │
│  ├─ Guards (JWT auth, RBAC)                                 │
│  └─ Interceptors (logging, transform)                       │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  APPLICATION LAYER (Use Cases)                               │
│  ├─ create-booking.usecase.ts                               │
│  │  ├─ 1. Validar disponibilidad                            │
│  │  ├─ 2. Crear entidad Booking                             │
│  │  ├─ 3. Calcular precio total                             │
│  │  ├─ 4. Generar código 6 dígitos                          │
│  │  ├─ 5. Llamar payment service                            │
│  │  ├─ 6. Guardar en BD (via repository)                    │
│  │  └─ 7. Publicar evento BookingCreated                    │
│  └─ Orchestration + Business logic                          │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  DOMAIN LAYER (Core Business)                                │
│  ├─ booking.entity.ts                                        │
│  │  ├─ Business rules                                        │
│  │  ├─ Validaciones de negocio                              │
│  │  ├─ State machine (status transitions)                   │
│  │  └─ Domain events dispatch                               │
│  ├─ value-objects/                                           │
│  │  ├─ Price (validación, operaciones)                      │
│  │  └─ DateRange (validación, overlaps)                     │
│  └─ Pure business logic (NO dependencies)                   │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE LAYER (Detalles técnicos)                    │
│  ├─ database/repositories/                                   │
│  │  └─ booking.repository.ts                                │
│  │     └─ Prisma implementation                             │
│  ├─ http/                                                    │
│  │  ├─ payment.client.ts (Stripe)                           │
│  │  ├─ artist.client.ts                                     │
│  │  └─ notification.client.ts                               │
│  ├─ cache/                                                   │
│  │  └─ Redis client                                         │
│  └─ messaging/                                               │
│     └─ Event bus (RabbitMQ)                                 │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL SERVICES                                           │
│  ├─ PostgreSQL (Booking data)                               │
│  ├─ Redis (Cache + Pub/Sub)                                 │
│  ├─ Stripe API (Payments)                                   │
│  └─ Notification Service (SendGrid)                         │
└─────────────────────────────────────────────────────────────┘
```

---

### **Principios Clean Architecture Aplicados:**

````typescript
// ✅ EJEMPLO REAL: create-booking.usecase.ts

import { Injectable } from '@nestjs/common';
import { CreateBookingDto } from '../dtos/create-booking.dto';
import { Booking } from '../../domain/entities/booking.entity';
import { IBookingRepository } from '../interfaces/booking.repository.interface';
import { IPaymentService } from '../interfaces/payment.service.interface';
import { INotificationService } from '../interfaces/notification.service.interface';
import { BookingCreatedEvent } from '../../domain/events/booking-created.event';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CreateBookingUseCase {
  constructor(
    // ⭐ DEPENDENCY INVERSION: Depende de INTERFACES, no implementaciones
    private readonly bookingRepository: IBookingRepository,
    private readonly paymentService: IPaymentService,
    private readonly notificationService: INotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: CreateBookingDto, userId: string): Promise<Booking> {
    // 1. Validar disponibilidad (Domain logic)
    const isAvailable = await this.bookingRepository.checkAvailability(
      dto.artistId,
      dto.date,
      dto.timeSlot,
    );

    if (!isAvailable) {
      throw new UnavailableSlotException();
    }

    // 2. Crear entidad de dominio (Domain layer)
    const booking = Booking.create({
      userId,
      artistId: dto.artistId,
      serviceId: dto.serviceId,
      date: dto.date,
      timeSlot: dto.timeSlot,
      addOns: dto.addOns || [],
    });

    // 3. Calcular precio (Domain logic - value object)
    const totalPrice = booking.calculateTotalPrice();

    // 4. Generar código único (Domain logic)
    booking.generateCode();

    // 5. Crear payment intent (Infrastructure)
    const paymentIntent = await this.paymentService.createIntent({
      amount: totalPrice.toNumber(),
      currency: 'usd',
      customerId: userId,
      metadata: {
        bookingId: booking.id,
      },
    });

    booking.setPaymentIntentId(paymentIntent.id);

    // 6. Persistir (Infrastructure - repository)
    const savedBooking = await this.bookingRepository.save(booking);

    // 7. Publicar evento de dominio (Event-driven)
    const event = new BookingCreatedEvent(savedBooking);
    this.eventEmitter.emit('booking.created', event);

    // 8. Notificar (async - infrastructure)
    await this.notificationService.send({
      to: userId,
      type: 'booking_created',
      data: { bookingId: savedBooking.id },
    });

    return savedBooking;
  }
}
````

---

### **Ventajas Clean Architecture en Piums:**

```
✅ 1. Testabilidad
   └─ Usar cases independientes
   └─ Mocks de interfaces (no implementaciones)
   └─ Tests unitarios rápidos

✅ 2. Mantenibilidad
   └─ Business logic aislada (domain/)
   └─ Cambios en infra no afectan dominio
   └─ Código expresivo y legible

✅ 3. Escalabilidad
   └─ Agregar nuevos use cases fácilmente
   └─ Cambiar BD sin tocar business logic
   └─ Swap de servicios externos sin impacto

✅ 4. Desacoplamiento
   └─ Domain no conoce infrastructure
   └─ Application no conoce DB details
   └─ Presentation no conoce business rules

✅ 5. Reusabilidad
   └─ Domain entities reutilizables
   └─ Value objects compartidos
   └─ Use cases componibles

= Clean Architecture al 100% ✅
```

---

## 📦 **PARTE 2: INFRA - ¿DE QUÉ SE ENCARGA?**

### **Estructura [`infra/`](infra/ ):**

````
infra/
├── docker/                       # DOCKER ORCHESTRATION
│   ├── docker-compose.dev.yml    # Development
│   ├── docker-compose.prod.yml   # Production
│   ├── docker-compose.staging.yml # Staging
│   └── .env.example              # Template
│
├── kubernetes/                   # KUBERNETES (Optional)
│   ├── deployments/
│   │   ├── web-client.yaml
│   │   ├── web-artist.yaml
│   │   ├── gateway.yaml
│   │   └── services/
│   │       ├── auth.yaml
│   │       ├── users.yaml
│   │       └── ...
│   ├── services/
│   ├── ingress/
│   └── configmaps/
│
├── nginx/                        # REVERSE PROXY
│   ├── nginx.conf                # Main config
│   ├── conf.d/
│   │   ├── client-app.conf       # piums.com
│   │   ├── artist-app.conf       # artist.piums.com
│   │   └── api.conf              # api.piums.com
│   └── ssl/                      # SSL certificates
│       ├── cert.pem
│       └── key.pem
│
├── terraform/                    # INFRASTRUCTURE AS CODE (IaC)
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── modules/
│   │   ├── vpc/
│   │   ├── rds/
│   │   ├── elasticache/
│   │   └── ecs/
│   └── environments/
│       ├── dev/
│       ├── staging/
│       └── prod/
│
├── monitoring/                   # OBSERVABILITY
│   ├── prometheus/
│   │   └── prometheus.yml
│   ├── grafana/
│   │   └── dashboards/
│   └── alerts/
│
├── scripts/                      # AUTOMATION SCRIPTS
│   ├── setup-dev.sh              # Setup local development
│   ├── deploy.sh                 # Deploy script
│   ├── backup-db.sh              # Database backup
│   ├── restore-db.sh             # Database restore
│   └── health-check.sh           # Health monitoring
│
└── ci/                          # CI/CD CONFIGS
    ├── github-actions/
    │   └── templates/
    └── gitlab-ci/
        └── .gitlab-ci.yml
````

---

### **Responsabilidades de `infra/`:**

---

#### **1. Docker Orchestration** 🐳

````yaml
# infra/docker/docker-compose.prod.yml

version: '3.8'

services:
  # ======================
  # FRONTEND APPS
  # ======================
  web-client:
    image: ghcr.io/piums/piums-web-client:${VERSION:-latest}
    container_name: piums-web-client
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.piums.com
      - NEXT_PUBLIC_ARTIST_APP_URL=https://artist.piums.com
    networks:
      - piums-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web-artist:
    image: ghcr.io/piums/piums-web-artist:${VERSION:-latest}
    container_name: piums-web-artist
    restart: always
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.piums.com
      - NEXT_PUBLIC_CLIENT_APP_URL=https://piums.com
    networks:
      - piums-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M

  # ======================
  # API GATEWAY
  # ======================
  gateway:
    image: ghcr.io/piums/piums-gateway:${VERSION:-latest}
    container_name: piums-gateway
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - CLIENT_APP_URL=https://piums.com
      - ARTIST_APP_URL=https://artist.piums.com
    networks:
      - piums-network
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 1G

  # ======================
  # MICROSERVICES
  # ======================
  auth-service:
    image: ghcr.io/piums/piums-auth-service:${VERSION:-latest}
    restart: always
    environment:
      - DATABASE_URL=${AUTH_DB_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - FACEBOOK_APP_ID=${FACEBOOK_APP_ID}
    networks:
      - piums-network
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 2

  # ... (otros 9 microservices similares)

  # ======================
  # DATABASES
  # ======================
  postgres:
    image: postgres:15-alpine
    container_name: piums-postgres
    restart: always
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=piums
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    networks:
      - piums-network
    ports:
      - "5432:5432"
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  redis:
    image: redis:7-alpine
    container_name: piums-redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - piums-network
    ports:
      - "6379:6379"
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

  # ======================
  # NGINX (Reverse Proxy)
  # ======================
  nginx:
    image: nginx:alpine
    container_name: piums-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ../nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ../nginx/conf.d:/etc/nginx/conf.d:ro
      - ../nginx/ssl:/etc/nginx/ssl:ro
      - nginx-cache:/var/cache/nginx
    networks:
      - piums-network
    depends_on:
      - web-client
      - web-artist
      - gateway

  # ======================
  # MONITORING
  # ======================
  prometheus:
    image: prom/prometheus:latest
    container_name: piums-prometheus
    restart: always
    volumes:
      - ../monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - piums-network
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    container_name: piums-grafana
    restart: always
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - ../monitoring/grafana/dashboards:/var/lib/grafana/dashboards
      - grafana-data:/var/lib/grafana
    networks:
      - piums-network
    ports:
      - "3003:3000"

networks:
  piums-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
  nginx-cache:
  prometheus-data:
  grafana-data:
````

**Responsabilidad:** 
- ✅ Orquestación de 13+ contenedores
- ✅ Networking entre servicios
- ✅ Persistencia de datos
- ✅ Resource limits
- ✅ Health checks
- ✅ Auto-restart policies

---

#### **2. Nginx Configuration** 🔀

````nginx
# infra/nginx/nginx.conf

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_
```


## License: unknown
https://github.com/m-ezaki/chef-repo/blob/40a4f83440a5ac8a8f67913b0f5d190061aecaed/site-cookbooks/nginx/templates/default/nginx.conf.erb

```
# 🏗️ **ARQUITECTURA COMPLETA + CLEAN ARCHITECTURE + INFRA + DEPLOYMENT**

---

## 📋 **RESUMEN EJECUTIVO**

```
╔═══════════════════════════════════════════════════════╗
║  PIUMS PLATFORM - ARQUITECTURA COMPLETA               ║
║                                                        ║
║  Patrón:           Clean Architecture ✅              ║
║  Infra:            Docker + Nginx + CI/CD ✅          ║
║  Deploy:           GitHub Actions (automatizado) ✅   ║
║  Estado:           Production-Ready 🚀                ║
╚═══════════════════════════════════════════════════════╝
```

---

## 🎯 **PARTE 1: CLEAN ARCHITECTURE**

### **¿Se sigue usando Clean Architecture?** ✅ **SÍ, AL 100%**

---

### **Estructura por Microservicio (Ejemplo: booking-service)**

````
services/booking-service/
├── src/
│   ├── application/              # CAPA DE APLICACIÓN
│   │   ├── dtos/                 # Data Transfer Objects
│   │   │   ├── create-booking.dto.ts
│   │   │   ├── update-booking.dto.ts
│   │   │   └── booking-response.dto.ts
│   │   │
│   │   ├── use-cases/            # Casos de Uso (Lógica de negocio)
│   │   │   ├── create-booking.usecase.ts
│   │   │   ├── reschedule-booking.usecase.ts
│   │   │   ├── cancel-booking.usecase.ts
│   │   │   ├── verify-code.usecase.ts
│   │   │   └── calculate-price.usecase.ts
│   │   │
│   │   └── interfaces/           # Contratos de infra
│   │       ├── booking.repository.interface.ts
│   │       ├── payment.service.interface.ts
│   │       └── notification.service.interface.ts
│   │
│   ├── domain/                   # CAPA DE DOMINIO (Core Business)
│   │   ├── entities/             # Entidades de negocio
│   │   │   ├── booking.entity.ts
│   │   │   ├── booking-code.entity.ts
│   │   │   └── booking-item.entity.ts
│   │   │
│   │   ├── value-objects/        # Objetos de valor
│   │   │   ├── price.vo.ts
│   │   │   ├── date-range.vo.ts
│   │   │   └── booking-status.vo.ts
│   │   │
│   │   ├── aggregates/           # Agregados
│   │   │   └── booking.aggregate.ts
│   │   │
│   │   ├── events/               # Domain Events
│   │   │   ├── booking-created.event.ts
│   │   │   ├── booking-confirmed.event.ts
│   │   │   └── booking-cancelled.event.ts
│   │   │
│   │   └── exceptions/           # Excepciones de dominio
│   │       ├── booking-not-found.exception.ts
│   │       ├── invalid-booking-status.exception.ts
│   │       └── unavailable-slot.exception.ts
│   │
│   ├── infrastructure/           # CAPA DE INFRAESTRUCTURA
│   │   ├── database/             # Persistencia
│   │   │   ├── prisma/
│   │   │   │   ├── schema.prisma
│   │   │   │   └── migrations/
│   │   │   │
│   │   │   └── repositories/    # Implementaciones de repos
│   │   │       ├── booking.repository.ts
│   │   │       └── booking-code.repository.ts
│   │   │
│   │   ├── http/                 # Clientes HTTP
│   │   │   ├── payment.client.ts
│   │   │   ├── artist.client.ts
│   │   │   └── notification.client.ts
│   │   │
│   │   ├── cache/                # Redis
│   │   │   └── booking-cache.service.ts
│   │   │
│   │   └── messaging/            # Event Bus (RabbitMQ/Redis Pub/Sub)
│   │       ├── event-publisher.ts
│   │       └── event-subscriber.ts
│   │
│   ├── presentation/             # CAPA DE PRESENTACIÓN (API Layer)
│   │   ├── controllers/          # REST Controllers
│   │   │   ├── booking.controller.ts
│   │   │   └── booking-admin.controller.ts
│   │   │
│   │   ├── guards/               # Auth guards
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   │
│   │   ├── interceptors/         # Response transformation
│   │   │   └── transform.interceptor.ts
│   │   │
│   │   └── filters/              # Exception handling
│   │       └── http-exception.filter.ts
│   │
│   ├── shared/                   # SHARED (Cross-cutting)
│   │   ├── config/               # Configuración
│   │   │   └── booking.config.ts
│   │   │
│   │   ├── decorators/           # Custom decorators
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   │
│   │   ├── utils/                # Utilidades
│   │   │   ├── date.utils.ts
│   │   │   └── code-generator.utils.ts
│   │   │
│   │   └── constants/            # Constantes
│   │       └── booking-status.constants.ts
│   │
│   ├── booking.module.ts         # Módulo raíz
│   └── main.ts                   # Bootstrap
│
├── test/                         # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── prisma/
│   └── schema.prisma
│
├── Dockerfile
├── package.json
└── tsconfig.json
````

---

### **Flujo de Datos (Clean Architecture)**

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT REQUEST                          │
│               (POST /api/bookings)                           │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (API Gateway)                            │
│  ├─ booking.controller.ts                                    │
│  ├─ Validación DTO (class-validator)                        │
│  ├─ Guards (JWT auth, RBAC)                                 │
│  └─ Interceptors (logging, transform)                       │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  APPLICATION LAYER (Use Cases)                               │
│  ├─ create-booking.usecase.ts                               │
│  │  ├─ 1. Validar disponibilidad                            │
│  │  ├─ 2. Crear entidad Booking                             │
│  │  ├─ 3. Calcular precio total                             │
│  │  ├─ 4. Generar código 6 dígitos                          │
│  │  ├─ 5. Llamar payment service                            │
│  │  ├─ 6. Guardar en BD (via repository)                    │
│  │  └─ 7. Publicar evento BookingCreated                    │
│  └─ Orchestration + Business logic                          │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  DOMAIN LAYER (Core Business)                                │
│  ├─ booking.entity.ts                                        │
│  │  ├─ Business rules                                        │
│  │  ├─ Validaciones de negocio                              │
│  │  ├─ State machine (status transitions)                   │
│  │  └─ Domain events dispatch                               │
│  ├─ value-objects/                                           │
│  │  ├─ Price (validación, operaciones)                      │
│  │  └─ DateRange (validación, overlaps)                     │
│  └─ Pure business logic (NO dependencies)                   │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE LAYER (Detalles técnicos)                    │
│  ├─ database/repositories/                                   │
│  │  └─ booking.repository.ts                                │
│  │     └─ Prisma implementation                             │
│  ├─ http/                                                    │
│  │  ├─ payment.client.ts (Stripe)                           │
│  │  ├─ artist.client.ts                                     │
│  │  └─ notification.client.ts                               │
│  ├─ cache/                                                   │
│  │  └─ Redis client                                         │
│  └─ messaging/                                               │
│     └─ Event bus (RabbitMQ)                                 │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL SERVICES                                           │
│  ├─ PostgreSQL (Booking data)                               │
│  ├─ Redis (Cache + Pub/Sub)                                 │
│  ├─ Stripe API (Payments)                                   │
│  └─ Notification Service (SendGrid)                         │
└─────────────────────────────────────────────────────────────┘
```

---

### **Principios Clean Architecture Aplicados:**

````typescript
// ✅ EJEMPLO REAL: create-booking.usecase.ts

import { Injectable } from '@nestjs/common';
import { CreateBookingDto } from '../dtos/create-booking.dto';
import { Booking } from '../../domain/entities/booking.entity';
import { IBookingRepository } from '../interfaces/booking.repository.interface';
import { IPaymentService } from '../interfaces/payment.service.interface';
import { INotificationService } from '../interfaces/notification.service.interface';
import { BookingCreatedEvent } from '../../domain/events/booking-created.event';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CreateBookingUseCase {
  constructor(
    // ⭐ DEPENDENCY INVERSION: Depende de INTERFACES, no implementaciones
    private readonly bookingRepository: IBookingRepository,
    private readonly paymentService: IPaymentService,
    private readonly notificationService: INotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: CreateBookingDto, userId: string): Promise<Booking> {
    // 1. Validar disponibilidad (Domain logic)
    const isAvailable = await this.bookingRepository.checkAvailability(
      dto.artistId,
      dto.date,
      dto.timeSlot,
    );

    if (!isAvailable) {
      throw new UnavailableSlotException();
    }

    // 2. Crear entidad de dominio (Domain layer)
    const booking = Booking.create({
      userId,
      artistId: dto.artistId,
      serviceId: dto.serviceId,
      date: dto.date,
      timeSlot: dto.timeSlot,
      addOns: dto.addOns || [],
    });

    // 3. Calcular precio (Domain logic - value object)
    const totalPrice = booking.calculateTotalPrice();

    // 4. Generar código único (Domain logic)
    booking.generateCode();

    // 5. Crear payment intent (Infrastructure)
    const paymentIntent = await this.paymentService.createIntent({
      amount: totalPrice.toNumber(),
      currency: 'usd',
      customerId: userId,
      metadata: {
        bookingId: booking.id,
      },
    });

    booking.setPaymentIntentId(paymentIntent.id);

    // 6. Persistir (Infrastructure - repository)
    const savedBooking = await this.bookingRepository.save(booking);

    // 7. Publicar evento de dominio (Event-driven)
    const event = new BookingCreatedEvent(savedBooking);
    this.eventEmitter.emit('booking.created', event);

    // 8. Notificar (async - infrastructure)
    await this.notificationService.send({
      to: userId,
      type: 'booking_created',
      data: { bookingId: savedBooking.id },
    });

    return savedBooking;
  }
}
````

---

### **Ventajas Clean Architecture en Piums:**

```
✅ 1. Testabilidad
   └─ Usar cases independientes
   └─ Mocks de interfaces (no implementaciones)
   └─ Tests unitarios rápidos

✅ 2. Mantenibilidad
   └─ Business logic aislada (domain/)
   └─ Cambios en infra no afectan dominio
   └─ Código expresivo y legible

✅ 3. Escalabilidad
   └─ Agregar nuevos use cases fácilmente
   └─ Cambiar BD sin tocar business logic
   └─ Swap de servicios externos sin impacto

✅ 4. Desacoplamiento
   └─ Domain no conoce infrastructure
   └─ Application no conoce DB details
   └─ Presentation no conoce business rules

✅ 5. Reusabilidad
   └─ Domain entities reutilizables
   └─ Value objects compartidos
   └─ Use cases componibles

= Clean Architecture al 100% ✅
```

---

## 📦 **PARTE 2: INFRA - ¿DE QUÉ SE ENCARGA?**

### **Estructura [`infra/`](infra/ ):**

````
infra/
├── docker/                       # DOCKER ORCHESTRATION
│   ├── docker-compose.dev.yml    # Development
│   ├── docker-compose.prod.yml   # Production
│   ├── docker-compose.staging.yml # Staging
│   └── .env.example              # Template
│
├── kubernetes/                   # KUBERNETES (Optional)
│   ├── deployments/
│   │   ├── web-client.yaml
│   │   ├── web-artist.yaml
│   │   ├── gateway.yaml
│   │   └── services/
│   │       ├── auth.yaml
│   │       ├── users.yaml
│   │       └── ...
│   ├── services/
│   ├── ingress/
│   └── configmaps/
│
├── nginx/                        # REVERSE PROXY
│   ├── nginx.conf                # Main config
│   ├── conf.d/
│   │   ├── client-app.conf       # piums.com
│   │   ├── artist-app.conf       # artist.piums.com
│   │   └── api.conf              # api.piums.com
│   └── ssl/                      # SSL certificates
│       ├── cert.pem
│       └── key.pem
│
├── terraform/                    # INFRASTRUCTURE AS CODE (IaC)
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── modules/
│   │   ├── vpc/
│   │   ├── rds/
│   │   ├── elasticache/
│   │   └── ecs/
│   └── environments/
│       ├── dev/
│       ├── staging/
│       └── prod/
│
├── monitoring/                   # OBSERVABILITY
│   ├── prometheus/
│   │   └── prometheus.yml
│   ├── grafana/
│   │   └── dashboards/
│   └── alerts/
│
├── scripts/                      # AUTOMATION SCRIPTS
│   ├── setup-dev.sh              # Setup local development
│   ├── deploy.sh                 # Deploy script
│   ├── backup-db.sh              # Database backup
│   ├── restore-db.sh             # Database restore
│   └── health-check.sh           # Health monitoring
│
└── ci/                          # CI/CD CONFIGS
    ├── github-actions/
    │   └── templates/
    └── gitlab-ci/
        └── .gitlab-ci.yml
````

---

### **Responsabilidades de `infra/`:**

---

#### **1. Docker Orchestration** 🐳

````yaml
# infra/docker/docker-compose.prod.yml

version: '3.8'

services:
  # ======================
  # FRONTEND APPS
  # ======================
  web-client:
    image: ghcr.io/piums/piums-web-client:${VERSION:-latest}
    container_name: piums-web-client
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.piums.com
      - NEXT_PUBLIC_ARTIST_APP_URL=https://artist.piums.com
    networks:
      - piums-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web-artist:
    image: ghcr.io/piums/piums-web-artist:${VERSION:-latest}
    container_name: piums-web-artist
    restart: always
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.piums.com
      - NEXT_PUBLIC_CLIENT_APP_URL=https://piums.com
    networks:
      - piums-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M

  # ======================
  # API GATEWAY
  # ======================
  gateway:
    image: ghcr.io/piums/piums-gateway:${VERSION:-latest}
    container_name: piums-gateway
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - CLIENT_APP_URL=https://piums.com
      - ARTIST_APP_URL=https://artist.piums.com
    networks:
      - piums-network
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 1G

  # ======================
  # MICROSERVICES
  # ======================
  auth-service:
    image: ghcr.io/piums/piums-auth-service:${VERSION:-latest}
    restart: always
    environment:
      - DATABASE_URL=${AUTH_DB_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - FACEBOOK_APP_ID=${FACEBOOK_APP_ID}
    networks:
      - piums-network
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 2

  # ... (otros 9 microservices similares)

  # ======================
  # DATABASES
  # ======================
  postgres:
    image: postgres:15-alpine
    container_name: piums-postgres
    restart: always
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=piums
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    networks:
      - piums-network
    ports:
      - "5432:5432"
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  redis:
    image: redis:7-alpine
    container_name: piums-redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - piums-network
    ports:
      - "6379:6379"
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

  # ======================
  # NGINX (Reverse Proxy)
  # ======================
  nginx:
    image: nginx:alpine
    container_name: piums-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ../nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ../nginx/conf.d:/etc/nginx/conf.d:ro
      - ../nginx/ssl:/etc/nginx/ssl:ro
      - nginx-cache:/var/cache/nginx
    networks:
      - piums-network
    depends_on:
      - web-client
      - web-artist
      - gateway

  # ======================
  # MONITORING
  # ======================
  prometheus:
    image: prom/prometheus:latest
    container_name: piums-prometheus
    restart: always
    volumes:
      - ../monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - piums-network
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    container_name: piums-grafana
    restart: always
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - ../monitoring/grafana/dashboards:/var/lib/grafana/dashboards
      - grafana-data:/var/lib/grafana
    networks:
      - piums-network
    ports:
      - "3003:3000"

networks:
  piums-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
  nginx-cache:
  prometheus-data:
  grafana-data:
````

**Responsabilidad:** 
- ✅ Orquestación de 13+ contenedores
- ✅ Networking entre servicios
- ✅ Persistencia de datos
- ✅ Resource limits
- ✅ Health checks
- ✅ Auto-restart policies

---

#### **2. Nginx Configuration** 🔀

````nginx
# infra/nginx/nginx.conf

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_
```


## License: unknown
https://github.com/thisissoon/SaltLondonMeetup/blob/c2bcdd6735a7b4b016c55b991be91a82be985110/states/nginx.conf

```
# 🏗️ **ARQUITECTURA COMPLETA + CLEAN ARCHITECTURE + INFRA + DEPLOYMENT**

---

## 📋 **RESUMEN EJECUTIVO**

```
╔═══════════════════════════════════════════════════════╗
║  PIUMS PLATFORM - ARQUITECTURA COMPLETA               ║
║                                                        ║
║  Patrón:           Clean Architecture ✅              ║
║  Infra:            Docker + Nginx + CI/CD ✅          ║
║  Deploy:           GitHub Actions (automatizado) ✅   ║
║  Estado:           Production-Ready 🚀                ║
╚═══════════════════════════════════════════════════════╝
```

---

## 🎯 **PARTE 1: CLEAN ARCHITECTURE**

### **¿Se sigue usando Clean Architecture?** ✅ **SÍ, AL 100%**

---

### **Estructura por Microservicio (Ejemplo: booking-service)**

````
services/booking-service/
├── src/
│   ├── application/              # CAPA DE APLICACIÓN
│   │   ├── dtos/                 # Data Transfer Objects
│   │   │   ├── create-booking.dto.ts
│   │   │   ├── update-booking.dto.ts
│   │   │   └── booking-response.dto.ts
│   │   │
│   │   ├── use-cases/            # Casos de Uso (Lógica de negocio)
│   │   │   ├── create-booking.usecase.ts
│   │   │   ├── reschedule-booking.usecase.ts
│   │   │   ├── cancel-booking.usecase.ts
│   │   │   ├── verify-code.usecase.ts
│   │   │   └── calculate-price.usecase.ts
│   │   │
│   │   └── interfaces/           # Contratos de infra
│   │       ├── booking.repository.interface.ts
│   │       ├── payment.service.interface.ts
│   │       └── notification.service.interface.ts
│   │
│   ├── domain/                   # CAPA DE DOMINIO (Core Business)
│   │   ├── entities/             # Entidades de negocio
│   │   │   ├── booking.entity.ts
│   │   │   ├── booking-code.entity.ts
│   │   │   └── booking-item.entity.ts
│   │   │
│   │   ├── value-objects/        # Objetos de valor
│   │   │   ├── price.vo.ts
│   │   │   ├── date-range.vo.ts
│   │   │   └── booking-status.vo.ts
│   │   │
│   │   ├── aggregates/           # Agregados
│   │   │   └── booking.aggregate.ts
│   │   │
│   │   ├── events/               # Domain Events
│   │   │   ├── booking-created.event.ts
│   │   │   ├── booking-confirmed.event.ts
│   │   │   └── booking-cancelled.event.ts
│   │   │
│   │   └── exceptions/           # Excepciones de dominio
│   │       ├── booking-not-found.exception.ts
│   │       ├── invalid-booking-status.exception.ts
│   │       └── unavailable-slot.exception.ts
│   │
│   ├── infrastructure/           # CAPA DE INFRAESTRUCTURA
│   │   ├── database/             # Persistencia
│   │   │   ├── prisma/
│   │   │   │   ├── schema.prisma
│   │   │   │   └── migrations/
│   │   │   │
│   │   │   └── repositories/    # Implementaciones de repos
│   │   │       ├── booking.repository.ts
│   │   │       └── booking-code.repository.ts
│   │   │
│   │   ├── http/                 # Clientes HTTP
│   │   │   ├── payment.client.ts
│   │   │   ├── artist.client.ts
│   │   │   └── notification.client.ts
│   │   │
│   │   ├── cache/                # Redis
│   │   │   └── booking-cache.service.ts
│   │   │
│   │   └── messaging/            # Event Bus (RabbitMQ/Redis Pub/Sub)
│   │       ├── event-publisher.ts
│   │       └── event-subscriber.ts
│   │
│   ├── presentation/             # CAPA DE PRESENTACIÓN (API Layer)
│   │   ├── controllers/          # REST Controllers
│   │   │   ├── booking.controller.ts
│   │   │   └── booking-admin.controller.ts
│   │   │
│   │   ├── guards/               # Auth guards
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   │
│   │   ├── interceptors/         # Response transformation
│   │   │   └── transform.interceptor.ts
│   │   │
│   │   └── filters/              # Exception handling
│   │       └── http-exception.filter.ts
│   │
│   ├── shared/                   # SHARED (Cross-cutting)
│   │   ├── config/               # Configuración
│   │   │   └── booking.config.ts
│   │   │
│   │   ├── decorators/           # Custom decorators
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   │
│   │   ├── utils/                # Utilidades
│   │   │   ├── date.utils.ts
│   │   │   └── code-generator.utils.ts
│   │   │
│   │   └── constants/            # Constantes
│   │       └── booking-status.constants.ts
│   │
│   ├── booking.module.ts         # Módulo raíz
│   └── main.ts                   # Bootstrap
│
├── test/                         # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── prisma/
│   └── schema.prisma
│
├── Dockerfile
├── package.json
└── tsconfig.json
````

---

### **Flujo de Datos (Clean Architecture)**

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT REQUEST                          │
│               (POST /api/bookings)                           │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (API Gateway)                            │
│  ├─ booking.controller.ts                                    │
│  ├─ Validación DTO (class-validator)                        │
│  ├─ Guards (JWT auth, RBAC)                                 │
│  └─ Interceptors (logging, transform)                       │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  APPLICATION LAYER (Use Cases)                               │
│  ├─ create-booking.usecase.ts                               │
│  │  ├─ 1. Validar disponibilidad                            │
│  │  ├─ 2. Crear entidad Booking                             │
│  │  ├─ 3. Calcular precio total                             │
│  │  ├─ 4. Generar código 6 dígitos                          │
│  │  ├─ 5. Llamar payment service                            │
│  │  ├─ 6. Guardar en BD (via repository)                    │
│  │  └─ 7. Publicar evento BookingCreated                    │
│  └─ Orchestration + Business logic                          │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  DOMAIN LAYER (Core Business)                                │
│  ├─ booking.entity.ts                                        │
│  │  ├─ Business rules                                        │
│  │  ├─ Validaciones de negocio                              │
│  │  ├─ State machine (status transitions)                   │
│  │  └─ Domain events dispatch                               │
│  ├─ value-objects/                                           │
│  │  ├─ Price (validación, operaciones)                      │
│  │  └─ DateRange (validación, overlaps)                     │
│  └─ Pure business logic (NO dependencies)                   │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE LAYER (Detalles técnicos)                    │
│  ├─ database/repositories/                                   │
│  │  └─ booking.repository.ts                                │
│  │     └─ Prisma implementation                             │
│  ├─ http/                                                    │
│  │  ├─ payment.client.ts (Stripe)                           │
│  │  ├─ artist.client.ts                                     │
│  │  └─ notification.client.ts                               │
│  ├─ cache/                                                   │
│  │  └─ Redis client                                         │
│  └─ messaging/                                               │
│     └─ Event bus (RabbitMQ)                                 │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL SERVICES                                           │
│  ├─ PostgreSQL (Booking data)                               │
│  ├─ Redis (Cache + Pub/Sub)                                 │
│  ├─ Stripe API (Payments)                                   │
│  └─ Notification Service (SendGrid)                         │
└─────────────────────────────────────────────────────────────┘
```

---

### **Principios Clean Architecture Aplicados:**

````typescript
// ✅ EJEMPLO REAL: create-booking.usecase.ts

import { Injectable } from '@nestjs/common';
import { CreateBookingDto } from '../dtos/create-booking.dto';
import { Booking } from '../../domain/entities/booking.entity';
import { IBookingRepository } from '../interfaces/booking.repository.interface';
import { IPaymentService } from '../interfaces/payment.service.interface';
import { INotificationService } from '../interfaces/notification.service.interface';
import { BookingCreatedEvent } from '../../domain/events/booking-created.event';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CreateBookingUseCase {
  constructor(
    // ⭐ DEPENDENCY INVERSION: Depende de INTERFACES, no implementaciones
    private readonly bookingRepository: IBookingRepository,
    private readonly paymentService: IPaymentService,
    private readonly notificationService: INotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: CreateBookingDto, userId: string): Promise<Booking> {
    // 1. Validar disponibilidad (Domain logic)
    const isAvailable = await this.bookingRepository.checkAvailability(
      dto.artistId,
      dto.date,
      dto.timeSlot,
    );

    if (!isAvailable) {
      throw new UnavailableSlotException();
    }

    // 2. Crear entidad de dominio (Domain layer)
    const booking = Booking.create({
      userId,
      artistId: dto.artistId,
      serviceId: dto.serviceId,
      date: dto.date,
      timeSlot: dto.timeSlot,
      addOns: dto.addOns || [],
    });

    // 3. Calcular precio (Domain logic - value object)
    const totalPrice = booking.calculateTotalPrice();

    // 4. Generar código único (Domain logic)
    booking.generateCode();

    // 5. Crear payment intent (Infrastructure)
    const paymentIntent = await this.paymentService.createIntent({
      amount: totalPrice.toNumber(),
      currency: 'usd',
      customerId: userId,
      metadata: {
        bookingId: booking.id,
      },
    });

    booking.setPaymentIntentId(paymentIntent.id);

    // 6. Persistir (Infrastructure - repository)
    const savedBooking = await this.bookingRepository.save(booking);

    // 7. Publicar evento de dominio (Event-driven)
    const event = new BookingCreatedEvent(savedBooking);
    this.eventEmitter.emit('booking.created', event);

    // 8. Notificar (async - infrastructure)
    await this.notificationService.send({
      to: userId,
      type: 'booking_created',
      data: { bookingId: savedBooking.id },
    });

    return savedBooking;
  }
}
````

---

### **Ventajas Clean Architecture en Piums:**

```
✅ 1. Testabilidad
   └─ Usar cases independientes
   └─ Mocks de interfaces (no implementaciones)
   └─ Tests unitarios rápidos

✅ 2. Mantenibilidad
   └─ Business logic aislada (domain/)
   └─ Cambios en infra no afectan dominio
   └─ Código expresivo y legible

✅ 3. Escalabilidad
   └─ Agregar nuevos use cases fácilmente
   └─ Cambiar BD sin tocar business logic
   └─ Swap de servicios externos sin impacto

✅ 4. Desacoplamiento
   └─ Domain no conoce infrastructure
   └─ Application no conoce DB details
   └─ Presentation no conoce business rules

✅ 5. Reusabilidad
   └─ Domain entities reutilizables
   └─ Value objects compartidos
   └─ Use cases componibles

= Clean Architecture al 100% ✅
```

---

## 📦 **PARTE 2: INFRA - ¿DE QUÉ SE ENCARGA?**

### **Estructura [`infra/`](infra/ ):**

````
infra/
├── docker/                       # DOCKER ORCHESTRATION
│   ├── docker-compose.dev.yml    # Development
│   ├── docker-compose.prod.yml   # Production
│   ├── docker-compose.staging.yml # Staging
│   └── .env.example              # Template
│
├── kubernetes/                   # KUBERNETES (Optional)
│   ├── deployments/
│   │   ├── web-client.yaml
│   │   ├── web-artist.yaml
│   │   ├── gateway.yaml
│   │   └── services/
│   │       ├── auth.yaml
│   │       ├── users.yaml
│   │       └── ...
│   ├── services/
│   ├── ingress/
│   └── configmaps/
│
├── nginx/                        # REVERSE PROXY
│   ├── nginx.conf                # Main config
│   ├── conf.d/
│   │   ├── client-app.conf       # piums.com
│   │   ├── artist-app.conf       # artist.piums.com
│   │   └── api.conf              # api.piums.com
│   └── ssl/                      # SSL certificates
│       ├── cert.pem
│       └── key.pem
│
├── terraform/                    # INFRASTRUCTURE AS CODE (IaC)
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── modules/
│   │   ├── vpc/
│   │   ├── rds/
│   │   ├── elasticache/
│   │   └── ecs/
│   └── environments/
│       ├── dev/
│       ├── staging/
│       └── prod/
│
├── monitoring/                   # OBSERVABILITY
│   ├── prometheus/
│   │   └── prometheus.yml
│   ├── grafana/
│   │   └── dashboards/
│   └── alerts/
│
├── scripts/                      # AUTOMATION SCRIPTS
│   ├── setup-dev.sh              # Setup local development
│   ├── deploy.sh                 # Deploy script
│   ├── backup-db.sh              # Database backup
│   ├── restore-db.sh             # Database restore
│   └── health-check.sh           # Health monitoring
│
└── ci/                          # CI/CD CONFIGS
    ├── github-actions/
    │   └── templates/
    └── gitlab-ci/
        └── .gitlab-ci.yml
````

---

### **Responsabilidades de `infra/`:**

---

#### **1. Docker Orchestration** 🐳

````yaml
# infra/docker/docker-compose.prod.yml

version: '3.8'

services:
  # ======================
  # FRONTEND APPS
  # ======================
  web-client:
    image: ghcr.io/piums/piums-web-client:${VERSION:-latest}
    container_name: piums-web-client
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.piums.com
      - NEXT_PUBLIC_ARTIST_APP_URL=https://artist.piums.com
    networks:
      - piums-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web-artist:
    image: ghcr.io/piums/piums-web-artist:${VERSION:-latest}
    container_name: piums-web-artist
    restart: always
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.piums.com
      - NEXT_PUBLIC_CLIENT_APP_URL=https://piums.com
    networks:
      - piums-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M

  # ======================
  # API GATEWAY
  # ======================
  gateway:
    image: ghcr.io/piums/piums-gateway:${VERSION:-latest}
    container_name: piums-gateway
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - CLIENT_APP_URL=https://piums.com
      - ARTIST_APP_URL=https://artist.piums.com
    networks:
      - piums-network
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 1G

  # ======================
  # MICROSERVICES
  # ======================
  auth-service:
    image: ghcr.io/piums/piums-auth-service:${VERSION:-latest}
    restart: always
    environment:
      - DATABASE_URL=${AUTH_DB_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - FACEBOOK_APP_ID=${FACEBOOK_APP_ID}
    networks:
      - piums-network
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 2

  # ... (otros 9 microservices similares)

  # ======================
  # DATABASES
  # ======================
  postgres:
    image: postgres:15-alpine
    container_name: piums-postgres
    restart: always
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=piums
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    networks:
      - piums-network
    ports:
      - "5432:5432"
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  redis:
    image: redis:7-alpine
    container_name: piums-redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - piums-network
    ports:
      - "6379:6379"
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

  # ======================
  # NGINX (Reverse Proxy)
  # ======================
  nginx:
    image: nginx:alpine
    container_name: piums-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ../nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ../nginx/conf.d:/etc/nginx/conf.d:ro
      - ../nginx/ssl:/etc/nginx/ssl:ro
      - nginx-cache:/var/cache/nginx
    networks:
      - piums-network
    depends_on:
      - web-client
      - web-artist
      - gateway

  # ======================
  # MONITORING
  # ======================
  prometheus:
    image: prom/prometheus:latest
    container_name: piums-prometheus
    restart: always
    volumes:
      - ../monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - piums-network
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    container_name: piums-grafana
    restart: always
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - ../monitoring/grafana/dashboards:/var/lib/grafana/dashboards
      - grafana-data:/var/lib/grafana
    networks:
      - piums-network
    ports:
      - "3003:3000"

networks:
  piums-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
  nginx-cache:
  prometheus-data:
  grafana-data:
````

**Responsabilidad:** 
- ✅ Orquestación de 13+ contenedores
- ✅ Networking entre servicios
- ✅ Persistencia de datos
- ✅ Resource limits
- ✅ Health checks
- ✅ Auto-restart policies

---

#### **2. Nginx Configuration** 🔀

````nginx
# infra/nginx/nginx.conf

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_
```


## License: Apache-2.0
https://github.com/Catherine22/Frontend-Development/blob/45f10023c0a5466a9f65a146acb856421f14da36/Vue/vue-pwa/nginx/nginx.conf

```
# 🏗️ **ARQUITECTURA COMPLETA + CLEAN ARCHITECTURE + INFRA + DEPLOYMENT**

---

## 📋 **RESUMEN EJECUTIVO**

```
╔═══════════════════════════════════════════════════════╗
║  PIUMS PLATFORM - ARQUITECTURA COMPLETA               ║
║                                                        ║
║  Patrón:           Clean Architecture ✅              ║
║  Infra:            Docker + Nginx + CI/CD ✅          ║
║  Deploy:           GitHub Actions (automatizado) ✅   ║
║  Estado:           Production-Ready 🚀                ║
╚═══════════════════════════════════════════════════════╝
```

---

## 🎯 **PARTE 1: CLEAN ARCHITECTURE**

### **¿Se sigue usando Clean Architecture?** ✅ **SÍ, AL 100%**

---

### **Estructura por Microservicio (Ejemplo: booking-service)**

````
services/booking-service/
├── src/
│   ├── application/              # CAPA DE APLICACIÓN
│   │   ├── dtos/                 # Data Transfer Objects
│   │   │   ├── create-booking.dto.ts
│   │   │   ├── update-booking.dto.ts
│   │   │   └── booking-response.dto.ts
│   │   │
│   │   ├── use-cases/            # Casos de Uso (Lógica de negocio)
│   │   │   ├── create-booking.usecase.ts
│   │   │   ├── reschedule-booking.usecase.ts
│   │   │   ├── cancel-booking.usecase.ts
│   │   │   ├── verify-code.usecase.ts
│   │   │   └── calculate-price.usecase.ts
│   │   │
│   │   └── interfaces/           # Contratos de infra
│   │       ├── booking.repository.interface.ts
│   │       ├── payment.service.interface.ts
│   │       └── notification.service.interface.ts
│   │
│   ├── domain/                   # CAPA DE DOMINIO (Core Business)
│   │   ├── entities/             # Entidades de negocio
│   │   │   ├── booking.entity.ts
│   │   │   ├── booking-code.entity.ts
│   │   │   └── booking-item.entity.ts
│   │   │
│   │   ├── value-objects/        # Objetos de valor
│   │   │   ├── price.vo.ts
│   │   │   ├── date-range.vo.ts
│   │   │   └── booking-status.vo.ts
│   │   │
│   │   ├── aggregates/           # Agregados
│   │   │   └── booking.aggregate.ts
│   │   │
│   │   ├── events/               # Domain Events
│   │   │   ├── booking-created.event.ts
│   │   │   ├── booking-confirmed.event.ts
│   │   │   └── booking-cancelled.event.ts
│   │   │
│   │   └── exceptions/           # Excepciones de dominio
│   │       ├── booking-not-found.exception.ts
│   │       ├── invalid-booking-status.exception.ts
│   │       └── unavailable-slot.exception.ts
│   │
│   ├── infrastructure/           # CAPA DE INFRAESTRUCTURA
│   │   ├── database/             # Persistencia
│   │   │   ├── prisma/
│   │   │   │   ├── schema.prisma
│   │   │   │   └── migrations/
│   │   │   │
│   │   │   └── repositories/    # Implementaciones de repos
│   │   │       ├── booking.repository.ts
│   │   │       └── booking-code.repository.ts
│   │   │
│   │   ├── http/                 # Clientes HTTP
│   │   │   ├── payment.client.ts
│   │   │   ├── artist.client.ts
│   │   │   └── notification.client.ts
│   │   │
│   │   ├── cache/                # Redis
│   │   │   └── booking-cache.service.ts
│   │   │
│   │   └── messaging/            # Event Bus (RabbitMQ/Redis Pub/Sub)
│   │       ├── event-publisher.ts
│   │       └── event-subscriber.ts
│   │
│   ├── presentation/             # CAPA DE PRESENTACIÓN (API Layer)
│   │   ├── controllers/          # REST Controllers
│   │   │   ├── booking.controller.ts
│   │   │   └── booking-admin.controller.ts
│   │   │
│   │   ├── guards/               # Auth guards
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   │
│   │   ├── interceptors/         # Response transformation
│   │   │   └── transform.interceptor.ts
│   │   │
│   │   └── filters/              # Exception handling
│   │       └── http-exception.filter.ts
│   │
│   ├── shared/                   # SHARED (Cross-cutting)
│   │   ├── config/               # Configuración
│   │   │   └── booking.config.ts
│   │   │
│   │   ├── decorators/           # Custom decorators
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   │
│   │   ├── utils/                # Utilidades
│   │   │   ├── date.utils.ts
│   │   │   └── code-generator.utils.ts
│   │   │
│   │   └── constants/            # Constantes
│   │       └── booking-status.constants.ts
│   │
│   ├── booking.module.ts         # Módulo raíz
│   └── main.ts                   # Bootstrap
│
├── test/                         # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── prisma/
│   └── schema.prisma
│
├── Dockerfile
├── package.json
└── tsconfig.json
````

---

### **Flujo de Datos (Clean Architecture)**

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT REQUEST                          │
│               (POST /api/bookings)                           │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (API Gateway)                            │
│  ├─ booking.controller.ts                                    │
│  ├─ Validación DTO (class-validator)                        │
│  ├─ Guards (JWT auth, RBAC)                                 │
│  └─ Interceptors (logging, transform)                       │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  APPLICATION LAYER (Use Cases)                               │
│  ├─ create-booking.usecase.ts                               │
│  │  ├─ 1. Validar disponibilidad                            │
│  │  ├─ 2. Crear entidad Booking                             │
│  │  ├─ 3. Calcular precio total                             │
│  │  ├─ 4. Generar código 6 dígitos                          │
│  │  ├─ 5. Llamar payment service                            │
│  │  ├─ 6. Guardar en BD (via repository)                    │
│  │  └─ 7. Publicar evento BookingCreated                    │
│  └─ Orchestration + Business logic                          │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  DOMAIN LAYER (Core Business)                                │
│  ├─ booking.entity.ts                                        │
│  │  ├─ Business rules                                        │
│  │  ├─ Validaciones de negocio                              │
│  │  ├─ State machine (status transitions)                   │
│  │  └─ Domain events dispatch                               │
│  ├─ value-objects/                                           │
│  │  ├─ Price (validación, operaciones)                      │
│  │  └─ DateRange (validación, overlaps)                     │
│  └─ Pure business logic (NO dependencies)                   │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE LAYER (Detalles técnicos)                    │
│  ├─ database/repositories/                                   │
│  │  └─ booking.repository.ts                                │
│  │     └─ Prisma implementation                             │
│  ├─ http/                                                    │
│  │  ├─ payment.client.ts (Stripe)                           │
│  │  ├─ artist.client.ts                                     │
│  │  └─ notification.client.ts                               │
│  ├─ cache/                                                   │
│  │  └─ Redis client                                         │
│  └─ messaging/                                               │
│     └─ Event bus (RabbitMQ)                                 │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL SERVICES                                           │
│  ├─ PostgreSQL (Booking data)                               │
│  ├─ Redis (Cache + Pub/Sub)                                 │
│  ├─ Stripe API (Payments)                                   │
│  └─ Notification Service (SendGrid)                         │
└─────────────────────────────────────────────────────────────┘
```

---

### **Principios Clean Architecture Aplicados:**

````typescript
// ✅ EJEMPLO REAL: create-booking.usecase.ts

import { Injectable } from '@nestjs/common';
import { CreateBookingDto } from '../dtos/create-booking.dto';
import { Booking } from '../../domain/entities/booking.entity';
import { IBookingRepository } from '../interfaces/booking.repository.interface';
import { IPaymentService } from '../interfaces/payment.service.interface';
import { INotificationService } from '../interfaces/notification.service.interface';
import { BookingCreatedEvent } from '../../domain/events/booking-created.event';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CreateBookingUseCase {
  constructor(
    // ⭐ DEPENDENCY INVERSION: Depende de INTERFACES, no implementaciones
    private readonly bookingRepository: IBookingRepository,
    private readonly paymentService: IPaymentService,
    private readonly notificationService: INotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: CreateBookingDto, userId: string): Promise<Booking> {
    // 1. Validar disponibilidad (Domain logic)
    const isAvailable = await this.bookingRepository.checkAvailability(
      dto.artistId,
      dto.date,
      dto.timeSlot,
    );

    if (!isAvailable) {
      throw new UnavailableSlotException();
    }

    // 2. Crear entidad de dominio (Domain layer)
    const booking = Booking.create({
      userId,
      artistId: dto.artistId,
      serviceId: dto.serviceId,
      date: dto.date,
      timeSlot: dto.timeSlot,
      addOns: dto.addOns || [],
    });

    // 3. Calcular precio (Domain logic - value object)
    const totalPrice = booking.calculateTotalPrice();

    // 4. Generar código único (Domain logic)
    booking.generateCode();

    // 5. Crear payment intent (Infrastructure)
    const paymentIntent = await this.paymentService.createIntent({
      amount: totalPrice.toNumber(),
      currency: 'usd',
      customerId: userId,
      metadata: {
        bookingId: booking.id,
      },
    });

    booking.setPaymentIntentId(paymentIntent.id);

    // 6. Persistir (Infrastructure - repository)
    const savedBooking = await this.bookingRepository.save(booking);

    // 7. Publicar evento de dominio (Event-driven)
    const event = new BookingCreatedEvent(savedBooking);
    this.eventEmitter.emit('booking.created', event);

    // 8. Notificar (async - infrastructure)
    await this.notificationService.send({
      to: userId,
      type: 'booking_created',
      data: { bookingId: savedBooking.id },
    });

    return savedBooking;
  }
}
````

---

### **Ventajas Clean Architecture en Piums:**

```
✅ 1. Testabilidad
   └─ Usar cases independientes
   └─ Mocks de interfaces (no implementaciones)
   └─ Tests unitarios rápidos

✅ 2. Mantenibilidad
   └─ Business logic aislada (domain/)
   └─ Cambios en infra no afectan dominio
   └─ Código expresivo y legible

✅ 3. Escalabilidad
   └─ Agregar nuevos use cases fácilmente
   └─ Cambiar BD sin tocar business logic
   └─ Swap de servicios externos sin impacto

✅ 4. Desacoplamiento
   └─ Domain no conoce infrastructure
   └─ Application no conoce DB details
   └─ Presentation no conoce business rules

✅ 5. Reusabilidad
   └─ Domain entities reutilizables
   └─ Value objects compartidos
   └─ Use cases componibles

= Clean Architecture al 100% ✅
```

---

## 📦 **PARTE 2: INFRA - ¿DE QUÉ SE ENCARGA?**

### **Estructura [`infra/`](infra/ ):**

````
infra/
├── docker/                       # DOCKER ORCHESTRATION
│   ├── docker-compose.dev.yml    # Development
│   ├── docker-compose.prod.yml   # Production
│   ├── docker-compose.staging.yml # Staging
│   └── .env.example              # Template
│
├── kubernetes/                   # KUBERNETES (Optional)
│   ├── deployments/
│   │   ├── web-client.yaml
│   │   ├── web-artist.yaml
│   │   ├── gateway.yaml
│   │   └── services/
│   │       ├── auth.yaml
│   │       ├── users.yaml
│   │       └── ...
│   ├── services/
│   ├── ingress/
│   └── configmaps/
│
├── nginx/                        # REVERSE PROXY
│   ├── nginx.conf                # Main config
│   ├── conf.d/
│   │   ├── client-app.conf       # piums.com
│   │   ├── artist-app.conf       # artist.piums.com
│   │   └── api.conf              # api.piums.com
│   └── ssl/                      # SSL certificates
│       ├── cert.pem
│       └── key.pem
│
├── terraform/                    # INFRASTRUCTURE AS CODE (IaC)
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── modules/
│   │   ├── vpc/
│   │   ├── rds/
│   │   ├── elasticache/
│   │   └── ecs/
│   └── environments/
│       ├── dev/
│       ├── staging/
│       └── prod/
│
├── monitoring/                   # OBSERVABILITY
│   ├── prometheus/
│   │   └── prometheus.yml
│   ├── grafana/
│   │   └── dashboards/
│   └── alerts/
│
├── scripts/                      # AUTOMATION SCRIPTS
│   ├── setup-dev.sh              # Setup local development
│   ├── deploy.sh                 # Deploy script
│   ├── backup-db.sh              # Database backup
│   ├── restore-db.sh             # Database restore
│   └── health-check.sh           # Health monitoring
│
└── ci/                          # CI/CD CONFIGS
    ├── github-actions/
    │   └── templates/
    └── gitlab-ci/
        └── .gitlab-ci.yml
````

---

### **Responsabilidades de `infra/`:**

---

#### **1. Docker Orchestration** 🐳

````yaml
# infra/docker/docker-compose.prod.yml

version: '3.8'

services:
  # ======================
  # FRONTEND APPS
  # ======================
  web-client:
    image: ghcr.io/piums/piums-web-client:${VERSION:-latest}
    container_name: piums-web-client
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.piums.com
      - NEXT_PUBLIC_ARTIST_APP_URL=https://artist.piums.com
    networks:
      - piums-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web-artist:
    image: ghcr.io/piums/piums-web-artist:${VERSION:-latest}
    container_name: piums-web-artist
    restart: always
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.piums.com
      - NEXT_PUBLIC_CLIENT_APP_URL=https://piums.com
    networks:
      - piums-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M

  # ======================
  # API GATEWAY
  # ======================
  gateway:
    image: ghcr.io/piums/piums-gateway:${VERSION:-latest}
    container_name: piums-gateway
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - CLIENT_APP_URL=https://piums.com
      - ARTIST_APP_URL=https://artist.piums.com
    networks:
      - piums-network
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 1G

  # ======================
  # MICROSERVICES
  # ======================
  auth-service:
    image: ghcr.io/piums/piums-auth-service:${VERSION:-latest}
    restart: always
    environment:
      - DATABASE_URL=${AUTH_DB_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - FACEBOOK_APP_ID=${FACEBOOK_APP_ID}
    networks:
      - piums-network
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 2

  # ... (otros 9 microservices similares)

  # ======================
  # DATABASES
  # ======================
  postgres:
    image: postgres:15-alpine
    container_name: piums-postgres
    restart: always
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=piums
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    networks:
      - piums-network
    ports:
      - "5432:5432"
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  redis:
    image: redis:7-alpine
    container_name: piums-redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - piums-network
    ports:
      - "6379:6379"
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

  # ======================
  # NGINX (Reverse Proxy)
  # ======================
  nginx:
    image: nginx:alpine
    container_name: piums-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ../nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ../nginx/conf.d:/etc/nginx/conf.d:ro
      - ../nginx/ssl:/etc/nginx/ssl:ro
      - nginx-cache:/var/cache/nginx
    networks:
      - piums-network
    depends_on:
      - web-client
      - web-artist
      - gateway

  # ======================
  # MONITORING
  # ======================
  prometheus:
    image: prom/prometheus:latest
    container_name: piums-prometheus
    restart: always
    volumes:
      - ../monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - piums-network
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    container_name: piums-grafana
    restart: always
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - ../monitoring/grafana/dashboards:/var/lib/grafana/dashboards
      - grafana-data:/var/lib/grafana
    networks:
      - piums-network
    ports:
      - "3003:3000"

networks:
  piums-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
  nginx-cache:
  prometheus-data:
  grafana-data:
````

**Responsabilidad:** 
- ✅ Orquestación de 13+ contenedores
- ✅ Networking entre servicios
- ✅ Persistencia de datos
- ✅ Resource limits
- ✅ Health checks
- ✅ Auto-restart policies

---

#### **2. Nginx Configuration** 🔀

````nginx
# infra/nginx/nginx.conf

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_
```


## License: unknown
https://github.com/nelreina/react-firebase-app/blob/f86bd8ff8ef6183281a3792b39e4d16ea0d8225a/default.conf

```
# 🏗️ **ARQUITECTURA COMPLETA + CLEAN ARCHITECTURE + INFRA + DEPLOYMENT**

---

## 📋 **RESUMEN EJECUTIVO**

```
╔═══════════════════════════════════════════════════════╗
║  PIUMS PLATFORM - ARQUITECTURA COMPLETA               ║
║                                                        ║
║  Patrón:           Clean Architecture ✅              ║
║  Infra:            Docker + Nginx + CI/CD ✅          ║
║  Deploy:           GitHub Actions (automatizado) ✅   ║
║  Estado:           Production-Ready 🚀                ║
╚═══════════════════════════════════════════════════════╝
```

---

## 🎯 **PARTE 1: CLEAN ARCHITECTURE**

### **¿Se sigue usando Clean Architecture?** ✅ **SÍ, AL 100%**

---

### **Estructura por Microservicio (Ejemplo: booking-service)**

````
services/booking-service/
├── src/
│   ├── application/              # CAPA DE APLICACIÓN
│   │   ├── dtos/                 # Data Transfer Objects
│   │   │   ├── create-booking.dto.ts
│   │   │   ├── update-booking.dto.ts
│   │   │   └── booking-response.dto.ts
│   │   │
│   │   ├── use-cases/            # Casos de Uso (Lógica de negocio)
│   │   │   ├── create-booking.usecase.ts
│   │   │   ├── reschedule-booking.usecase.ts
│   │   │   ├── cancel-booking.usecase.ts
│   │   │   ├── verify-code.usecase.ts
│   │   │   └── calculate-price.usecase.ts
│   │   │
│   │   └── interfaces/           # Contratos de infra
│   │       ├── booking.repository.interface.ts
│   │       ├── payment.service.interface.ts
│   │       └── notification.service.interface.ts
│   │
│   ├── domain/                   # CAPA DE DOMINIO (Core Business)
│   │   ├── entities/             # Entidades de negocio
│   │   │   ├── booking.entity.ts
│   │   │   ├── booking-code.entity.ts
│   │   │   └── booking-item.entity.ts
│   │   │
│   │   ├── value-objects/        # Objetos de valor
│   │   │   ├── price.vo.ts
│   │   │   ├── date-range.vo.ts
│   │   │   └── booking-status.vo.ts
│   │   │
│   │   ├── aggregates/           # Agregados
│   │   │   └── booking.aggregate.ts
│   │   │
│   │   ├── events/               # Domain Events
│   │   │   ├── booking-created.event.ts
│   │   │   ├── booking-confirmed.event.ts
│   │   │   └── booking-cancelled.event.ts
│   │   │
│   │   └── exceptions/           # Excepciones de dominio
│   │       ├── booking-not-found.exception.ts
│   │       ├── invalid-booking-status.exception.ts
│   │       └── unavailable-slot.exception.ts
│   │
│   ├── infrastructure/           # CAPA DE INFRAESTRUCTURA
│   │   ├── database/             # Persistencia
│   │   │   ├── prisma/
│   │   │   │   ├── schema.prisma
│   │   │   │   └── migrations/
│   │   │   │
│   │   │   └── repositories/    # Implementaciones de repos
│   │   │       ├── booking.repository.ts
│   │   │       └── booking-code.repository.ts
│   │   │
│   │   ├── http/                 # Clientes HTTP
│   │   │   ├── payment.client.ts
│   │   │   ├── artist.client.ts
│   │   │   └── notification.client.ts
│   │   │
│   │   ├── cache/                # Redis
│   │   │   └── booking-cache.service.ts
│   │   │
│   │   └── messaging/            # Event Bus (RabbitMQ/Redis Pub/Sub)
│   │       ├── event-publisher.ts
│   │       └── event-subscriber.ts
│   │
│   ├── presentation/             # CAPA DE PRESENTACIÓN (API Layer)
│   │   ├── controllers/          # REST Controllers
│   │   │   ├── booking.controller.ts
│   │   │   └── booking-admin.controller.ts
│   │   │
│   │   ├── guards/               # Auth guards
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   │
│   │   ├── interceptors/         # Response transformation
│   │   │   └── transform.interceptor.ts
│   │   │
│   │   └── filters/              # Exception handling
│   │       └── http-exception.filter.ts
│   │
│   ├── shared/                   # SHARED (Cross-cutting)
│   │   ├── config/               # Configuración
│   │   │   └── booking.config.ts
│   │   │
│   │   ├── decorators/           # Custom decorators
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   │
│   │   ├── utils/                # Utilidades
│   │   │   ├── date.utils.ts
│   │   │   └── code-generator.utils.ts
│   │   │
│   │   └── constants/            # Constantes
│   │       └── booking-status.constants.ts
│   │
│   ├── booking.module.ts         # Módulo raíz
│   └── main.ts                   # Bootstrap
│
├── test/                         # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── prisma/
│   └── schema.prisma
│
├── Dockerfile
├── package.json
└── tsconfig.json
````

---

### **Flujo de Datos (Clean Architecture)**

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT REQUEST                          │
│               (POST /api/bookings)                           │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (API Gateway)                            │
│  ├─ booking.controller.ts                                    │
│  ├─ Validación DTO (class-validator)                        │
│  ├─ Guards (JWT auth, RBAC)                                 │
│  └─ Interceptors (logging, transform)                       │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  APPLICATION LAYER (Use Cases)                               │
│  ├─ create-booking.usecase.ts                               │
│  │  ├─ 1. Validar disponibilidad                            │
│  │  ├─ 2. Crear entidad Booking                             │
│  │  ├─ 3. Calcular precio total                             │
│  │  ├─ 4. Generar código 6 dígitos                          │
│  │  ├─ 5. Llamar payment service                            │
│  │  ├─ 6. Guardar en BD (via repository)                    │
│  │  └─ 7. Publicar evento BookingCreated                    │
│  └─ Orchestration + Business logic                          │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  DOMAIN LAYER (Core Business)                                │
│  ├─ booking.entity.ts                                        │
│  │  ├─ Business rules                                        │
│  │  ├─ Validaciones de negocio                              │
│  │  ├─ State machine (status transitions)                   │
│  │  └─ Domain events dispatch                               │
│  ├─ value-objects/                                           │
│  │  ├─ Price (validación, operaciones)                      │
│  │  └─ DateRange (validación, overlaps)                     │
│  └─ Pure business logic (NO dependencies)                   │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE LAYER (Detalles técnicos)                    │
│  ├─ database/repositories/                                   │
│  │  └─ booking.repository.ts                                │
│  │     └─ Prisma implementation                             │
│  ├─ http/                                                    │
│  │  ├─ payment.client.ts (Stripe)                           │
│  │  ├─ artist.client.ts                                     │
│  │  └─ notification.client.ts                               │
│  ├─ cache/                                                   │
│  │  └─ Redis client                                         │
│  └─ messaging/                                               │
│     └─ Event bus (RabbitMQ)                                 │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL SERVICES                                           │
│  ├─ PostgreSQL (Booking data)                               │
│  ├─ Redis (Cache + Pub/Sub)                                 │
│  ├─ Stripe API (Payments)                                   │
│  └─ Notification Service (SendGrid)                         │
└─────────────────────────────────────────────────────────────┘
```

---

### **Principios Clean Architecture Aplicados:**

````typescript
// ✅ EJEMPLO REAL: create-booking.usecase.ts

import { Injectable } from '@nestjs/common';
import { CreateBookingDto } from '../dtos/create-booking.dto';
import { Booking } from '../../domain/entities/booking.entity';
import { IBookingRepository } from '../interfaces/booking.repository.interface';
import { IPaymentService } from '../interfaces/payment.service.interface';
import { INotificationService } from '../interfaces/notification.service.interface';
import { BookingCreatedEvent } from '../../domain/events/booking-created.event';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CreateBookingUseCase {
  constructor(
    // ⭐ DEPENDENCY INVERSION: Depende de INTERFACES, no implementaciones
    private readonly bookingRepository: IBookingRepository,
    private readonly paymentService: IPaymentService,
    private readonly notificationService: INotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: CreateBookingDto, userId: string): Promise<Booking> {
    // 1. Validar disponibilidad (Domain logic)
    const isAvailable = await this.bookingRepository.checkAvailability(
      dto.artistId,
      dto.date,
      dto.timeSlot,
    );

    if (!isAvailable) {
      throw new UnavailableSlotException();
    }

    // 2. Crear entidad de dominio (Domain layer)
    const booking = Booking.create({
      userId,
      artistId: dto.artistId,
      serviceId: dto.serviceId,
      date: dto.date,
      timeSlot: dto.timeSlot,
      addOns: dto.addOns || [],
    });

    // 3. Calcular precio (Domain logic - value object)
    const totalPrice = booking.calculateTotalPrice();

    // 4. Generar código único (Domain logic)
    booking.generateCode();

    // 5. Crear payment intent (Infrastructure)
    const paymentIntent = await this.paymentService.createIntent({
      amount: totalPrice.toNumber(),
      currency: 'usd',
      customerId: userId,
      metadata: {
        bookingId: booking.id,
      },
    });

    booking.setPaymentIntentId(paymentIntent.id);

    // 6. Persistir (Infrastructure - repository)
    const savedBooking = await this.bookingRepository.save(booking);

    // 7. Publicar evento de dominio (Event-driven)
    const event = new BookingCreatedEvent(savedBooking);
    this.eventEmitter.emit('booking.created', event);

    // 8. Notificar (async - infrastructure)
    await this.notificationService.send({
      to: userId,
      type: 'booking_created',
      data: { bookingId: savedBooking.id },
    });

    return savedBooking;
  }
}
````

---

### **Ventajas Clean Architecture en Piums:**

```
✅ 1. Testabilidad
   └─ Usar cases independientes
   └─ Mocks de interfaces (no implementaciones)
   └─ Tests unitarios rápidos

✅ 2. Mantenibilidad
   └─ Business logic aislada (domain/)
   └─ Cambios en infra no afectan dominio
   └─ Código expresivo y legible

✅ 3. Escalabilidad
   └─ Agregar nuevos use cases fácilmente
   └─ Cambiar BD sin tocar business logic
   └─ Swap de servicios externos sin impacto

✅ 4. Desacoplamiento
   └─ Domain no conoce infrastructure
   └─ Application no conoce DB details
   └─ Presentation no conoce business rules

✅ 5. Reusabilidad
   └─ Domain entities reutilizables
   └─ Value objects compartidos
   └─ Use cases componibles

= Clean Architecture al 100% ✅
```

---

## 📦 **PARTE 2: INFRA - ¿DE QUÉ SE ENCARGA?**

### **Estructura [`infra/`](infra/ ):**

````
infra/
├── docker/                       # DOCKER ORCHESTRATION
│   ├── docker-compose.dev.yml    # Development
│   ├── docker-compose.prod.yml   # Production
│   ├── docker-compose.staging.yml # Staging
│   └── .env.example              # Template
│
├── kubernetes/                   # KUBERNETES (Optional)
│   ├── deployments/
│   │   ├── web-client.yaml
│   │   ├── web-artist.yaml
│   │   ├── gateway.yaml
│   │   └── services/
│   │       ├── auth.yaml
│   │       ├── users.yaml
│   │       └── ...
│   ├── services/
│   ├── ingress/
│   └── configmaps/
│
├── nginx/                        # REVERSE PROXY
│   ├── nginx.conf                # Main config
│   ├── conf.d/
│   │   ├── client-app.conf       # piums.com
│   │   ├── artist-app.conf       # artist.piums.com
│   │   └── api.conf              # api.piums.com
│   └── ssl/                      # SSL certificates
│       ├── cert.pem
│       └── key.pem
│
├── terraform/                    # INFRASTRUCTURE AS CODE (IaC)
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── modules/
│   │   ├── vpc/
│   │   ├── rds/
│   │   ├── elasticache/
│   │   └── ecs/
│   └── environments/
│       ├── dev/
│       ├── staging/
│       └── prod/
│
├── monitoring/                   # OBSERVABILITY
│   ├── prometheus/
│   │   └── prometheus.yml
│   ├── grafana/
│   │   └── dashboards/
│   └── alerts/
│
├── scripts/                      # AUTOMATION SCRIPTS
│   ├── setup-dev.sh              # Setup local development
│   ├── deploy.sh                 # Deploy script
│   ├── backup-db.sh              # Database backup
│   ├── restore-db.sh             # Database restore
│   └── health-check.sh           # Health monitoring
│
└── ci/                          # CI/CD CONFIGS
    ├── github-actions/
    │   └── templates/
    └── gitlab-ci/
        └── .gitlab-ci.yml
````

---

### **Responsabilidades de `infra/`:**

---

#### **1. Docker Orchestration** 🐳

````yaml
# infra/docker/docker-compose.prod.yml

version: '3.8'

services:
  # ======================
  # FRONTEND APPS
  # ======================
  web-client:
    image: ghcr.io/piums/piums-web-client:${VERSION:-latest}
    container_name: piums-web-client
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.piums.com
      - NEXT_PUBLIC_ARTIST_APP_URL=https://artist.piums.com
    networks:
      - piums-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web-artist:
    image: ghcr.io/piums/piums-web-artist:${VERSION:-latest}
    container_name: piums-web-artist
    restart: always
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.piums.com
      - NEXT_PUBLIC_CLIENT_APP_URL=https://piums.com
    networks:
      - piums-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M

  # ======================
  # API GATEWAY
  # ======================
  gateway:
    image: ghcr.io/piums/piums-gateway:${VERSION:-latest}
    container_name: piums-gateway
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - CLIENT_APP_URL=https://piums.com
      - ARTIST_APP_URL=https://artist.piums.com
    networks:
      - piums-network
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 1G

  # ======================
  # MICROSERVICES
  # ======================
  auth-service:
    image: ghcr.io/piums/piums-auth-service:${VERSION:-latest}
    restart: always
    environment:
      - DATABASE_URL=${AUTH_DB_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - FACEBOOK_APP_ID=${FACEBOOK_APP_ID}
    networks:
      - piums-network
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 2

  # ... (otros 9 microservices similares)

  # ======================
  # DATABASES
  # ======================
  postgres:
    image: postgres:15-alpine
    container_name: piums-postgres
    restart: always
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=piums
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    networks:
      - piums-network
    ports:
      - "5432:5432"
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  redis:
    image: redis:7-alpine
    container_name: piums-redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - piums-network
    ports:
      - "6379:6379"
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

  # ======================
  # NGINX (Reverse Proxy)
  # ======================
  nginx:
    image: nginx:alpine
    container_name: piums-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ../nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ../nginx/conf.d:/etc/nginx/conf.d:ro
      - ../nginx/ssl:/etc/nginx/ssl:ro
      - nginx-cache:/var/cache/nginx
    networks:
      - piums-network
    depends_on:
      - web-client
      - web-artist
      - gateway

  # ======================
  # MONITORING
  # ======================
  prometheus:
    image: prom/prometheus:latest
    container_name: piums-prometheus
    restart: always
    volumes:
      - ../monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - piums-network
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    container_name: piums-grafana
    restart: always
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - ../monitoring/grafana/dashboards:/var/lib/grafana/dashboards
      - grafana-data:/var/lib/grafana
    networks:
      - piums-network
    ports:
      - "3003:3000"

networks:
  piums-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
  nginx-cache:
  prometheus-data:
  grafana-data:
````

**Responsabilidad:** 
- ✅ Orquestación de 13+ contenedores
- ✅ Networking entre servicios
- ✅ Persistencia de datos
- ✅ Resource limits
- ✅ Health checks
- ✅ Auto-restart policies

---

#### **2. Nginx Configuration** 🔀

````nginx
# infra/nginx/nginx.conf

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;

    # Upstream definitions
    upstream web_client {
        least_conn;
        server web-client:3000 weight=1 max_fails=3 fail_timeout=30s;
        server web-client:3000 weight=1 max_fails=3 fail_timeout=30s;
    }

    upstream web_artist {
        least_conn;
        server web-artist:3001 weight=1 max_fails=3 fail_timeout=30s;
        server web-artist:3001 weight=1 max_fails=3 fail_timeout=30s;
    }

    upstream api_gateway {
        least_conn;
        server gateway:3000 weight=1 max_fails=3 fail_timeout=30s;
        server gateway:3000 weight=1 max_fails=3 fail_timeout=30s;
        server gateway:3000 weight=1 max_fails=3 fail_timeout=30s;
    }

    # Include virtual hosts
    include /etc/nginx/conf.d/*.conf;
}
````

````nginx
# infra/nginx/conf.d/client-app.conf

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name piums.com www.piums.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS - Client App
server {
    listen 443 ssl http2;
    server_name piums.com www.piums.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate Limiting
    limit_req zone=general burst=20 nodelay;

    # Proxy to Next.js
    location / {
        proxy_pass http://web_client;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://web_client;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        access_log off;
        return 200 "OK";
    }
}
````

````nginx
# infra/nginx/conf.d/artist-app.conf

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name artist.piums.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS - Artist App
server {
    listen 443 ssl http2;
    server_name artist.piums.com;

    # SSL Configuration (same as client)
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate Limiting
    limit_req zone=general burst=20 nodelay;

    # Proxy to Next.js Artist App
    location / {
        proxy_pass http://web_artist;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static assets
    location ~* \.(js|
```


## License: unknown
https://github.com/nelreina/react-firebase-app/blob/f86bd8ff8ef6183281a3792b39e4d16ea0d8225a/default.conf

```
# 🏗️ **ARQUITECTURA COMPLETA + CLEAN ARCHITECTURE + INFRA + DEPLOYMENT**

---

## 📋 **RESUMEN EJECUTIVO**

```
╔═══════════════════════════════════════════════════════╗
║  PIUMS PLATFORM - ARQUITECTURA COMPLETA               ║
║                                                        ║
║  Patrón:           Clean Architecture ✅              ║
║  Infra:            Docker + Nginx + CI/CD ✅          ║
║  Deploy:           GitHub Actions (automatizado) ✅   ║
║  Estado:           Production-Ready 🚀                ║
╚═══════════════════════════════════════════════════════╝
```

---

## 🎯 **PARTE 1: CLEAN ARCHITECTURE**

### **¿Se sigue usando Clean Architecture?** ✅ **SÍ, AL 100%**

---

### **Estructura por Microservicio (Ejemplo: booking-service)**

````
services/booking-service/
├── src/
│   ├── application/              # CAPA DE APLICACIÓN
│   │   ├── dtos/                 # Data Transfer Objects
│   │   │   ├── create-booking.dto.ts
│   │   │   ├── update-booking.dto.ts
│   │   │   └── booking-response.dto.ts
│   │   │
│   │   ├── use-cases/            # Casos de Uso (Lógica de negocio)
│   │   │   ├── create-booking.usecase.ts
│   │   │   ├── reschedule-booking.usecase.ts
│   │   │   ├── cancel-booking.usecase.ts
│   │   │   ├── verify-code.usecase.ts
│   │   │   └── calculate-price.usecase.ts
│   │   │
│   │   └── interfaces/           # Contratos de infra
│   │       ├── booking.repository.interface.ts
│   │       ├── payment.service.interface.ts
│   │       └── notification.service.interface.ts
│   │
│   ├── domain/                   # CAPA DE DOMINIO (Core Business)
│   │   ├── entities/             # Entidades de negocio
│   │   │   ├── booking.entity.ts
│   │   │   ├── booking-code.entity.ts
│   │   │   └── booking-item.entity.ts
│   │   │
│   │   ├── value-objects/        # Objetos de valor
│   │   │   ├── price.vo.ts
│   │   │   ├── date-range.vo.ts
│   │   │   └── booking-status.vo.ts
│   │   │
│   │   ├── aggregates/           # Agregados
│   │   │   └── booking.aggregate.ts
│   │   │
│   │   ├── events/               # Domain Events
│   │   │   ├── booking-created.event.ts
│   │   │   ├── booking-confirmed.event.ts
│   │   │   └── booking-cancelled.event.ts
│   │   │
│   │   └── exceptions/           # Excepciones de dominio
│   │       ├── booking-not-found.exception.ts
│   │       ├── invalid-booking-status.exception.ts
│   │       └── unavailable-slot.exception.ts
│   │
│   ├── infrastructure/           # CAPA DE INFRAESTRUCTURA
│   │   ├── database/             # Persistencia
│   │   │   ├── prisma/
│   │   │   │   ├── schema.prisma
│   │   │   │   └── migrations/
│   │   │   │
│   │   │   └── repositories/    # Implementaciones de repos
│   │   │       ├── booking.repository.ts
│   │   │       └── booking-code.repository.ts
│   │   │
│   │   ├── http/                 # Clientes HTTP
│   │   │   ├── payment.client.ts
│   │   │   ├── artist.client.ts
│   │   │   └── notification.client.ts
│   │   │
│   │   ├── cache/                # Redis
│   │   │   └── booking-cache.service.ts
│   │   │
│   │   └── messaging/            # Event Bus (RabbitMQ/Redis Pub/Sub)
│   │       ├── event-publisher.ts
│   │       └── event-subscriber.ts
│   │
│   ├── presentation/             # CAPA DE PRESENTACIÓN (API Layer)
│   │   ├── controllers/          # REST Controllers
│   │   │   ├── booking.controller.ts
│   │   │   └── booking-admin.controller.ts
│   │   │
│   │   ├── guards/               # Auth guards
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   │
│   │   ├── interceptors/         # Response transformation
│   │   │   └── transform.interceptor.ts
│   │   │
│   │   └── filters/              # Exception handling
│   │       └── http-exception.filter.ts
│   │
│   ├── shared/                   # SHARED (Cross-cutting)
│   │   ├── config/               # Configuración
│   │   │   └── booking.config.ts
│   │   │
│   │   ├── decorators/           # Custom decorators
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   │
│   │   ├── utils/                # Utilidades
│   │   │   ├── date.utils.ts
│   │   │   └── code-generator.utils.ts
│   │   │
│   │   └── constants/            # Constantes
│   │       └── booking-status.constants.ts
│   │
│   ├── booking.module.ts         # Módulo raíz
│   └── main.ts                   # Bootstrap
│
├── test/                         # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── prisma/
│   └── schema.prisma
│
├── Dockerfile
├── package.json
└── tsconfig.json
````

---

### **Flujo de Datos (Clean Architecture)**

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT REQUEST                          │
│               (POST /api/bookings)                           │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (API Gateway)                            │
│  ├─ booking.controller.ts                                    │
│  ├─ Validación DTO (class-validator)                        │
│  ├─ Guards (JWT auth, RBAC)                                 │
│  └─ Interceptors (logging, transform)                       │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  APPLICATION LAYER (Use Cases)                               │
│  ├─ create-booking.usecase.ts                               │
│  │  ├─ 1. Validar disponibilidad                            │
│  │  ├─ 2. Crear entidad Booking                             │
│  │  ├─ 3. Calcular precio total                             │
│  │  ├─ 4. Generar código 6 dígitos                          │
│  │  ├─ 5. Llamar payment service                            │
│  │  ├─ 6. Guardar en BD (via repository)                    │
│  │  └─ 7. Publicar evento BookingCreated                    │
│  └─ Orchestration + Business logic                          │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  DOMAIN LAYER (Core Business)                                │
│  ├─ booking.entity.ts                                        │
│  │  ├─ Business rules                                        │
│  │  ├─ Validaciones de negocio                              │
│  │  ├─ State machine (status transitions)                   │
│  │  └─ Domain events dispatch                               │
│  ├─ value-objects/                                           │
│  │  ├─ Price (validación, operaciones)                      │
│  │  └─ DateRange (validación, overlaps)                     │
│  └─ Pure business logic (NO dependencies)                   │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE LAYER (Detalles técnicos)                    │
│  ├─ database/repositories/                                   │
│  │  └─ booking.repository.ts                                │
│  │     └─ Prisma implementation                             │
│  ├─ http/                                                    │
│  │  ├─ payment.client.ts (Stripe)                           │
│  │  ├─ artist.client.ts                                     │
│  │  └─ notification.client.ts                               │
│  ├─ cache/                                                   │
│  │  └─ Redis client                                         │
│  └─ messaging/                                               │
│     └─ Event bus (RabbitMQ)                                 │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL SERVICES                                           │
│  ├─ PostgreSQL (Booking data)                               │
│  ├─ Redis (Cache + Pub/Sub)                                 │
│  ├─ Stripe API (Payments)                                   │
│  └─ Notification Service (SendGrid)                         │
└─────────────────────────────────────────────────────────────┘
```

---

### **Principios Clean Architecture Aplicados:**

````typescript
// ✅ EJEMPLO REAL: create-booking.usecase.ts

import { Injectable } from '@nestjs/common';
import { CreateBookingDto } from '../dtos/create-booking.dto';
import { Booking } from '../../domain/entities/booking.entity';
import { IBookingRepository } from '../interfaces/booking.repository.interface';
import { IPaymentService } from '../interfaces/payment.service.interface';
import { INotificationService } from '../interfaces/notification.service.interface';
import { BookingCreatedEvent } from '../../domain/events/booking-created.event';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CreateBookingUseCase {
  constructor(
    // ⭐ DEPENDENCY INVERSION: Depende de INTERFACES, no implementaciones
    private readonly bookingRepository: IBookingRepository,
    private readonly paymentService: IPaymentService,
    private readonly notificationService: INotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: CreateBookingDto, userId: string): Promise<Booking> {
    // 1. Validar disponibilidad (Domain logic)
    const isAvailable = await this.bookingRepository.checkAvailability(
      dto.artistId,
      dto.date,
      dto.timeSlot,
    );

    if (!isAvailable) {
      throw new UnavailableSlotException();
    }

    // 2. Crear entidad de dominio (Domain layer)
    const booking = Booking.create({
      userId,
      artistId: dto.artistId,
      serviceId: dto.serviceId,
      date: dto.date,
      timeSlot: dto.timeSlot,
      addOns: dto.addOns || [],
    });

    // 3. Calcular precio (Domain logic - value object)
    const totalPrice = booking.calculateTotalPrice();

    // 4. Generar código único (Domain logic)
    booking.generateCode();

    // 5. Crear payment intent (Infrastructure)
    const paymentIntent = await this.paymentService.createIntent({
      amount: totalPrice.toNumber(),
      currency: 'usd',
      customerId: userId,
      metadata: {
        bookingId: booking.id,
      },
    });

    booking.setPaymentIntentId(paymentIntent.id);

    // 6. Persistir (Infrastructure - repository)
    const savedBooking = await this.bookingRepository.save(booking);

    // 7. Publicar evento de dominio (Event-driven)
    const event = new BookingCreatedEvent(savedBooking);
    this.eventEmitter.emit('booking.created', event);

    // 8. Notificar (async - infrastructure)
    await this.notificationService.send({
      to: userId,
      type: 'booking_created',
      data: { bookingId: savedBooking.id },
    });

    return savedBooking;
  }
}
````

---

### **Ventajas Clean Architecture en Piums:**

```
✅ 1. Testabilidad
   └─ Usar cases independientes
   └─ Mocks de interfaces (no implementaciones)
   └─ Tests unitarios rápidos

✅ 2. Mantenibilidad
   └─ Business logic aislada (domain/)
   └─ Cambios en infra no afectan dominio
   └─ Código expresivo y legible

✅ 3. Escalabilidad
   └─ Agregar nuevos use cases fácilmente
   └─ Cambiar BD sin tocar business logic
   └─ Swap de servicios externos sin impacto

✅ 4. Desacoplamiento
   └─ Domain no conoce infrastructure
   └─ Application no conoce DB details
   └─ Presentation no conoce business rules

✅ 5. Reusabilidad
   └─ Domain entities reutilizables
   └─ Value objects compartidos
   └─ Use cases componibles

= Clean Architecture al 100% ✅
```

---

## 📦 **PARTE 2: INFRA - ¿DE QUÉ SE ENCARGA?**

### **Estructura [`infra/`](infra/ ):**

````
infra/
├── docker/                       # DOCKER ORCHESTRATION
│   ├── docker-compose.dev.yml    # Development
│   ├── docker-compose.prod.yml   # Production
│   ├── docker-compose.staging.yml # Staging
│   └── .env.example              # Template
│
├── kubernetes/                   # KUBERNETES (Optional)
│   ├── deployments/
│   │   ├── web-client.yaml
│   │   ├── web-artist.yaml
│   │   ├── gateway.yaml
│   │   └── services/
│   │       ├── auth.yaml
│   │       ├── users.yaml
│   │       └── ...
│   ├── services/
│   ├── ingress/
│   └── configmaps/
│
├── nginx/                        # REVERSE PROXY
│   ├── nginx.conf                # Main config
│   ├── conf.d/
│   │   ├── client-app.conf       # piums.com
│   │   ├── artist-app.conf       # artist.piums.com
│   │   └── api.conf              # api.piums.com
│   └── ssl/                      # SSL certificates
│       ├── cert.pem
│       └── key.pem
│
├── terraform/                    # INFRASTRUCTURE AS CODE (IaC)
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── modules/
│   │   ├── vpc/
│   │   ├── rds/
│   │   ├── elasticache/
│   │   └── ecs/
│   └── environments/
│       ├── dev/
│       ├── staging/
│       └── prod/
│
├── monitoring/                   # OBSERVABILITY
│   ├── prometheus/
│   │   └── prometheus.yml
│   ├── grafana/
│   │   └── dashboards/
│   └── alerts/
│
├── scripts/                      # AUTOMATION SCRIPTS
│   ├── setup-dev.sh              # Setup local development
│   ├── deploy.sh                 # Deploy script
│   ├── backup-db.sh              # Database backup
│   ├── restore-db.sh             # Database restore
│   └── health-check.sh           # Health monitoring
│
└── ci/                          # CI/CD CONFIGS
    ├── github-actions/
    │   └── templates/
    └── gitlab-ci/
        └── .gitlab-ci.yml
````

---

### **Responsabilidades de `infra/`:**

---

#### **1. Docker Orchestration** 🐳

````yaml
# infra/docker/docker-compose.prod.yml

version: '3.8'

services:
  # ======================
  # FRONTEND APPS
  # ======================
  web-client:
    image: ghcr.io/piums/piums-web-client:${VERSION:-latest}
    container_name: piums-web-client
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.piums.com
      - NEXT_PUBLIC_ARTIST_APP_URL=https://artist.piums.com
    networks:
      - piums-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web-artist:
    image: ghcr.io/piums/piums-web-artist:${VERSION:-latest}
    container_name: piums-web-artist
    restart: always
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.piums.com
      - NEXT_PUBLIC_CLIENT_APP_URL=https://piums.com
    networks:
      - piums-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M

  # ======================
  # API GATEWAY
  # ======================
  gateway:
    image: ghcr.io/piums/piums-gateway:${VERSION:-latest}
    container_name: piums-gateway
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - CLIENT_APP_URL=https://piums.com
      - ARTIST_APP_URL=https://artist.piums.com
    networks:
      - piums-network
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 1G

  # ======================
  # MICROSERVICES
  # ======================
  auth-service:
    image: ghcr.io/piums/piums-auth-service:${VERSION:-latest}
    restart: always
    environment:
      - DATABASE_URL=${AUTH_DB_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - FACEBOOK_APP_ID=${FACEBOOK_APP_ID}
    networks:
      - piums-network
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 2

  # ... (otros 9 microservices similares)

  # ======================
  # DATABASES
  # ======================
  postgres:
    image: postgres:15-alpine
    container_name: piums-postgres
    restart: always
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=piums
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    networks:
      - piums-network
    ports:
      - "5432:5432"
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  redis:
    image: redis:7-alpine
    container_name: piums-redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - piums-network
    ports:
      - "6379:6379"
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

  # ======================
  # NGINX (Reverse Proxy)
  # ======================
  nginx:
    image: nginx:alpine
    container_name: piums-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ../nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ../nginx/conf.d:/etc/nginx/conf.d:ro
      - ../nginx/ssl:/etc/nginx/ssl:ro
      - nginx-cache:/var/cache/nginx
    networks:
      - piums-network
    depends_on:
      - web-client
      - web-artist
      - gateway

  # ======================
  # MONITORING
  # ======================
  prometheus:
    image: prom/prometheus:latest
    container_name: piums-prometheus
    restart: always
    volumes:
      - ../monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - piums-network
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    container_name: piums-grafana
    restart: always
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - ../monitoring/grafana/dashboards:/var/lib/grafana/dashboards
      - grafana-data:/var/lib/grafana
    networks:
      - piums-network
    ports:
      - "3003:3000"

networks:
  piums-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
  nginx-cache:
  prometheus-data:
  grafana-data:
````

**Responsabilidad:** 
- ✅ Orquestación de 13+ contenedores
- ✅ Networking entre servicios
- ✅ Persistencia de datos
- ✅ Resource limits
- ✅ Health checks
- ✅ Auto-restart policies

---

#### **2. Nginx Configuration** 🔀

````nginx
# infra/nginx/nginx.conf

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;

    # Upstream definitions
    upstream web_client {
        least_conn;
        server web-client:3000 weight=1 max_fails=3 fail_timeout=30s;
        server web-client:3000 weight=1 max_fails=3 fail_timeout=30s;
    }

    upstream web_artist {
        least_conn;
        server web-artist:3001 weight=1 max_fails=3 fail_timeout=30s;
        server web-artist:3001 weight=1 max_fails=3 fail_timeout=30s;
    }

    upstream api_gateway {
        least_conn;
        server gateway:3000 weight=1 max_fails=3 fail_timeout=30s;
        server gateway:3000 weight=1 max_fails=3 fail_timeout=30s;
        server gateway:3000 weight=1 max_fails=3 fail_timeout=30s;
    }

    # Include virtual hosts
    include /etc/nginx/conf.d/*.conf;
}
````

````nginx
# infra/nginx/conf.d/client-app.conf

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name piums.com www.piums.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS - Client App
server {
    listen 443 ssl http2;
    server_name piums.com www.piums.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate Limiting
    limit_req zone=general burst=20 nodelay;

    # Proxy to Next.js
    location / {
        proxy_pass http://web_client;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://web_client;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        access_log off;
        return 200 "OK";
    }
}
````

````nginx
# infra/nginx/conf.d/artist-app.conf

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name artist.piums.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS - Artist App
server {
    listen 443 ssl http2;
    server_name artist.piums.com;

    # SSL Configuration (same as client)
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate Limiting
    limit_req zone=general burst=20 nodelay;

    # Proxy to Next.js Artist App
    location / {
        proxy_pass http://web_artist;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static assets
    location ~* \.(js|
```


## License: unknown
https://github.com/pavski0x/vulnapp/blob/b127ba1165da0f14e084f747b81d51c984ffe42d/terraform/10_vpc.tf

```
# 🏗️ **ARQUITECTURA COMPLETA + CLEAN ARCHITECTURE + INFRA + DEPLOYMENT**

---

## 📋 **RESUMEN EJECUTIVO**

```
╔═══════════════════════════════════════════════════════╗
║  PIUMS PLATFORM - ARQUITECTURA COMPLETA               ║
║                                                        ║
║  Patrón:           Clean Architecture ✅              ║
║  Infra:            Docker + Nginx + CI/CD ✅          ║
║  Deploy:           GitHub Actions (automatizado) ✅   ║
║  Estado:           Production-Ready 🚀                ║
╚═══════════════════════════════════════════════════════╝
```

---

## 🎯 **PARTE 1: CLEAN ARCHITECTURE**

### **¿Se sigue usando Clean Architecture?** ✅ **SÍ, AL 100%**

---

### **Estructura por Microservicio (Ejemplo: booking-service)**

````
services/booking-service/
├── src/
│   ├── application/              # CAPA DE APLICACIÓN
│   │   ├── dtos/                 # Data Transfer Objects
│   │   │   ├── create-booking.dto.ts
│   │   │   ├── update-booking.dto.ts
│   │   │   └── booking-response.dto.ts
│   │   │
│   │   ├── use-cases/            # Casos de Uso (Lógica de negocio)
│   │   │   ├── create-booking.usecase.ts
│   │   │   ├── reschedule-booking.usecase.ts
│   │   │   ├── cancel-booking.usecase.ts
│   │   │   ├── verify-code.usecase.ts
│   │   │   └── calculate-price.usecase.ts
│   │   │
│   │   └── interfaces/           # Contratos de infra
│   │       ├── booking.repository.interface.ts
│   │       ├── payment.service.interface.ts
│   │       └── notification.service.interface.ts
│   │
│   ├── domain/                   # CAPA DE DOMINIO (Core Business)
│   │   ├── entities/             # Entidades de negocio
│   │   │   ├── booking.entity.ts
│   │   │   ├── booking-code.entity.ts
│   │   │   └── booking-item.entity.ts
│   │   │
│   │   ├── value-objects/        # Objetos de valor
│   │   │   ├── price.vo.ts
│   │   │   ├── date-range.vo.ts
│   │   │   └── booking-status.vo.ts
│   │   │
│   │   ├── aggregates/           # Agregados
│   │   │   └── booking.aggregate.ts
│   │   │
│   │   ├── events/               # Domain Events
│   │   │   ├── booking-created.event.ts
│   │   │   ├── booking-confirmed.event.ts
│   │   │   └── booking-cancelled.event.ts
│   │   │
│   │   └── exceptions/           # Excepciones de dominio
│   │       ├── booking-not-found.exception.ts
│   │       ├── invalid-booking-status.exception.ts
│   │       └── unavailable-slot.exception.ts
│   │
│   ├── infrastructure/           # CAPA DE INFRAESTRUCTURA
│   │   ├── database/             # Persistencia
│   │   │   ├── prisma/
│   │   │   │   ├── schema.prisma
│   │   │   │   └── migrations/
│   │   │   │
│   │   │   └── repositories/    # Implementaciones de repos
│   │   │       ├── booking.repository.ts
│   │   │       └── booking-code.repository.ts
│   │   │
│   │   ├── http/                 # Clientes HTTP
│   │   │   ├── payment.client.ts
│   │   │   ├── artist.client.ts
│   │   │   └── notification.client.ts
│   │   │
│   │   ├── cache/                # Redis
│   │   │   └── booking-cache.service.ts
│   │   │
│   │   └── messaging/            # Event Bus (RabbitMQ/Redis Pub/Sub)
│   │       ├── event-publisher.ts
│   │       └── event-subscriber.ts
│   │
│   ├── presentation/             # CAPA DE PRESENTACIÓN (API Layer)
│   │   ├── controllers/          # REST Controllers
│   │   │   ├── booking.controller.ts
│   │   │   └── booking-admin.controller.ts
│   │   │
│   │   ├── guards/               # Auth guards
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   │
│   │   ├── interceptors/         # Response transformation
│   │   │   └── transform.interceptor.ts
│   │   │
│   │   └── filters/              # Exception handling
│   │       └── http-exception.filter.ts
│   │
│   ├── shared/                   # SHARED (Cross-cutting)
│   │   ├── config/               # Configuración
│   │   │   └── booking.config.ts
│   │   │
│   │   ├── decorators/           # Custom decorators
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   │
│   │   ├── utils/                # Utilidades
│   │   │   ├── date.utils.ts
│   │   │   └── code-generator.utils.ts
│   │   │
│   │   └── constants/            # Constantes
│   │       └── booking-status.constants.ts
│   │
│   ├── booking.module.ts         # Módulo raíz
│   └── main.ts                   # Bootstrap
│
├── test/                         # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── prisma/
│   └── schema.prisma
│
├── Dockerfile
├── package.json
└── tsconfig.json
````

---

### **Flujo de Datos (Clean Architecture)**

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT REQUEST                          │
│               (POST /api/bookings)                           │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (API Gateway)                            │
│  ├─ booking.controller.ts                                    │
│  ├─ Validación DTO (class-validator)                        │
│  ├─ Guards (JWT auth, RBAC)                                 │
│  └─ Interceptors (logging, transform)                       │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  APPLICATION LAYER (Use Cases)                               │
│  ├─ create-booking.usecase.ts                               │
│  │  ├─ 1. Validar disponibilidad                            │
│  │  ├─ 2. Crear entidad Booking                             │
│  │  ├─ 3. Calcular precio total                             │
│  │  ├─ 4. Generar código 6 dígitos                          │
│  │  ├─ 5. Llamar payment service                            │
│  │  ├─ 6. Guardar en BD (via repository)                    │
│  │  └─ 7. Publicar evento BookingCreated                    │
│  └─ Orchestration + Business logic                          │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  DOMAIN LAYER (Core Business)                                │
│  ├─ booking.entity.ts                                        │
│  │  ├─ Business rules                                        │
│  │  ├─ Validaciones de negocio                              │
│  │  ├─ State machine (status transitions)                   │
│  │  └─ Domain events dispatch                               │
│  ├─ value-objects/                                           │
│  │  ├─ Price (validación, operaciones)                      │
│  │  └─ DateRange (validación, overlaps)                     │
│  └─ Pure business logic (NO dependencies)                   │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE LAYER (Detalles técnicos)                    │
│  ├─ database/repositories/                                   │
│  │  └─ booking.repository.ts                                │
│  │     └─ Prisma implementation                             │
│  ├─ http/                                                    │
│  │  ├─ payment.client.ts (Stripe)                           │
│  │  ├─ artist.client.ts                                     │
│  │  └─ notification.client.ts                               │
│  ├─ cache/                                                   │
│  │  └─ Redis client                                         │
│  └─ messaging/                                               │
│     └─ Event bus (RabbitMQ)                                 │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL SERVICES                                           │
│  ├─ PostgreSQL (Booking data)                               │
│  ├─ Redis (Cache + Pub/Sub)                                 │
│  ├─ Stripe API (Payments)                                   │
│  └─ Notification Service (SendGrid)                         │
└─────────────────────────────────────────────────────────────┘
```

---

### **Principios Clean Architecture Aplicados:**

````typescript
// ✅ EJEMPLO REAL: create-booking.usecase.ts

import { Injectable } from '@nestjs/common';
import { CreateBookingDto } from '../dtos/create-booking.dto';
import { Booking } from '../../domain/entities/booking.entity';
import { IBookingRepository } from '../interfaces/booking.repository.interface';
import { IPaymentService } from '../interfaces/payment.service.interface';
import { INotificationService } from '../interfaces/notification.service.interface';
import { BookingCreatedEvent } from '../../domain/events/booking-created.event';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CreateBookingUseCase {
  constructor(
    // ⭐ DEPENDENCY INVERSION: Depende de INTERFACES, no implementaciones
    private readonly bookingRepository: IBookingRepository,
    private readonly paymentService: IPaymentService,
    private readonly notificationService: INotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: CreateBookingDto, userId: string): Promise<Booking> {
    // 1. Validar disponibilidad (Domain logic)
    const isAvailable = await this.bookingRepository.checkAvailability(
      dto.artistId,
      dto.date,
      dto.timeSlot,
    );

    if (!isAvailable) {
      throw new UnavailableSlotException();
    }

    // 2. Crear entidad de dominio (Domain layer)
    const booking = Booking.create({
      userId,
      artistId: dto.artistId,
      serviceId: dto.serviceId,
      date: dto.date,
      timeSlot: dto.timeSlot,
      addOns: dto.addOns || [],
    });

    // 3. Calcular precio (Domain logic - value object)
    const totalPrice = booking.calculateTotalPrice();

    // 4. Generar código único (Domain logic)
    booking.generateCode();

    // 5. Crear payment intent (Infrastructure)
    const paymentIntent = await this.paymentService.createIntent({
      amount: totalPrice.toNumber(),
      currency: 'usd',
      customerId: userId,
      metadata: {
        bookingId: booking.id,
      },
    });

    booking.setPaymentIntentId(paymentIntent.id);

    // 6. Persistir (Infrastructure - repository)
    const savedBooking = await this.bookingRepository.save(booking);

    // 7. Publicar evento de dominio (Event-driven)
    const event = new BookingCreatedEvent(savedBooking);
    this.eventEmitter.emit('booking.created', event);

    // 8. Notificar (async - infrastructure)
    await this.notificationService.send({
      to: userId,
      type: 'booking_created',
      data: { bookingId: savedBooking.id },
    });

    return savedBooking;
  }
}
````

---

### **Ventajas Clean Architecture en Piums:**

```
✅ 1. Testabilidad
   └─ Usar cases independientes
   └─ Mocks de interfaces (no implementaciones)
   └─ Tests unitarios rápidos

✅ 2. Mantenibilidad
   └─ Business logic aislada (domain/)
   └─ Cambios en infra no afectan dominio
   └─ Código expresivo y legible

✅ 3. Escalabilidad
   └─ Agregar nuevos use cases fácilmente
   └─ Cambiar BD sin tocar business logic
   └─ Swap de servicios externos sin impacto

✅ 4. Desacoplamiento
   └─ Domain no conoce infrastructure
   └─ Application no conoce DB details
   └─ Presentation no conoce business rules

✅ 5. Reusabilidad
   └─ Domain entities reutilizables
   └─ Value objects compartidos
   └─ Use cases componibles

= Clean Architecture al 100% ✅
```

---

## 📦 **PARTE 2: INFRA - ¿DE QUÉ SE ENCARGA?**

### **Estructura [`infra/`](infra/ ):**

````
infra/
├── docker/                       # DOCKER ORCHESTRATION
│   ├── docker-compose.dev.yml    # Development
│   ├── docker-compose.prod.yml   # Production
│   ├── docker-compose.staging.yml # Staging
│   └── .env.example              # Template
│
├── kubernetes/                   # KUBERNETES (Optional)
│   ├── deployments/
│   │   ├── web-client.yaml
│   │   ├── web-artist.yaml
│   │   ├── gateway.yaml
│   │   └── services/
│   │       ├── auth.yaml
│   │       ├── users.yaml
│   │       └── ...
│   ├── services/
│   ├── ingress/
│   └── configmaps/
│
├── nginx/                        # REVERSE PROXY
│   ├── nginx.conf                # Main config
│   ├── conf.d/
│   │   ├── client-app.conf       # piums.com
│   │   ├── artist-app.conf       # artist.piums.com
│   │   └── api.conf              # api.piums.com
│   └── ssl/                      # SSL certificates
│       ├── cert.pem
│       └── key.pem
│
├── terraform/                    # INFRASTRUCTURE AS CODE (IaC)
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── modules/
│   │   ├── vpc/
│   │   ├── rds/
│   │   ├── elasticache/
│   │   └── ecs/
│   └── environments/
│       ├── dev/
│       ├── staging/
│       └── prod/
│
├── monitoring/                   # OBSERVABILITY
│   ├── prometheus/
│   │   └── prometheus.yml
│   ├── grafana/
│   │   └── dashboards/
│   └── alerts/
│
├── scripts/                      # AUTOMATION SCRIPTS
│   ├── setup-dev.sh              # Setup local development
│   ├── deploy.sh                 # Deploy script
│   ├── backup-db.sh              # Database backup
│   ├── restore-db.sh             # Database restore
│   └── health-check.sh           # Health monitoring
│
└── ci/                          # CI/CD CONFIGS
    ├── github-actions/
    │   └── templates/
    └── gitlab-ci/
        └── .gitlab-ci.yml
````

---

### **Responsabilidades de `infra/`:**

---

#### **1. Docker Orchestration** 🐳

````yaml
# infra/docker/docker-compose.prod.yml

version: '3.8'

services:
  # ======================
  # FRONTEND APPS
  # ======================
  web-client:
    image: ghcr.io/piums/piums-web-client:${VERSION:-latest}
    container_name: piums-web-client
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.piums.com
      - NEXT_PUBLIC_ARTIST_APP_URL=https://artist.piums.com
    networks:
      - piums-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web-artist:
    image: ghcr.io/piums/piums-web-artist:${VERSION:-latest}
    container_name: piums-web-artist
    restart: always
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.piums.com
      - NEXT_PUBLIC_CLIENT_APP_URL=https://piums.com
    networks:
      - piums-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M

  # ======================
  # API GATEWAY
  # ======================
  gateway:
    image: ghcr.io/piums/piums-gateway:${VERSION:-latest}
    container_name: piums-gateway
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - CLIENT_APP_URL=https://piums.com
      - ARTIST_APP_URL=https://artist.piums.com
    networks:
      - piums-network
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 1G

  # ======================
  # MICROSERVICES
  # ======================
  auth-service:
    image: ghcr.io/piums/piums-auth-service:${VERSION:-latest}
    restart: always
    environment:
      - DATABASE_URL=${AUTH_DB_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - FACEBOOK_APP_ID=${FACEBOOK_APP_ID}
    networks:
      - piums-network
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 2

  # ... (otros 9 microservices similares)

  # ======================
  # DATABASES
  # ======================
  postgres:
    image: postgres:15-alpine
    container_name: piums-postgres
    restart: always
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=piums
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    networks:
      - piums-network
    ports:
      - "5432:5432"
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  redis:
    image: redis:7-alpine
    container_name: piums-redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - piums-network
    ports:
      - "6379:6379"
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

  # ======================
  # NGINX (Reverse Proxy)
  # ======================
  nginx:
    image: nginx:alpine
    container_name: piums-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ../nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ../nginx/conf.d:/etc/nginx/conf.d:ro
      - ../nginx/ssl:/etc/nginx/ssl:ro
      - nginx-cache:/var/cache/nginx
    networks:
      - piums-network
    depends_on:
      - web-client
      - web-artist
      - gateway

  # ======================
  # MONITORING
  # ======================
  prometheus:
    image: prom/prometheus:latest
    container_name: piums-prometheus
    restart: always
    volumes:
      - ../monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - piums-network
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    container_name: piums-grafana
    restart: always
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - ../monitoring/grafana/dashboards:/var/lib/grafana/dashboards
      - grafana-data:/var/lib/grafana
    networks:
      - piums-network
    ports:
      - "3003:3000"

networks:
  piums-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
  nginx-cache:
  prometheus-data:
  grafana-data:
````

**Responsabilidad:** 
- ✅ Orquestación de 13+ contenedores
- ✅ Networking entre servicios
- ✅ Persistencia de datos
- ✅ Resource limits
- ✅ Health checks
- ✅ Auto-restart policies

---

#### **2. Nginx Configuration** 🔀

````nginx
# infra/nginx/nginx.conf

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;

    # Upstream definitions
    upstream web_client {
        least_conn;
        server web-client:3000 weight=1 max_fails=3 fail_timeout=30s;
        server web-client:3000 weight=1 max_fails=3 fail_timeout=30s;
    }

    upstream web_artist {
        least_conn;
        server web-artist:3001 weight=1 max_fails=3 fail_timeout=30s;
        server web-artist:3001 weight=1 max_fails=3 fail_timeout=30s;
    }

    upstream api_gateway {
        least_conn;
        server gateway:3000 weight=1 max_fails=3 fail_timeout=30s;
        server gateway:3000 weight=1 max_fails=3 fail_timeout=30s;
        server gateway:3000 weight=1 max_fails=3 fail_timeout=30s;
    }

    # Include virtual hosts
    include /etc/nginx/conf.d/*.conf;
}
````

````nginx
# infra/nginx/conf.d/client-app.conf

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name piums.com www.piums.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS - Client App
server {
    listen 443 ssl http2;
    server_name piums.com www.piums.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate Limiting
    limit_req zone=general burst=20 nodelay;

    # Proxy to Next.js
    location / {
        proxy_pass http://web_client;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://web_client;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        access_log off;
        return 200 "OK";
    }
}
````

````nginx
# infra/nginx/conf.d/artist-app.conf

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name artist.piums.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS - Artist App
server {
    listen 443 ssl http2;
    server_name artist.piums.com;

    # SSL Configuration (same as client)
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate Limiting
    limit_req zone=general burst=20 nodelay;

    # Proxy to Next.js Artist App
    location / {
        proxy_pass http://web_artist;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://web_artist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
````

````nginx
# infra/nginx/conf.d/api.conf

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name api.piums.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS - API Gateway
server {
    listen 443 ssl http2;
    server_name api.piums.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate Limiting (más estricto para API)
    limit_req zone=api burst=50 nodelay;

    # CORS (handled by gateway, pero backup aquí)
    add_header Access-Control-Allow-Origin "https://piums.com, https://artist.piums.com" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;

    # Proxy to API Gateway
    location / {
        proxy_pass http://api_gateway;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts (más cortos para API)
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # WebSocket (Chat service)
    location /api/chat/socket {
        proxy_pass http://api_gateway;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400; # 24h para WebSocket
    }

    # Health check
    location /health {
        access_log off;
        proxy_pass http://api_gateway/health;
    }

    # Swagger docs (solo en dev/staging)
    location /api/docs {
        proxy_pass http://api_gateway/api/docs;
    }
}
````

**Responsabilidad:**
- ✅ Load balancing (round-robin, least_conn)
- ✅ SSL/TLS termination
- ✅ Domain routing (piums.com, artist.piums.com, api.piums.com)
- ✅ Rate limiting
- ✅ Gzip compression
- ✅ Static assets caching
- ✅ Security headers
- ✅ WebSocket support

---

#### **3. Terraform (Infrastructure as Code)** ☁️

````hcl
# infra/terraform/main.tf

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "piums-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
module "vpc" {
  source = "./modules/vpc"
  
  vpc_cidr = "10.0.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b"]
  public_subnets     = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnets    = ["10.0.10.0/24", "10.0.20.0/24"]
  
  tags = {
    Environment
```


## License: unknown
https://github.com/pavski0x/vulnapp/blob/b127ba1165da0f14e084f747b81d51c984ffe42d/terraform/10_vpc.tf

```
# 🏗️ **ARQUITECTURA COMPLETA + CLEAN ARCHITECTURE + INFRA + DEPLOYMENT**

---

## 📋 **RESUMEN EJECUTIVO**

```
╔═══════════════════════════════════════════════════════╗
║  PIUMS PLATFORM - ARQUITECTURA COMPLETA               ║
║                                                        ║
║  Patrón:           Clean Architecture ✅              ║
║  Infra:            Docker + Nginx + CI/CD ✅          ║
║  Deploy:           GitHub Actions (automatizado) ✅   ║
║  Estado:           Production-Ready 🚀                ║
╚═══════════════════════════════════════════════════════╝
```

---

## 🎯 **PARTE 1: CLEAN ARCHITECTURE**

### **¿Se sigue usando Clean Architecture?** ✅ **SÍ, AL 100%**

---

### **Estructura por Microservicio (Ejemplo: booking-service)**

````
services/booking-service/
├── src/
│   ├── application/              # CAPA DE APLICACIÓN
│   │   ├── dtos/                 # Data Transfer Objects
│   │   │   ├── create-booking.dto.ts
│   │   │   ├── update-booking.dto.ts
│   │   │   └── booking-response.dto.ts
│   │   │
│   │   ├── use-cases/            # Casos de Uso (Lógica de negocio)
│   │   │   ├── create-booking.usecase.ts
│   │   │   ├── reschedule-booking.usecase.ts
│   │   │   ├── cancel-booking.usecase.ts
│   │   │   ├── verify-code.usecase.ts
│   │   │   └── calculate-price.usecase.ts
│   │   │
│   │   └── interfaces/           # Contratos de infra
│   │       ├── booking.repository.interface.ts
│   │       ├── payment.service.interface.ts
│   │       └── notification.service.interface.ts
│   │
│   ├── domain/                   # CAPA DE DOMINIO (Core Business)
│   │   ├── entities/             # Entidades de negocio
│   │   │   ├── booking.entity.ts
│   │   │   ├── booking-code.entity.ts
│   │   │   └── booking-item.entity.ts
│   │   │
│   │   ├── value-objects/        # Objetos de valor
│   │   │   ├── price.vo.ts
│   │   │   ├── date-range.vo.ts
│   │   │   └── booking-status.vo.ts
│   │   │
│   │   ├── aggregates/           # Agregados
│   │   │   └── booking.aggregate.ts
│   │   │
│   │   ├── events/               # Domain Events
│   │   │   ├── booking-created.event.ts
│   │   │   ├── booking-confirmed.event.ts
│   │   │   └── booking-cancelled.event.ts
│   │   │
│   │   └── exceptions/           # Excepciones de dominio
│   │       ├── booking-not-found.exception.ts
│   │       ├── invalid-booking-status.exception.ts
│   │       └── unavailable-slot.exception.ts
│   │
│   ├── infrastructure/           # CAPA DE INFRAESTRUCTURA
│   │   ├── database/             # Persistencia
│   │   │   ├── prisma/
│   │   │   │   ├── schema.prisma
│   │   │   │   └── migrations/
│   │   │   │
│   │   │   └── repositories/    # Implementaciones de repos
│   │   │       ├── booking.repository.ts
│   │   │       └── booking-code.repository.ts
│   │   │
│   │   ├── http/                 # Clientes HTTP
│   │   │   ├── payment.client.ts
│   │   │   ├── artist.client.ts
│   │   │   └── notification.client.ts
│   │   │
│   │   ├── cache/                # Redis
│   │   │   └── booking-cache.service.ts
│   │   │
│   │   └── messaging/            # Event Bus (RabbitMQ/Redis Pub/Sub)
│   │       ├── event-publisher.ts
│   │       └── event-subscriber.ts
│   │
│   ├── presentation/             # CAPA DE PRESENTACIÓN (API Layer)
│   │   ├── controllers/          # REST Controllers
│   │   │   ├── booking.controller.ts
│   │   │   └── booking-admin.controller.ts
│   │   │
│   │   ├── guards/               # Auth guards
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   │
│   │   ├── interceptors/         # Response transformation
│   │   │   └── transform.interceptor.ts
│   │   │
│   │   └── filters/              # Exception handling
│   │       └── http-exception.filter.ts
│   │
│   ├── shared/                   # SHARED (Cross-cutting)
│   │   ├── config/               # Configuración
│   │   │   └── booking.config.ts
│   │   │
│   │   ├── decorators/           # Custom decorators
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   │
│   │   ├── utils/                # Utilidades
│   │   │   ├── date.utils.ts
│   │   │   └── code-generator.utils.ts
│   │   │
│   │   └── constants/            # Constantes
│   │       └── booking-status.constants.ts
│   │
│   ├── booking.module.ts         # Módulo raíz
│   └── main.ts                   # Bootstrap
│
├── test/                         # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── prisma/
│   └── schema.prisma
│
├── Dockerfile
├── package.json
└── tsconfig.json
````

---

### **Flujo de Datos (Clean Architecture)**

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT REQUEST                          │
│               (POST /api/bookings)                           │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (API Gateway)                            │
│  ├─ booking.controller.ts                                    │
│  ├─ Validación DTO (class-validator)                        │
│  ├─ Guards (JWT auth, RBAC)                                 │
│  └─ Interceptors (logging, transform)                       │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  APPLICATION LAYER (Use Cases)                               │
│  ├─ create-booking.usecase.ts                               │
│  │  ├─ 1. Validar disponibilidad                            │
│  │  ├─ 2. Crear entidad Booking                             │
│  │  ├─ 3. Calcular precio total                             │
│  │  ├─ 4. Generar código 6 dígitos                          │
│  │  ├─ 5. Llamar payment service                            │
│  │  ├─ 6. Guardar en BD (via repository)                    │
│  │  └─ 7. Publicar evento BookingCreated                    │
│  └─ Orchestration + Business logic                          │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  DOMAIN LAYER (Core Business)                                │
│  ├─ booking.entity.ts                                        │
│  │  ├─ Business rules                                        │
│  │  ├─ Validaciones de negocio                              │
│  │  ├─ State machine (status transitions)                   │
│  │  └─ Domain events dispatch                               │
│  ├─ value-objects/                                           │
│  │  ├─ Price (validación, operaciones)                      │
│  │  └─ DateRange (validación, overlaps)                     │
│  └─ Pure business logic (NO dependencies)                   │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE LAYER (Detalles técnicos)                    │
│  ├─ database/repositories/                                   │
│  │  └─ booking.repository.ts                                │
│  │     └─ Prisma implementation                             │
│  ├─ http/                                                    │
│  │  ├─ payment.client.ts (Stripe)                           │
│  │  ├─ artist.client.ts                                     │
│  │  └─ notification.client.ts                               │
│  ├─ cache/                                                   │
│  │  └─ Redis client                                         │
│  └─ messaging/                                               │
│     └─ Event bus (RabbitMQ)                                 │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL SERVICES                                           │
│  ├─ PostgreSQL (Booking data)                               │
│  ├─ Redis (Cache + Pub/Sub)                                 │
│  ├─ Stripe API (Payments)                                   │
│  └─ Notification Service (SendGrid)                         │
└─────────────────────────────────────────────────────────────┘
```

---

### **Principios Clean Architecture Aplicados:**

````typescript
// ✅ EJEMPLO REAL: create-booking.usecase.ts

import { Injectable } from '@nestjs/common';
import { CreateBookingDto } from '../dtos/create-booking.dto';
import { Booking } from '../../domain/entities/booking.entity';
import { IBookingRepository } from '../interfaces/booking.repository.interface';
import { IPaymentService } from '../interfaces/payment.service.interface';
import { INotificationService } from '../interfaces/notification.service.interface';
import { BookingCreatedEvent } from '../../domain/events/booking-created.event';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CreateBookingUseCase {
  constructor(
    // ⭐ DEPENDENCY INVERSION: Depende de INTERFACES, no implementaciones
    private readonly bookingRepository: IBookingRepository,
    private readonly paymentService: IPaymentService,
    private readonly notificationService: INotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: CreateBookingDto, userId: string): Promise<Booking> {
    // 1. Validar disponibilidad (Domain logic)
    const isAvailable = await this.bookingRepository.checkAvailability(
      dto.artistId,
      dto.date,
      dto.timeSlot,
    );

    if (!isAvailable) {
      throw new UnavailableSlotException();
    }

    // 2. Crear entidad de dominio (Domain layer)
    const booking = Booking.create({
      userId,
      artistId: dto.artistId,
      serviceId: dto.serviceId,
      date: dto.date,
      timeSlot: dto.timeSlot,
      addOns: dto.addOns || [],
    });

    // 3. Calcular precio (Domain logic - value object)
    const totalPrice = booking.calculateTotalPrice();

    // 4. Generar código único (Domain logic)
    booking.generateCode();

    // 5. Crear payment intent (Infrastructure)
    const paymentIntent = await this.paymentService.createIntent({
      amount: totalPrice.toNumber(),
      currency: 'usd',
      customerId: userId,
      metadata: {
        bookingId: booking.id,
      },
    });

    booking.setPaymentIntentId(paymentIntent.id);

    // 6. Persistir (Infrastructure - repository)
    const savedBooking = await this.bookingRepository.save(booking);

    // 7. Publicar evento de dominio (Event-driven)
    const event = new BookingCreatedEvent(savedBooking);
    this.eventEmitter.emit('booking.created', event);

    // 8. Notificar (async - infrastructure)
    await this.notificationService.send({
      to: userId,
      type: 'booking_created',
      data: { bookingId: savedBooking.id },
    });

    return savedBooking;
  }
}
````

---

### **Ventajas Clean Architecture en Piums:**

```
✅ 1. Testabilidad
   └─ Usar cases independientes
   └─ Mocks de interfaces (no implementaciones)
   └─ Tests unitarios rápidos

✅ 2. Mantenibilidad
   └─ Business logic aislada (domain/)
   └─ Cambios en infra no afectan dominio
   └─ Código expresivo y legible

✅ 3. Escalabilidad
   └─ Agregar nuevos use cases fácilmente
   └─ Cambiar BD sin tocar business logic
   └─ Swap de servicios externos sin impacto

✅ 4. Desacoplamiento
   └─ Domain no conoce infrastructure
   └─ Application no conoce DB details
   └─ Presentation no conoce business rules

✅ 5. Reusabilidad
   └─ Domain entities reutilizables
   └─ Value objects compartidos
   └─ Use cases componibles

= Clean Architecture al 100% ✅
```

---

## 📦 **PARTE 2: INFRA - ¿DE QUÉ SE ENCARGA?**

### **Estructura [`infra/`](infra/ ):**

````
infra/
├── docker/                       # DOCKER ORCHESTRATION
│   ├── docker-compose.dev.yml    # Development
│   ├── docker-compose.prod.yml   # Production
│   ├── docker-compose.staging.yml # Staging
│   └── .env.example              # Template
│
├── kubernetes/                   # KUBERNETES (Optional)
│   ├── deployments/
│   │   ├── web-client.yaml
│   │   ├── web-artist.yaml
│   │   ├── gateway.yaml
│   │   └── services/
│   │       ├── auth.yaml
│   │       ├── users.yaml
│   │       └── ...
│   ├── services/
│   ├── ingress/
│   └── configmaps/
│
├── nginx/                        # REVERSE PROXY
│   ├── nginx.conf                # Main config
│   ├── conf.d/
│   │   ├── client-app.conf       # piums.com
│   │   ├── artist-app.conf       # artist.piums.com
│   │   └── api.conf              # api.piums.com
│   └── ssl/                      # SSL certificates
│       ├── cert.pem
│       └── key.pem
│
├── terraform/                    # INFRASTRUCTURE AS CODE (IaC)
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── modules/
│   │   ├── vpc/
│   │   ├── rds/
│   │   ├── elasticache/
│   │   └── ecs/
│   └── environments/
│       ├── dev/
│       ├── staging/
│       └── prod/
│
├── monitoring/                   # OBSERVABILITY
│   ├── prometheus/
│   │   └── prometheus.yml
│   ├── grafana/
│   │   └── dashboards/
│   └── alerts/
│
├── scripts/                      # AUTOMATION SCRIPTS
│   ├── setup-dev.sh              # Setup local development
│   ├── deploy.sh                 # Deploy script
│   ├── backup-db.sh              # Database backup
│   ├── restore-db.sh             # Database restore
│   └── health-check.sh           # Health monitoring
│
└── ci/                          # CI/CD CONFIGS
    ├── github-actions/
    │   └── templates/
    └── gitlab-ci/
        └── .gitlab-ci.yml
````

---

### **Responsabilidades de `infra/`:**

---

#### **1. Docker Orchestration** 🐳

````yaml
# infra/docker/docker-compose.prod.yml

version: '3.8'

services:
  # ======================
  # FRONTEND APPS
  # ======================
  web-client:
    image: ghcr.io/piums/piums-web-client:${VERSION:-latest}
    container_name: piums-web-client
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.piums.com
      - NEXT_PUBLIC_ARTIST_APP_URL=https://artist.piums.com
    networks:
      - piums-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web-artist:
    image: ghcr.io/piums/piums-web-artist:${VERSION:-latest}
    container_name: piums-web-artist
    restart: always
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.piums.com
      - NEXT_PUBLIC_CLIENT_APP_URL=https://piums.com
    networks:
      - piums-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M

  # ======================
  # API GATEWAY
  # ======================
  gateway:
    image: ghcr.io/piums/piums-gateway:${VERSION:-latest}
    container_name: piums-gateway
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - CLIENT_APP_URL=https://piums.com
      - ARTIST_APP_URL=https://artist.piums.com
    networks:
      - piums-network
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 1G

  # ======================
  # MICROSERVICES
  # ======================
  auth-service:
    image: ghcr.io/piums/piums-auth-service:${VERSION:-latest}
    restart: always
    environment:
      - DATABASE_URL=${AUTH_DB_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - FACEBOOK_APP_ID=${FACEBOOK_APP_ID}
    networks:
      - piums-network
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 2

  # ... (otros 9 microservices similares)

  # ======================
  # DATABASES
  # ======================
  postgres:
    image: postgres:15-alpine
    container_name: piums-postgres
    restart: always
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=piums
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    networks:
      - piums-network
    ports:
      - "5432:5432"
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  redis:
    image: redis:7-alpine
    container_name: piums-redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - piums-network
    ports:
      - "6379:6379"
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

  # ======================
  # NGINX (Reverse Proxy)
  # ======================
  nginx:
    image: nginx:alpine
    container_name: piums-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ../nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ../nginx/conf.d:/etc/nginx/conf.d:ro
      - ../nginx/ssl:/etc/nginx/ssl:ro
      - nginx-cache:/var/cache/nginx
    networks:
      - piums-network
    depends_on:
      - web-client
      - web-artist
      - gateway

  # ======================
  # MONITORING
  # ======================
  prometheus:
    image: prom/prometheus:latest
    container_name: piums-prometheus
    restart: always
    volumes:
      - ../monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - piums-network
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    container_name: piums-grafana
    restart: always
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - ../monitoring/grafana/dashboards:/var/lib/grafana/dashboards
      - grafana-data:/var/lib/grafana
    networks:
      - piums-network
    ports:
      - "3003:3000"

networks:
  piums-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
  nginx-cache:
  prometheus-data:
  grafana-data:
````

**Responsabilidad:** 
- ✅ Orquestación de 13+ contenedores
- ✅ Networking entre servicios
- ✅ Persistencia de datos
- ✅ Resource limits
- ✅ Health checks
- ✅ Auto-restart policies

---

#### **2. Nginx Configuration** 🔀

````nginx
# infra/nginx/nginx.conf

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;

    # Upstream definitions
    upstream web_client {
        least_conn;
        server web-client:3000 weight=1 max_fails=3 fail_timeout=30s;
        server web-client:3000 weight=1 max_fails=3 fail_timeout=30s;
    }

    upstream web_artist {
        least_conn;
        server web-artist:3001 weight=1 max_fails=3 fail_timeout=30s;
        server web-artist:3001 weight=1 max_fails=3 fail_timeout=30s;
    }

    upstream api_gateway {
        least_conn;
        server gateway:3000 weight=1 max_fails=3 fail_timeout=30s;
        server gateway:3000 weight=1 max_fails=3 fail_timeout=30s;
        server gateway:3000 weight=1 max_fails=3 fail_timeout=30s;
    }

    # Include virtual hosts
    include /etc/nginx/conf.d/*.conf;
}
````

````nginx
# infra/nginx/conf.d/client-app.conf

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name piums.com www.piums.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS - Client App
server {
    listen 443 ssl http2;
    server_name piums.com www.piums.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate Limiting
    limit_req zone=general burst=20 nodelay;

    # Proxy to Next.js
    location / {
        proxy_pass http://web_client;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://web_client;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        access_log off;
        return 200 "OK";
    }
}
````

````nginx
# infra/nginx/conf.d/artist-app.conf

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name artist.piums.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS - Artist App
server {
    listen 443 ssl http2;
    server_name artist.piums.com;

    # SSL Configuration (same as client)
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate Limiting
    limit_req zone=general burst=20 nodelay;

    # Proxy to Next.js Artist App
    location / {
        proxy_pass http://web_artist;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://web_artist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
````

````nginx
# infra/nginx/conf.d/api.conf

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name api.piums.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS - API Gateway
server {
    listen 443 ssl http2;
    server_name api.piums.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate Limiting (más estricto para API)
    limit_req zone=api burst=50 nodelay;

    # CORS (handled by gateway, pero backup aquí)
    add_header Access-Control-Allow-Origin "https://piums.com, https://artist.piums.com" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;

    # Proxy to API Gateway
    location / {
        proxy_pass http://api_gateway;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts (más cortos para API)
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # WebSocket (Chat service)
    location /api/chat/socket {
        proxy_pass http://api_gateway;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400; # 24h para WebSocket
    }

    # Health check
    location /health {
        access_log off;
        proxy_pass http://api_gateway/health;
    }

    # Swagger docs (solo en dev/staging)
    location /api/docs {
        proxy_pass http://api_gateway/api/docs;
    }
}
````

**Responsabilidad:**
- ✅ Load balancing (round-robin, least_conn)
- ✅ SSL/TLS termination
- ✅ Domain routing (piums.com, artist.piums.com, api.piums.com)
- ✅ Rate limiting
- ✅ Gzip compression
- ✅ Static assets caching
- ✅ Security headers
- ✅ WebSocket support

---

#### **3. Terraform (Infrastructure as Code)** ☁️

````hcl
# infra/terraform/main.tf

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "piums-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
module "vpc" {
  source = "./modules/vpc"
  
  vpc_cidr = "10.0.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b"]
  public_subnets     = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnets    = ["10.0.10.0/24", "10.0.20.0/24"]
  
  tags = {
    Environment
```

