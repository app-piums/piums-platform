# Backup & Restauración de Datos de Prueba

## Descripción
Script para crear y restaurar un escenario completo de prueba con:
- **Cliente**: client01@piums.com (Ana Cifuentes)
- **Artistas**: artist02, artist03, artist05
- **Datos**: Servicios, Reservas, Chats, Reviews

## Archivos

### 1. `seed-complete-test-scenario.sh`
Script que crea todos los datos de prueba.

```bash
chmod +x scripts/seed-complete-test-scenario.sh
bash scripts/seed-complete-test-scenario.sh
```

**Output**: 
- 6 servicios/catálogos
- 7 reservas (estados: PENDING, CONFIRMED, COMPLETED, REJECTED, CANCELLED)
- 3 conversaciones con 5+ mensajes cada una
- 3 reviews con ratings variados

### 2. `backups/test-data-*.sql`
Archivo SQL de backup que contiene:
- CREATE STATEMENTS para tablas
- INSERT con todos los datos
- Aplicable en desarrollo y producción

**Restaurar**:
```bash
docker exec piums-postgres psql -U piums < backups/test-data-20260420-152345.sql
```

## Estructura de Datos

### Servicios (6)
| Artista | Servicio | Precio | Duración |
|---------|----------|--------|----------|
| Rob Photography | Sesión 2h | Q750 | 2 horas |
| Rob Photography | Sesión Boda | Q2500 | 8 horas |
| DJ Alex | DJ 4h | Q1500 | 4 horas |
| DJ Alex | DJ Boda | Q3500 | 8 horas |
| Diego Ink | Tatuaje Pequeño | Q300 | 1 hora |
| Diego Ink | Tatuaje Mediano | Q1000 | 3 horas |

### Reservas (7)
| Estado | Artista | Cliente | Fecha |
|--------|---------|---------|-------|
| COMPLETED | Rob | Ana | -15 días |
| PENDING | DJ | Ana | +7 días |
| CONFIRMED | Diego | Ana | +3 días |
| REJECTED | Rob | Ana | +30 días |
| COMPLETED | DJ | Ana | -8 días |
| CANCELLED | Diego | Ana | -25 días |
| CONFIRMED | Rob | Ana | +45 días |

### Reviews (3)
- ⭐⭐⭐⭐⭐ Rob Photography: "Excelente trabajo"
- ⭐⭐⭐ DJ Alex: "Llegó tarde pero bien"
- ⭐⭐⭐⭐ Diego Ink: "Muy profesional"

### Chats (3)
- Ana ↔️ Rob: 5 mensajes (negociación foto boda)
- Ana ↔️ DJ: 4 mensajes (disponibilidad fiesta)
- Ana ↔️ Diego: 5 mensajes (tatuaje personalizado)

## Uso

### Desarrollo
```bash
# Ejecutar seed
bash scripts/seed-complete-test-scenario.sh

# Backup se crea automáticamente en: backups/test-data-*.sql
```

### Producción
```bash
# Restaurar backup anterior
docker exec piums-postgres psql -U piums < backups/test-data-20260420.sql
```

## Credenciales
- **Cliente**: client01@piums.com / Test1234!
- **Artistas**: artist0X@piums.com / Test1234! (X=2,3,5)

## Endpoints de Prueba
- Web Cliente: http://localhost:3000
- Web Artist: http://localhost:3001
- Web Admin: http://localhost:3003

## Notas
- Los datos son 100% realistas
- Incluyen diferentes estados de reservas
- Tiene conversaciones con historial completo
- Reviews con ratings variados
- Aplicable en ciclo de desarrollo completo
