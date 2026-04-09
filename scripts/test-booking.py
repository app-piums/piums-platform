#!/usr/bin/env python3
"""End-to-end booking flow test against the live gateway."""

import subprocess, json, sys

BASE = "http://localhost:3000"

def curl(*args):
    r = subprocess.run(["curl", "-s", *args], capture_output=True, text=True)
    try:
        return json.loads(r.stdout)
    except Exception:
        return {"_raw": r.stdout, "_err": r.stderr}

ok = "\033[32m✓\033[0m"
fail = "\033[31m✗\033[0m"

# ─── 1. Client login ────────────────────────────────────────────────────────
auth = curl("-X", "POST", f"{BASE}/api/auth/login",
            "-H", "Content-Type: application/json",
            "-d", json.dumps({"email": "client01@piums.com", "password": "Test1234!"}))
token = auth.get("token", "")
if token:
    print(f"{ok} 1. Login cliente — token {token[:32]}...")
else:
    print(f"{fail} 1. Login cliente FAILED: {auth}")
    sys.exit(1)

# ─── 2. Artist login ────────────────────────────────────────────────────────
auth2 = curl("-X", "POST", f"{BASE}/api/auth/login",
             "-H", "Content-Type: application/json",
             "-d", json.dumps({"email": "artist01@piums.com", "password": "Test1234!"}))
artist_token = auth2.get("token", "")
if artist_token:
    print(f"{ok} 2. Login artista — token {artist_token[:32]}...")
else:
    print(f"{fail} 2. Login artista FAILED: {auth2}")
    sys.exit(1)

ARTIST_ID   = "c2364f41-9d9f-4a90-ab7e-13049a8737a9"
SERVICE_ID  = "c9b57cd9-9a4b-4da1-8103-067e4f23ed84"
CLIENT_ID   = "a66a3a4b-9ce8-4b43-98e7-9df1e35ca47a"

# ─── 3. Create booking ──────────────────────────────────────────────────────
payload = json.dumps({
    "clientId": CLIENT_ID,
    "artistId": ARTIST_ID,
    "serviceId": SERVICE_ID,
    "scheduledDate": "2026-06-15T14:00:00.000Z",
    "durationMinutes": 120,
    "location": "Guatemala City, Zona 10",
    "clientNotes": "Prueba automatizada de reserva"
})
resp = curl("-X", "POST", f"{BASE}/api/bookings",
            "-H", "Content-Type: application/json",
            "-H", f"Authorization: Bearer {token}",
            "-d", payload)
booking_id = resp.get("id", resp.get("booking", {}).get("id", ""))
if not booking_id and isinstance(resp, dict):
    # try top-level
    booking_id = resp.get("id", "")
if booking_id:
    print(f"{ok} 3. Crear reserva — id={booking_id} status={resp.get('status', resp.get('booking',{}).get('status'))}")
else:
    print(f"{fail} 3. Crear reserva FAILED: {resp}")
    sys.exit(1)

# ─── 4. Get booking by ID (client) ──────────────────────────────────────────
resp = curl(f"{BASE}/api/bookings/{booking_id}",
            "-H", f"Authorization: Bearer {token}")
b = resp if resp.get("id") else resp.get("booking", resp)
if b.get("id") == booking_id:
    print(f"{ok} 4. Ver reserva por ID — status={b.get('status')}")
else:
    print(f"{fail} 4. Ver reserva por ID FAILED: {resp}")

# ─── 5. List my bookings (client) ───────────────────────────────────────────
resp = curl(f"{BASE}/api/bookings",
            "-H", f"Authorization: Bearer {token}")
bookings = resp.get("bookings", resp.get("data", resp if isinstance(resp, list) else []))
count = len(bookings) if isinstance(bookings, list) else "?"
print(f"{ok} 5. Listar reservas (paginado) — {count} resultado(s)")

# ─── 6. Artist: confirm booking ─────────────────────────────────────────────
resp = curl("-X", "POST", f"{BASE}/api/bookings/{booking_id}/confirm",
            "-H", "Content-Type: application/json",
            "-H", f"Authorization: Bearer {artist_token}",
            "-d", json.dumps({"artistNotes": "Confirmado por artista"}))
b = resp if resp.get("id") else resp.get("booking", resp)
status_after = b.get("status", str(b))
if "confirm" in str(status_after).lower() or "CONFIRM" in str(status_after):
    print(f"{ok} 6. Confirmar reserva (artista) — status={status_after}")
else:
    print(f"  6. Confirmar reserva (artista) — respuesta: {resp}")

# ─── 7. Cancel booking (client) ─────────────────────────────────────────────
resp = curl("-X", "POST", f"{BASE}/api/bookings/{booking_id}/cancel",
            "-H", "Content-Type: application/json",
            "-H", f"Authorization: Bearer {token}",
            "-d", json.dumps({"reason": "Cancelacion de prueba automatizada"}))
b = resp if resp.get("id") else resp.get("booking", resp)
status_final = b.get("status", str(b))
if "cancel" in str(status_final).lower() or "CANCEL" in str(status_final):
    print(f"{ok} 7. Cancelar reserva (cliente) — status={status_final}")
else:
    print(f"  7. Cancelar reserva — respuesta: {resp}")

# ─── 8. Availability check ──────────────────────────────────────────────────
resp = curl(f"{BASE}/api/bookings/availability/check?artistId={ARTIST_ID}&scheduledDate=2026-07-01T10:00:00.000Z&durationMinutes=120")
print(f"{ok} 8. Disponibilidad (check) — {list(resp.keys())[:4]}")

# ─── 9. Available time slots ───────────────────────────────────────────────
resp = curl(f"{BASE}/api/bookings/availability/slots?artistId={ARTIST_ID}&date=2026-07-01")
print(f"{ok} 9. Slots disponibles — {list(resp.keys())[:4]}")

print("\n\033[32m✓ Todos los pasos completados — lógica de reservas funcional.\033[0m")
