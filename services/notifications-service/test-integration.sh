#!/bin/bash

# =============================================================================
# Notifications Service - Integration Tests
# =============================================================================
# Este script prueba todos los endpoints del servicio de notificaciones
# Requiere: jq (para formatear JSON)
# =============================================================================

set -e  # Salir si algún comando falla

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
BASE_URL="http://localhost:4006"
AUTH_URL="http://localhost:4001"

# Contadores
TESTS_PASSED=0
TESTS_FAILED=0

# =============================================================================
# Funciones de utilidad
# ============================================================================

print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}► $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_test() {
    echo -e "${YELLOW}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓ PASS${NC} $1"
    ((TESTS_PASSED++))
}

print_error() {
    echo -e "${RED}✗ FAIL${NC} $1"
    ((TESTS_FAILED++))
}

assert_status() {
    local expected=$1
    local actual=$2
    local test_name=$3
    
    if [ "$actual" -eq "$expected" ]; then
        print_success "$test_name (status: $actual)"
    else
        print_error "$test_name (expected: $expected, got: $actual)"
    fi
}

assert_field() {
    local field=$1
    local value=$2
    local test_name=$3
    
    if [ -n "$value" ] && [ "$value" != "null" ]; then
        print_success "$test_name (value: $value)"
    else
        print_error "$test_name (field '$field' missing or null)"
    fi
}

# =============================================================================
# Tests
# =============================================================================

print_header "1. Health Check"

print_test "GET /health"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)
HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | tail -n 1)

echo "$HEALTH_BODY" | jq '.' || echo "$HEALTH_BODY"
assert_status 200 $HEALTH_STATUS "Health check debe retornar 200"

SERVICE_NAME=$(echo "$HEALTH_BODY" | jq -r '.service')
assert_field "service" "$SERVICE_NAME" "Debe retornar nombre del servicio"

# =============================================================================
print_header "2. Autenticación (Obtener tokens)"

print_test "POST $AUTH_URL/api/auth/register - Registrar usuario 1"
USER1_REGISTER=$(curl -s -w "\n%{http_code}" -X POST "$AUTH_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "user1-notif-test@test.com",
        "password": "Test1234!",
        "name": "Usuario 1 Notifications"
    }')
USER1_REGISTER_BODY=$(echo "$USER1_REGISTER" | head -n -1)
USER1_TOKEN=$(echo "$USER1_REGISTER_BODY" | jq -r '.token // empty')
USER1_ID=$(echo "$USER1_REGISTER_BODY" | jq -r '.user.id // empty')

if [ -z "$USER1_TOKEN" ]; then
    print_test "POST $AUTH_URL/api/auth/login - Login usuario 1"
    USER1_LOGIN=$(curl -s -w "\n%{http_code}" -X POST "$AUTH_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "user1-notif-test@test.com",
            "password": "Test1234!"
        }')
    USER1_LOGIN_BODY=$(echo "$USER1_LOGIN" | head -n -1)
    USER1_TOKEN=$(echo "$USER1_LOGIN_BODY" | jq -r '.token')
    USER1_ID=$(echo "$USER1_LOGIN_BODY" | jq -r '.user.id')
fi

echo "Usuario 1 token: ${USER1_TOKEN:0:30}..."
echo "Usuario 1 ID: $USER1_ID"

print_test "POST $AUTH_URL/api/auth/register - Registrar usuario 2"
USER2_REGISTER=$(curl -s -w "\n%{http_code}" -X POST "$AUTH_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "user2-notif-test@test.com",
        "password": "Test1234!",
        "name": "Usuario 2 Notifications"
    }')
USER2_REGISTER_BODY=$(echo "$USER2_REGISTER" | head -n -1)
USER2_ID=$(echo "$USER2_REGISTER_BODY" | jq -r '.user.id // empty')

if [ -z "$USER2_ID" ]; then
    print_test "Login usuario 2 (ya existe)"
    USER2_LOGIN=$(curl -s -X POST "$AUTH_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "user2-notif-test@test.com",
            "password": "Test1234!"
        }')
    USER2_ID=$(echo "$USER2_LOGIN" | jq -r '.user.id')
fi

echo "Usuario 2 ID: $USER2_ID"

# =============================================================================
print_header "3. Crear Template de Notificación"

print_test "POST /api/notifications/templates"
TEMPLATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/notifications/templates" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $USER1_TOKEN" \
    -d '{
        "key": "test_notification",
        "name": "Notificación de Prueba",
        "description": "Template de prueba para tests",
        "type": "SYSTEM_NOTIFICATION",
        "title": "Hola {{userName}}",
        "message": "Este es un mensaje de prueba para {{userName}} sobre {{topic}}",
        "emailSubject": "Notificación de {{topic}}",
        "variables": ["userName", "topic"],
        "priority": "normal",
        "category": "test"
    }')
TEMPLATE_BODY=$(echo "$TEMPLATE_RESPONSE" | head -n -1)
TEMPLATE_STATUS=$(echo "$TEMPLATE_RESPONSE" | tail -n 1)

echo "$TEMPLATE_BODY" | jq '.'
# Si ya existe, obtendremos un error 400, pero continuamos
if [ "$TEMPLATE_STATUS" -eq 201 ] || [ "$TEMPLATE_STATUS" -eq 400 ]; then
    print_success "Template creado o ya existe"
    ((TESTS_PASSED++))
else
    print_error "Error creando template (status: $TEMPLATE_STATUS)"
    ((TESTS_FAILED++))
fi

# =============================================================================
print_header "4. Listar Templates"

print_test "GET /api/notifications/templates"
LIST_TEMPLATES_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/notifications/templates" \
    -H "Authorization: Bearer $USER1_TOKEN")
LIST_TEMPLATES_BODY=$(echo "$LIST_TEMPLATES_RESPONSE" | head -n -1)
LIST_TEMPLATES_STATUS=$(echo "$LIST_TEMPLATES_RESPONSE" | tail -n 1)

echo "$LIST_TEMPLATES_BODY" | jq '.' | head -20
assert_status 200 $LIST_TEMPLATES_STATUS "Listar templates"

# =============================================================================
print_header "5. Enviar Notificación Directa"

print_test "POST /api/notifications/send - Email notification"
SEND_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/notifications/send" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $USER1_TOKEN" \
    -d "{
        \"userId\": \"$USER1_ID\",
        \"type\": \"SYSTEM_NOTIFICATION\",
        \"channel\": \"IN_APP\",
        \"title\": \"Notificación de Prueba\",
        \"message\": \"Este es un mensaje de prueba del sistema de notificaciones\",
        \"data\": {
            \"testId\": \"test-123\",
            \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
        },
        \"priority\": \"high\",
        \"category\": \"test\"
    }")
SEND_BODY=$(echo "$SEND_RESPONSE" | head -n -1)
SEND_STATUS=$(echo "$SEND_RESPONSE" | tail -n 1)

echo "$SEND_BODY" | jq '.'
assert_status 201 $SEND_STATUS "Enviar notificación directa"

NOTIFICATION_ID=$(echo "$SEND_BODY" | jq -r '.id')
echo "Notification ID: $NOTIFICATION_ID"

# =============================================================================
print_header "6. Obtener Notificación por ID"

print_test "GET /api/notifications/$NOTIFICATION_ID"
GET_NOTIF_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/notifications/$NOTIFICATION_ID" \
    -H "Authorization: Bearer $USER1_TOKEN")
GET_NOTIF_BODY=$(echo "$GET_NOTIF_RESPONSE" | head -n -1)
GET_NOTIF_STATUS=$(echo "$GET_NOTIF_RESPONSE" | tail -n 1)

echo "$GET_NOTIF_BODY" | jq '.'
assert_status 200 $GET_NOTIF_STATUS "Obtener notificación por ID"

# =============================================================================
print_header "7. Enviar desde Template"

print_test "POST /api/notifications/template"
TEMPLATE_SEND_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/notifications/template" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $USER1_TOKEN" \
    -d "{
        \"userId\": \"$USER1_ID\",
        \"templateKey\": \"test_notification\",
        \"channel\": \"IN_APP\",
        \"variables\": {
            \"userName\": \"Usuario de Prueba\",
            \"topic\": \"Sistema de Templates\"
        }
    }")
TEMPLATE_SEND_BODY=$(echo "$TEMPLATE_SEND_RESPONSE" | head -n -1)
TEMPLATE_SEND_STATUS=$(echo "$TEMPLATE_SEND_RESPONSE" | tail -n 1)

echo "$TEMPLATE_SEND_BODY" | jq '.'
assert_status 201 $TEMPLATE_SEND_STATUS "Enviar desde template"

TEMPLATE_NOTIF_ID=$(echo "$TEMPLATE_SEND_BODY" | jq -r '.id')

# =============================================================================
print_header "8. Batch Send"

print_test "POST /api/notifications/batch"
BATCH_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/notifications/batch" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $USER1_TOKEN" \
    -d "{
        \"userIds\": [\"$USER1_ID\", \"$USER2_ID\"],
        \"type\": \"SYSTEM_NOTIFICATION\",
        \"channel\": \"IN_APP\",
        \"title\": \"Anuncio para Todos\",
        \"message\": \"Este es un mensaje enviado a múltiples usuarios\",
        \"priority\": \"normal\"
    }")
BATCH_BODY=$(echo "$BATCH_RESPONSE" | head -n -1)
BATCH_STATUS=$(echo "$BATCH_RESPONSE" | tail -n 1)

echo "$BATCH_BODY" | jq '.'
assert_status 200 $BATCH_STATUS "Batch send"

BATCH_SUCCESSFUL=$(echo "$BATCH_BODY" | jq -r '.successful')
echo "Notificaciones enviadas exitosamente: $BATCH_SUCCESSFUL"

# =============================================================================
print_header "9. Buscar Notificaciones"

print_test "GET /api/notifications?userId=$USER1_ID"
SEARCH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/notifications?userId=$USER1_ID&limit=10" \
    -H "Authorization: Bearer $USER1_TOKEN")
SEARCH_BODY=$(echo "$SEARCH_RESPONSE" | head -n -1)
SEARCH_STATUS=$(echo "$SEARCH_RESPONSE" | tail -n 1)

echo "$SEARCH_BODY" | jq '.'
assert_status 200 $SEARCH_STATUS "Buscar notificaciones"

TOTAL_NOTIFS=$(echo "$SEARCH_BODY" | jq -r '.pagination.total')
echo "Total de notificaciones para usuario 1: $TOTAL_NOTIFS"

# =============================================================================
print_header "10. Preferencias de Usuario"

print_test "GET /api/notifications/preferences"
GET_PREFS_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/notifications/preferences" \
    -H "Authorization: Bearer $USER1_TOKEN")
GET_PREFS_BODY=$(echo "$GET_PREFS_RESPONSE" | head -n -1)
GET_PREFS_STATUS=$(echo "$GET_PREFS_RESPONSE" | tail -n 1)

echo "$GET_PREFS_BODY" | jq '.'
assert_status 200 $GET_PREFS_STATUS "Obtener preferencias"

print_test "PUT /api/notifications/preferences"
UPDATE_PREFS_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/notifications/preferences" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $USER1_TOKEN" \
    -d '{
        "emailEnabled": true,
        "smsEnabled": false,
        "pushEnabled": true,
        "marketingNotifications": false,
        "dndEnabled": true,
        "dndStartHour": 22,
        "dndEndHour": 8
    }')
UPDATE_PREFS_BODY=$(echo "$UPDATE_PREFS_RESPONSE" | head -n -1)
UPDATE_PREFS_STATUS=$(echo "$UPDATE_PREFS_RESPONSE" | tail -n 1)

echo "$UPDATE_PREFS_BODY" | jq '.'
assert_status 200 $UPDATE_PREFS_STATUS "Actualizar preferencias"

# =============================================================================
print_header "11. Marcar como Leída"

print_test "POST /api/notifications/read"
MARK_READ_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/notifications/read" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $USER1_TOKEN" \
    -d "{
        \"notificationIds\": [\"$NOTIFICATION_ID\", \"$TEMPLATE_NOTIF_ID\"]
    }")
MARK_READ_BODY=$(echo "$MARK_READ_RESPONSE" | head -n -1)
MARK_READ_STATUS=$(echo "$MARK_READ_RESPONSE" | tail -n 1)

echo "$MARK_READ_BODY" | jq '.'
assert_status 200 $MARK_READ_STATUS "Marcar como leída"

UPDATED_COUNT=$(echo "$MARK_READ_BODY" | jq -r '.updated')
echo "Notificaciones marcadas como leídas: $UPDATED_COUNT"

# =============================================================================
print_header "12. Estadísticas"

print_test "GET /api/notifications/stats?userId=$USER1_ID"
STATS_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/notifications/stats?userId=$USER1_ID" \
    -H "Authorization: Bearer $USER1_TOKEN")
STATS_BODY=$(echo "$STATS_RESPONSE" | head -n -1)
STATS_STATUS=$(echo "$STATS_RESPONSE" | tail -n 1)

echo "$STATS_BODY" | jq '.'
assert_status 200 $STATS_STATUS "Obtener estadísticas"

# =============================================================================
print_header "13. Buscar con Filtros"

print_test "GET /api/notifications?status=READ&channel=IN_APP"
FILTER_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/notifications?userId=$USER1_ID&status=READ&channel=IN_APP" \
    -H "Authorization: Bearer $USER1_TOKEN")
FILTER_BODY=$(echo "$FILTER_RESPONSE" | head -n -1)
FILTER_STATUS=$(echo "$FILTER_RESPONSE" | tail -n 1)

echo "$FILTER_BODY" | jq '.' | head -30
assert_status 200 $FILTER_STATUS "Buscar con filtros"

# =============================================================================
print_header "14. Eliminar Notificación"

print_test "DELETE /api/notifications/$NOTIFICATION_ID"
DELETE_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/notifications/$NOTIFICATION_ID" \
    -H "Authorization: Bearer $USER1_TOKEN")
DELETE_STATUS=$(echo "$DELETE_RESPONSE" | tail -n 1)

assert_status 200 $DELETE_STATUS "Eliminar notificación"

# =============================================================================
print_header "15. Obtener Template por Key"

print_test "GET /api/notifications/templates/test_notification"
GET_TEMPLATE_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/notifications/templates/test_notification" \
    -H "Authorization: Bearer $USER1_TOKEN")
GET_TEMPLATE_BODY=$(echo "$GET_TEMPLATE_RESPONSE" | head -n -1)
GET_TEMPLATE_STATUS=$(echo "$GET_TEMPLATE_RESPONSE" | tail -n 1)

echo "$GET_TEMPLATE_BODY" | jq '.'
assert_status 200 $GET_TEMPLATE_STATUS "Obtener template por key"

# =============================================================================
# Resumen
# =============================================================================

print_header "Resumen de Tests"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
echo "Total: $TOTAL_TESTS tests"
echo -e "${GREEN}Pasados: $TESTS_PASSED${NC}"
echo -e "${RED}Fallidos: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✓ Todos los tests pasaron exitosamente!${NC}\n"
    exit 0
else
    echo -e "\n${RED}✗ Algunos tests fallaron${NC}\n"
    exit 1
fi
