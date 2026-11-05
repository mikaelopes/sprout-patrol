# Compares each state of a pest against its plain "awake" look in color, greyscale, deuteranopia and protanopia.
# A state counts as readable when it differs clearly from awake in every view (mean luminance change of the crop).
import json, sys, numpy as np
from PIL import Image, ImageDraw
D = sys.argv[1] if len(sys.argv) > 1 else 'readab'
idx = json.load(open(D + '/index.json'))
MAT = {  # Machado et al. 2009, severity 1.0
 'deutan': np.array([[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]]),
 'protan': np.array([[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]])}
def load(f): return np.asarray(Image.open(f).convert('RGB')).astype(float) / 255
def lum(a): return a @ np.array([0.2126, 0.7152, 0.0722])
def views(a): return {'grey': lum(a), 'deutan': lum(np.clip(a @ MAT['deutan'].T, 0, 1)), 'protan': lum(np.clip(a @ MAT['protan'].T, 0, 1))}
by = {}
for r in idx: by.setdefault(r['who'], {})[r['st']] = r['f']
# noise floor: the same pest, same state, a moment later (bobbing, blinking)
NZ = None
if 'awake2' in by.get('wander', {}):
    a, b2 = views(load(by['wander']['awake'])), views(load(by['wander']['awake2']))
    NZ = ({k: float(np.mean(np.abs(a[k] - b2[k])) * 255) for k in a}, {k: float(np.mean(np.abs(a[k] - b2[k]) * 255 > 40)) for k in a})
rows = []
for who, sts in by.items():
    base = sts.get('awake') or sts.get('under')
    if not base: continue
    B = views(load(base))
    for st, f in sts.items():
        if f == base: continue
        V = views(load(f)); d = {k: float(np.mean(np.abs(V[k] - B[k])) * 255) for k in V}
        # also the share of pixels that changed a lot (a ring or a glow shows up here even if the average is small)
        big = {k: float(np.mean(np.abs(V[k] - B[k]) * 255 > 40)) for k in V}
        ok = all(d[k] >= 2 * NZ[0][k] or big[k] >= 2 * NZ[1][k] for k in d) if NZ else all(d[k] >= 6 or big[k] >= 0.06 for k in d)
        if st == 'awake2': continue
        rows.append({'who': who, 'state': st, **{k: round(v, 1) for k, v in d.items()}, **{k + '%': round(100 * v) for k, v in big.items()}, 'readable': ok})
print('noise floor', NZ)
json.dump(rows, open(D + '/readab.json', 'w'), indent=1)
for r in rows: print(f"{r['who']:12} {r['state']:9} grey {r['grey']:5.1f} ({r['grey%']:3}%)  deutan {r['deutan']:5.1f} ({r['deutan%']:3}%)  protan {r['protan']:5.1f} ({r['protan%']:3}%)  {'OK' if r['readable'] else 'HARD TO READ'}")
# contact sheet: each row = one pest; columns = color / grey / deutan per state
cells = []
for who, sts in by.items():
    for st, f in sts.items(): cells.append((who, st, f))
W = 120; sheet = Image.new('RGB', (W * 3 + 160, W * len(cells)), (20, 18, 40)); dr = ImageDraw.Draw(sheet)
for k, (who, st, f) in enumerate(cells):
    a = load(f); im = [Image.fromarray((a * 255).astype('uint8')), Image.fromarray((lum(a) * 255).astype('uint8')).convert('RGB'), Image.fromarray((np.clip(a @ MAT['deutan'].T, 0, 1) * 255).astype('uint8'))]
    for j, x in enumerate(im): sheet.paste(x.resize((W, W)), (160 + j * W, k * W))
    dr.text((6, k * W + 50), f"{who}\n{st}", fill=(255, 255, 255))
sheet.save(D + '/sheet.png'); print('sheet', sheet.size)
