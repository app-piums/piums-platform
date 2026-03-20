# Sistema de Pricing Avanzado - PIUMS

Sistema completo y flexible para calcular precios de servicios con múltiples componentes: precio base, addons, costos de viaje y descuentos.

## 📊 Arquitectura

### Componentes del Pricing

```
┌──────────────────────────────────────────────────────┐
│                  PRICING CALCULADO                    │
│                                                       │
│  1. PRECIO BASE (service_pricing)                    │
│     • FIXED: Precio fijo                             │
│     • BASE_PLUS_HOURLY: Base + minutos extra         │
│     • PACKAGE: Paquete con minutos incluidos         │
│                                                       │
│  2. ADDONS (service_addons)                          │
│     • Obligatorios: Se agregan automáticamente       │
│     • Opcionales: Cliente selecciona                 │
│                                                       │
│  3. VIAJE (service_travel_rules)                     │
│     • KM incluidos gratis                            │
│     • Precio por KM adicional                        │
│     • Distancia máxima permitida                     │
│                                                       │
│  4. DESCUENTOS (futuro)                              │
│     • Códigos promocionales                          │
│     • Descuentos por volumen                         │
│                                                       │
│  = TOTAL FINAL → Desglosado en booking_items         │
└──────────────────────────────────────────────────────┘
```

## 🗃️ Tablas de Base de Datos

### catalog-service (piums_catalog)

**service_pricing**
```sql
id                    uuid      PK
serviceId             uuid      UNIQUE FK → services.id
pricingModel          enum      (FIXED, BASE_PLUS_HOURLY, PACKAGE)
currency              text      default 'MXN'
basePriceCents        int       Precio base en centavos
includedMinutes       int?      Minutos incluidos en el precio base
extraMinutePriceCents int?      Precio por minuto adicional
minNoticeHours        int?      Horas mínimas de anticipación
```

**service_addons**
```sql
id          uuid      PK
serviceId   uuid      FK → services.id
name        text      Nombre del addon
description text?     Descripción opcional
price       int       Precio en centavos
isRequired  boolean   Si es obligatorio (nuevo campo)
isOptional  boolean   Si es opcional
isDefault   boolean   Si se incluye por defecto
```

**service_travel_rules**
```sql
id              uuid      PK
serviceId       uuid      UNIQUE FK → services.id
includedKm      int?      Kilómetros sin costo adicional
pricePerKmCents int?      Precio por km adicional
maxDistanceKm   int?      Distancia máxima permitida
```

### booking-service (piums_bookings)

**booking_items**
```sql
id              uuid      PK
bookingId       uuid      FK → bookings.id
type            enum      (BASE, ADDON, TRAVEL, DISCOUNT)
name            text      Nombre descriptivo
qty             int       Cantidad
unitPriceCents  int       Precio unitario
totalPriceCents int       Precio total (qty × unitPrice)
metadata        json?     Datos adicionales
```

## 🔄 Modelos de Pricing

### 1. FIXED - Precio Fijo

El más simple. Un precio fijo sin variables.

**Ejemplo: Sesión de fotos corporativas**
```json
{
  "pricingModel": "FIXED",
  "basePriceCents": 150000  // $1,500 MXN fijo
}
```

**Cálculo:**
- Precio = $1,500 (siempre)

---

### 2. BASE_PLUS_HOURLY - Base + Tiempo Extra

Precio base que incluye cierto tiempo, cobra por minutos adicionales.

**Ejemplo: DJ para eventos**
```json
{
  "pricingModel": "BASE_PLUS_HOURLY",
  "basePriceCents": 500000,        // $5,000 base
  "includedMinutes": 180,          // Incluye 3 horas
  "extraMinutePriceCents": 1000    // $10 por minuto extra
}
```

**Cálculo para evento de 4 horas (240 minutos):**
- Base: $5,000 (incluye 180 min)
- Extra: 60 min × $10 = $600
- **Total: $5,600**

---

### 3. PACKAGE - Paquete con Minutos Incluidos

Similar a BASE_PLUS_HOURLY pero enfocado en paquetes predefinidos.

**Ejemplo: Servicio de maquillaje**
```json
{
  "pricingModel": "PACKAGE",
  "basePriceCents": 200000,        // $2,000
  "includedMinutes": 120,          // Paquete de 2 horas
  "extraMinutePriceCents": 500     // $5 por minuto extra
}
```

## 🧮 Cálculo de Precio Completo

### Flujo de Cálculo

```javascript
calculateServicePrice({
  serviceId: 'uuid',
  durationMinutes: 240,
  selectedAddonIds: ['addon-1', 'addon-2'],
  distanceKm: 25
})

// 1️⃣ PRECIO BASE
// Según pricing model (FIXED, BASE_PLUS_HOURLY, PACKAGE)
baseCents = 500000

// 2️⃣ ADDONS SELECCIONADOS
addon1 = 10000  // Cliente seleccionó
addon2 = 5000   // Cliente seleccionó
addonsCents = 15000

// 3️⃣ ADDONS OBLIGATORIOS
// Se agregan automáticamente si no están en selectedAddonIds
requiredAddon = 8000
addonsCents = 23000

// 4️⃣ COSTO DE VIAJE
includedKm = 10
extraKm = 25 - 10 = 15
travelCents = 15 × 500 = 7500

// 5️⃣ TOTAL
totalCents = 500000 + 23000 + 7500 = 530500
// = $5,305 MXN
```

### Desglose en Items

```json
{
  "items": [
    {
      "type": "BASE",
      "name": "DJ para eventos (incluye 3 hrs)",
      "qty": 1,
      "unitPriceCents": 500000,
      "totalPriceCents": 500000
    },
    {
      "type": "ADDON",
      "name": "Luces LED premium",
      "qty": 1,
      "unitPriceCents": 10000,
      "totalPriceCents": 10000
    },
    {
      "type": "ADDON",
      "name": "Micrófono inalámbrico",
      "qty": 1,
      "unitPriceCents": 5000,
      "totalPriceCents": 5000
    },
    {
      "type": "ADDON",
      "name": "Seguro de equipo (obligatorio)",
      "qty": 1,
      "unitPriceCents": 8000,
      "totalPriceCents": 8000,
      "metadata": { "required": true }
    },
    {
      "type": "TRAVEL",
      "name": "Desplazamiento (15 km adicionales)",
      "qty": 1,
      "unitPriceCents": 7500,
      "totalPriceCents": 7500,
      "metadata": {
        "totalKm": 25,
        "includedKm": 10,
        "extraKm": 15,
        "pricePerKm": 500
      }
    }
  ],
  "subtotalCents": 530500,
  "totalCents": 530500,
  "depositRequiredCents": 265250,
  "breakdown": {
    "baseCents": 500000,
    "addonsCents": 23000,
    "travelCents": 7500,
    "discountsCents": 0
  }
}
```

## 📡 Endpoints Disponibles

### catalog-service (puerto 4004)

#### Calcular Precio

```http
POST /api/pricing/calculate

Body:
{
  "serviceId": "uuid",
  "durationMinutes": 240,           // Opcional (req. para BASE_PLUS_HOURLY)
  "selectedAddonIds": ["id1", "id2"], // Array de IDs de addons
  "distanceKm": 25.5                // Distancia en kilómetros
}

Response:
{
  "serviceId": "uuid",
  "currency": "MXN",
  "items": [...],                   // Desglose completo
  "subtotalCents": 530500,
  "totalCents": 530500,
  "depositRequiredCents": 265250,
  "breakdown": {
    "baseCents": 500000,
    "addonsCents": 23000,
    "travelCents": 7500,
    "discountsCents": 0
  }
}
```

#### Obtener Resumen de Pricing

```http
GET /api/pricing/summary/:serviceId

Response:
{
  "serviceId": "uuid",
  "serviceName": "DJ para eventos",
  "basePrice": {
    "cents": 500000,
    "currency": "MXN",
    "display": "$5,000.00"
  },
  "pricingModel": "BASE_PLUS_HOURLY",
  "includedMinutes": 180,
  "extraMinutePriceCents": 1000,
  "addons": [
    {
      "id": "uuid",
      "name": "Luces LED",
      "price": { "cents": 10000, "display": "$100.00" },
      "isRequired": false,
      "isOptional": true
    }
  ],
  "travelRules": {
    "includedKm": 10,
    "pricePerKmCents": 500,
    "maxDistanceKm": 50
  },
  "requiresDeposit": true,
  "depositPercentage": 50
}
```

#### Validar Configuración de Pricing

```http
GET /api/pricing/validate/:serviceId

Response:
{
  "isValid": true,
  "errors": []
}
// o
{
  "isValid": false,
  "errors": [
    "includedMinutes must be set for this pricing model",
    "extraMinutePriceCents must be set for this pricing model"
  ]
}
```

## 🎯 Casos de Uso

### 1. Configurar Servicio con Pricing Fijo

```typescript
// Crear servicio
const service = await prisma.service.create({
  data: {
    name: 'Sesión de fotos corporativas',
    basePrice: 150000, // $1,500
    // ... otros campos
  }
});

// Configurar pricing
await prisma.servicePricing.create({
  data: {
    serviceId: service.id,
    pricingModel: 'FIXED',
    basePriceCents: 150000,
  }
});
```

### 2. Configurar Servicio con Tiempo Base + Extra

```typescript
await prisma.servicePricing.create({
  data: {
    serviceId: service.id,
    pricingModel: 'BASE_PLUS_HOURLY',
    basePriceCents: 500000,        // $5,000
    includedMinutes: 180,          // 3 horas incluidas
    extraMinutePriceCents: 1000,   // $10 por minuto extra
    minNoticeHours: 48,            // 48 hrs de anticipación
  }
});
```

### 3. Agregar Addons

```typescript
// Addon opcional
await prisma.serviceAddon.create({
  data: {
    serviceId: service.id,
    name: 'Luces LED premium',
    description: 'Sistema de iluminación profesional',
    price: 10000,              // $100
    isRequired: false,
    isOptional: true,
  }
});

// Addon obligatorio
await prisma.serviceAddon.create({
  data: {
    serviceId: service.id,
    name: 'Seguro de equipo',
    price: 8000,               // $80
    isRequired: true,          // Se agrega automáticamente
    isOptional: false,
  }
});
```

### 4. Configurar Reglas de Viaje

```typescript
await prisma.serviceTravelRules.create({
  data: {
    serviceId: service.id,
    includedKm: 10,            // Primeros 10 km gratis
    pricePerKmCents: 500,      // $5 por km adicional
    maxDistanceKm: 50,         // Máximo 50 km
  }
});
```

### 5. Calcular Precio para un Cliente

```typescript
import { calculateServicePrice } from './services/pricing.service';

const quote = await calculateServicePrice({
  serviceId: 'service-uuid',
  durationMinutes: 240,                    // 4 horas
  selectedAddonIds: ['addon-1', 'addon-2'], // Addons elegidos
  distanceKm: 25,                          // 25 km de distancia
});

console.log(`Total: ${quote.totalCents / 100} ${quote.currency}`);
console.log(`Depósito: ${quote.depositRequiredCents / 100}`);
console.log('Desglose:', quote.items);
```

### 6. Guardar Items al Crear Booking

```typescript
// En booking-service, después de calcular el precio
const quote = await calculateServicePrice(input);

// Crear booking
const booking = await prisma.booking.create({
  data: {
    // ... campos del booking
    totalPrice: quote.totalCents,
    currency: quote.currency,
  }
});

// Guardar items del desglose
for (const item of quote.items) {
  await prisma.bookingItem.create({
    data: {
      bookingId: booking.id,
      type: item.type,
      name: item.name,
      qty: item.qty,
      unitPriceCents: item.unitPriceCents,
      totalPriceCents: item.totalPriceCents,
      metadata: item.metadata,
    }
  });
}
```

## 🧪 Pruebas

Ejecuta el script de pruebas:

```bash
cd /Users/piums/Desktop/piums-platform
./services/test-pricing.sh
```

O prueba manualmente:

```bash
# Calcular precio de un servicio
curl -X POST http://localhost:4004/api/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "service-uuid",
    "durationMinutes": 180,
    "selectedAddonIds": ["addon-1"],
    "distanceKm": 20
  }'

# Ver resumen de pricing
curl http://localhost:4004/api/pricing/summary/service-uuid

# Validar configuración
curl http://localhost:4004/api/pricing/validate/service-uuid
```

## ⚠️ Validaciones y Reglas

### Validaciones Automáticas

✅ **Precio base** debe ser > 0  
✅ **includedMinutes** requerido para BASE_PLUS_HOURLY y PACKAGE  
✅ **extraMinutePriceCents** requerido para BASE_PLUS_HOURLY y PACKAGE  
✅ **Distancia máxima** se valida en cálculo de viaje  
✅ **Addons obligatorios** se agregan automáticamente

### Reglas de Negocio

1. **Addons obligatorios** siempre se incluyen, aunque el cliente no los seleccione
2. **Distancia excedida** lanza error si supera `maxDistanceKm`
3. **Depósito** se calcula como porcentaje o monto fijo según configuración
4. **Minutos extra** se cobran solo si exceden `includedMinutes`
5. **KM incluidos** no se cobran, solo los km adicionales

## 🔜 Futuras Mejoras

1. **Descuentos automáticos** - Por volumen, fidelidad, promociones
2. **Pricing dinámico** - Según demanda, día de semana, temporada
3. **Multimoneda** - Conversión automática de divisas
4. **Taxes/impuestos** - Cálculo de IVA o impuestos locales
5. **Paquetes personalizados** - Cliente elige duración exacta
6. **Time slots** - Precios diferentes según horario
7. **Cálculo de distancia automático** - Con coordenadas lat/lng

## 💡 Best Practices

### Para Artistas

✅ Configura siempre `servicePricing` para tener control total  
✅ Define addons obligatorios claramente  
✅ Establece distancia máxima realista  
✅ Usa `minNoticeHours` para evitar reservas de última hora  

### Para Desarrollo

✅ Siempre valida pricing antes de crear bookings  
✅ Guarda `booking_items` para trazabilidad  
✅ Usa el campo `metadata` en items para datos extra  
✅ Formatea precios con `Intl.NumberFormat` en el frontend  

### Para Testing

✅ Prueba los 3 modelos de pricing (FIXED, BASE_PLUS_HOURLY, PACKAGE)  
✅ Verifica addons obligatorios se agreguen automáticamente  
✅ Valida errores de distancia máxima  
✅ Confirma cálculo de depósito correcto  

## 🆘 Troubleshooting

**Error: "durationMinutes is required"**
- El servicio usa BASE_PLUS_HOURLY o PACKAGE
- Debes enviar `durationMinutes` en el request

**Error: "Distance exceeds maximum allowed"**
- La distancia supera `maxDistanceKm` en `service_travel_rules`
- Reduce la distancia o contacta al artista

**Precio incorrecto**
- Verifica que `servicePricing` esté configurado
- Confirma que los addons seleccionados existan
- Revisa que `extraMinutePriceCents` sea correcto

**Addons faltantes**
- Los addons obligatorios (`isRequired: true`) se agregan automáticamente
- No necesitas incluirlos en `selectedAddonIds`

## 📊 Ejemplos Reales

### DJ para Boda

```json
{
  "pricingModel": "BASE_PLUS_HOURLY",
  "basePriceCents": 800000,      // $8,000 (4 hrs incluidas)
  "includedMinutes": 240,
  "extraMinutePriceCents": 2000, // $20 por minuto extra
  "addons": [
    { "name": "Luces inteligentes", "price": 15000, "isRequired": false },
    { "name": "Micrófono", "price": 5000, "isRequired": true }
  ],
  "travelRules": {
    "includedKm": 20,
    "pricePerKmCents": 800,      // $8 por km
    "maxDistanceKm": 100
  }
}
```

### Fotógrafo de Bodas

```json
{
  "pricingModel": "PACKAGE",
  "basePriceCents": 1500000,       // $15,000 (paquete 8 hrs)
  "includedMinutes": 480,
  "extraMinutePriceCents": 3000,   // $30 por minuto extra
  "addons": [
    { "name": "Video destacado", "price": 50000, "isRequired": false },
    { "name": "Álbum impreso", "price": 80000, "isRequired": false },
    { "name": "Seguro equipo", "price": 10000, "isRequired": true }
  ],
  "travelRules": {
    "includedKm": 30,
    "pricePerKmCents": 1000,
    "maxDistanceKm": 150
  }
}
```

### Maquillista

```json
{
  "pricingModel": "FIXED",
  "basePriceCents": 120000,        // $1,200 precio fijo
  "addons": [
    { "name": "Peinado", "price": 30000, "isRequired": false },
    { "name": "Airbrush", "price": 20000, "isRequired": false },
    { "name": "Prueba previa", "price": 40000, "isRequired": false }
  ],
  "travelRules": {
    "includedKm": 15,
    "pricePerKmCents": 600,
    "maxDistanceKm": 50
  }
}
```
