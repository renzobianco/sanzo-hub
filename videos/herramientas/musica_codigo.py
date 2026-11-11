"""Música original hecha por código (sin derechos), con largo exacto para que el loop cierre.
uso: python musica_codigo.py chiptune|cumbia SEGUNDOS SALIDA.wav
"""
import sys, wave
import numpy as np

SR = 48000
estilo, dur, salida = sys.argv[1], float(sys.argv[2]), sys.argv[3]
N = int(round(dur * SR))
mix = np.zeros(N)
rng = np.random.default_rng(7)

def hz(n):  # midi -> Hz
    return 440.0 * 2 ** ((n - 69) / 12)

def env(n, a=0.005, r=0.08):
    t = np.arange(n) / SR
    e = np.minimum(1, t / a) * np.exp(-t / r)
    return e

def poner(x, t0, g=1.0):
    i = int(t0 * SR)
    if i >= N:
        return
    x = x[: N - i]
    mix[i:i + len(x)] += x * g

def osc(tipo, f, largo, duty=0.5):
    t = np.arange(int(largo * SR)) / SR
    ph = (t * f) % 1
    if tipo == "pulso":
        return np.where(ph < duty, 1.0, -1.0)
    if tipo == "tri":
        return 4 * np.abs(ph - 0.5) - 1
    if tipo == "saw":
        return 2 * ph - 1
    return np.sin(2 * np.pi * ph)

def ruido(largo):
    return rng.uniform(-1, 1, int(largo * SR))

if estilo == "chiptune":
    beats = 64
    b = dur / beats                                  # duración de un tiempo
    prog = [57, 53, 48, 55]                          # Am F C G (raíces)
    acordes = {57: [69, 72, 76], 53: [65, 69, 72], 48: [64, 67, 72], 55: [67, 71, 74]}
    mel = [76, 74, 72, 74, 76, 76, 79, 76, 77, 76, 74, 72, 74, 72, 71, 67]   # 4 compases de corcheas a pares
    for compas in range(16):
        raiz = prog[compas % 4]
        fuerte = compas >= 9                         # tras la entrada del dueño, sube la energía
        for k in range(8):                           # bajo en corcheas (triangular)
            t0 = (compas * 4 + k * 0.5) * b
            n = raiz - 12 + (12 if k % 2 else 0)
            poner(osc("tri", hz(n), b * 0.45) * env(int(b * 0.45 * SR), r=0.2), t0, 0.32)
        for k in range(16):                          # arpegio en semicorcheas (pulso 12.5%)
            t0 = (compas * 4 + k * 0.25) * b
            n = acordes[raiz][k % 3] + (12 if fuerte and k % 4 == 3 else 0)
            poner(osc("pulso", hz(n), b * 0.22, 0.125) * env(int(b * 0.22 * SR), r=0.05), t0, 0.07)
        if compas >= 4:                              # melodía (pulso 50%)
            for k in range(4):
                n = mel[((compas % 4) * 4 + k) % 16]
                t0 = (compas * 4 + k) * b
                poner(osc("pulso", hz(n), b * 0.9, 0.5) * env(int(b * 0.9 * SR), r=0.35), t0, 0.06 if not fuerte else 0.075)
        for k in range(4):                           # batería de ruido
            t0 = (compas * 4 + k) * b
            if k % 2 == 0:                           # bombo: seno que cae
                L = int(0.15 * SR); t = np.arange(L) / SR
                bombo = np.sin(2 * np.pi * (140 * np.exp(-t * 25) + 45) * t) * np.exp(-t * 18)
                poner(bombo, t0, 0.55)
            else:
                poner(ruido(0.12) * env(int(0.12 * SR), r=0.04), t0, 0.22)
            poner(ruido(0.04) * env(int(0.04 * SR), r=0.01), t0 + b / 2, 0.07)
else:  # cumbia liviana
    beats = 44
    b = dur / beats
    prog = [50, 55, 57, 50]                          # D G A D
    acordes = {50: [62, 66, 69], 55: [62, 67, 71], 57: [61, 64, 69]}
    mel = [74, 76, 78, 76, 74, 71, 69, 71, 73, 76, 74, 73, 74, 69, 66, 69]
    for compas in range(11):
        raiz = prog[compas % 4]
        for k in range(4):                           # bajo cumbiero: raíz - quinta
            t0 = (compas * 4 + k) * b
            n = raiz - 12 + (7 if k % 2 else 0)
            poner(osc("sin", hz(n), b * 0.8) * env(int(b * 0.8 * SR), r=0.3) + 0.3 * osc("tri", hz(n), b * 0.8) * env(int(b * 0.8 * SR), r=0.2), t0, 0.4)
        for k in range(8):                           # acordes a contratiempo (tipo acordeón/teclado)
            if k % 2 == 1:
                t0 = (compas * 4 + k * 0.5) * b
                L = b * 0.35
                x = sum(osc("saw", hz(n), L) for n in acordes[raiz]) / 3
                poner(x * env(int(L * SR), a=0.01, r=0.12), t0, 0.08)
        for k in range(16):                          # güiro: raspado en corcheas con acento
            t0 = (compas * 4 + k * 0.25) * b
            g = 0.09 if k % 4 == 2 else 0.035
            L = 0.07 if k % 4 == 2 else 0.04
            gu = ruido(L) * (1 + 0.6 * np.sin(2 * np.pi * 90 * np.arange(int(L * SR)) / SR))
            poner(gu * env(int(L * SR), a=0.01, r=L / 3), t0, g)
        for k in range(4):                           # bombo en 1 y 3, timbal (tom) en el 4 y
            t0 = (compas * 4 + k) * b
            if k % 2 == 0:
                L = int(0.15 * SR); t = np.arange(L) / SR
                poner(np.sin(2 * np.pi * (110 * np.exp(-t * 20) + 50) * t) * np.exp(-t * 16), t0, 0.45)
            if k == 3:
                L = int(0.12 * SR); t = np.arange(L) / SR
                poner(np.sin(2 * np.pi * (260 * np.exp(-t * 8)) * t) * np.exp(-t * 22), t0 + b / 2, 0.18)
        if compas >= 2:                              # melodía de flauta (seno con vibrato)
            for k in range(4):
                n = mel[((compas % 4) * 4 + k) % 16]
                t0 = (compas * 4 + k) * b
                L = b * 0.85; t = np.arange(int(L * SR)) / SR
                x = np.sin(2 * np.pi * hz(n) * t + 0.4 * np.sin(2 * np.pi * 5.5 * t))
                poner(x * np.minimum(1, t / 0.03) * np.exp(-t / 0.6), t0, 0.07)

# cola: lo que se pasa del final vuelve al principio (loop sin corte)
mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.8
fade = int(0.02 * SR)
mix[:fade] *= np.linspace(0.6, 1, fade)
mix[-fade:] *= np.linspace(1, 0.6, fade)
with wave.open(salida, "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
print("ok", salida, round(dur, 3))
