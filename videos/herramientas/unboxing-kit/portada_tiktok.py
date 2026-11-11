# Portada para TikTok: todo dentro del recorte 3:4 del perfil (y 240..1680).
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'portada_final.py'), encoding='utf-8').read().split('hoja = Image.new')[0]
g = {'__file__': os.path.join(os.path.dirname(os.path.abspath(__file__)), 'portada_final.py')}; exec(src, g)
W, H, CR = 1080, 1920, (244, 237, 227)
im = g['cuadro'](22.9, 1.08)
top, bot = 240, 1680
gr = Image.new("L", (1, H))
for y in range(H): gr.putpixel((0, y), int(150 * max(0, 1 - (y - top) / 700) ** 1.6) if y >= top else 150)
sh = Image.new("RGBA", (W, H), (15, 10, 6, 0)); sh.putalpha(gr.resize((W, H))); im = Image.alpha_composite(im, sh)
lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
m = 40; d.rectangle((m, top + m, W - m, bot - m), outline=CR + (235,), width=6)
PLAY = g['PLAY']; n = 240
while ImageFont.truetype(PLAY, n).getlength("KIT COMPLETO") > 880: n -= 4
d.text((W / 2, top + 210), "KIT COMPLETO", font=ImageFont.truetype(PLAY, n), fill=CR + (255,), anchor="mm")
d.rectangle((W / 2 - 420, top + 292, W / 2 + 420, top + 295), fill=CR + (255,))
g['texto_esp'](d, W / 2, top + 342, "SANZO", ImageFont.truetype(g['JOST'], 52), CR + (255,), 22)
a = lay.split()[3].point(lambda v: int(v * 0.7)); s2 = Image.new("RGBA", (W, H), (15, 10, 5, 0)); s2.putalpha(a)
out = Image.alpha_composite(Image.alpha_composite(im, s2.filter(ImageFilter.GaussianBlur(9))), lay).convert("RGB")
dst = r"D:\CLAUDIO\sanzo-hub\videos\videos ya publicados\unboxing kit completo"
out.save(os.path.join(dst, "portada-tiktok.png"))
prev = out.crop((0, top, W, bot)).resize((540, 720), Image.LANCZOS)
ig = Image.open(os.path.join(dst, "portada.png")).crop((0, top, W, bot)).resize((540, 720), Image.LANCZOS)
hoja = Image.new("RGB", (540 * 2 + 30, 720 + 70), (30, 26, 23)); hoja.paste(ig, (10, 60)); hoja.paste(prev, (560, 60))
dh = ImageDraw.Draw(hoja); fj = ImageFont.truetype(g['JOST'], 30)
dh.text((10, 15), "Antes (así la recorta TikTok)", font=fj, fill=CR); dh.text((560, 15), "Nueva para TikTok", font=fj, fill=CR)
hoja.save(r"D:\CLAUDIO\sanzo-hub\videos\3-listos\_opciones\_portada-tiktok-comparacion.jpg", quality=92); print("ok")
