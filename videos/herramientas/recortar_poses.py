"""Recorta las poses de una hoja de personaje (poses en fila sobre fondo blanco) en PNG transparentes.
Uso: python recortar_poses.py HOJA.png CARPETA_SALIDA prefijo
Separa por columnas vacías, recorta justo cada pose y vuelve transparente el blanco conectado al borde
(los blancos internos, como los ojos, se mantienen)."""
import sys
import numpy as np
from PIL import Image, ImageDraw

hoja, salida, pref = sys.argv[1], sys.argv[2], sys.argv[3]
im = Image.open(hoja).convert("RGB")
a = np.asarray(im).astype(int)
tinta = (a.min(axis=2) < 225)            # no-blanco
col = tinta.sum(axis=0) > 2
# tramos de columnas con tinta, uniendo huecos chicos (< 18 px)
tramos, ini, hueco = [], None, 0
for x, v in enumerate(col):
    if v:
        if ini is None: ini = x
        hueco = 0
    elif ini is not None:
        hueco += 1
        if hueco > 18:
            tramos.append((ini, x - hueco)); ini = None; hueco = 0
if ini is not None: tramos.append((ini, len(col) - 1))
tramos = [t for t in tramos if t[1] - t[0] > 40]
for k, (x0, x1) in enumerate(tramos, 1):
    filas = np.where(tinta[:, x0:x1 + 1].sum(axis=1) > 1)[0]
    y0, y1 = max(0, filas[0] - 6), min(a.shape[0] - 1, filas[-1] + 6)
    x0m, x1m = max(0, x0 - 6), min(a.shape[1] - 1, x1 + 6)
    pose = im.crop((x0m, y0, x1m + 1, y1 + 1))
    # máscara: blanco conectado al borde → transparente
    m = Image.fromarray(((np.asarray(pose).min(axis=2) >= 232) * 255).astype("uint8"))
    w, h = m.size
    pad = Image.new("L", (w + 2, h + 2), 255); pad.paste(m, (1, 1))
    ImageDraw.floodfill(pad, (0, 0), 128)
    fondo = (np.asarray(pad)[1:-1, 1:-1] == 128)
    # blancos encerrados en la mitad de abajo (entre las patas, bajo la panza) también son fondo; los ojos (arriba) no
    arr = np.where((np.asarray(m) == 255) & ~fondo, 255, 0).astype("uint8")
    arr[: int(h * 0.6), :] = 0          # solo se buscan huecos en la parte de abajo (más rápido)
    vueltas = 0
    while True:
        ys, xs = np.nonzero(arr == 255)
        vueltas += 1
        if len(ys) == 0 or vueltas > 400: break
        tmp = Image.fromarray(arr); ImageDraw.floodfill(tmp, (int(xs[0]), int(ys[0])), 77, thresh=0); comp = (np.asarray(tmp) == 77)
        if not comp.any():
            arr[ys[0], xs[0]] = 0; continue
        if np.nonzero(comp)[0].mean() > 0.62 * h: fondo = fondo | comp
        arr[comp] = 0
    # la sombra gris clara que dibuja ChatGPT bajo las patas (franja de abajo, gris poco saturado) también se saca:
    # en el video se pone una sombra oscura propia apoyada en el piso
    px = np.asarray(pose).astype(int)
    gris = (px.min(axis=2) > 150) & ((px.max(axis=2) - px.min(axis=2)) < 22)
    abajo = np.zeros_like(gris); abajo[int(h * 0.8):, :] = True
    fondo = fondo | (gris & abajo)
    alfa = np.where(fondo, 0, 255).astype("uint8")
    alfa = np.asarray(Image.fromarray(alfa).filter(__import__("PIL.ImageFilter", fromlist=["x"]).GaussianBlur(0.7)))
    rgba = np.dstack([np.asarray(pose), alfa])
    Image.fromarray(rgba, "RGBA").save(f"{salida}/{pref}-{k}.png")
    print(f"{pref}-{k}.png", pose.size)
