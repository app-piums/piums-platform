## Descripción

<!-- Qué hace este PR y por qué es necesario -->

Fixes #<!-- número de issue -->

## Tipo de cambio

- [ ] 🐛 Bug fix (cambio que corrige un issue)
- [ ] ✨ Nueva feature (cambio que agrega funcionalidad)
- [ ] 🔨 Refactor (cambio que mejora código sin cambiar comportamiento)
- [ ] 📝 Documentación
- [ ] 🏗️ Infraestructura / DevOps
- [ ] ⚡ Performance
- [ ] 🧪 Tests

## Checklist

### Código
- [ ] Compila sin errores (`./scripts/build.sh`)
- [ ] Linters pasan (`./scripts/lint.sh`)
- [ ] Tests pasan (`./scripts/test.sh`)

### Calidad
- [ ] El código sigue las convenciones del proyecto ([contributing.md](../docs/guides/contributing.md))
- [ ] No se incluye código comentado o archivos innecesarios
- [ ] Variables de entorno nuevas están en `.env.example`

### API (si aplica)
- [ ] `docs/api-contracts/openapi.yaml` actualizado
- [ ] Endpoints documentados con schemas correctos

### Base de datos (si aplica)
- [ ] Migración Prisma creada (`prisma migrate dev --name <nombre>`)
- [ ] La migración es reversible o tiene nota de rollback

### Seguridad
- [ ] No se exponen credenciales / secretos
- [ ] El input del usuario está validado (Zod)
- [ ] Endpoints protegidos con auth middleware donde corresponde

## Screenshots / Videos (si aplica)

<!-- Adjunta capturas o GIFs si el cambio es visual -->

## Notas para reviewer

<!-- Algo específico que el reviewer debe saber o probar -->
