# Unboxing POV "Kit Paseo Sanzo" (IMG_0066). Sin audio original: cortes, cámara rápida, HUD de checklist, rótulos y cierre.
# Uso: python render_kit.py FUENTE.MOV CARPETA_TRABAJO SALIDA.mp4 [--cuadros t1,t2] [--desde S --hasta S]
import sys, os, subprocess, json, math
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SRC, WORK, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
args = sys.argv[4:]
def opt(n, d=None): return args[args.index(n) + 1] if n in args else d
FPS, W, H = 30, 1080, 1920
SUBY = 1480  # rótulos siempre acá

ITEMS = ["Moño", "Porta bolsitas", "Collar", "Bandana", "Correa", "Arnés"]
# (nombre, piezas [(desde, hasta, velocidad)], zoom ini, zoom fin, cy, rótulo, ítem que se tilda, golpe de zoom)
SHOTS = [
    ("bolsa",        [(8.6, 10.0, 1.4)],   1.06, 1.10, 900, None, None, False),
    ("rompe",        [(10.5, 17.7, 3.5)],  1.08, 1.12, 900, None, None, False),
    ("caja",         [(17.7, 20.4, 1.6)], 1.14, 1.06, 880, None, None, True),
    ("abre",         [(20.4, 22.6, 1.0)],  1.06, 1.10, 880, None, None, False),
    ("tarjeta",      [(23.6, 26.1, 1.0)],  1.14, 1.20, 860, None, None, True),
    ("mono_saca",    [(27.6, 32.1, 3.0)],  1.08, 1.10, 880, None, None, False),
    ("mono",         [(32.1, 34.4, 1.0)],  1.10, 1.15, 880, "Moño", 0, False),
    ("pb_saca",      [(38.0, 39.6, 2.0)],  1.08, 1.10, 880, None, None, False),
    ("pb",           [(39.6, 42.0, 1.0)],  1.10, 1.16, 880, "Porta bolsitas", 1, False),
    ("collar_saca",  [(45.4, 48.9, 2.5)],  1.08, 1.10, 880, None, None, False),
    ("collar",       [(48.9, 52.9, 1.0)], 1.10, 1.15, 880, "Collar", 2, False),
    ("bandana_saca", [(63.9, 65.2, 1.0), (65.2, 69.5, 3.0)],  1.08, 1.10, 880, None, None, False),
    ("bandana",      [(69.5, 70.3, 1.0), (70.3, 71.8, 0.7)],  1.10, 1.12, 880, "Bandana", 3, False),
    ("correa_saca",  [(79.4, 81.2, 2.0)],  1.08, 1.10, 880, None, None, False),
    ("correa",       [(81.2, 82.3, 1.0), (82.3, 83.4, 2.0), (83.4, 84.8, 1.0)], 1.10, 1.13, 880, "Correa", 4, False),
    ("arnes_saca",   [(99.6, 101.8, 2.0)], 1.08, 1.10, 880, None, None, False),
    ("arnes",        [(101.8, 105.4, 1.0)],1.10, 1.13, 880, "Arnés", 5, False),
    ("arnes_atras",  [(106.8, 108.8, 1.2)],1.06, 1.10, 900, None, None, False),
    ("chapa1",       [(113.0, 114.3, 1.0)],1.18, 1.22, 1000, "+ Chapitas grabadas", None, True),
    ("chapa2",       [(117.4, 118.9, 1.0)],1.18, 1.22, 1000, None, None, True),
    ("chapa3",       [(121.9, 123.4, 1.0)],1.18, 1.22, 1000, None, None, True),
    ("cierra",       [(124.9, 127.4, 1.2)],1.06, 1.12, 900, None, None, False),
]
CIERRE = 2.7

# ------------------------------------------------------------------ utilidades
def ease(u): u = min(max(u, 0), 1); return u * u * (3 - 2 * u)
def eout(u): u = min(max(u, 0), 1); return 1 - (1 - u) ** 3
def eback(u):
    u = min(max(u, 0), 1); c = 1.7; return 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2

class Lector:
    def __init__(self, path, t0, t1):
        self.fps = 60000 / 1001; self.t0 = t0
        self.p = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", f"{t0:.3f}", "-i", path, "-t", f"{t1 - t0 + 0.3:.3f}",
                                   "-an", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], stdout=subprocess.PIPE, bufsize=10**8)
        self.n = 0; self.buf = []; self.vel = 1
    def _leer(self):
        raw = self.p.stdout.read(W * H * 3)
        if len(raw) < W * H * 3: return None
        fr = (self.t0 + self.n / self.fps, np.frombuffer(raw, np.uint8).reshape(H, W, 3)); self.n += 1; return fr
    def ventana(self, a, b):
        while not self.buf or self.buf[-1][0] < b:
            fr = self._leer()
            if fr is None: break
            self.buf.append(fr)
        sel = [f for t, f in self.buf if a - 1e-6 <= t < b]
        if not sel: sel = [min(self.buf, key=lambda x: abs(x[0] - (a + b) / 2))[1]]
        self.buf = [x for x in self.buf if x[0] >= b - 2 / self.fps]
        if len(sel) == 1: return sel[0]
        if self.vel < 2: sel = [sel[len(sel) // 2]]
        sel = sel[:4]  # desenfoque de movimiento suave en cámara rápida (máx 4 cuadros)
        acc = sel[0].astype(np.float32)
        for f in sel[1:]: acc += f
        return (acc / len(sel)).astype(np.uint8)
    def cerrar(self):
        try: self.p.kill()
        except Exception: pass

def encuadrar(img, z, cy):
    ww, hh = W / z, H / z
    x0 = (W - ww) / 2; y0 = min(max(cy - hh / 2, 0), H - hh)
    M = np.float32([[z, 0, -x0 * z], [0, z, -y0 * z]])
    return cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

def hacer_lut():
    x = np.arange(256) / 255.0; luts = []
    for c in range(3):  # B G R
        y = x + 0.05 * np.sin(np.pi * (x - 0.5)) * (1 - abs(2 * x - 1))
        y = 0.012 + y * 0.982
        if c == 2: y = y ** 0.98
        if c == 0: y = y ** 1.03
        luts.append(np.clip(y * 255, 0, 255).astype(np.uint8))
    return np.dstack(luts).reshape(1, 256, 3)
LUT = hacer_lut()
def grade(img):
    img = cv2.LUT(img, LUT); f = img.astype(np.float32); l = f @ np.float32([0.114, 0.587, 0.299])
    return np.clip(l[..., None] + (f - l[..., None]) * 1.06, 0, 255).astype(np.uint8)

VIN = None
def viñeta(img):
    global VIN
    if VIN is None:
        yy, xx = np.mgrid[0:H, 0:W]; d = np.sqrt(((xx - W / 2) / (W * 0.75)) ** 2 + ((yy - H * 0.47) / (H * 0.72)) ** 2)
        VIN = (1 - 0.28 * np.clip(d - 0.55, 0, 1) ** 1.5)[..., None].astype(np.float32)
    return (img.astype(np.float32) * VIN).astype(np.uint8)

# ------------------------------------------------------------------ gráficos (PIL, RGBA del tamaño del cuadro)
F6 = os.path.join(WORK, "Jost-600.ttf"); F5 = os.path.join(WORK, "Jost-500.ttf")
def fuente(p, s): return ImageFont.truetype(p, s)
CREMA = (244, 237, 227); MARRON = (148, 96, 55); TINTA = (58, 50, 45); DORADO = (226, 180, 96)

def texto_sombra(capa, xy, txt, f, col, anchor="la", a=255, blur=8):
    sh = Image.new("RGBA", capa.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).text((xy[0] + 3, xy[1] + 5), txt, font=f, fill=(20, 12, 6, int(160 * a / 255)), anchor=anchor)
    capa.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)))
    ImageDraw.Draw(capa).text(xy, txt, font=f, fill=col + (a,), anchor=anchor)

def rotulo(capa, lineas, oro, t, t_fin):
    """Rótulo en SUBY: entra subiendo, subrayado dorado que se dibuja; sale bajando opacidad."""
    a = eout(t / 0.3) * (1 - ease((t - t_fin) / 0.25));
    if a <= 0.01: return
    f = fuente(F6, 92); d = ImageDraw.Draw(capa)
    y = SUBY + int((1 - eout(t / 0.3)) * 30)
    for li in lineas:
        ancho = d.textlength(li, font=f); x = (W - ancho) / 2
        oros = set(w.strip("¿?¡!.,") for w in oro.split(" ")); xs = []
        for pal in li.split(" "):
            es_oro = pal.strip("¿?¡!.,") in oros
            texto_sombra(capa, (x, y), pal, f, DORADO if es_oro else (255, 255, 255), a=int(255 * a))
            if es_oro: xs.append((x, x + d.textlength(pal.rstrip("?!.,"), font=f)))
            x += d.textlength(pal + " ", font=f)
        k = ease((t - 0.15) / 0.35)
        if xs and k > 0:
            ux0, ux1 = xs[0][0], xs[-1][1]
            ImageDraw.Draw(capa).rounded_rectangle((ux0, y + 108, ux0 + (ux1 - ux0) * k, y + 118), radius=5, fill=DORADO + (int(255 * a),))
        y += 106

def check(d, cx, cy, r, col, w=6, k=1.0):
    pts = [(cx - r * 0.45, cy + r * 0.02), (cx - r * 0.1, cy + r * 0.35), (cx + r * 0.5, cy - r * 0.35)]
    if k <= 0: return
    if k < 0.4: d.line([pts[0], (pts[0][0] + (pts[1][0] - pts[0][0]) * k / 0.4, pts[0][1] + (pts[1][1] - pts[0][1]) * k / 0.4)], fill=col, width=w); return
    q = (k - 0.4) / 0.6
    d.line([pts[0], pts[1], (pts[1][0] + (pts[2][0] - pts[1][0]) * q, pts[1][1] + (pts[2][1] - pts[1][1]) * q)], fill=col, width=w, joint="curve")

SS = 3          # el panel se dibuja al triple y se achica: bordes suaves, nada pixelado
PANEL_H = 520  # alto del lienzo del panel (desde y=0)
_SOMBRAS = {}
def sombra_panel(px, py, pw, ph):
    k = (px, py, pw, ph)
    if k not in _SOMBRAS:
        sh = Image.new("L", (W, PANEL_H), 0)
        ImageDraw.Draw(sh).rounded_rectangle((px, py + 10, px + pw, py + ph + 10), radius=34, fill=95)
        _SOMBRAS[k] = sh.filter(ImageFilter.GaussianBlur(16))
        if len(_SOMBRAS) > 80: _SOMBRAS.pop(next(iter(_SOMBRAS)))
    return _SOMBRAS[k]

CENSURA = int(os.environ.get("CENSURA", "2"))  # Santino: pixelado (eligió 2)
_ABC = "ABCDEFGHJKLMNPRSTUVWXYZabcdefghijkmnoprstuvwxyz"
def censurada(big, d, nm, x, cy, fnt, col, prog, salta, semilla):
    """Dibuja el nombre censurado (prog=0) que se va revelando (prog=1). Estilos: 1 desenfoque, 2 pixelado, 3 asteriscos,
    4 signos de pregunta, 5 letras que cambian (glitch), 6 primera letra + puntos."""
    S = SS; n = len(nm); nv = int(prog * n + 1e-6)
    if CENSURA == 0: return _palabra(d, nm, x, cy, fnt, col, salta)
    if CENSURA in (1, 2):
        if prog >= 1: return _palabra(d, nm, x, cy, fnt, col, salta)
        g = Image.new("RGBA", (int(d.textlength(nm, font=fnt)) + 40 * S, 70 * S), (0, 0, 0, 0))
        ImageDraw.Draw(g).text((20 * S, 35 * S), nm, font=fnt, fill=col + (255,), anchor="lm")
        q = 1 - ease(prog)
        if CENSURA == 1: g = g.filter(ImageFilter.GaussianBlur(max(0.1, 11 * S * q)))
        else:
            b = max(1, int(16 * S * q)); g = g.resize((max(1, g.width // b), max(1, g.height // b)), Image.BILINEAR).resize(g.size, Image.NEAREST)
        big.alpha_composite(g, (int(x * S - 20 * S), int(cy * S - 35 * S))); return
    txt = ""
    for j, ch in enumerate(nm):
        if j < nv or ch == " ": txt += ch
        elif CENSURA == 3: txt += "*"
        elif CENSURA == 4: txt += "?"
        elif CENSURA == 5: txt += _ABC[(semilla * 7 + j * 13 + int(FRAME_T * 12) * 5) % len(_ABC)]
        else: txt += ch if j == 0 else "•"
    _palabra(d, txt, x, cy, fnt, col, salta)

def _palabra(d, txt, x, y, fnt, col, salta):
    S = SS
    for j, ch in enumerate(txt):
        hop = 0
        if salta is not None:
            v = (FRAME_T - salta - j * 0.035) / 0.26
            if 0 < v < 1: hop = -10 * np.sin(np.pi * v)
        d.text((x * S, (y + hop) * S), ch, font=fnt, fill=col + (255,), anchor="lm"); x += d.textlength(ch, font=fnt) / S

FRAME_T = 0.0
def panel(capa, t_in, checks, t, t_out):
    global FRAME_T
    FRAME_T = t
    """Checklist del kit arriba. checks: lista de tiempos (s) en que se tilda cada ítem."""
    a = eout((t - t_in) / 0.4) * (1 - ease((t - t_out) / 0.3))
    if a <= 0.01: return
    dy = int((1 - eout((t - t_in) / 0.4)) * -60)
    px, py, pw, ph = 48, 170 + dy, W - 96, 240
    if t >= EXTRA - 0.12: ph = 240 + int(64 * eout((t - EXTRA + 0.12) / 0.4))
    S = SS
    big = Image.new("RGBA", (W * S, PANEL_H * S), (0, 0, 0, 0)); d = ImageDraw.Draw(big)
    def R(*v): return tuple(x * S for x in v)
    d.rounded_rectangle(R(px, py, px + pw, py + ph), radius=34 * S, fill=CREMA + (242,))
    d.rounded_rectangle(R(px, py, px + pw, py + ph), radius=34 * S, outline=(226, 212, 192, 255), width=2 * S)
    n = sum(1 for c in checks if c is not None and t >= c)
    completo = n == len(ITEMS)
    d.text(R(px + 36, py + 50), "KIT COMPLETO SANZO", font=fuente(F6, 40 * S), fill=TINTA + (255,), anchor="lm")
    ult = max([c for c in checks if c is not None and t >= c], default=-9)
    sc = 1 + 0.35 * (1 - eout((t - ult) / 0.35)) if t - ult < 0.35 else 1
    col = DORADO if completo else MARRON
    d.text(R(px + pw - 36, py + 50), f"{n}/{len(ITEMS)}", font=fuente(F6, int(42 * sc * S)), fill=col + (255,), anchor="rm")
    bx0, bx1, by = px + 36, px + pw - 36, py + 90
    d.rounded_rectangle(R(bx0, by, bx1, by + 10), radius=5 * S, fill=(224, 212, 196, 255))
    prog = sum((eout((t - c) / 0.4) if t >= c else 0) for c in checks if c is not None) / len(ITEMS)
    if prog > 0.004: d.rounded_rectangle(R(bx0, by, bx0 + (bx1 - bx0) * prog, by + 10), radius=5 * S, fill=col + (255,))
    fi = fuente(F5, 36 * S); fb = fuente(F6, 36 * S)
    colw = (pw - 72) / 3
    def celda(i):
        if i < len(ITEMS):
            cx = px + 36 + (i % 3) * colw; cy = py + 146 + (i // 3) * 58
            return (cx - 12, cy - 26, cx + colw - 16, cy + 26)
        cy = py + 146 + 2 * 58 + 4; return (px + 24, cy - 26, px + pw - 24, cy + 26)
    # producto que se está viendo (y cuándo se pasó a él)
    tiempos = [(c, i) for i, c in enumerate(checks) if c is not None] + [(EXTRA + 0.4, len(ITEMS))]
    pasados = sorted([x for x in tiempos if t >= x[0] - 0.12])
    cur, tc = (pasados[-1][1], pasados[-1][0] - 0.12) if pasados else (None, None)
    prev = pasados[-2][1] if len(pasados) > 1 else None
    if cur is not None:
        q = eout((t - tc) / 0.38); c1 = celda(cur)
        if prev is None:
            cxm, cym = (c1[0] + c1[2]) / 2, (c1[1] + c1[3]) / 2; c0 = (cxm, cym, cxm, cym)
        else: c0 = celda(prev)
        box = tuple(u0 + (u1 - u0) * q for u0, u1 in zip(c0, c1))
        d.rounded_rectangle(R(*box), radius=26 * S, fill=MARRON + (255,))
    def palabra(txt, x, y, fnt, col, salta):
        for j, ch in enumerate(txt):
            hop = 0
            if salta is not None:
                v = (t - salta - j * 0.035) / 0.26
                if 0 < v < 1: hop = -10 * np.sin(np.pi * v)
            d.text(R(x, y + hop), ch, font=fnt, fill=col + (255,), anchor="lm"); x += d.textlength(ch, font=fnt) / S
    for i, nm in enumerate(ITEMS):
        cx = px + 36 + (i % 3) * colw; cy = py + 146 + (i // 3) * 58
        c = checks[i]; k = eout((t - c) / 0.3) if (c is not None and t >= c) else 0
        r = 17; activo = (i == cur) and (t - tc) > 0.3
        if k > 0:
            rr = r * (1 + 0.4 * np.sin(np.pi * min(1, k)) * (1 - k))
            d.ellipse(R(cx + r - rr, cy - rr, cx + r + rr, cy + rr), fill=(CREMA if activo else MARRON) + (255,))
            check(d, (cx + r) * S, cy * S, r * S, (MARRON if activo else CREMA) + (255,), w=5 * S, k=ease((t - c) / 0.35))
        else:
            d.ellipse(R(cx, cy - r, cx + 2 * r, cy + r), outline=(190, 172, 150, 255), width=3 * S)
        col_t = CREMA if activo else (TINTA if k > 0 else (150, 136, 120))
        fnt_i = fb if activo else fi; x_t = cx + 2 * r + 14
        ancho = d.textlength(nm, font=fnt_i) / S
        prog = 0.0 if (c is None or t < c - 0.12) else min(1.0, (t - (c - 0.12)) / (0.05 * len(nm)))
        censurada(big, d, nm, x_t, cy, fnt_i, col_t, prog, tc + 0.2 if (i == cur and prog >= 1) else None, i)
    if t >= EXTRA - 0.12:  # fila extra de las chapitas
        ke = eout((t - EXTRA + 0.12) / 0.4); txt = "+ Chapitas grabadas"; fe = fuente(F6, 38 * S)
        tw = d.textlength(txt, font=fe) / S; cy = py + 146 + 2 * 58 + 4
        if ke > 0.3: palabra(txt, W / 2 - tw / 2, cy, fe, CREMA if (cur == len(ITEMS) and t - tc > 0.3) else TINTA, EXTRA + 0.5)
    if completo:  # brillo que cruza el panel al llegar a 6/6
        g = t - max(checks)
        if 0 <= g < 0.6:
            x = px + pw * ease(g / 0.6) * 1.3 - 120
            m = Image.new("L", big.size, 0); ImageDraw.Draw(m).polygon([R(x, py), R(x + 70, py), R(x - 10, py + ph), R(x - 80, py + ph)], fill=110)
            m = Image.fromarray(np.minimum(np.array(m), np.array(big.split()[3])))
            big.alpha_composite(Image.merge("RGBA", (Image.new("L", big.size, 255),) * 3 + (m,)))
    lay = big.resize((W, PANEL_H), Image.LANCZOS)
    out = Image.new("RGBA", (W, PANEL_H), (0, 0, 0, 0))
    out.putalpha(sombra_panel(px, py, pw, ph)); out = Image.alpha_composite(out, lay)
    if a < 1: out.putalpha(out.split()[3].point(lambda v: int(v * a)))
    capa.alpha_composite(out, (0, 0))

def chip_rapido(capa, vel, t):
    a = eout(t / 0.15)
    if a <= 0.01: return
    S = SS; w, h = 156, 66; x1, y0 = W - 48, 448
    big = Image.new("RGBA", (w * S, h * S), (0, 0, 0, 0)); d = ImageDraw.Draw(big)
    d.rounded_rectangle((0, 0, w * S - 1, h * S - 1), radius=33 * S, fill=(30, 22, 16, 160))
    fl = 0.75 + 0.25 * (np.sin(t * 14) > 0)
    for k in range(2):
        tx = (26 + k * 20) * S
        d.polygon([(tx, 19 * S), (tx, (h - 19) * S), (tx + 20 * S, h / 2 * S)], fill=(255, 255, 255, int(255 * fl)))
    d.text((104 * S, h / 2 * S), f"x{vel:g}", font=fuente(F6, 34 * S), fill=(255, 255, 255, 255), anchor="mm")
    lay = big.resize((w, h), Image.LANCZOS)
    if a < 1: lay.putalpha(lay.split()[3].point(lambda v: int(v * a)))
    capa.alpha_composite(lay, (x1 - w, y0))

LOGO = os.path.join(WORK, "logo-texto.png")
def capa_sombra_simple(lay, op):
    if op <= 0.01: return lay
    a = lay.split()[3].point(lambda v: int(v * op)); sh = Image.new("RGBA", lay.size, (20, 12, 6, 0)); sh.putalpha(a)
    o = Image.new("RGBA", lay.size, (0, 0, 0, 0)); o.alpha_composite(sh.filter(ImageFilter.GaussianBlur(14)), (4, 14)); o.alpha_composite(lay); return o

_LOGO_PIEZAS = None
def piezas_logo():
    global _LOGO_PIEZAS
    if _LOGO_PIEZAS is None:
        lg = Image.open(LOGO).convert("RGBA"); cortes = [(0, 167), (167, 367), (367, 556), (556, 742), (742, lg.width)]
        _LOGO_PIEZAS = (lg, [(x0, lg.crop((x0, 0, x1, lg.height))) for x0, x1 in cortes])
    return _LOGO_PIEZAS

CAJA_LOGO = (648, 618, 456, 3.0)  # centro x, centro y, ancho y giro (grados) del logo impreso en la caja, último cuadro
def cuadro_cierre(t, fondo=None):
    img = Image.new("RGBA", (W, H), CREMA + (255,)); d = ImageDraw.Draw(img)
    for x in range(0, W, 72): d.line([(x, 0), (x, H)], fill=(0xEE, 0xE4, 0xD6), width=2)
    for y in range(0, H, 72): d.line([(0, y), (W, y)], fill=(0xEE, 0xE4, 0xD6), width=2)
    lg, piezas = piezas_logo(); esc = 720 / lg.width; lh = lg.height * esc; X0 = (W - 720) / 2; Y0 = 720 - lh / 2
    # fondo: la caja se funde con el crema mientras el logo se despega
    if fondo is not None:
        kf = ease((t - 0.3) / 0.55)
        if kf < 1:
            caja = Image.fromarray(fondo[..., ::-1].copy()).convert("RGBA")
            img = Image.blend(caja, img, kf); d = ImageDraw.Draw(img)
    bx, by, bw, bang = CAJA_LOGO; sb = bw / lg.width; ca, sa = math.cos(math.radians(-bang)), math.sin(math.radians(-bang))
    capa = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    for j, (x0, pz) in enumerate(piezas):
        # origen: sobre el logo impreso de la caja (con su giro); destino: el lugar final centrado
        ox, oy = (x0 + pz.width / 2 - lg.width / 2) * sb, 0
        sx, sy = bx + ox * ca - oy * sa, by + ox * sa + oy * ca
        ex, ey = X0 + (x0 + pz.width / 2) * esc, Y0 + lh / 2
        a_ = min(1, t / 0.2)                       # aparece sobre la caja
        lev = eout(min(1, t / 0.3))                # se despega: crece un poco y hace sombra
        u = (t - 0.3 - j * 0.06) / 0.55            # viaja al centro, letra por letra
        q = eback(u) if 0 < u < 1 else (1.0 if u >= 1 else 0.0)
        qp = eout(min(1, max(0, u)))
        esc_j = sb * (1 + 0.08 * lev) + (esc - sb * 1.08) * q
        arco = -90 * math.sin(math.pi * min(1, max(0, u)))   # suben en arco antes de asentarse
        cx = sx + (ex - sx) * qp; cy = sy + (ey - sy) * qp + arco
        rot = bang * (1 - qp) + (8 if j % 2 else -8) * math.sin(math.pi * min(1, max(0, u)))
        w, h = max(1, int(pz.width * esc_j)), max(1, int(pz.height * esc_j))
        g = pz.resize((w, h), Image.LANCZOS).rotate(-rot, expand=True, resample=Image.BICUBIC)
        if a_ < 1: g.putalpha(g.split()[3].point(lambda v, a2=a_: int(v * a2)))
        capa.alpha_composite(g, (int(cx - g.width / 2), int(cy - g.height / 2)))
    img.alpha_composite(capa_sombra_simple(capa, 0.35 * (1 - ease((t - 0.9) / 0.4))))
    # "Kit completo" letra por letra
    fk = fuente(F5, 58); txt = "Kit completo"; anchos = [d.textlength(ch, font=fk) for ch in txt]; xk = W / 2 - sum(anchos) / 2
    for j, ch in enumerate(txt):
        u = (t - 1.05 - j * 0.03) / 0.3
        if u > 0 and ch != " ":
            a_ = min(1, u * 1.6); dy = (1 - eout(u)) * 22
            d.text((xk, 860 + dy), ch, font=fk, fill=TINTA + (int(255 * a_),), anchor="lm")
        xk += anchos[j]
    # pastilla que aparece con rebote
    kp = (t - 1.45) / 0.4
    if kp > 0:
        s_ = eback(kp) if kp < 1 else 1.0; f = fuente(F5, 52); txt = "Ya disponible en nuestra web"
        tw = d.textlength(txt, font=f); pw, ph = (tw + 110) * s_, 108 * s_
        c2 = Image.new("RGBA", (W, H), (0, 0, 0, 0)); dc = ImageDraw.Draw(c2); a_ = min(1, kp * 2)
        dc.rounded_rectangle((W / 2 - pw / 2, 1004 - ph / 2, W / 2 + pw / 2, 1004 + ph / 2), radius=ph / 2, fill=MARRON + (int(255 * a_),))
        if s_ > 0.6: dc.text((W / 2, 1006), txt, font=fuente(F5, max(8, int(52 * s_))), fill=CREMA + (int(255 * a_),), anchor="mm")
        img.alpha_composite(c2)
    return np.array(img.convert("RGB"))[..., ::-1].copy()

# ------------------------------------------------------------------ línea de tiempo
for i, s in enumerate(SHOTS):
    nf = [int(round((b - a) / v * FPS)) for a, b, v in s[1]]
    SHOTS[i] = s + (nf, sum(nf))
starts = []; acc = 0
for s in SHOTS: starts.append(acc); acc += s[-1]
CIE0 = acc; TOTAL = CIE0 + int(CIERRE * FPS)
def ini(nm): return starts[[s[0] for s in SHOTS].index(nm)] / FPS
def fin(nm): i = [s[0] for s in SHOTS].index(nm); return (starts[i] + SHOTS[i][-1]) / FPS

CHECKS = [None] * len(ITEMS)
TITULO = fin("rompe") - 0.35
ETQ = []
for s in SHOTS:
    if s[6] is not None: CHECKS[s[6]] = ini(s[0]) + 0.15
    if s[5] and s[0] != "chapa1": ETQ.append((ini(s[0]) + 0.05, fin("arnes_atras" if s[0] == "arnes" else s[0]) - 0.3, [s[5]], s[0]))
ETQ.append((ini("chapa1") + 0.05, fin("chapa3") - 0.3, ["Chapitas", "grabadas"], "chapa1"))
import textos_animados as TXA
titulo, etiqueta = TXA.instalar(globals())
PANEL = (ini("abre") + 0.6, fin("chapa3") - 0.05)
EXTRA = ini("chapa1") + 0.15
RAPIDO = []
for i, s_ in enumerate(SHOTS):
    t_ = starts[i] / FPS
    for (pa, pb, pv), pn in zip(s_[1], s_[-2]):
        if pv >= 2.0: RAPIDO.append((t_, t_ + pn / FPS, pv))
        t_ += pn / FPS
def t_src(nm, src):
    i = [s_[0] for s_ in SHOTS].index(nm); t_ = starts[i] / FPS
    for (pa, pb, pv), pn in zip(SHOTS[i][1], SHOTS[i][-2]):
        if src <= pb: return t_ + max(0, src - pa) / pv
        t_ += pn / FPS
    return t_
SRC_EV = dict(bolsa_sale=("caja", 17.75), tapa=("abre", 20.9), tarjeta_gira=("tarjeta", 25.05),
              mono_sale=("mono", 32.2), pb_sale=("pb", 39.7), collar_cierra1=("collar", 50.85), collar_abre=("collar", 51.4),
              collar_cierra2=("collar", 52.35), bandana_sale=("bandana_saca", 64.6), bandana_estira=("bandana", 69.8),
              correa_sale=("correa", 81.3), correa_estira=("correa", 83.5),
              arnes_sale=("arnes", 102.1), arnes_gira=("arnes_atras", 106.9), chapa1=("chapa1", 113.3), chapa=("chapa2", 117.9), chapa3=("chapa3", 122.3), tapa_cierra=("cierra", 125.3))
EVENTOS = dict(teclas=TXA.teclas(TITULO), src={k: t_src(*v) for k, v in SRC_EV.items()}, cortes=[ini(s[0]) for s in SHOTS], checks=CHECKS, caja=ini("caja"), abre=ini("abre") + 0.5,
               chapas=[ini("chapa1") + 0.25, ini("chapa2") + 0.25, ini("chapa3") + 0.25], tapa=ini("cierra") + 0.4 / 1.2, tarjeta=ini("tarjeta"), tomas={s[0]: [ini(s[0]), fin(s[0])] for s in SHOTS}, cierre=CIE0 / FPS,
               rapido=RAPIDO, completo=CHECKS[-1], panel=PANEL[0], total=TOTAL / FPS)
json.dump(EVENTOS, open(os.path.join(WORK, "eventos.json"), "w"), indent=1)
print("duración", round(TOTAL / FPS, 2), [(s[0], round(starts[i] / FPS, 2)) for i, s in enumerate(SHOTS)], flush=True)

# difuminados de datos personales: (toma, [(seg desde inicio de toma, cx, cy, rx, ry)])
BORRONES = [
]
BORR = [(ini(nm), fin(nm), k) for nm, k in BORRONES]
def borrar(img, t):
    for a, b, kf in BORR:
        if not (a <= t < b): continue
        u = t - a
        if u < kf[0][0]: continue
        for (u0, *p0), (u1, *p1) in zip(kf, kf[1:]):
            if u0 <= u <= u1:
                q = (u - u0) / max(1e-6, u1 - u0); cx, cy, rx, ry = [x + (y - x) * q for x, y in zip(p0, p1)]; break
        else: cx, cy, rx, ry = kf[-1][1:]
        x0, y0 = int(max(0, cx - rx * 1.4)), int(max(0, cy - ry * 1.4)); x1, y1 = int(min(W, cx + rx * 1.4)), int(min(H, cy + ry * 1.4))
        roi = img[y0:y1, x0:x1]; bl = cv2.GaussianBlur(cv2.resize(cv2.resize(roi, None, fx=0.12, fy=0.12), (x1 - x0, y1 - y0)), (0, 0), 6)
        m = np.zeros(roi.shape[:2], np.float32); cv2.ellipse(m, (int(cx - x0), int(cy - y0)), (int(rx), int(ry)), 0, 0, 360, 1, -1)
        m = cv2.GaussianBlur(m, (0, 0), 14)[..., None]
        img = img.copy(); img[y0:y1, x0:x1] = (roi * (1 - m) + bl * m).astype(np.uint8)
    return img

def overlay(img, t):
    img = borrar(img, t)
    capa = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    if PANEL[0] - 0.1 <= t <= PANEL[1] + 0.4: panel(capa, PANEL[0], CHECKS, t, PANEL[1])
    for a, b, v in RAPIDO:
        if a <= t < b and t > TITULO + 0.3: chip_rapido(capa, {3.5: 3, 2.5: 2}.get(v, v), t - a)
    titulo(capa, t, TITULO)
    pass  # nombres con flecha descartados (Santino, 11-nov): el producto se marca en el panel
    arr = np.array(capa)
    al = arr[..., 3:4].astype(np.float32) / 255
    if al.max() == 0: return img
    return np.clip(img * (1 - al) + arr[..., :3][..., ::-1] * al, 0, 255).astype(np.uint8)

# ------------------------------------------------------------------ render
cuadros = [float(x) for x in opt("--cuadros", "").split(",") if x]
want = set(int(round(c * FPS)) for c in cuadros)
f0 = int(float(opt("--desde", 0)) * FPS); f1 = min(TOTAL, int(float(opt("--hasta", TOTAL / FPS)) * FPS))
enc = None
if not want:
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(FPS),
                            "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
                            "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", OUT], stdin=subprocess.PIPE)
fidx = 0; primero = None
ULTIMO = {}
def emitir(img, base=False):
    global fidx, primero
    t = fidx / FPS
    out = None
    if primero is None: out = overlay(img, t); primero = out.copy()  # para el loop: primer cuadro con el gancho
    if f0 <= fidx < f1 and (not want or fidx in want):
        out = overlay(img, t) if out is None else out
        if enc: enc.stdin.write(out.tobytes())
        if fidx in want: cv2.imwrite(os.path.join(WORK, f"c_{t:05.2f}.jpg"), out, [cv2.IMWRITE_JPEG_QUALITY, 88])
    fidx += 1

def rango_ok(i):
    a, b = starts[i], starts[i] + SHOTS[i][-1]
    if want: return any(a <= w < b for w in want) or i == 0
    return a < f1 and b > f0

for i, (nm, pz, z0, z1, cy, rot, chk, golpe, nfs, dur) in enumerate(SHOTS):
    if not rango_ok(i):
        fidx += dur; continue
    print("toma", nm, flush=True)
    L = Lector(SRC, pz[0][0], pz[-1][1]); k = 0
    for (a, b, v), nf in zip(pz, nfs):
        for j in range(nf):
            L.vel = v; fr = L.ventana(a + j * v / FPS, a + (j + 1) * v / FPS)
            u = k / max(1, dur - 1); z = z0 + (z1 - z0) * ease(u)
            if golpe and k < 8: z *= 1 + 0.07 * (1 - eout(k / 8))
            img = viñeta(grade(encuadrar(fr, z, cy)))
            emitir(img); k += 1
            ULTIMO["img"] = img
    L.cerrar()

nci = TOTAL - CIE0; prev = None
ULTIMO_CAJA = ULTIMO.get("img")
ultimo = None
for k in range(nci):
    img = cuadro_cierre(k / FPS, ULTIMO_CAJA)
    if k >= nci - 5 and primero is not None:
        q = (k - (nci - 5) + 1) / 5; img = cv2.addWeighted(img, 1 - q, primero, q, 0)
    emitir(img)
if enc: enc.stdin.close(); enc.wait()
print("listo", fidx, flush=True)
