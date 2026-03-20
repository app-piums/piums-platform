# Guía de Contribución — Piums Platform

## Flujo de trabajo (Git Flow)

```
main          ← producción (protegida, solo merge via PR)
  └── develop ← staging (integración)
        └── feature/nombre-feature   ← nuevas funcionalidades
        └── fix/nombre-bug           ← correcciones
        └── chore/nombre-tarea       ← mantenimiento
```

### Pasos para contribuir

```bash
# 1. Asegúrate de estar en develop actualizado
git checkout develop
git pull origin develop

# 2. Crea tu branch
git checkout -b feature/mi-nueva-feature

# 3. Desarrolla + commits atómicos
git add .
git commit -m "feat(artists): add portfolio image reordering"

# 4. Push y abre PR hacia develop
git push origin feature/mi-nueva-feature
```

## Convención de commits (Conventional Commits)

```
<tipo>(<scope>): <descripción corta>

[cuerpo opcional — explica el QUÉ y POR QUÉ]

[footer opcional — referencias a issues]
```

### Tipos permitidos

| Tipo | Cuándo usarlo |
|------|---------------|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Cambios en documentación |
| `style` | Formato (sin cambio de lógica) |
| `refactor` | Refactoring sin nueva feature ni fix |
| `test` | Agregar o corregir tests |
| `chore` | Mantenimiento, dependencias, CI |
| `perf` | Mejora de performance |
| `ci` | Cambios en GitHub Actions |

### Scopes comunes

`gateway`, `auth`, `users`, `artists`, `catalog`, `payments`, `reviews`, `booking`, `search`, `chat`, `notifications`, `web-client`, `web-artist`, `ui`, `shared-types`, `shared-utils`, `k8s`, `terraform`

### Ejemplos válidos

```
feat(booking): add cancellation with partial refund
fix(auth): handle expired refresh token edge case
docs(api): add missing endpoints to openapi.yaml
chore(deps): update stripe to v14
test(search): add unit tests for fuzzy search
```

## Checklist para Pull Requests

Antes de abrir un PR, verifica:

- [ ] El código compila sin errores (`./scripts/build.sh`)
- [ ] Los linters pasan (`./scripts/lint.sh`)
- [ ] Los tests pasan (`./scripts/test.sh`)
- [ ] Los cambios tienen cobertura de test (si aplica)
- [ ] El PR tiene título en formato Conventional Commits
- [ ] Descripción explica el **qué** y **por qué**
- [ ] Si hay cambios de API, `openapi.yaml` está actualizado
- [ ] Variables de entorno nuevas están documentadas en `.env.example`

## Estándares de código

### TypeScript

- **Strict mode** habilitado en todos los `tsconfig.json`
- Preferir `type` sobre `interface` para tipos de datos planos
- Usar `interface` para contratos (clases, objetos extensibles)
- Evitar `any` — usar `unknown` + type narrowing
- Documentar funciones públicas con JSDoc si no son obvias

### Servicios Node.js (Express)

- Usar los helpers de `@piums/shared-utils` (logger, errors, response)
- Toda validación de input via **Zod** antes de tocar la DB
- Respuestas siempre vía `jsonSuccess()` / `jsonError()` / `jsonPaginated()`
- Errores HTTP: lanzar `AppError` / `NotFoundError` etc.
- No retornar contraseñas ni campos sensibles en responses
- Logging: `logger.info()` en operaciones importantes, `logger.error()` en errores

### Next.js (frontend)

- Componentes de UI en `@piums/ui`, NO redefinir localmente
- Nomenclatura de archivos: `kebab-case.tsx`
- Nomenclatura de componentes: `PascalCase`
- Usar `@piums/sdk` para todas las llamadas a la API
- Evitar `useEffect` para data fetching — usar React Query / SWR

### Base de datos

- Todos los cambios de schema via **Prisma migrations** (`prisma migrate dev`)
- Nunca editar el archivo de migración generado
- Naming: tablas en `snake_case`, campos en `camelCase` en el schema Prisma

## Estructura de un servicio

```
services/mi-servicio/
├── src/
│   ├── index.ts              # Entry point (Express app + listen)
│   ├── controller/
│   │   └── mi.controller.ts  # Request handlers (thin layer)
│   ├── services/
│   │   └── mi.service.ts     # Business logic
│   ├── routes/
│   │   └── mi.routes.ts      # Router + middleware
│   ├── schemas/
│   │   └── mi.schemas.ts     # Zod validation schemas
│   └── middleware/
│       └── auth.ts           # Auth middleware
├── prisma/
│   └── schema.prisma         # DB schema (si el servicio tiene DB)
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Code Review

- Todos los PRs requieren **al menos 1 aprobación**
- Reviewer debe verificar lógica de negocio, no solo estilo
- Usar "Request Changes" con explicación detallada si hay problemas
- Approved → merge por el **autor del PR**
- Merge strategy: **Squash and merge** hacia develop
