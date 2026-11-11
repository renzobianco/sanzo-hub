# 25 opciones de título de portada sobre el cuadro real (estado final de cada animación), en una hoja numerada.
import os, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
D = os.path.dirname(os.path.abspath(__file__)); FU = os.path.join(D, "..", "..", "..", "recursos", "fuentes")
W, H = 1080, 1920
def f(nm, s):
    p = {"anton": "Anton.ttf", "mblack": "Montserrat-Black.ttf", "mxb": "Montserrat-ExtraBold.ttf", "play": "PlayfairDisplay-Bold.ttf",
         "corm": "CormorantGaramond-SemiBold.ttf"}.get(nm)
    return ImageFont.truetype(os.path.join(FU, p) if p else os.path.join(D, {"jost6": "Jost-600.ttf", "jost5": "Jost-500.ttf"}[nm]), s)
BL, CR, MA, TI, KR, DO = (255, 255, 255), (244, 237, 227), (148, 96, 55), (58, 50, 45), (214, 184, 140), (226, 180, 96)
FONDO = Image.open(os.path.join(D, "raw_hook.png")).convert("RGBA").resize((W, H))

def sombra(lay, blur=10, op=0.6, dy=6):
    a = lay.split()[3].point(lambda v: int(v * op)); sh = Image.new("RGBA", lay.size, (15, 10, 5, 0)); sh.putalpha(a)
    o = Image.new("RGBA", lay.size, (0, 0, 0, 0)); o.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)), (3, dy)); o.alpha_composite(lay); return o
def nuevo(): return Image.new("RGBA", (W, H), (0, 0, 0, 0))
def ctxt(d, y, t, fn, col, **k): d.text((W / 2, y), t, font=fn, fill=col, anchor="mm", **k)
def espaciado(d, cx, y, t, fn, col, esp):
    ws = [d.textlength(c, font=fn) + esp for c in t]; x = cx - (sum(ws) - esp) / 2
    for c, w in zip(t, ws): d.text((x, y), c, font=fn, fill=col, anchor="lm"); x += w

def o1(l, d): ctxt(d, 260, "KIT", f("anton", 300), BL); ctxt(d, 520, "COMPLETO", f("anton", 210), BL)
def o2(l, d):
    ctxt(d, 280, "KIT", f("anton", 280), (0, 0, 0, 0), stroke_width=6, stroke_fill=BL); ctxt(d, 520, "COMPLETO", f("anton", 200), BL)
def o3(l, d):
    espaciado(d, W / 2, 230, "UNBOXING", f("jost5", 38), BL, 14); ctxt(d, 360, "Kit completo", f("play", 130), BL)
def o4(l, d):
    d.line((340, 250, 740, 250), fill=DO, width=3); ctxt(d, 340, "Kit Completo", f("corm", 150), BL); d.line((340, 440, 740, 440), fill=DO, width=3)
    espaciado(d, W / 2, 480, "SANZO", f("jost5", 34), BL, 18)
def o5(l, d):
    t = Image.new("RGBA", (800, 300), (0, 0, 0, 0)); dt = ImageDraw.Draw(t)
    dt.rounded_rectangle((0, 0, 799, 299), radius=24, fill=KR); dt.rounded_rectangle((14, 14, 785, 285), radius=16, outline=MA, width=4)
    dt.text((400, 125), "KIT COMPLETO", font=f("anton", 120), fill=TI, anchor="mm"); dt.text((400, 230), "SANZO · UNBOXING", font=f("jost6", 40), fill=MA, anchor="mm")
    t = t.rotate(-5, expand=True, resample=Image.BICUBIC); l.alpha_composite(t, ((W - t.width) // 2, 180))
def o6(l, d):
    cx, cy, r = W / 2, 420, 250; d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=CR); d.ellipse((cx - r + 18, cy - r + 18, cx + r - 18, cy + r - 18), outline=MA, width=4)
    txt = " UNBOXING · KIT COMPLETO · SANZO ·"; fn = f("jost6", 40)
    for i, ch in enumerate(txt):
        a = -math.pi / 2 + i / len(txt) * 2 * math.pi; x, y = cx + (r - 52) * math.cos(a), cy + (r - 52) * math.sin(a)
        g = Image.new("RGBA", (60, 60), (0, 0, 0, 0)); ImageDraw.Draw(g).text((30, 30), ch, font=fn, fill=MA, anchor="mm")
        g = g.rotate(-math.degrees(a) - 90, resample=Image.BICUBIC); l.alpha_composite(g, (int(x - 30), int(y - 30)))
    ctxt(d, cy, "6 en 1", f("anton", 120), TI)
def o7(l, d):
    t = Image.new("RGBA", (1700, 150), MA + (255,)); dt = ImageDraw.Draw(t)
    dt.text((850, 75), "KIT COMPLETO  •  KIT COMPLETO  •  KIT COMPLETO", font=f("anton", 90), fill=CR, anchor="mm")
    t = t.rotate(8, expand=True, resample=Image.BICUBIC); l.alpha_composite(t, ((W - t.width) // 2, 230))
def o8(l, d):
    d.rectangle((250, 140, 830, 640), fill=(250, 248, 242)); fn = f("jost6", 40); y = 190
    for li in ["SANZO", "------------------------", "PEDIDO", "Kit completo   x1", "Moño · Collar · Bandana", "Correa · Arnés", "Porta bolsitas", "------------------------"]:
        d.text((540, y), li, font=f("anton", 64) if li in ("SANZO", "PEDIDO") else fn, fill=TI, anchor="mm"); y += 60 if li not in ("SANZO",) else 70
def o9(l, d):
    fn = f("mxb", 66); y = 1320
    for li in ["abriendo el kit", "completo de Sanzo"]:
        tw = d.textlength(li, font=fn); d.rounded_rectangle((W / 2 - tw / 2 - 30, y, W / 2 + tw / 2 + 30, y + 100), radius=22, fill=BL); ctxt(d, y + 50, li, fn, (20, 20, 20)); y += 108
def o10(l, d): ctxt(d, 330, "6", f("anton", 420), DO); ctxt(d, 600, "PRODUCTOS · 1 KIT", f("mblack", 62), BL)
def o11(l, d):
    d.rectangle((240, 260, 840, 560), outline=BL, width=8); d.polygon([(240, 260), (380, 160), (980, 160), (840, 260)], outline=BL, width=8)
    ctxt(d, 410, "KIT COMPLETO", f("anton", 110), BL)
def o12(l, d): ctxt(d, 290, "KIT", f("anton", 320), DO); ctxt(d, 560, "COMPLETO", f("anton", 180), BL)
def o13(l, d):
    d.text((90, 200), "KIT", font=f("anton", 280), fill=BL); d.line((90, 545, 990, 545), fill=DO, width=6)
    d.text((990, 560), "COMPLETO", font=f("anton", 150), fill=BL, anchor="ra")
def o14(l, d):
    fn = f("mblack", 110)
    for y, t in [(300, "kit"), (440, "completo")]:
        tw = d.textlength(t, font=fn); d.rectangle((W / 2 - tw / 2 - 24, y - 40, W / 2 + tw / 2 + 24, y + 70), fill=MA); ctxt(d, y + 10, t, fn, CR)
def o15(l, d):
    g = Image.new("RGBA", (1100, 200), (0, 0, 0, 0)); espaciado(ImageDraw.Draw(g), 550, 100, "UNBOXING", f("anton", 150), BL, 20)
    g = g.rotate(90, expand=True); l.alpha_composite(g, (-20, 120)); d.text((250, 330), "kit\ncompleto", font=f("play", 120), fill=BL, spacing=6)
def o16(l, d):
    d.rounded_rectangle((170, 270, 910, 450), radius=90, fill=CR)
    d.rectangle((215, 315, 305, 405), outline=MA, width=7); d.line((215, 345, 305, 345), fill=MA, width=7)
    d.text((340, 360), "Kit completo", font=f("jost6", 92), fill=MA, anchor="lm")
def o17(l, d):
    fn = f("mxb", 72); d.text((110, 300), "unboxing del", font=fn, fill=BL); d.text((110, 395), "kit completo", font=fn, fill=BL)
    x = 110 + d.textlength("kit completo", font=fn) + 10; d.rectangle((x, 400, x + 14, 480), fill=DO)
def o18(l, d):
    ctxt(d, 230, "SANZO", f("play", 200), BL); d.line((140, 340, 940, 340), fill=BL, width=3)
    espaciado(d, W / 2, 380, "EDICIÓN ESPECIAL", f("jost5", 34), BL, 10); ctxt(d, 470, "El kit completo", f("corm", 96), DO)
def o19(l, d):
    for i, a in enumerate([40, 70, 110, 170, 255]): ctxt(d, 200 + i * 95, "KIT COMPLETO", f("anton", 120), BL + (a,))
def o20(l, d):
    cx, cy = W / 2, 300; d.polygon([(cx - 150, cy - 40), (cx + 150, cy - 40), (cx + 150, cy + 130), (cx - 150, cy + 130)], fill=KR, outline=MA)
    d.polygon([(cx - 150, cy - 40), (cx - 230, cy - 140), (cx + 70, cy - 140), (cx + 150, cy - 40)], fill=(230, 205, 165)); d.line((cx - 150, cy - 40, cx + 150, cy - 40), fill=MA, width=5)
    ctxt(d, 560, "KIT COMPLETO", f("anton", 130), BL)
def o21(l, d):
    g = Image.new("RGBA", (W, 400), (0, 0, 0, 0)); dg = ImageDraw.Draw(g)
    dg.text((W / 2, 200), "Kit completo", font=f("mblack", 130), fill=MA, anchor="mm", stroke_width=18, stroke_fill=BL)
    g = g.rotate(-6, resample=Image.BICUBIC); l.alpha_composite(g, (0, 200))
def o22(l, d): d.text((110, 330), "kit completo", font=f("jost6", 120), fill=BL); d.ellipse((900, 440, 935, 475), fill=DO)
def o23(l, d):
    g = nuevo(); dg = ImageDraw.Draw(g); ctxt(dg, 360, "KIT COMPLETO", f("anton", 160), DO)
    l.alpha_composite(g.filter(ImageFilter.GaussianBlur(18))); l.alpha_composite(g.filter(ImageFilter.GaussianBlur(6))); ctxt(d, 360, "KIT COMPLETO", f("anton", 160), (255, 236, 190))
def o24(l, d): ctxt(d, 250, "¿Qué trae el", f("jost6", 70), BL); ctxt(d, 420, "KIT COMPLETO?", f("anton", 190), BL)
def o25(l, d):
    ctxt(d, 330, "KIT COMPLETO", f("anton", 170), BL)
    d.rounded_rectangle((420, 470, 660, 560), radius=45, fill=MA); ctxt(d, 515, "0/6", f("jost6", 56), CR)

OPS = [o1, o2, o3, o4, o5, o6, o7, o8, o9, o10, o11, o12, o13, o14, o15, o16, o17, o18, o19, o20, o21, o22, o23, o24, o25]
tw, th, cols = 300, 533, 5
hoja = Image.new("RGB", (cols * (tw + 8) + 8, 5 * (th + 8) + 8), (30, 26, 23)); dh = ImageDraw.Draw(hoja)
for i, op in enumerate(OPS):
    l = nuevo(); op(l, ImageDraw.Draw(l)); img = FONDO.copy(); img.alpha_composite(sombra(l))
    x = 8 + (i % cols) * (tw + 8); y = 8 + (i // cols) * (th + 8)
    hoja.paste(img.convert("RGB").resize((tw, th), Image.LANCZOS), (x, y))
    dh.ellipse((x + 8, y + th - 70, x + 70, y + th - 8), fill=MA); dh.text((x + 39, y + th - 39), str(i + 1), font=f("jost6", 36), fill=CR, anchor="mm")
out = os.path.join(D, "..", "..", "_portadas-25-opciones.jpg"); hoja.save(out, quality=90); print(os.path.abspath(out))
