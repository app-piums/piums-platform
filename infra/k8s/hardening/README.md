# Endurecimiento de Kubernetes

Manifests que cierran hallazgos de la auditoría de seguridad (junio 2026).

## Estado

| Archivo | Hallazgo | Estado |
|---|---|---|
| `securitycontext-patch.yaml` | Pods corren como root (sin `securityContext`) | **CABLEADO** en el overlay de producción (patch inline con `target: {kind: Deployment}`). Pod-level no-root (UID 1000); todas las imágenes ya usan `USER node`. |
| `rbac.yaml` | Pods usan la ServiceAccount `default` con acceso amplio al API server | **CABLEADO**: `overlays/production` lo incluye vía `resources: - ../../hardening` y aplica `serviceAccountName: piums-app` + `automountServiceAccountToken: false` a todos los Deployments. |
| `networkpolicy.yaml` | Sin segmentación de red (cualquier pod habla con cualquier pod) | **OPT-IN, no cableado**. Es default-deny; aplicar y validar en staging durante el corte a DOKS. |

Esta carpeta es una base kustomize (`kustomization.yaml` incluye solo `rbac.yaml`).
El render se valida en CI (`backend-ci.yml` → job `validate-k8s-manifests`,
`kustomize build | kubeconform -strict`).

## Pendiente por-contenedor (tras validar en staging)

El patch cableado es solo a nivel de **pod**. Falta endurecer por-contenedor:
`allowPrivilegeEscalation: false`, `capabilities.drop: [ALL]` y
`readOnlyRootFilesystem: true`. Este último requiere validar las escrituras de cada
servicio (`/tmp`, `prisma`) antes de activarlo — hacerlo por-servicio.

## NetworkPolicy — activar durante el corte a DOKS

1. Confirmar el namespace real del ingress controller (el manifest asume
   `ingress-nginx`; ajustar el `namespaceSelector` si difiere).
2. Postgres/Redis son **managed** en DOKS → el egress hacia ellos NO debe
   bloquearse (la regla `allow-dns-egress` ya deja egress general; no añadir un
   default-deny-egress sin reglas explícitas a las DB managed).
3. Aplicar `kubectl apply -f networkpolicy.yaml` en staging primero y verificar que
   el tráfico inter-servicio sigue funcionando (`allow-intra-namespace`).
   Requiere un CNI con soporte de NetworkPolicy (DOKS/Cilium lo tiene).

## Pendiente manual (no es manifest)

- **Tags de imagen `:latest`** en `deployments.yaml`: migrar a versión fija
  (`:v1.2.3`) para builds reproducibles y rollback. Cambiar `imagePullPolicy` a
  `IfNotPresent`.
- **INF-M2 (cifrado de Secrets en reposo / etcd)**: en DigitalOcean DOKS el
  plano de control (etcd) es gestionado y cifrado por el proveedor — confirmar en
  su documentación y cerrar el hallazgo, o habilitar un KMS/sealed-secrets si se
  requiere control propio.
- **Rate limiting a nivel ingress**: añadir anotaciones
  `nginx.ingress.kubernetes.io/limit-rps` y `limit-connections` en
  `infra/k8s/base/ingress.yaml`.
