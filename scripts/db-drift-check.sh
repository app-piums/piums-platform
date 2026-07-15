#!/usr/bin/env bash
# Compara el schema.prisma DE TU COPIA LOCAL contra la base real de cada servicio y
# avisa ANTES de desplegar si el deploy destruiría datos.
#
# Por qué existe: los contenedores corren `prisma db push` al arrancar. db push SÍ
# detecta la pérdida de datos, avisa y sale con 1 — y como el CMD encadena
# `... db push; fi && node dist/index.js`, node no arranca y el pod entra en
# CrashLoopBackOff. O sea que estás protegido, pero te enteras tarde y de forma
# indirecta: en los logs de un pod que no levanta. Esto lo adelanta a antes del
# deploy, cuando todavía puedes escribir la migración de datos.
#
# Compara el schema del working copy (no el horneado en la imagen que corre) para
# que responda la pregunta útil: "si despliego esto, ¿qué le pasa a la base?".
#
# Uso:
#   ./scripts/db-drift-check.sh            # revisa todos los servicios
#   ./scripts/db-drift-check.sh artists    # revisa uno
#
# Códigos de salida: 0 = sin cambios o cambios seguros | 1 = cambios DESTRUCTIVOS
#
# El diff corre DENTRO de cada pod usando su propio DATABASE_URL, así que la
# contraseña de postgres nunca sale del clúster.

set -uo pipefail

NS="${PIUMS_NAMESPACE:-piums}"
SERVICES=(artists auth booking catalog chat moderation notifications payments reviews search users)
[ $# -gt 0 ] && SERVICES=("$@")

# Operaciones que pueden tirar datos. `DROP INDEX` NO está aquí a propósito:
# borrar un índice no pierde información, solo rendimiento.
DESTRUCTIVE_RE='DROP COLUMN|DROP TABLE|DROP SCHEMA|TRUNCATE|DROP CONSTRAINT|ALTER COLUMN.*(SET NOT NULL|TYPE)|DROP DEFAULT'

red()   { printf '\033[31m%s\033[0m\n' "$1"; }
green() { printf '\033[32m%s\033[0m\n' "$1"; }
amber() { printf '\033[33m%s\033[0m\n' "$1"; }

destructive_found=0
changes_found=0

for svc in "${SERVICES[@]}"; do
  dep="${svc}-service"

  local_schema="services/${dep}/prisma/schema.prisma"

  if ! kubectl get "deploy/$dep" -n "$NS" >/dev/null 2>&1; then
    printf '%-24s %s\n' "$dep" "(sin deployment, se omite)"
    continue
  fi
  if [ ! -f "$local_schema" ]; then
    printf '%-24s %s\n' "$dep" "(sin $local_schema, se omite)"
    continue
  fi

  # Se manda el schema local al pod por stdin: el diff es "mi copia de trabajo vs
  # la base viva", no "la imagen que ya corre vs la base viva".
  diff_sql=$(kubectl exec -i -n "$NS" "deploy/$dep" -- sh -c \
    'cat > /tmp/_local.prisma && npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel /tmp/_local.prisma --script 2>&1; rm -f /tmp/_local.prisma' \
    < "$local_schema" 2>/dev/null)

  if [ -z "$diff_sql" ]; then
    printf '%-24s ' "$dep"; amber "sin respuesta del pod (¿arrancando?)"
    continue
  fi

  if grep -q 'empty migration' <<<"$diff_sql"; then
    printf '%-24s ' "$dep"; green "en sincronía"
    continue
  fi

  ddl=$(grep -E '^(ALTER|CREATE|DROP|TRUNCATE)' <<<"$diff_sql")
  peligro=$(grep -Ei "$DESTRUCTIVE_RE" <<<"$ddl")

  if [ -n "$peligro" ]; then
    destructive_found=1
    # Se avisa por la FORMA del DDL, sin mirar si hay filas: es deliberadamente más
    # conservador que db push, que solo se planta si la columna trae valores. Una
    # columna hoy vacía puede tener datos cuando esto llegue a producción.
    printf '%-24s ' "$dep"; red "PUEDE DESTRUIR DATOS"
    sed 's/^/      /' <<<"$peligro"
  else
    changes_found=1
    printf '%-24s ' "$dep"; amber "$(wc -l <<<"$ddl" | tr -d ' ') cambio(s) seguro(s) pendiente(s)"
    sed 's/^/      /' <<<"$ddl"
  fi
done

echo
if [ "$destructive_found" = 1 ]; then
  red 'Hay cambios que pueden destruir datos.'
  echo 'Si la columna trae valores, db push se planta al arrancar el contenedor y el pod'
  echo 'entra en CrashLoopBackOff (node no llega a ejecutarse). Si está vacía, lo aplica'
  echo 'sin decir nada — por eso conviene revisarlo aquí y no allá.'
  echo
  echo 'Antes de desplegar: respalda (pg_dumpall) y escribe la migración de datos a mano.'
  echo 'No uses --accept-data-loss para silenciarlo sin más.'
  exit 1
fi

if [ "$changes_found" = 1 ]; then
  amber 'Hay cambios pendientes, ninguno destruye datos.'
  echo 'Se aplican solos al reiniciar los pods, o ya con:'
  echo '  kubectl exec -n '"$NS"' deploy/<servicio> -- npx prisma db push --skip-generate'
  exit 0
fi

green 'Todas las bases están en sincronía con su schema.prisma.'
