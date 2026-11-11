# Variantes de las portadas 14 (resaltador), 18 (revista) y 24 (pregunta), en una hoja numerada.
import os, math, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter
D = os.path.dirname(os.path.abspath(__file__)); FU = os.path.join(D, "..", "..", "..", "recursos", "fuentes")
W, H = 1080, 1920
def f(nm, s):
    p = {"anton": "Anton.ttf", "mblack": "Montserrat-Black.ttf", "mxb": "Montserrat-ExtraBold.ttf", "play": "PlayfairDisplay-Bold.ttf",
         "corm": "CormorantGaramond-SemiBold.ttf"}.get(nm)
    return ImageFont.truetype(os.path.join(FU, p) if p else os.path.join(D, {"jost6": "Jost-600.ttf", "jost5": "Jost-500.ttf"}[nm]), s)
BL, CR, MA, TI, KR, DO, NE = (255, 255, 255), (244, 237, 227), (148, 96, 55), (58, 50, 45), (214, 184, 140), (226, 180, 96), (20, 20, 20)
FONDO = Image.open(os.path.join(D, "raw_hook.png")).convert("RGBA").resize((W, H))
def sombra(lay, blur=10, op=0.6, dy=6):
    a = lay.split()[3].point(lambda v: int(v * op)); sh = Image.new("RGBA", lay.size, (15, 10, 5, 0)); sh.putalpha(a)
    o = Image.new("RGBA", lay.size, (0, 0, 0, 0)); o.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)), (3, dy)); o.alpha_composite(lay); return o
def ctxt(d, y, t, fn, col, x=W / 2, **k): d.text((x, y), t, font=fn, fill=col, anchor="mm", **k)
def esp(d, cx, y, t, fn, col, e):
    ws = [d.textlength(c, font=fn) + e for c in t]; x = cx - (sum(ws) - e) / 2
    for c, w in zip(t, ws): d.text((x, y), c, font=fn, fill=col, anchor="lm"); x += w
def marca(d, y, t, fn, fondo, col, pad=24, alto=(40, 70), x=W / 2, rugoso=False):
    tw = d.textlength(t, font=fn)
    if rugoso:
        rnd = random.Random(len(t)); pts = []
        x0, x1, y0, y1 = x - tw / 2 - pad, x + tw / 2 + pad, y - alto[0], y + alto[1]
        for i in range(13): pts.append((x0 + (x1 - x0) * i / 12, y0 + rnd.uniform(-8, 8)))
        for i in range(13): pts.append((x1 - (x1 - x0) * i / 12 + rnd.uniform(-4, 4), y1 + rnd.uniform(-8, 8)))
        d.polygon(pts, fill=fondo)
    else: d.rectangle((x - tw / 2 - pad, y - alto[0], x + tw / 2 + pad, y + alto[1]), fill=fondo)
    ctxt(d, y + 12, t, fn, col, x=x)
def rotado(l, dibujar, ang, y0):
    g = Image.new("RGBA", (W, 700), (0, 0, 0, 0)); dibujar(ImageDraw.Draw(g)); g = g.rotate(ang, resample=Image.BICUBIC); l.alpha_composite(g, (0, y0))

# ---- 14: resaltador
def a14(l, d): fn = f("mblack", 110); marca(d, 300, "kit", fn, CR, MA); marca(d, 440, "completo", fn, CR, MA)
def b14(l, d):
    def dib(g): fn = f("mblack", 105); marca(g, 200, "kit", fn, DO, NE); marca(g, 340, "completo", fn, DO, NE)
    rotado(l, dib, 3, 100)
def c14(l, d): esp(d, W / 2, 230, "UNBOXING · SANZO", f("jost6", 36), BL, 10); marca(d, 360, "kit completo", f("mblack", 100), MA, CR)
def d14(l, d):
    fn = f("mblack", 96); marca(d, 260, "el kit", fn, MA, CR); marca(d, 390, "completo", fn, CR, MA); marca(d, 520, "de Sanzo", fn, MA, CR)
def e14(l, d): fn = f("mblack", 112); marca(d, 300, "kit", fn, MA, BL, rugoso=True); marca(d, 445, "completo", fn, MA, BL, rugoso=True)
def f14(l, d): ctxt(d, 280, "KIT", f("anton", 230), BL); marca(d, 470, "completo", f("mblack", 110), MA, CR)

# ---- 18: revista
def a18(l, d):
    ctxt(d, 250, "SANZO", f("play", 230), CR); d.rounded_rectangle((300, 400, 780, 480), radius=40, fill=MA); ctxt(d, 440, "Edición: Kit completo", f("jost6", 44), CR)
def b18(l, d):
    g = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ctxt(ImageDraw.Draw(g), 300, "SANZO", f("play", 290), BL + (120,)); l.alpha_composite(g)
    ctxt(d, 380, "KIT COMPLETO", f("anton", 150), BL)
def c18(l, d):
    ctxt(d, 240, "SANZO", f("play", 220), BL); d.line((110, 355, 970, 355), fill=BL, width=3)
    d.text((110, 380), "N° 01", font=f("jost6", 34), fill=BL); d.text((970, 380), "NOV 2026", font=f("jost6", 34), fill=BL, anchor="ra")
    ctxt(d, 500, "El kit completo", f("corm", 110), DO)
def d18(l, d):
    d.rectangle((40, 40, W - 40, H - 40), outline=CR, width=6); ctxt(d, 230, "SANZO", f("play", 220), CR)
    ctxt(d, 370, "EL KIT COMPLETO", f("jost6", 48), CR)
    for i in range(28): d.rectangle((800 + i * 6, 1700, 800 + i * 6 + (2 if i % 3 else 4), 1820), fill=BL)
def e18(l, d):
    d.rectangle((0, 140, W, 400), fill=CR); ctxt(d, 270, "SANZO", f("play", 210), MA); ctxt(d, 480, "El kit completo", f("play", 90), BL)
def f18(l, d):
    ctxt(d, 230, "SANZO", f("play", 220), BL); d.line((110, 345, 970, 345), fill=DO, width=4)
    ctxt(d, 430, "KIT COMPLETO", f("anton", 110), BL); y = 540
    for li in ["Moño · Collar · Bandana", "Correa · Arnés · Porta bolsitas"]: ctxt(d, y, li, f("jost6", 40), CR); y += 56

# ---- 24: pregunta
def a24(l, d): ctxt(d, 250, "¿Qué trae el", f("jost6", 72), BL); ctxt(d, 420, "KIT COMPLETO", f("anton", 165), BL, x=W / 2 - 55); d.text((1005, 410), "?", font=f("anton", 220), fill=DO, anchor="mm")
def b24(l, d):
    fn = f("mxb", 60); tw = d.textlength("¿Qué trae el", font=fn); d.rounded_rectangle((W / 2 - tw / 2 - 30, 200, W / 2 + tw / 2 + 30, 295), radius=22, fill=BL)
    ctxt(d, 248, "¿Qué trae el", fn, NE); ctxt(d, 430, "KIT COMPLETO?", f("anton", 170), BL)
def c24(l, d): ctxt(d, 280, "¿Qué trae el", f("play", 110), BL); ctxt(d, 420, "kit completo?", f("play", 110), DO)
def d24(l, d): ctxt(d, 240, "¿QUÉ VIENE EN EL", f("jost6", 56), BL); ctxt(d, 390, "KIT", f("anton", 190), BL, x=400); ctxt(d, 560, "COMPLETO", f("anton", 190), BL); d.text((820, 380), "?", font=f("anton", 300), fill=DO, anchor="mm")
def e24(l, d):
    d.rounded_rectangle((340, 190, 740, 290), radius=50, fill=MA); ctxt(d, 240, "¿Qué trae?", f("jost6", 56), CR); ctxt(d, 430, "KIT COMPLETO", f("anton", 170), BL)
def f24(l, d): ctxt(d, 300, "KIT COMPLETO", f("anton", 180), BL); ctxt(d, 460, "¿qué trae adentro?", f("jost6", 66), DO)

OPS = [("14a", a14), ("14b", b14), ("14c", c14), ("14d", d14), ("14e", e14), ("14f", f14),
       ("18a", a18), ("18b", b18), ("18c", c18), ("18d", d18), ("18e", e18), ("18f", f18),
       ("24a", a24), ("24b", b24), ("24c", c24), ("24d", d24), ("24e", e24), ("24f", f24)]
tw, th, cols = 300, 533, 6
hoja = Image.new("RGB", (cols * (tw + 8) + 8, 3 * (th + 8) + 8), (30, 26, 23)); dh = ImageDraw.Draw(hoja)
for i, (nm, op) in enumerate(OPS):
    l = Image.new("RGBA", (W, H), (0, 0, 0, 0)); op(l, ImageDraw.Draw(l)); img = FONDO.copy(); img.alpha_composite(sombra(l))
    x = 8 + (i % cols) * (tw + 8); y = 8 + (i // cols) * (th + 8)
    hoja.paste(img.convert("RGB").resize((tw, th), Image.LANCZOS), (x, y))
    dh.rounded_rectangle((x + 8, y + th - 66, x + 108, y + th - 8), radius=29, fill=MA); dh.text((x + 58, y + th - 37), nm, font=f("jost6", 34), fill=CR, anchor="mm")
out = os.path.join(D, "..", "..", "_portadas-variantes-14-18-24.jpg"); hoja.save(out, quality=90); print(os.path.abspath(out))
