#!/usr/bin/env python3

import requests
import json
from datetime import datetime, timedelta
import sys

# Colors
RED = '\033[0;31m'
GREEN = '\033[0;32m'
YELLOW = '\033[1;33m'
BLUE = '\033[0;34m'
NC = '\033[0m'

GATEWAY = "http://localhost:3005/api"

# Usuarios
CLIENT_EMAIL = "client01@piums.com"
CLIENT_PASS = "Test1234!"

ARTISTS = {
    "artist02@piums.com": {"name": "Rob Photography", "pass": "Test1234!"},
    "artist03@piums.com": {"name": "DJ Alex", "pass": "Test1234!"},
    "artist05@piums.com": {"name": "Diego Ink", "pass": "Test1234!"}
}

def log_success(msg):
    print(f"{GREEN}✓ {msg}{NC}")

def log_info(msg):
    print(f"{BLUE}ℹ {msg}{NC}")

def log_error(msg):
    print(f"{RED}✗ {msg}{NC}")

def log_step(num, msg):
    print(f"\n{YELLOW}[{num}]{NC} {msg}")

def login(email, password):
    """Obtener JWT token"""
    try:
        resp = requests.post(f"{GATEWAY}/auth/login", json={
            "email": email,
            "password": password
        }, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            token = data.get("token") or data.get("data", {}).get("token")
            if token:
                return token
        else:
            log_error(f"Login {email} status {resp.status_code}: {resp.text[:100]}")
    except Exception as e:
        log_error(f"Login failed for {email}: {str(e)}")
    return None

def get_artist_id(token):
    """Obtener artist ID del usuario autenticado"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(f"{GATEWAY}/artists/me/profile", headers=headers, timeout=5)
        if resp.status_code == 200:
            return resp.json().get("artist", {}).get("id")
    except Exception as e:
        log_error(f"Failed to get artist ID: {str(e)}")
    return None

def create_service(artist_token, artist_id, service_data):
    """Crear un servicio"""
    try:
        headers = {"Authorization": f"Bearer {artist_token}"}
        resp = requests.post(f"{GATEWAY}/catalog/services", 
            json=service_data, 
            headers=headers, 
            timeout=5)
        if resp.status_code == 201 or resp.status_code == 200:
            data = resp.json()
            service_id = data.get("id") or data.get("data", {}).get("id")
            return service_id
        else:
            log_error(f"Service creation failed ({resp.status_code}): {resp.text[:100]}")
    except Exception as e:
        log_error(f"Create service error: {str(e)}")
    return None

def create_booking(client_token, booking_data):
    """Crear una reserva"""
    try:
        headers = {"Authorization": f"Bearer {client_token}"}
        resp = requests.post(f"{GATEWAY}/bookings", 
            json=booking_data, 
            headers=headers, 
            timeout=5)
        if resp.status_code == 201:
            return resp.json().get("data", {}).get("id")
        else:
            log_error(f"Booking creation failed: {resp.text}")
    except Exception as e:
        log_error(f"Create booking error: {str(e)}")
    return None

def send_message(sender_token, message_data):
    """Enviar mensaje en chat"""
    try:
        headers = {"Authorization": f"Bearer {sender_token}"}
        resp = requests.post(f"{GATEWAY}/chat/messages", 
            json=message_data, 
            headers=headers, 
            timeout=5)
        if resp.status_code == 201:
            return resp.json().get("data", {}).get("id")
    except Exception as e:
        log_error(f"Send message error: {str(e)}")
    return None

def create_review(client_token, review_data):
    """Crear una review"""
    try:
        headers = {"Authorization": f"Bearer {client_token}"}
        resp = requests.post(f"{GATEWAY}/reviews", 
            json=review_data, 
            headers=headers, 
            timeout=5)
        if resp.status_code == 201:
            return resp.json().get("data", {}).get("id")
        else:
            log_error(f"Review creation failed: {resp.text}")
    except Exception as e:
        log_error(f"Create review error: {str(e)}")
    return None

def main():
    print(f"{BLUE}🌱 Creando Escenario Completo de Prueba{NC}\n")
    
    # ========== LOGIN ==========
    log_step(1, "Obteniendo Tokens")
    
    client_token = login(CLIENT_EMAIL, CLIENT_PASS)
    if not client_token:
        log_error("Failed to login client")
        return 1
    log_success(f"Cliente: {CLIENT_EMAIL}")
    
    artist_tokens = {}
    for email, info in ARTISTS.items():
        token = login(email, info["pass"])
        if token:
            artist_tokens[email] = token
            log_success(f"Artista: {info['name']}")
        else:
            log_error(f"Failed to login {email}")
    
    if len(artist_tokens) < 3:
        log_error("Not all artists could login")
        return 1
    
    # ========== SERVICIOS ==========
    log_step(2, "Creando 6 Servicios")
    
    services_created = {}
    
    # Artist02 - Photography
    artist02_email = "artist02@piums.com"
    artist02_id = get_artist_id(artist_tokens[artist02_email])
    if artist02_id:
        # Servicio 1
        service_id = create_service(artist_tokens[artist02_email], artist02_id, {
            "title": "Sesión Fotográfica 2 Horas",
            "description": "Sesión de fotos profesional, incluye 50-100 fotos editadas",
            "price": 75000,
            "duration": 120,
            "category": "photography"
        })
        if service_id:
            services_created[f"rob_2h"] = service_id
            log_success("Rob Photography: Sesión 2h")
        
        # Servicio 2
        service_id = create_service(artist_tokens[artist02_email], artist02_id, {
            "title": "Cobertura de Boda Completa",
            "description": "Cobertura de 8 horas de boda, 300+ fotos editadas, álbum digital",
            "price": 250000,
            "duration": 480,
            "category": "photography"
        })
        if service_id:
            services_created[f"rob_boda"] = service_id
            log_success("Rob Photography: Boda Completa")
    
    # Artist03 - DJ
    artist03_email = "artist03@piums.com"
    artist03_id = get_artist_id(artist_tokens[artist03_email])
    if artist03_id:
        # Servicio 3
        service_id = create_service(artist_tokens[artist03_email], artist03_id, {
            "title": "DJ para Evento 4 Horas",
            "description": "DJ profesional con equipo de sonido e iluminación para fiestas y eventos",
            "price": 150000,
            "duration": 240,
            "category": "dj"
        })
        if service_id:
            services_created[f"dj_4h"] = service_id
            log_success("DJ Alex: Evento 4h")
        
        # Servicio 4
        service_id = create_service(artist_tokens[artist03_email], artist03_id, {
            "title": "DJ para Boda",
            "description": "DJ para ceremonia, recepción y animación, 8 horas completas",
            "price": 350000,
            "duration": 480,
            "category": "dj"
        })
        if service_id:
            services_created[f"dj_boda"] = service_id
            log_success("DJ Alex: Boda")
    
    # Artist05 - Tattoo
    artist05_email = "artist05@piums.com"
    artist05_id = get_artist_id(artist_tokens[artist05_email])
    if artist05_id:
        # Servicio 5
        service_id = create_service(artist_tokens[artist05_email], artist05_id, {
            "title": "Tatuaje Pequeño",
            "description": "Tatuaje personalizado pequeño (hasta 5x5cm), diseño incluido",
            "price": 30000,
            "duration": 60,
            "category": "tattoo"
        })
        if service_id:
            services_created[f"tattoo_small"] = service_id
            log_success("Diego Ink: Tatuaje Pequeño")
        
        # Servicio 6
        service_id = create_service(artist_tokens[artist05_email], artist05_id, {
            "title": "Tatuaje Mediano",
            "description": "Tatuaje personalizado mediano (hasta 15x15cm), diseño incluido",
            "price": 100000,
            "duration": 180,
            "category": "tattoo"
        })
        if service_id:
            services_created[f"tattoo_medium"] = service_id
            log_success("Diego Ink: Tatuaje Mediano")
    
    if len(services_created) < 6:
        log_error(f"Only {len(services_created)}/6 services created")
        return 1
    
    # ========== RESERVAS ==========
    log_step(3, "Creando 7 Reservas con Diferentes Estados")
    
    bookings_created = {}
    
    # Reserva 1: COMPLETED (hace 15 días)
    date_past_15 = (datetime.now() - timedelta(days=15)).isoformat()
    booking_id = create_booking(client_token, {
        "serviceId": services_created["rob_2h"],
        "artistId": artist02_id,
        "startTime": date_past_15,
        "status": "COMPLETED"
    })
    if booking_id:
        bookings_created["completed_1"] = booking_id
        log_success("Reserva 1: Rob Photo COMPLETED (hace 15 días)")
    
    # Reserva 2: PENDING (próximo 7 días)
    date_future_7 = (datetime.now() + timedelta(days=7)).isoformat()
    booking_id = create_booking(client_token, {
        "serviceId": services_created["dj_4h"],
        "artistId": artist03_id,
        "startTime": date_future_7,
        "status": "PENDING"
    })
    if booking_id:
        bookings_created["pending_1"] = booking_id
        log_success("Reserva 2: DJ Event PENDING (próximo 7 días)")
    
    # Reserva 3: CONFIRMED (próximo 3 días)
    date_future_3 = (datetime.now() + timedelta(days=3)).isoformat()
    booking_id = create_booking(client_token, {
        "serviceId": services_created["tattoo_small"],
        "artistId": artist05_id,
        "startTime": date_future_3,
        "status": "CONFIRMED"
    })
    if booking_id:
        bookings_created["confirmed_1"] = booking_id
        log_success("Reserva 3: Tattoo CONFIRMED (próximo 3 días)")
    
    # Reserva 4: REJECTED (próximo 30 días)
    date_future_30 = (datetime.now() + timedelta(days=30)).isoformat()
    booking_id = create_booking(client_token, {
        "serviceId": services_created["rob_boda"],
        "artistId": artist02_id,
        "startTime": date_future_30,
        "status": "REJECTED"
    })
    if booking_id:
        bookings_created["rejected_1"] = booking_id
        log_success("Reserva 4: Rob Boda REJECTED (próximo 30 días)")
    
    # Reserva 5: COMPLETED (hace 8 días)
    date_past_8 = (datetime.now() - timedelta(days=8)).isoformat()
    booking_id = create_booking(client_token, {
        "serviceId": services_created["dj_boda"],
        "artistId": artist03_id,
        "startTime": date_past_8,
        "status": "COMPLETED"
    })
    if booking_id:
        bookings_created["completed_2"] = booking_id
        log_success("Reserva 5: DJ Boda COMPLETED (hace 8 días)")
    
    # Reserva 6: CANCELLED (hace 25 días)
    date_past_25 = (datetime.now() - timedelta(days=25)).isoformat()
    booking_id = create_booking(client_token, {
        "serviceId": services_created["tattoo_medium"],
        "artistId": artist05_id,
        "startTime": date_past_25,
        "status": "CANCELLED"
    })
    if booking_id:
        bookings_created["cancelled_1"] = booking_id
        log_success("Reserva 6: Tattoo CANCELLED (hace 25 días)")
    
    # Reserva 7: CONFIRMED (próximo 45 días)
    date_future_45 = (datetime.now() + timedelta(days=45)).isoformat()
    booking_id = create_booking(client_token, {
        "serviceId": services_created["rob_boda"],
        "artistId": artist02_id,
        "startTime": date_future_45,
        "status": "CONFIRMED"
    })
    if booking_id:
        bookings_created["confirmed_2"] = booking_id
        log_success("Reserva 7: Rob Boda CONFIRMED (próximo 45 días)")
    
    # ========== CHATS ==========
    log_step(4, "Creando 3 Conversaciones con Mensajes")
    
    # Chat 1: Ana ↔ Rob (5 mensajes)
    log_info("Chat 1: Ana ↔ Rob Photography (5 mensajes)")
    messages = [
        "Hola Rob, me interesa tu sesión fotográfica para una boda",
        "¡Hola! Claro, tengo disponibilidad el próximo mes",
        "¿Cuál es tu estilo? ¿Haces fotos creativas?",
        "Sí, me especializo en fotos artísticas y naturales",
        "Perfecto, me encanta. Hagamos una sesión de prueba"
    ]
    for msg in messages:
        send_message(client_token if "Hola Ana" not in msg else artist_tokens[artist02_email], {
            "recipientId": artist02_id if "Hola" in msg and "Hola Ana" not in msg else "client01_id",
            "content": msg
        })
        log_success(f"Mensaje: {msg[:40]}...")
    
    # Chat 2: Ana ↔ DJ (4 mensajes)
    log_info("Chat 2: Ana ↔ DJ Alex (4 mensajes)")
    messages = [
        "Necesito DJ para una fiesta el próximo mes",
        "Perfecto, tengo disponibilidad. ¿Qué tipo de música?",
        "Pop, reggaeton y un poco de electrónica",
        "Excelente, eso puedo hacerlo sin problema"
    ]
    for msg in messages:
        send_message(client_token if "Necesito" in msg or "música" in msg else artist_tokens[artist03_email], {
            "recipientId": artist03_id if "Necesito" in msg else "client01_id",
            "content": msg
        })
        log_success(f"Mensaje: {msg[:40]}...")
    
    # Chat 3: Ana ↔ Diego (5 mensajes)
    log_info("Chat 3: Ana ↔ Diego Ink (5 mensajes)")
    messages = [
        "Hola Diego, quiero un tatuaje personalizado",
        "Claro, ¿qué tienes en mente?",
        "Un mandala pequeño con algunos símbolos",
        "Perfecto, tengo varios diseños de mandalas",
        "Genial, podemos agendar pronto"
    ]
    for msg in messages:
        send_message(client_token if "Hola" in msg or "mente" in msg or "pronto" in msg else artist_tokens[artist05_email], {
            "recipientId": artist05_id if "Hola" in msg else "client01_id",
            "content": msg
        })
        log_success(f"Mensaje: {msg[:40]}...")
    
    # ========== REVIEWS ==========
    log_step(5, "Creando 3 Reviews con Ratings")
    
    # Review 1: 5 stars
    review_id = create_review(client_token, {
        "artistId": artist02_id,
        "bookingId": bookings_created.get("completed_1"),
        "rating": 5,
        "comment": "Excelente trabajo profesional, fotos hermosas"
    })
    if review_id:
        log_success("Review 1: Rob Photography ⭐⭐⭐⭐⭐")
    
    # Review 2: 3 stars
    review_id = create_review(client_token, {
        "artistId": artist03_id,
        "bookingId": bookings_created.get("completed_2"),
        "rating": 3,
        "comment": "Buen servicio pero llegó 30 minutos tarde"
    })
    if review_id:
        log_success("Review 2: DJ Alex ⭐⭐⭐")
    
    # Review 3: 4 stars
    review_id = create_review(client_token, {
        "artistId": artist05_id,
        "rating": 4,
        "comment": "Muy profesional y creativo"
    })
    if review_id:
        log_success("Review 3: Diego Ink ⭐⭐⭐⭐")
    
    # ========== RESUMEN ==========
    log_step(6, "Resumen Final")
    
    print(f"\n{GREEN}📊 DATOS CREADOS:{NC}")
    print(f"   • Servicios: {len(services_created)}/6")
    print(f"   • Reservas: {len(bookings_created)}/7")
    print(f"   • Conversaciones: 3")
    print(f"   • Reviews: 3\n")
    
    print(f"{BLUE}🌐 Verifica en:{NC}")
    print(f"   • Web Cliente: http://localhost:3000")
    print(f"   • Web Artist: http://localhost:3001")
    print(f"   • Web Admin: http://localhost:3003\n")
    
    print(f"{GREEN}✅ ESCENARIO COMPLETO CREADO{NC}\n")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
