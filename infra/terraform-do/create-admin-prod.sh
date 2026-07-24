#!/bin/zsh
# Crea (o resetea) el usuario admin en la base de producción (piums_auth del
# Postgres gestionado), ejecutando Prisma DENTRO del pod auth-service.
#
# Email y contraseña se pasan por variables de entorno (NO se hardcodean en el
# repo). Si no se pasa ADMIN_PW, se genera una aleatoria fuerte.
#
#   ADMIN_EMAIL=admin@piums.io ADMIN_PW='TuPass' zsh infra/terraform-do/create-admin-prod.sh
#
set -e
CTX=do-nyc3-piums-prod
NS=piums

EMAIL="${ADMIN_EMAIL:-admin@piums.io}"
PW="${ADMIN_PW:-$(openssl rand -base64 15)Aa1!}"

POD=$(kubectl --context "$CTX" -n "$NS" get pod -l app=auth-service -o jsonpath='{.items[0].metadata.name}')
echo "Usando pod: $POD"

kubectl --context "$CTX" -n "$NS" exec -i "$POD" -- env ADMIN_PW="$PW" ADMIN_EMAIL="$EMAIL" node - <<'NODE'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
(async () => {
  const prisma = new PrismaClient();
  const email = process.env.ADMIN_EMAIL;
  const hash = await bcrypt.hash(process.env.ADMIN_PW, 12);
  const u = await prisma.user.upsert({
    where: { email },
    update: { passwordHash: hash, role: 'admin', status: 'ACTIVE', emailVerified: true, isVerified: true, isBlocked: false },
    create: { email, nombre: 'Admin Piums', passwordHash: hash, role: 'admin', status: 'ACTIVE', emailVerified: true, isVerified: true },
  });
  console.log('ADMIN_OK', u.id, u.email, u.role, u.status);
  await prisma.$disconnect();
})().catch(e => { console.error('ADMIN_ERR', e.message); process.exit(1); });
NODE

echo ""
echo "======================================================"
echo "  ADMIN creado / actualizado"
echo "  Email:    $EMAIL"
echo "  (contraseña: la que pasaste en ADMIN_PW)"
echo "======================================================"
