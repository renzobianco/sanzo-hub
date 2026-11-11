"""Recorta las poses de una hoja de personaje con IA (rembg, modelo isnet-anime: como remove.bg pero local y gratis).

Uso: python recortar_ia.py HOJA.png CARPETA_SALIDA prefijo [--entera]
- Separa las poses por columnas vacías (fondo blanco) y recorta cada una con rembg.
- Además vuelve transparentes los huecos blancos encerrados en la parte de abajo (entre las patas, bajo la panza),
  que la IA a veces deja.
- --entera: no separa, recorta la imagen entera como una sola pieza.
Pedido de Santino (nov 2026): los recortes tienen que quedar perfectos, sin restos del fondo.
"""
import sys
import numpy as np
from PIL import Image, ImageDraw
from rembg import remove, new_session

SESION = None


def sesion():
    global SESION
    if SESION is None:
        SESION = new_session("isnet-anime")
    return SESION


def poses(im):
    a = np.asarray(im).astype(int)
    tinta = a.min(axis=2) < 225
    col = tinta.sum(axis=0) > 2
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
    out = []
    for x0, x1 in [t for t in tramos if t[1] - t[0] > 40]:
        filas = np.where(tinta[:, x0:x1 + 1].sum(axis=1) > 1)[0]
        out.append((max(0, x0 - 10), max(0, filas[0] - 10), min(a.shape[1], x1 + 11), min(a.shape[0], filas[-1] + 11)))
    return out


def huecos_abajo(rgba):
    """Blancos puros encerrados en el 40 % de abajo → transparentes."""
    a = np.asarray(rgba).copy()
    h = a.shape[0]
    blanco = (a[..., :3].min(axis=2) >= 232) & (a[..., 3] > 0)
    blanco[: int(h * 0.6), :] = False
    m = Image.fromarray((blanco * 255).astype("uint8"))
    arr = np.asarray(m).copy()
    vueltas = 0
    while vueltas < 300:
        ys, xs = np.nonzero(arr == 255)
        if len(ys) == 0: break
        vueltas += 1
        tmp = Image.fromarray(arr); ImageDraw.floodfill(tmp, (int(xs[0]), int(ys[0])), 77, thresh=0)
        comp = np.asarray(tmp) == 77
        if not comp.any():
            arr[ys[0], xs[0]] = 0; continue
        if comp.sum() > 60:
            a[..., 3][comp] = 0
        arr[comp] = 0
    return Image.fromarray(a, "RGBA")


def solido(pieza, r):
    """La IA decide QUÉ es personaje; adentro de esa zona el dibujo queda 100 % opaco (sin partes medio transparentes).
    Lo que no es blanco del fondo (conectado al borde) y cae dentro de la máscara de la IA (agrandada) → opaco."""
    from PIL import ImageFilter
    rgb = pieza.convert("RGB")
    m = Image.fromarray(((np.asarray(rgb).min(axis=2) >= 232) * 255).astype("uint8"))
    w, h = m.size
    pad = Image.new("L", (w + 2, h + 2), 255); pad.paste(m, (1, 1))
    ImageDraw.floodfill(pad, (0, 0), 128)
    fondo = np.asarray(pad)[1:-1, 1:-1] == 128
    ia = np.asarray(r)[:, :, 3]
    zona = np.asarray(Image.fromarray(((ia > 40) * 255).astype("uint8")).filter(ImageFilter.MaxFilter(9))) > 0
    alfa = np.where(zona & ~fondo, 255, 0).astype("uint8")
    # adentro de la zona, lo que la IA marcó como hueco (blanco encerrado) también queda afuera
    px = np.asarray(rgb).astype(int)
    alfa = np.where((ia < 128) & (px.min(axis=2) >= 225), 0, alfa)
    # la sombrita gris clara bajo las patas (franja de abajo, gris poco saturado) también afuera
    gris = (px.min(axis=2) > 150) & ((px.max(axis=2) - px.min(axis=2)) < 22)
    abajo = np.zeros_like(gris); abajo[int(h * 0.82):, :] = True
    alfa = np.where(gris & abajo, 0, alfa)
    alfa = np.asarray(Image.fromarray(alfa).filter(ImageFilter.GaussianBlur(0.6)))
    return Image.fromarray(np.dstack([np.asarray(rgb), alfa]), "RGBA")


def recortar(pieza):
    r = remove(pieza.convert("RGB"), session=sesion())
    r = solido(pieza, r)
    r = huecos_abajo(r)
    al = np.asarray(r)[:, :, 3]
    ys, xs = np.nonzero(al > 8)
    return r.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


if __name__ == "__main__":
    hoja, salida, pref = sys.argv[1], sys.argv[2], sys.argv[3]
    im = Image.open(hoja).convert("RGB")
    cajas = [(0, 0, im.width, im.height)] if "--entera" in sys.argv else poses(im)
    for k, c in enumerate(cajas, 1):
        r = recortar(im.crop(c))
        r.save(f"{salida}/{pref}-{k}.png")
        print(f"{pref}-{k}.png", r.size)
