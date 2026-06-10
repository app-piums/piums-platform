# Auditoría de seguridad — Plataforma Piums (2026-06-10)

Revisión completa del backend (monorepo) y las 4 apps móviles
(`/Volumes/piums/Proyectos/`). Baseline: `security-review-2026-05-25.md`.
Este documento registra hallazgos verificados en código y los fixes aplicados
en esta sesión. **No contiene valores de credenciales.**

## Resumen

- **Críticos corregidos en código:** secretos reales en archivos trackeados,
  tokens OAuth no revocables y con PII, pinning TLS roto en Android, WebView de
  pagos que aceptaba cualquier certificado, upload KYC sin auth en el gateway.
- **Acción manual obligatoria del usuario:** rotar todas las credenciales
  filtradas (siguen en la historia de git, ver §1).
- **Preparado para revisión:** endurecimiento de Kubernetes (NetworkPolicy,
  RBAC, securityContext) en `infra/k8s/hardening/` — no activado.

---

## 1. Secretos (CRÍTICO) — requiere rotación manual

`infra/k8s/overlays/local/dev-secrets.yaml` y varios docs/compose contenían
credenciales **reales y activas**. Ya no están en HEAD (limpiados esta sesión),
pero **siguen en la historia de git**, pusheada a 3 remotes. Reescribir la
historia no garantiza su eliminación (GitHub retiene commits huérfanos por SHA),
por lo que **la rotación es la única mitigación real**.

Aplicado por Claude:
- `docker-compose.dev.yml`: credenciales movidas a variables de entorno
  (`infra/docker/.env`, gitignorado; `.env.example` como plantilla).
- Untrack de `credenciales-demo.md` y `docker-compose.dev.yml.bak`.
- Redacción de Tilopay/TikTok/Cloudinary/Firebase en `planpagos.md`,
  `mobile-implementation-guide.md`, `security-review-2026-05-25.md`, `AGENT.md`.
- `.gitignore`: `credenciales-demo.md`, `.fuse_hidden*`, `_tmp_*`.

**Pendiente del usuario — rotar (asumir comprometidas desde ~13 mayo):**
Firebase service-account key, Tilopay API key/secret/user, Cloudinary API
secret, Google OAuth client secret, TikTok client secret, Resend API key,
secretos JWT/REFRESH/INTERNAL_SERVICE/SESSION y passwords de DB (verificar
primero si producción usa los mismos valores: `kubectl get secret piums-secrets
-n piums -o yaml`), y el password demo `Admin1234!`. Tras rotar: actualizar el
Secret del cluster + redeploy.

---

## 2. Backend — corregido

| Hallazgo | Severidad | Fix |
|---|---|---|
| `JWT_SECRET` con fallback inseguro en 10 servicios | Alto | Falla en arranque si falta en producción (commit JWT_SECRET) |
| Tokens OAuth (Google/Facebook/TikTok) firmados inline con `email` y sin `jti` → no revocables (PII-M2 + PII-M6) | Alto | `issueOAuthAccessToken`: jti + registro de Session, sin email (`oauth.routes.ts`) |
| Revocación JTI ausente en rutas sensibles de users/artists/catalog/reviews (PII-M6) | Alto | `requireActiveSession` añadido en rutas mutantes de los 4 servicios |
| Upload KYC público en el gateway mientras users-service exige auth | Medio | Gateway ahora exige `authMiddleware` + rate limit propio en `/api/users/documents/upload` |
| `moderation-service` corría como root | Medio | `USER node` en su Dockerfile |

### Verificado y ya resuelto (del audit de mayo)
API-M4 (límite cantidad tickets), OPS-M1 (lock distribuido en cron de captura),
ownership en catalog/booking (no aceptan `artistId` del body), idempotencia de
webhooks Stripe/Tilopay y recálculo server-side del monto de pago: **confirmados
en código**.

### Endurecimiento K8s — cableado para la migración DOKS (actualización 2026-06-10)
`securityContext` no-root (UID 1000, seccomp RuntimeDefault) + `serviceAccountName:
piums-app` + `automountServiceAccountToken:false` **cableados en el overlay de
producción** (aplican en el `kubectl apply -k` del corte a DOKS; el docker-compose
actual no cambia). `infra/k8s/hardening/` es ahora una base kustomize con el RBAC.
CI valida los manifests (`backend-ci.yml` → `validate-k8s-manifests`,
`kustomize build | kubeconform -strict`; los 4 overlays pasan, 0 inválidos).
Bug preexistente corregido de paso: los overlays production/staging usaban
`configMapGenerator behavior:merge` contra un ConfigMap-resource → **no renderizaban**;
ahora sí. **NetworkPolicy** queda opt-in (validar en staging durante el corte).
Tags `:latest`, rate-limit de ingress, endurecimiento por-contenedor
(`readOnlyRootFilesystem`) e INF-M2 (etcd, gestionado por DOKS) documentados en el README.

---

## 3. Apps móviles

### Android — corregido (commiteado en sus repos)
| Hallazgo | App | Severidad | Fix |
|---|---|---|---|
| Certificate pinning con placeholder inválido; en Artista apuntaba a `artist.piums.io` (no-op, la app usa `backend.piums.io`) | ambas | Crítico | Pins SPKI reales verificados (leaf + LE E8 + ISRG X1 + GTS R1/R4 backup por Cloudflare) |
| WebView de pagos aceptaba cualquier error SSL (`handler.proceed()`) y mixed-content | Cliente | Crítico | `handler.cancel()` + `MIXED_CONTENT_NEVER_ALLOW` |
| `android:allowBackup="true"` (extracción de prefs cifradas vía backup) | ambas | Alto | `allowBackup=false` |
| `isMinifyEnabled=false` en release (sin ofuscación) | Artista | Alto | `true` (R8 validado) |
| Regla ProGuard con paquete equivocado | Cliente | Medio | Corregido a `com.piums.cliente` |

**Deep link OAuth — RESUELTO (actualización 2026-06-10):** se verificó que el login
social web móvil (Facebook/TikTok) estaba **roto** (Android llamaba a
`/api/auth/oauth/{provider}`, ruta inexistente → 404) y que el handler
`piums://auth/callback?jwt=` era un sumidero latente de session-fixation. Por decisión
de producto se **eliminó el path inseguro** de Cliente Android e iOS (handler de deep
link, intent-filter, `OAuthWebLoginHelper`/`OAuthCallbackManager`/`OAuthWebLogin.swift`,
métodos `loginWithOAuth`/`loginWithFacebook`/`loginWithTikTok` y botones). Quedan
**Google/Apple nativos** (Firebase, sin deep link). Builds verificados: Cliente Android
`compileReleaseKotlin` OK, Cliente iOS `xcodebuild` BUILD SUCCEEDED. El login social
**web** (Next.js + rutas `/auth/facebook|tiktok`) no se tocó.
Nota: el flujo iOS usaba `ASWebAuthenticationSession` (HTTPS, no custom scheme) y era
más seguro que el de Android; se removió por consistencia y es reversible.

### iOS — corregido en código (los repos NO tienen git: hacer `git init`)
| Hallazgo | App | Severidad | Fix |
|---|---|---|---|
| Keychain con `WhenUnlockedThisDeviceOnly` (más débil que Cliente) | Artista | Alto | `WhenPasscodeSetThisDeviceOnly` + fallback |
| `print()` de response/request body (PII) sin `#if DEBUG` | Cliente | Alto | Envuelto en `#if DEBUG` |

**Verificado sin problema:** tokens en Keychain, ATS HTTPS-only (Cliente), cert
pinning real (ambas, public-key pinning en Artista), logs de APNs/FCM ya bajo
`#if DEBUG`, campos de password con `textContentType`.

**Pendiente del usuario (iOS):** el deep link inseguro ya se eliminó (ver §3 arriba).
Queda: inicializar repos git para versionar las apps iOS (hoy no tienen `.git`).

### Bug relacionado (fuera del alcance de estos pendientes)
auth-service usa `express-session` con **MemoryStore** (`index.ts:37`): el `state`/PKCE
de TikTok **web** no sobrevive entre las 3 réplicas de producción → el login TikTok web
es racy en prod. Migrar a store Redis (ya existe `REDIS_URL`). No se tocó porque el login
social móvil se removió; afecta solo la web.

---

## 4. Checklist post-rotación (smoke del usuario)

Tras rotar credenciales y redeploy, verificar: login email + Google + TikTok,
un pago sandbox Tilopay, envío de email (Resend), upload a Cloudinary, push FCM.
En móvil: build release, conexión OK con pins nuevos, y conexión que DEBE FALLAR
con un proxy MITM (Charles con CA propia) — esa es la prueba real del pinning.
