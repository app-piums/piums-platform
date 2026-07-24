#!/bin/zsh
# Copia piums-secrets del cluster local (docker-desktop) al DOKS (do-nyc3-piums-prod),
# sobreescribiendo las conexiones de Postgres/Valkey con los outputs de Terraform.
# No imprime ni guarda ningún valor secreto. Correr desde infra/terraform-do.
set -e
cd "$(dirname "$0")"

TF=$(terraform output -json)
DEV=$(kubectl --context docker-desktop -n piums get secret piums-secrets -o json)

jq -n --argjson tf "$TF" --argjson dev "$DEV" '
  ($tf.database_urls.value) as $dbs |
  ($dbs.piums_auth | capture("doadmin:(?<p>[^@]+)@").p) as $pgpass |
  ({
    AUTH_DATABASE_URL: $dbs.piums_auth,
    USERS_DATABASE_URL: $dbs.piums_users,
    ARTISTS_DATABASE_URL: $dbs.piums_artists,
    CATALOG_DATABASE_URL: $dbs.piums_catalog,
    BOOKING_DATABASE_URL: $dbs.piums_bookings,
    PAYMENTS_DATABASE_URL: $dbs.piums_payments,
    REVIEWS_DATABASE_URL: $dbs.piums_reviews,
    NOTIFICATIONS_DATABASE_URL: $dbs.piums_notifications,
    SEARCH_DATABASE_URL: $dbs.piums_search,
    CHAT_DATABASE_URL: $dbs.piums_chat,
    MODERATION_DATABASE_URL: $dbs.piums_moderation,
    DATABASE_URL: $dbs.piums_auth,
    POSTGRES_PASSWORD: $pgpass,
    REDIS_HOST: $tf.redis_host.value,
    REDIS_PORT: ($tf.redis_port.value|tostring),
    REDIS_PASSWORD: $tf.redis_password.value,
    REDIS_TLS: "true",
    REDIS_URL: $tf.redis_url.value
  } | map_values(@base64)) as $ov |
  {apiVersion: "v1", kind: "Secret", type: "Opaque",
   metadata: {name: "piums-secrets", namespace: "piums"},
   data: ($dev.data + $ov)}
' | kubectl --context do-nyc3-piums-prod apply -f -

echo "OK - claves en el secret de prod:"
kubectl --context do-nyc3-piums-prod -n piums get secret piums-secrets -o json | jq '.data | length'
