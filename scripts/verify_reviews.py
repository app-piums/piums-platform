#!/usr/bin/env python3
import urllib.request, json, subprocess

IDS = [
    "c2364f41-9d9f-4a90-ab7e-13049a8737a9",  # artist01 Maria G.
    "fd5c55ef-5fa7-4731-a099-dfbfb04e2435",  # artist02 Roberto Perez
    "7a737a87-76fd-4c4b-920f-f6ccc6b90842",  # artist03 DJ Alex Cruz
    "b75bf8da-04bc-43cf-ae04-2b8ab62a1900",  # artist08 Claudia Chavez
    "0dcef5d1-d843-4ae3-9e08-8e3b59ab91eb",  # artista@piums.com
]

GW = "http://localhost:3000/api"

print(f"\n{'ID':40} {'Artista':25} {'Reseñas':>8} {'Rating gateway':>15}")
print("-"*95)

for aid in IDS:
    # Reviews via gateway
    url = f"{GW}/reviews/reviews?artistId={aid}&limit=5"
    try:
        r = json.loads(urllib.request.urlopen(url, timeout=5).read())
        total = r["pagination"]["total"]
        comments = [x["comment"][:25] for x in r["reviews"]]
    except Exception as e:
        total = f"ERR: {e}"
        comments = []

    # Artist name from /api/artists/:id
    try:
        ar = json.loads(urllib.request.urlopen(f"{GW}/artists/{aid}", timeout=5).read())
        name = ar.get("nombre", ar.get("name", "?"))[:24]
        rating = ar.get("rating", "?")
    except:
        name = "?"
        rating = "?"

    print(f"  {aid[:8]}..  {name:25} {str(total):>8}     {str(rating):>10}")
    for c in comments:
        print(f"    └ \"{c}\"")

print()
