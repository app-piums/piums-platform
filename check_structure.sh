#!/usr/bin/env bash
# Comprueba presencia de archivos/dirs esperados en piums-platform
root="${1:-/Users/piums/Desktop/piums-platform}"
missing=0

expect=(
  "README.md"
  "docs/kickoff.md"
  "docs/architecture/diagrams/mvp-flow.mmd"
  "docs/architecture/diagrams/microservices.mmd"
  "docs/architecture/decisions/adr-0001-database.md"
  "docs/architecture/decisions/adr-0002-monorepo.md"
  "docs/api-contracts/openapi.yaml"
  ".github/workflows/ci.yml"
  ".github/workflows/deploy-staging.yml"
  ".github/workflows/deploy-prod.yml"
  "apps/web"
  "apps/mobile"
  "apps/gateway"
  "services/auth-service"
  "services/users-service"
  "services/artists-service"
  "services/catalog-service"
  "services/booking-service"
  "services/reviews-service"
  "services/payments-service"
  "services/notifications-service"
  "services/search-service"
  "packages/shared-types"
  "packages/shared-utils"
  "packages/shared-config"
  "packages/sdk"
  "packages/ui"
  "infra/docker/docker-compose.dev.yml"
  "infra/docker/docker-compose.staging.yml"
  "infra/k8s/base"
  "infra/k8s/overlays/staging"
  "infra/k8s/overlays/production"
  "infra/terraform"
  "infra/nginx"
  "scripts/dev.sh"
  "scripts/lint.sh"
  "scripts/seed.sh"
  ".env.example"
  ".editorconfig"
  "package.json"
  "pnpm-workspace.yaml"
)

printf "Comprobando %s\n\n" "$root"
for p in "${expect[@]}"; do
  if [ -e "$root/$p" ]; then
    printf "OK    %s\n" "$p"
  else
    printf "MISSING %s\n" "$p"
    missing=1
  fi
done

if [ $missing -eq 0 ]; then
  printf "\nTodos los archivos/directorios esperados existen.\n"
  exit 0
else
  printf "\nFaltan elementos. Revisa los MISSING arriba.\n"
  exit 2
fi
