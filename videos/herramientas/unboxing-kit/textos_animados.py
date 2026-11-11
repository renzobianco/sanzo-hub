# Título animado ("KIT COMPLETO") y etiquetas de producto escritas letra por letra con flecha a mano.
# Se importa desde render_kit.py (usa sus constantes y funciones).
import math, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

def instalar(g):
    W, H = g["W"], g["H"]; fuente, ease, eout, eback = g["fuente"], g["ease"], g["eout"], g["eback"]
    F5, DORADO = g["F5"], g["DORADO"]
    FUENTES = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "recursos", "fuentes")
    ANTON = os.path.join(FUENTES, "Anton.ttf"); MONT = os.path.join(FUENTES, "Montserrat-ExtraBold.ttf")
    BLANCO = (255, 255, 255)

    def capa_sombra(lay, blur=8, op=0.6, dy=5):
        a = (np.array(lay.split()[3]).astype(np.float32) * op).astype(np.uint8)
        sh = Image.new("RGBA", lay.size, (15, 10, 5, 0)); sh.putalpha(Image.fromarray(a))
        out = Image.new("RGBA", lay.size, (0, 0, 0, 0)); out.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)), (2, dy))
        out.alpha_composite(lay); return out

    def letras(capa, texto, fnt, x, y, t, paso=0.045, dur=0.32, alfa=1.0, col=BLANCO, centro=False, salida=None, sube=26, espaciado=0, op_sombra=0.6, borra=None, paso_b=0.04):
        """Letra por letra: cada una sube, crece desde 0,6 con rebote y aparece. salida: tiempo en que salen en cascada hacia arriba."""
        d = ImageDraw.Draw(capa)
        anchos = [d.textlength(ch, font=fnt) + espaciado for ch in texto]; total = sum(anchos) - espaciado
        x0 = x - total / 2 if centro else x
        lay = Image.new("RGBA", capa.size, (0, 0, 0, 0)); hay = False; xi = x0
        nvis = len(texto) if borra is None else len(texto) - int(max(0.0, t - borra) / paso_b + (1 if t >= borra else 0))
        x_fin = None
        for i, ch in enumerate(texto):
            w = anchos[i] - espaciado; u = (t - i * paso) / dur
            if i >= nvis: break
            if u > 0: x_fin = xi + w
            if u > 0 and ch != " ":
                k = eback(u) if u < 1 else 1.0; a = min(1, u * 1.6) * alfa; dy = (1 - eout(u)) * sube
                if salida is not None:
                    v = (t - salida - i * 0.02) / 0.25
                    if v > 0: a *= 1 - ease(v); dy -= ease(v) * 40
                if a > 0.01:
                    gl = Image.new("RGBA", (int(w * 2 + 40), int(fnt.size * 2)), (0, 0, 0, 0))
                    ImageDraw.Draw(gl).text((gl.width / 2, gl.height / 2), ch, font=fnt, fill=col + (int(255 * a),), anchor="mm")
                    if abs(k - 1) > 0.01: gl = gl.resize((max(1, int(gl.width * k)), max(1, int(gl.height * k))), Image.LANCZOS)
                    cy = y + fnt.size * 0.5
                    lay.alpha_composite(gl, (int(xi + w / 2 - gl.width / 2), int(cy - gl.height / 2 + dy))); hay = True
            xi += anchos[i]
        if borra is not None and t >= borra - 0.15 and not (nvis <= 0 and t > borra + len(texto) * paso_b + 0.1):  # cursor de máquina de escribir
            xc = (x_fin if x_fin is not None else x0) + 6
            ImageDraw.Draw(lay).rectangle((xc, y + fnt.size * 0.12, xc + max(4, fnt.size * 0.06), y + fnt.size * 1.0), fill=col + (int(255 * alfa),))
            hay = True
        if hay: capa.alpha_composite(capa_sombra(lay, op=op_sombra))
        return total

    PLAY = os.path.join(FUENTES, "PlayfairDisplay-Bold.ttf"); CREMA_T = (244, 237, 227)
    from PIL import ImageFont
    _tam = {}
    def play_ajustada(txt, ancho):
        if txt not in _tam:
            n = 240
            while n > 60 and ImageFont.truetype(PLAY, n).getlength(txt) > ancho: n -= 4
            _tam[txt] = n
        return fuente(PLAY, _tam[txt])

    def borde(capa, k, alfa):
        """Marco de revista que se dibuja desde arriba al centro hacia los dos lados y se cierra abajo."""
        if k <= 0 or alfa <= 0: return
        m, w = 40, 6; x0, y0, x1, y1 = m, m, W - m, H - m
        mitad = (x1 - x0) / 2 + (y1 - y0) + (x1 - x0) / 2  # recorrido de cada lado
        L = mitad * k; d = ImageDraw.Draw(capa); col = CREMA_T + (int(235 * alfa),); cx = W / 2
        for sg in (-1, 1):
            rest = L; xa = cx
            seg = min(rest, (x1 - x0) / 2); xb = xa + sg * seg
            d.rectangle((min(xa, xb), y0 - w / 2, max(xa, xb), y0 + w / 2), fill=col); rest -= seg
            xe = x1 if sg > 0 else x0
            if rest > 0:
                seg = min(rest, y1 - y0); d.rectangle((xe - w / 2, y0, xe + w / 2, y0 + seg), fill=col); rest -= seg
            if rest > 0:
                seg = min(rest, (x1 - x0) / 2); xb = xe - sg * seg
                d.rectangle((min(xe, xb), y1 - w / 2, max(xe, xb), y1 + w / 2), fill=col)

    def titulo(capa, t, t_fin):
        if t < -0.5 or t > t_fin + 0.7: return
        apaga = 1 - ease((t - t_fin - 0.05) / 0.15)
        kb = eout((t + 0.15) / 0.75)
        if t > t_fin - 0.65: kb = 1 - ease((t - (t_fin - 0.65)) / 0.75)  # se come desde abajo hasta arriba al centro
        borde(capa, kb, 1.0)
        letras(capa, "KIT COMPLETO", play_ajustada("KIT COMPLETO", 900), W / 2, 205, t + T_ENTRA, paso=P_ENTRA, dur=0.4,
               col=CREMA_T, centro=True, sube=-45, op_sombra=0.7, borra=t_fin + B_KIT + T_ENTRA, paso_b=P_BORRA)
        k = ease((t - 0.3) / 0.4)
        if t > t_fin + B_KIT: k *= 1 - ease((t - t_fin - B_KIT) / (12 * P_BORRA))
        if k > 0:
            L = 430 * k; ImageDraw.Draw(capa).rectangle((W / 2 - L, 372, W / 2 + L, 375), fill=CREMA_T + (int(255 * min(1, k * 1.5)),))
        letras(capa, "SANZO", fuente(g["F6"], 50), W / 2, 395, t - T_SANZO, paso=P_SANZO, dur=0.35, col=CREMA_T, centro=True,
               sube=14, espaciado=22, op_sombra=0.95, borra=t_fin + B_SANZO - T_SANZO, paso_b=P_BORRA)

    def kf_xy(kf, u):
        if u <= kf[0][0]: return kf[0][1:]
        for (u0, *a), (u1, *b) in zip(kf, kf[1:]):
            if u <= u1: q = ease((u - u0) / (u1 - u0)); return tuple(x + (y - x) * q for x, y in zip(a, b))
        return kf[-1][1:]

    def flecha_mano(capa, p0, p2, k, alfa):
        """Curva a mano de p0 a p2, dibujada hasta la fracción k, con punta. Al triple y achicada: bordes suaves."""
        if k <= 0.01 or alfa <= 0.01: return
        (x0, y0), (x2, y2) = p0, p2; dx, dy = x2 - x0, y2 - y0; L = max(1, math.hypot(dx, dy))
        nx, ny = -dy / L, dx / L; bul = 0.22 * L
        p1 = ((x0 + x2) / 2 + nx * bul, (y0 + y2) / 2 + ny * bul)
        n = 40; pts = []
        for i in range(int(n * k) + 1):
            u = i / n; pts.append(((1 - u) ** 2 * x0 + 2 * (1 - u) * u * p1[0] + u * u * x2, (1 - u) ** 2 * y0 + 2 * (1 - u) * u * p1[1] + u * u * y2))
        xs = [p[0] for p in pts]; ys = [p[1] for p in pts]; m = 60
        bx0, by0, bx1, by1 = int(min(xs) - m), int(min(ys) - m), int(max(xs) + m), int(max(ys) + m)
        S3 = 3; big = Image.new("RGBA", ((bx1 - bx0) * S3, (by1 - by0) * S3), (0, 0, 0, 0)); d = ImageDraw.Draw(big)
        P = [((x - bx0) * S3, (y - by0) * S3) for x, y in pts]; wdt = 9 * S3; col = BLANCO + (int(255 * alfa),); r = wdt / 2
        if len(P) > 1: d.line(P, fill=col, width=wdt, joint="curve")
        for q in (P[0], P[-1]): d.ellipse((q[0] - r, q[1] - r, q[0] + r, q[1] + r), fill=col)
        if k > 0.85 and len(P) > 2:
            hk = ease((k - 0.85) / 0.15); (ax, ay), (bx, by) = P[-3], P[-1]; ang = math.atan2(by - ay, bx - ax); hl = 34 * S3 * hk
            for sg in (0.55, -0.55):
                ex, ey = bx - hl * math.cos(ang + sg), by - hl * math.sin(ang + sg)
                d.line([(bx, by), (ex, ey)], fill=col, width=wdt); d.ellipse((ex - r, ey - r, ex + r, ey + r), fill=col)
        lay = big.resize((bx1 - bx0, by1 - by0), Image.LANCZOS)
        full = Image.new("RGBA", capa.size, (0, 0, 0, 0)); full.alpha_composite(lay, (bx0, by0))
        capa.alpha_composite(capa_sombra(capa_sombra(full, blur=2, op=0.55, dy=0), blur=7, op=0.6, dy=4))

    ETQ_Y = 1430  # el nombre siempre en el mismo lugar
    def etiqueta(capa, lineas, t, t_fin, kf):
        if t < 0 or t > t_fin + 0.35: return
        sal = 1 - ease((t - t_fin) / 0.3)
        fnt = fuente(MONT, 96); x = 84; tw = 0
        for j, li in enumerate(lineas):
            tw = max(tw, letras(capa, li, fnt, x, ETQ_Y + j * 104, t - j * 0.2, paso=0.03, dur=0.28, alfa=sal))
        ka = ease((t - (0.08 + 0.03 * len(lineas[0]))) / 0.4)  # la flecha arranca cuando termina la palabra
        ox, oy = kf_xy(kf, t)
        p0 = (min(x + tw * 0.62, 700), ETQ_Y - 22)
        dx, dy = ox - p0[0], oy - p0[1]; L = max(1, math.hypot(dx, dy)); corta = min(95, L * 0.3)
        flecha_mano(capa, p0, (ox - dx / L * corta, oy - dy / L * corta), ka, sal)

    return titulo, etiqueta

# tiempos de la portada (segundos desde el inicio del video; t_fin = fin de la portada)
T_ENTRA, P_ENTRA = 0.1, 0.035   # "KIT COMPLETO": la letra i aparece en i*P_ENTRA - T_ENTRA
T_SANZO, P_SANZO = 0.45, 0.06   # "SANZO": la letra i aparece en T_SANZO + i*P_SANZO
P_BORRA, B_SANZO, B_KIT = 0.045, -0.7, -0.45  # se borra primero SANZO y después KIT COMPLETO
def teclas(t_fin):
    ev = []
    for i, ch in enumerate("KIT COMPLETO"):
        if ch != " " and i * P_ENTRA - T_ENTRA >= 0: ev.append((i * P_ENTRA - T_ENTRA, "tecla"))
    for i in range(5): ev.append((T_SANZO + i * P_SANZO, "tecla"))
    for j in range(5): ev.append((t_fin + B_SANZO + j * P_BORRA, "borra"))
    for j, ch in enumerate(reversed("KIT COMPLETO")):
        if ch != " ": ev.append((t_fin + B_KIT + j * P_BORRA, "borra"))
    return sorted(ev)

# segundos desde el inicio de la toma -> (x, y) del producto en pantalla (medido en cuadros del video)
OBJ_KF = {
    "mono":    [(0, 520, 690), (0.5, 540, 700), (1.0, 640, 720), (1.5, 560, 660), (2.4, 560, 660)],
    "pb":      [(0, 860, 780), (0.5, 600, 560), (1.0, 600, 760), (1.5, 600, 780), (2.4, 620, 800)],
    "collar":  [(0, 780, 650), (0.5, 640, 860), (1.0, 620, 780), (1.5, 600, 760), (2.0, 600, 860), (2.5, 680, 780), (2.93, 540, 860), (3.4, 520, 840), (3.73, 600, 720), (4.2, 600, 720)],
    "bandana": [(0, 600, 940), (0.5, 520, 900), (1.0, 540, 1020), (1.5, 540, 1000), (2.0, 540, 1000), (2.6, 590, 1000), (3.2, 590, 1000)],
    "correa":  [(0, 640, 800), (0.5, 600, 800), (0.97, 537, 925), (1.27, 620, 850), (1.77, 500, 800), (2.27, 500, 910), (2.77, 500, 880), (3.3, 500, 880)],
    "arnes":   [(0, 600, 840), (0.5, 520, 800), (1.0, 540, 920), (1.5, 540, 940), (2.0, 540, 760), (2.5, 540, 720), (3.0, 540, 680),
                (3.5, 540, 640), (3.8, 800, 700), (4.1, 700, 950), (4.6, 560, 1000), (5.6, 560, 1000)],
    "chapa1":  [(0, 760, 880), (0.5, 640, 1060), (1.0, 480, 940), (1.3, 480, 940), (1.43, 900, 610), (1.73, 760, 830), (2.6, 760, 850), (2.85, 780, 1040), (3.3, 700, 1070), (4.6, 700, 1040)],
}
