"""Genereer een SVG-kaart van Nederland met de congestiegebieden (PC4) oranje.
Bron PC4-geometrie: cartomap.github.io/nl (WGS84). Download eerst naar /tmp/pc4.geojson.
"""
import json
import os
from math import cos, radians

GEO = '/tmp/pc4.geojson'
CONG = 'data/congested_pc4.json'
OUT = 'maps/congestiegebieden.svg'

ORANGE = '#FF6933'
GRAY = '#E7E4DA'

congested = set(int(p) for p in json.load(open(CONG)))
feats = json.load(open(GEO))['features']


def rings_of(geom):
    if not geom:
        return []
    t = geom['type']
    c = geom['coordinates']
    if t == 'Polygon':
        return [c]
    if t == 'MultiPolygon':
        return c
    return []


# bounds
lon_min = lon_max = lat_min = lat_max = None
for f in feats:
    for poly in rings_of(f['geometry']):
        for ring in poly:
            for x, y in ring:
                if lon_min is None:
                    lon_min = lon_max = x
                    lat_min = lat_max = y
                lon_min = min(lon_min, x); lon_max = max(lon_max, x)
                lat_min = min(lat_min, y); lat_max = max(lat_max, y)

mid_lat = (lat_min + lat_max) / 2
lon_scale = cos(radians(mid_lat))
W = 1000.0
s = W / ((lon_max - lon_min) * lon_scale)
H = (lat_max - lat_min) * s


def proj(x, y):
    return (x - lon_min) * lon_scale * s, (lat_max - y) * s


TOL2 = 1.4 * 1.4  # minimale afstand (px) tussen behouden punten, in het kwadraat


def simplify(pts):
    out = [pts[0]]
    for p in pts[1:-1]:
        lx, ly = out[-1]
        if (p[0] - lx) ** 2 + (p[1] - ly) ** 2 >= TOL2:
            out.append(p)
    out.append(pts[-1])
    return out


def path_d(geom):
    parts = []
    for poly in rings_of(geom):
        for ring in poly:
            pts = [proj(x, y) for x, y in ring]
            if len(pts) < 4:
                continue
            pts = simplify(pts)
            parts.append('M' + ' '.join('%d,%d' % (round(px), round(py)) for px, py in pts) + 'Z')
    return ''.join(parts)


paths = []
n_cong = 0
for f in feats:
    pc = int(f['properties']['postcode'])
    is_c = pc in congested
    if is_c:
        n_cong += 1
    paths.append('<path d="%s" fill="%s"/>' % (path_d(f['geometry']), ORANGE if is_c else GRAY))

Wr = round(W)
Hr = round(H)
svg = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" font-family="sans-serif">' % (Wr, Hr, Wr, Hr)]
svg.append('<rect width="%d" height="%d" fill="#FFFFFF"/>' % (Wr, Hr))
svg.append('<g stroke="#FFFFFF" stroke-width="0.4" stroke-linejoin="round">')
svg.extend(paths)
svg.append('</g>')
svg.append('<g transform="translate(20,%d)">' % (Hr - 74))
svg.append('<rect x="0" y="0" width="236" height="56" rx="8" fill="#FFFFFF" stroke="#E7E4DA"/>')
svg.append('<rect x="14" y="12" width="16" height="16" rx="3" fill="%s"/><text x="40" y="25" font-size="14" fill="#333333">Congestiegebied</text>' % ORANGE)
svg.append('<rect x="14" y="32" width="16" height="16" rx="3" fill="%s"/><text x="40" y="45" font-size="14" fill="#333333">Overig Nederland</text>' % GRAY)
svg.append('</g>')
svg.append('</svg>')

os.makedirs('maps', exist_ok=True)
open(OUT, 'w').write('\n'.join(svg))
print('PC4-features        :', len(feats))
print('congestie-PC4 in kaart:', n_cong, 'van', len(congested))
print('viewBox             : %d x %d' % (Wr, Hr))
print('SVG-grootte         : %d bytes (%.0f KB)' % (os.path.getsize(OUT), os.path.getsize(OUT) / 1024))
