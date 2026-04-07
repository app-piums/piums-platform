import urllib.request, json

base_auth = 'http://localhost:4001'
base_art  = 'http://localhost:4003'

data = json.dumps({'email':'artist03@piums.com','password':'Test1234!'}).encode()
req = urllib.request.Request(base_auth+'/auth/login', data=data, headers={'Content-Type':'application/json'})
resp = json.loads(urllib.request.urlopen(req).read())
token = resp['token']
auth_id = resp['user']['id']
print('auth_id:', auth_id)

# Check if artist already exists
req_check = urllib.request.Request(base_art+'/artists/search?limit=20', headers={'Authorization':f'Bearer {token}'})
artists = json.loads(urllib.request.urlopen(req_check).read())
print('Current artists in DB:', len(artists.get('artists', [])))
for a in artists.get('artists', []):
    print(' -', a.get('nombre'), a.get('email'))
