#!/usr/bin/env python3
"""Seed missing artist profiles and their catalog services."""
import urllib.request, json, re

AUTH_URL = 'http://localhost:4001'
ART_URL  = 'http://localhost:4003'
CAT_URL  = 'http://localhost:4004'

# Category IDs from catalog-service DB
CAT_MUSICA       = '19e9c1ab-1bf5-44c7-81aa-4d71948aed6e'
CAT_FOTOGRAFIA   = 'f334aef0-baf8-4eec-98ee-0afeb42a3cf3'
CAT_DJ           = 'aa84d936-2165-43ec-805f-7c8584b6f047'
CAT_MAQUILLAJE   = '0b300c6a-5fae-407d-9f51-8a554b2ea773'
CAT_TATUAJES     = '9674f12d-6591-4df5-a3a5-257f8ced3420'
CAT_ARTISTICOS   = 'b68b9683-225a-4b16-a89b-112bbce2b6df'

def slug(name):
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

MISSING = [
    # artist03 profile exists; only needs services
    {
        'email': 'artist03@piums.com', 'password': 'Test1234!',
        'nombre': 'DJ Alex Cruz', 'category': 'DJ',
        'specialties': ['DJ', 'Mezcla en vivo'],
        'city': 'Guatemala', 'country': 'GT',
        'profile_exists': True,
        'services': [
            {'name': 'DJ Set para eventos', 'description': 'DJ set profesional de 4 horas para cualquier evento', 'categoryId': CAT_DJ, 'basePrice': 2500, 'durationMin': 240},
            {'name': 'DJ para boda', 'description': 'Paquete especial para bodas: ceremonia, cena y fiesta', 'categoryId': CAT_DJ, 'basePrice': 4500, 'durationMin': 480},
            {'name': 'Mezcla de música electrónica', 'description': 'Sets de música electrónica para fiestas privadas', 'categoryId': CAT_DJ, 'basePrice': 1800, 'durationMin': 180},
        ]
    },
    {
        'email': 'artist04@piums.com', 'password': 'Test1234!',
        'nombre': 'Sofia Beauty Studio', 'category': 'MAQUILLADOR',
        'specialties': ['Maquillaje nupcial', 'Maquillaje artístico'],
        'city': 'Quetzaltenango', 'country': 'GT',
        'profile_exists': True,
        'services': [
            {'name': 'Maquillaje nupcial completo', 'description': 'Look de novia completo con prueba previa incluida', 'categoryId': CAT_MAQUILLAJE, 'basePrice': 800, 'durationMin': 180},
            {'name': 'Maquillaje sesion fotografica', 'description': 'Maquillaje profesional para sesión fotográfica', 'categoryId': CAT_MAQUILLAJE, 'basePrice': 350, 'durationMin': 90},
            {'name': 'Maquillaje artistico y fantasia', 'description': 'Diseños creativos para eventos temáticos y fiestas', 'categoryId': CAT_MAQUILLAJE, 'basePrice': 450, 'durationMin': 120},
        ]
    },
    {
        'email': 'artist06@piums.com', 'password': 'Test1234!',
        'nombre': 'Paola Dance Company', 'category': 'OTRO',
        'specialties': ['Salsa', 'Bachata', 'Danza contemporánea'],
        'city': 'Cobán', 'country': 'GT',
        'profile_exists': False,
        'services': [
            {'name': 'Show de salsa y bachata', 'description': 'Presentación profesional de pareja de baile de 20 minutos', 'categoryId': CAT_ARTISTICOS, 'basePrice': 1500, 'durationMin': 20},
            {'name': 'Coreografia personalizada para boda', 'description': 'Diseño y ensayo de coreografía especial para tu boda', 'categoryId': CAT_ARTISTICOS, 'basePrice': 2500, 'durationMin': 300},
            {'name': 'Clases de baile para novios', 'description': 'Paquete de 5 clases privadas para la pareja nupcial', 'categoryId': CAT_ARTISTICOS, 'basePrice': 900, 'durationMin': 60},
        ]
    },
    {
        'email': 'artist07@piums.com', 'password': 'Test1234!',
        'nombre': 'Humo Barberia Premium', 'category': 'OTRO',
        'specialties': ['Barbería', 'Grooming'],
        'city': 'Escuintla', 'country': 'GT',
        'profile_exists': True,
        'services': [
            {'name': 'Barberia profesional para eventos', 'description': 'Barbero profesional disponible en tu evento o local', 'categoryId': CAT_ARTISTICOS, 'basePrice': 1200, 'durationMin': 240},
            {'name': 'Corte y arreglo de barba premium', 'description': 'Servicio premium de corte y arreglo de barba individual', 'categoryId': CAT_ARTISTICOS, 'basePrice': 150, 'durationMin': 45},
            {'name': 'Paquete novio completo grooming', 'description': 'Corte, barba, cejas y tratamiento facial para el novio', 'categoryId': CAT_ARTISTICOS, 'basePrice': 350, 'durationMin': 90},
        ]
    },
    {
        'email': 'artist09@piums.com', 'password': 'Test1234!',
        'nombre': 'Sam Lights and Audio', 'category': 'OTRO',
        'specialties': ['Sonido', 'Iluminación', 'DJ técnico'],
        'city': 'Huehuetenango', 'country': 'GT',
        'profile_exists': True,
        'services': [
            {'name': 'Sonido e iluminacion para eventos', 'description': 'Sistema PA completo más luces de ambiente para tu evento', 'categoryId': CAT_ARTISTICOS, 'basePrice': 3500, 'durationMin': 480},
            {'name': 'Renta de equipo de sonido', 'description': 'Sistema de sonido PA sin operador para autoservicio', 'categoryId': CAT_ARTISTICOS, 'basePrice': 1800, 'durationMin': 480},
            {'name': 'Paquete boda completo audiovisual', 'description': 'Paquete completo de sonido, luces y video beam para boda', 'categoryId': CAT_ARTISTICOS, 'basePrice': 5500, 'durationMin': 600},
        ]
    },
]

def http(method, url, payload=None, token=None):
    data = json.dumps(payload).encode() if payload is not None else None
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(req)
        return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, body

for artist in MISSING:
    email = artist['email']

    # Login
    status, resp = http('POST', f'{AUTH_URL}/auth/login', {'email': email, 'password': artist['password']})
    if status != 200:
        print(f'[FAIL] Login {email}: {status} {resp}')
        continue
    token   = resp['token']
    auth_id = resp['user']['id']
    print(f'[OK]   Login {email} → auth_id {auth_id[:8]}...')

    # Create artist profile if needed
    if not artist.get('profile_exists'):
        profile = {
            'authId':      auth_id,
            'email':       email,
            'nombre':      artist['nombre'],
            'category':    artist['category'],
            'specialties': artist['specialties'],
            'country':     artist['country'],
            'city':        artist['city'],
        }
        status, resp = http('POST', f'{ART_URL}/artists', profile, token)
        if status in (200, 201):
            raw = resp.get('artist', resp)
            artist_id = raw.get('id') or raw.get('artistId')
            print(f'[OK]   Profile created → id {str(artist_id)[:8]}...')
        elif status == 409:
            print(f'[SKIP] Profile already exists for {email}')
            artist_id = None
        else:
            print(f'[FAIL] Create profile {email}: {status} {resp}')
            continue
    else:
        artist_id = None

    # Look up artist_id if we don't have it yet
    if not artist_id:
        s2, r2 = http('GET', f'{ART_URL}/artists/search?limit=20', token=token)
        for a in r2.get('artists', []):
            if a.get('email') == email:
                artist_id = a.get('id')
                break
        if artist_id:
            print(f'[OK]   Found existing artist_id {str(artist_id)[:8]}...')
        else:
            print(f'[FAIL] Could not resolve artist_id for {email}')
            continue

    # Create catalog services
    for svc in artist['services']:
        payload = {
            'artistId':    artist_id,
            'name':        svc['name'],
            'slug':        slug(svc['name']),
            'description': svc['description'],
            'categoryId':  svc['categoryId'],
            'basePrice':   svc['basePrice'],
            'pricingType': svc.get('pricingType', 'FIXED'),
            'durationMin': svc.get('durationMin'),
        }
        status, resp = http('POST', f'{CAT_URL}/api/services', payload, token)
        if status in (200, 201):
            print(f'  [OK]   Service "{svc["name"][:50]}"')
        else:
            print(f'  [FAIL] Service "{svc["name"][:50]}": {status} {resp}')

print('\nDone.')

