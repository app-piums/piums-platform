#!/bin/bash
# Script para crear usuario admin inicial
# Uso: ./scripts/create-admin-user.sh [password]
set -e

ADMIN_EMAIL="admin@piums.com"
ADMIN_PASSWORD="${1:-Admin1234!}"
ADMIN_NAME="Admin Piums"

echo "Creando usuario admin..."

HASH=$(docker exec piums-auth-service node -e "
const bcrypt = require('bcryptjs');
bcrypt.hash('${ADMIN_PASSWORD}', 12).then(h => console.log(h));
" 2>/dev/null)

docker exec piums-postgres psql -U piums -d piums_auth -c "
INSERT INTO users (
  id, nombre, email, \"passwordHash\", role, status,
  \"emailVerified\", \"isVerified\", \"isBlocked\",
  \"twoFactorEnabled\", \"backupCodes\",
  \"failedLoginAttempts\", \"lastPasswordChange\",
  \"createdAt\", \"updatedAt\"
) VALUES (
  gen_random_uuid(),
  '${ADMIN_NAME}',
  '${ADMIN_EMAIL}',
  '${HASH}',
  'admin', 'ACTIVE', true, true, false, false, '{}',
  0, NOW(), NOW(), NOW()
) ON CONFLICT (email) DO UPDATE SET
  \"passwordHash\" = EXCLUDED.\"passwordHash\",
  role = 'admin',
  status = 'ACTIVE';
"

echo "✓ Admin creado: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}"
