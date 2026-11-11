# Portadas del unboxing: diseño 18d (borde de revista, "KIT COMPLETO" Playfair, "SANZO") sobre cuadros limpios del crudo.
import os, subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
D = os.path.dirname(os.path.abspath(__file__)); FU = os.path.join(D, "..", "..", "..", "recursos", "fuentes")
SRC = os.path.expanduser("~/Downloads/IMG_0066.MOV"); OUT = os.path.join(D, "..", "..")
W, H = 1080, 1920; CR = (244, 237, 227)
PLAY = os.path.join(FU, "PlayfairDisplay-Bold.ttf"); JOST = os.path.join(D, "Jost-600.ttf")
OPC = [(1, 22.9, 1.08, "caja abierta con todo"), (2, 103.2, 1.06, "arnés con el logo"), (3, 70.6, 1.04, "bandana estirada"), (4, 127.0, 1.05, "caja cerrada con el logo")]

def cuadro(t, z):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(t), "-i", SRC, "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True).stdout
    from io import BytesIO
    im = Image.open(BytesIO(raw)).convert("RGB").resize((W, H))
    w, h = int(W / z), int(H / z); im = im.crop(((W - w) // 2, (H - h) // 2 - 40, (W - w) // 2 + w, (H - h) // 2 - 40 + h)).resize((W, H), Image.LANCZOS)
    im = ImageEnhance.Color(im).enhance(1.06); im = ImageEnhance.Contrast(im).enhance(1.04)
    return im.convert("RGBA")

def texto_esp(d, cx, y, t, fn, col, e):
    ws = [d.textlength(c, font=fn) + e for c in t]; x = cx - (sum(ws) - e) / 2
    for c, w in zip(t, ws): d.text((x, y), c, font=fn, fill=col, anchor="lm"); x += w

def portada(im):
    # degradé oscuro arriba para que el título se lea siempre
    g = Image.new("L", (1, H)); [g.putpixel((0, y), int(150 * max(0, 1 - y / 760) ** 1.6)) for y in range(H)]
    sombra = Image.new("RGBA", (W, H), (15, 10, 6, 0)); sombra.putalpha(g.resize((W, H))); im = Image.alpha_composite(im, sombra)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    m = 40; d.rectangle((m, m, W - m, H - m), outline=CR + (235,), width=6)
    n = 240
    while ImageFont.truetype(PLAY, n).getlength("KIT COMPLETO") > 900: n -= 4
    d.text((W / 2, 330), "KIT COMPLETO", font=ImageFont.truetype(PLAY, n), fill=CR + (255,), anchor="mm")
    d.rectangle((W / 2 - 430, 412, W / 2 + 430, 415), fill=CR + (255,))
    texto_esp(d, W / 2, 462, "SANZO", ImageFont.truetype(JOST, 52), CR + (255,), 22)
    a = lay.split()[3].point(lambda v: int(v * 0.7)); sh = Image.new("RGBA", (W, H), (15, 10, 5, 0)); sh.putalpha(a)
    out = Image.alpha_composite(im, sh.filter(ImageFilter.GaussianBlur(9))); return Image.alpha_composite(out, lay).convert("RGB")

hoja = Image.new("RGB", (4 * 368 + 8, 655 + 80), (30, 26, 23)); dh = ImageDraw.Draw(hoja); fj = ImageFont.truetype(JOST, 30)
for k, (n_, t, z, nombre) in enumerate(OPC):
    p = portada(cuadro(t, z)); p.save(os.path.join(OUT, f"_portada-unboxing-kit-op{n_}.png"))
    x = 8 + k * 368; hoja.paste(p.resize((360, 640), Image.LANCZOS), (x, 8))
    dh.ellipse((x + 8, 8 + 640 - 62, x + 62, 8 + 640 - 8), fill=(148, 96, 55)); dh.text((x + 35, 8 + 640 - 35), str(n_), font=fj, fill=CR, anchor="mm")
    dh.text((x + 4, 660), nombre, font=fj, fill=CR)
    # línea punteada del recorte 3:4 de la grilla
    for yy in (8 + 640 * 240 / 1920, 8 + 640 * 1680 / 1920):
        for xx in range(x, x + 360, 12): dh.line((xx, yy, xx + 6, yy), fill=(255, 210, 120), width=1)
hoja.save(os.path.join(OUT, "_portadas-unboxing-kit.jpg"), quality=92); print("ok")
