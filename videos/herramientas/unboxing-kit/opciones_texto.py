# Hoja de opciones numeradas para el título inicial (1-4) y los rótulos de productos (5-8).
import os, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
D = os.path.dirname(os.path.abspath(__file__)); F = os.path.join(D, "..", "..", "..", "recursos", "fuentes")
W, H, S = 1080, 1920, 3
def f(nm, s): return ImageFont.truetype(nm if os.path.isabs(nm) else os.path.join(F, nm), s)
JOST6, JOST5 = os.path.join(D, "Jost-600.ttf"), os.path.join(D, "Jost-500.ttf")
CREMA, MARRON, TINTA, KRAFT, DORADO = (244, 237, 227), (148, 96, 55), (58, 50, 45), (214, 184, 140), (226, 180, 96)

def base(path):
    return Image.open(os.path.join(D, path)).convert("RGBA").resize((W, H))
def capa(): return Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
def bajar(c): return c.resize((W, H), Image.LANCZOS)
def sombra(img, blur=10, op=150, dx=4, dy=8):
    a = img.split()[3].point(lambda v: int(v * op / 255)); sh = Image.new("RGBA", img.size, (15, 10, 5, 0)); sh.putalpha(a)
    out = Image.new("RGBA", img.size, (0, 0, 0, 0)); out.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)), (dx, dy)); out.alpha_composite(img); return out
def comp(fondo, c, sh=True):
    c = bajar(c); fondo = fondo.copy(); fondo.alpha_composite(sombra(c) if sh else c); return fondo

# ---------------- títulos
def t1(fd):  # grande y fuerte
    c = capa(); d = ImageDraw.Draw(c)
    d.text((W / 2 * S, 300 * S), "UNBOXING", font=f("Anton.ttf", 190 * S), fill=(255, 255, 255, 255), anchor="mm")
    txt = "kit completo · Sanzo"; fo = f(JOST6, 50 * S); tw = d.textlength(txt, font=fo)
    d.rounded_rectangle(((W / 2 - 30) * S - tw / 2, 420 * S, (W / 2 + 30) * S + tw / 2, 510 * S), radius=45 * S, fill=MARRON + (255,))
    d.text((W / 2 * S, 465 * S), txt, font=fo, fill=CREMA + (255,), anchor="mm")
    return comp(fd, c)
def t2(fd):  # etiqueta kraft como la de la caja
    c = Image.new("RGBA", (760 * S, 300 * S), (0, 0, 0, 0)); d = ImageDraw.Draw(c)
    d.rounded_rectangle((0, 0, 760 * S, 300 * S), radius=26 * S, fill=KRAFT + (255,))
    d.rounded_rectangle((14 * S, 14 * S, 746 * S, 286 * S), radius=18 * S, outline=MARRON + (255,), width=3 * S)
    d.text((380 * S, 120 * S), "Unboxing", font=f("PlayfairDisplay-Bold.ttf", 110 * S), fill=TINTA + (255,), anchor="mm")
    d.text((380 * S, 225 * S), "DEL KIT COMPLETO SANZO", font=f(JOST5, 40 * S), fill=MARRON + (255,), anchor="mm")
    c = c.resize((760, 300), Image.LANCZOS).rotate(-4, expand=True, resample=Image.BICUBIC)
    fd = fd.copy(); fd.alpha_composite(sombra(c, 14, 140), ((W - c.width) // 2, 200)); return fd
def t3(fd):  # estilo TikTok: cajitas blancas
    c = capa(); d = ImageDraw.Draw(c); fo = f("Montserrat-ExtraBold.ttf", 66 * S); y = 1350
    for li in ["unboxing del", "kit completo Sanzo"]:
        tw = d.textlength(li, font=fo)
        d.rounded_rectangle((W / 2 * S - tw / 2 - 30 * S, y * S, W / 2 * S + tw / 2 + 30 * S, (y + 100) * S), radius=22 * S, fill=(255, 255, 255, 255))
        d.text((W / 2 * S, (y + 50) * S), li, font=fo, fill=(20, 20, 20, 255), anchor="mm"); y += 108
    return comp(fd, c, sh=False)
def t4(fd):  # editorial elegante
    c = capa(); d = ImageDraw.Draw(c)
    d.text((W / 2 * S, 250 * S), "U N B O X I N G   ·   S A N Z O", font=f(JOST5, 34 * S), fill=(255, 255, 255, 235), anchor="mm")
    d.line(((W / 2 - 60) * S, 300 * S, (W / 2 + 60) * S, 300 * S), fill=DORADO + (255,), width=3 * S)
    d.text((W / 2 * S, 400 * S), "el kit completo", font=f("CormorantGaramond-SemiBold.ttf", 140 * S), fill=(255, 255, 255, 255), anchor="mm")
    return comp(fd, c)

# ---------------- rótulos de producto (collar en la mano: hebilla ~(480,800), cuerpo ~(700,800))
def flecha(d, pts, w, col, punta=26):
    d.line([(x * S, y * S) for x, y in pts], fill=col, width=w * S, joint="curve")
    (x0, y0), (x1, y1) = pts[-2], pts[-1]; a = math.atan2(y1 - y0, x1 - x0)
    for s in (0.5, -0.5):
        d.line([(x1 * S, y1 * S), ((x1 - punta * math.cos(a + s)) * S, (y1 - punta * math.sin(a + s)) * S)], fill=col, width=w * S)
def curva(p0, p1, p2, n=30):
    return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]) for t in [i / n for i in range(n + 1)]]
def r5(fd):  # flecha a mano + palabra
    c = capa(); d = ImageDraw.Draw(c)
    d.text((300 * S, 1180 * S), "Collar", font=f("Montserrat-ExtraBold.ttf", 96 * S), fill=(255, 255, 255, 255), anchor="mm")
    flecha(d, curva((420, 1120), (560, 1080), (600, 880)), 9, (255, 255, 255, 255))
    return comp(fd, c)
def r6(fd):  # punto en el producto + línea + etiqueta crema
    c = capa(); d = ImageDraw.Draw(c); x, y = 700, 800
    d.ellipse(((x - 14) * S, (y - 14) * S, (x + 14) * S, (y + 14) * S), fill=(255, 255, 255, 255))
    d.ellipse(((x - 26) * S, (y - 26) * S, (x + 26) * S, (y + 26) * S), outline=(255, 255, 255, 200), width=3 * S)
    d.line([(x * S, (y + 26) * S), (x * S, 1120 * S), (560 * S, 1120 * S)], fill=(255, 255, 255, 255), width=4 * S)
    fo = f(JOST6, 60 * S); tw = d.textlength("Collar", font=fo)
    d.rounded_rectangle((560 * S - tw - 70 * S, 1075 * S, 560 * S, 1165 * S), radius=45 * S, fill=CREMA + (250,))
    d.text((560 * S - tw / 2 - 35 * S, 1120 * S), "Collar", font=fo, fill=TINTA + (255,), anchor="mm")
    return comp(fd, c)
def r7(fd):  # número grande + nombre
    c = capa(); d = ImageDraw.Draw(c)
    d.text((70 * S, 1560 * S), "03", font=f("Anton.ttf", 230 * S), fill=(255, 255, 255, 0), stroke_width=4 * S, stroke_fill=(255, 255, 255, 255), anchor="ls")
    d.text((330 * S, 1470 * S), "Collar", font=f("Montserrat-Black.ttf", 92 * S), fill=(255, 255, 255, 255), anchor="ls")
    d.text((334 * S, 1540 * S), "3 de 6 del kit", font=f(JOST5, 44 * S), fill=DORADO + (255,), anchor="ls")
    return comp(fd, c)
def r8(fd):  # cajita blanca estilo TikTok con tilde
    c = capa(); d = ImageDraw.Draw(c); fo = f("Montserrat-ExtraBold.ttf", 70 * S)
    txt = "collar"; tw = d.textlength(txt, font=fo); x0 = W / 2 * S - tw / 2 - 90 * S; y0 = 1120 * S
    d.rounded_rectangle((x0, y0, W / 2 * S + tw / 2 + 40 * S, y0 + 110 * S), radius=24 * S, fill=(255, 255, 255, 255))
    cx, cy = x0 + 60 * S, y0 + 55 * S
    d.ellipse((cx - 30 * S, cy - 30 * S, cx + 30 * S, cy + 30 * S), fill=MARRON + (255,))
    d.line([(cx - 14 * S, cy), (cx - 3 * S, cy + 12 * S), (cx + 16 * S, cy - 12 * S)], fill=(255, 255, 255, 255), width=7 * S, joint="curve")
    d.text((W / 2 * S + 25 * S, y0 + 55 * S), txt, font=fo, fill=(20, 20, 20, 255), anchor="mm")
    return comp(fd, c, sh=False)

hook, item = base("raw_hook.png"), base("raw_item.png")
pan = [t1(hook), t2(hook), t3(hook), t4(hook), r5(item), r6(item), r7(item), r8(item)]
tw, th = 405, 720
hoja = Image.new("RGB", (tw * 4 + 50, th * 2 + 170), (30, 26, 23)); dh = ImageDraw.Draw(hoja)
dh.text((25, 20), "TÍTULO DEL PRINCIPIO", font=f(JOST6, 34), fill=CREMA)
dh.text((25, th + 100), "NOMBRE DE CADA PRODUCTO", font=f(JOST6, 34), fill=CREMA)
for i, p in enumerate(pan):
    x = 10 + (i % 4) * (tw + 10); y = 70 + (i // 4) * (th + 80)
    hoja.paste(p.convert("RGB").resize((tw, th), Image.LANCZOS), (x, y))
    dh.ellipse((x + 12, y + 12, x + 82, y + 82), fill=MARRON); dh.text((x + 47, y + 47), str(i + 1), font=f(JOST6, 46), fill=CREMA, anchor="mm")
out = os.path.join(D, "..", "..", "..", "3-listos", "_opciones-texto-unboxing.jpg")
hoja.save(out, quality=92); print(out)
