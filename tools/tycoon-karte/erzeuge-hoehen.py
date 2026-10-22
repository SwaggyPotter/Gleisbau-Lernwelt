"""
Erzeugt das Hoehenraster fuer die Tycoon-Karte (ganz Europa) aus den AWS Terrain Tiles (Terrarium-Format):
  src/assets/tycoon/hoehen.png            8-Bit-Graustufen, Wert v -> Hoehe = (v/255)^2 * MAX_M (Meer = 0)
  src/app/modules/zusatz/tycoon/tycoon-hoehen-meta.ts   Rasterlage in Weltkoordinaten

Quelle der Hoehendaten: AWS Open Data "Terrain Tiles" (Mapzen/Tilezen), u. a. SRTM, GMTED2010, ETOPO1 (Public Domain)
und EU-DEM (Copernicus). Namensnennung siehe https://github.com/tilezen/joerd/blob/master/docs/attribution.md

Aufruf: python tools/tycoon-karte/erzeuge-hoehen.py <cache-ordner>
"""
import io
import json
import math
import os
import re
import sys
import time
import urllib.request

from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
CACHE = sys.argv[1]
os.makedirs(CACHE, exist_ok=True)

# Projektion wie tycoon-karte-daten.ts
daten = io.open(os.path.join(ROOT, 'src/app/modules/zusatz/tycoon/tycoon-karte-daten.ts'), encoding='utf-8').read()
P = json.loads(re.sub(r'(\w+):', r'"\1":', re.search(r'KARTE_PROJ = (\{[^}]+\})', daten).group(1)))

LON_MIN, LON_MAX, LAT_MIN, LAT_MAX = -12.0, 36.0, 34.0, 71.0
ZOOM = 5
ZELLE = 5          # Weltkoordinaten je Rasterzelle
MAX_M = 4800.0


def welt(lat, lon):
    return ((lon - P['lon0']) * P['cos'] * P['s'] + P['rand'], (P['lat0'] - lat) * P['s'] + P['rand'])


def geo(x, y):
    return (P['lat0'] - (y - P['rand']) / P['s'], (x - P['rand']) / (P['cos'] * P['s']) + P['lon0'])


def kachel_xy(lat, lon, z):
    n = 2 ** z
    xt = (lon + 180) / 360 * n
    yt = (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n
    return xt, yt


x0, y0 = welt(LAT_MAX, LON_MIN)
x1, y1 = welt(LAT_MIN, LON_MAX)
breite, hoehe = int((x1 - x0) / ZELLE), int((y1 - y0) / ZELLE)
print('Raster', breite, 'x', hoehe, 'Welt', round(x0), round(y0), round(x1), round(y1))

# Kacheln laden (mit Cache)
kx0, ky0 = kachel_xy(LAT_MAX, LON_MIN, ZOOM)
kx1, ky1 = kachel_xy(LAT_MIN, LON_MAX, ZOOM)
kacheln = {}
for kx in range(int(kx0), int(kx1) + 1):
    for ky in range(int(ky0), int(ky1) + 1):
        datei = os.path.join(CACHE, f'{ZOOM}-{kx}-{ky}.png')
        if not os.path.exists(datei):
            url = f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{ZOOM}/{kx}/{ky}.png'
            for versuch in range(5):
                try:
                    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Gleisbau-Lernwelt/1.0'}), timeout=60) as r:
                        open(datei, 'wb').write(r.read())
                    break
                except Exception as e:
                    print('  Fehler', url, e)
                    time.sleep(3 * (versuch + 1))
            time.sleep(0.3)
        kacheln[(kx, ky)] = Image.open(datei).convert('RGB').load()
print(len(kacheln), 'Kacheln')


def hoehe_bei(lat, lon):
    xt, yt = kachel_xy(lat, lon, ZOOM)
    kx, ky = int(xt), int(yt)
    px, py = min(255, int((xt - kx) * 256)), min(255, int((yt - ky) * 256))
    k = kacheln.get((kx, ky))
    if k is None:
        return 0.0
    r, g, b = k[px, py]
    return r * 256 + g + b / 256 - 32768


bild = Image.new('L', (breite, hoehe))
pix = bild.load()
for j in range(hoehe):
    for i in range(breite):
        lat, lon = geo(x0 + (i + 0.5) * ZELLE, y0 + (j + 0.5) * ZELLE)
        h = max(0.0, min(MAX_M, hoehe_bei(lat, lon)))
        pix[i, j] = int(round(math.sqrt(h / MAX_M) * 255))
os.makedirs(os.path.join(ROOT, 'src/assets/tycoon'), exist_ok=True)
ziel = os.path.join(ROOT, 'src/assets/tycoon/hoehen.png')
bild.save(ziel, optimize=True)
print('geschrieben', ziel, os.path.getsize(ziel), 'Bytes')

meta = os.path.join(ROOT, 'src/app/modules/zusatz/tycoon/tycoon-hoehen-meta.ts')
io.open(meta, 'w', encoding='utf-8').write(f"""/* Automatisch erzeugt von tools/tycoon-karte/erzeuge-hoehen.py -- nicht von Hand aendern.
 * Hoehen: AWS Terrain Tiles (SRTM, GMTED2010, ETOPO1, EU-DEM u. a.), siehe tilezen/joerd attribution. */
/* eslint-disable */
/** Lage des Hoehenrasters assets/tycoon/hoehen.png in Weltkoordinaten (Europa). Wert v -> (v/255)^2 * MAX_M Meter. */
export const HOEHEN = {{ x0: {x0:.2f}, y0: {y0:.2f}, zelle: {ZELLE}, breite: {breite}, hoehe: {hoehe}, maxM: {MAX_M} }};
""")
print('geschrieben', meta)
