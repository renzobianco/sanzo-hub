"""Recorta objetos grises/claros (chapitas, etc.) de una hoja con fondo blanco, SIN la regla de la sombra gris
de recortar_poses.py (que borraba la mitad de abajo de las chapitas).
Uso: python recortar_objetos.py HOJA.png CARPETA_SALIDA prefijo
Saca el fondo claro y poco saturado conectado al borde (blanco + sombrita gris del piso); lo que está
adentro del contorno oscuro queda entero. Separa las piezas por columnas vacías."""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

hoja, salida, pref = sys.argv[1], sys.argv[2], sys.argv[3]
im = Image.open(hoja).convert("RGB")
a = np.asarray(im).astype(int)
claro = (a.min(axis=2) > 150) & ((a.max(axis=2) - a.min(axis=2)) < 26)
m = Image.fromarray((claro * 255).astype("uint8"))
w, h = m.size
pad = Image.new("L", (w + 2, h + 2), 255); pad.paste(m, (1, 1))
ImageDraw.floodfill(pad, (0, 0), 128)
fondo = np.asarray(pad)[1:-1, 1:-1] == 128
alfa = np.asarray(Image.fromarray(np.where(fondo, 0, 255).astype("uint8")).filter(ImageFilter.GaussianBlur(0.7)))
rgba = Image.fromarray(np.dstack([a.astype("uint8"), alfa]), "RGBA")
col = (alfa > 128).sum(axis=0) > 2
tramos, ini, hueco = [], None, 0
for x, v in enumerate(col):
    if v:
        if ini is None: ini = x
        hueco = 0
    elif ini is not None:
        hueco += 1
        if hueco > 18: tramos.append((ini, x - hueco)); ini = None; hueco = 0
if ini is not None: tramos.append((ini, len(col) - 1))
tramos = [t for t in tramos if t[1] - t[0] > 40]
for k, (x0, x1) in enumerate(tramos, 1):
    p = rgba.crop((x0, 0, x1 + 1, h)); p = p.crop(p.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox())
    p.save(f"{salida}/{pref}-{k}.png"); print(f"{pref}-{k}.png", p.size)
