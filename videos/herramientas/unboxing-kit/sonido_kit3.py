# Sonido ASMR del unboxing del kit: efectos de manos al frente (ElevenLabs), ambiente de casa y lofi muy bajo.
# Uso: python sonido_kit3.py CARPETA_TRABAJO MUSICA.mp3 INICIO_MUSICA SALIDA.wav
import sys, os, json, subprocess, numpy as np, wave
WORK, MUS, M0, OUT = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4]
SR = 48000; rng = np.random.default_rng(5)
E = json.load(open(os.path.join(WORK, "eventos.json"))); T = E["tomas"]; S = E["src"]; DUR = E["total"]
BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "animaciones", "public")
KIT, VIEJO = os.path.join(BASE, "kit", "sfx"), os.path.join(BASE, "unboxing", "sfx")
N = int(DUR * SR)

def leer(path, t0=0.0, dur=None, af=None):
    cmd = ["ffmpeg", "-v", "error", "-ss", str(t0), "-i", path] + (["-t", str(dur)] if dur else []) + (["-af", af] if af else []) + \
          ["-f", "f32le", "-ac", "2", "-ar", str(SR), "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True).stdout, np.float32).reshape(-1, 2).astype(np.float64)
def lufs(x):
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-f", "f32le", "-ac", "2", "-ar", str(SR), "-i", "-", "-af", "ebur128", "-f", "null", "-"],
                       input=x.astype(np.float32).tobytes(), capture_output=True).stderr.decode()
    return float([l for l in p.splitlines() if l.strip().startswith("I:")][-1].split()[1])
def sfx(nombre, viejo=False):
    x = leer(os.path.join(VIEJO if viejo else KIT, nombre + ".mp3"))
    act = x[np.abs(x).max(1) > np.abs(x).max() * 0.05]  # parte con sonido
    r = np.sqrt(np.mean(act ** 2)) if len(act) else 1
    x = x * (10 ** (-20 / 20) / max(r, 1e-9))              # todos al mismo nivel de energía (RMS −20 dBFS)
    return x
def tono(x, f):
    idx = np.arange(0, len(x) - 1, f); return np.stack([np.interp(idx, np.arange(len(x)), x[:, c]) for c in (0, 1)], 1)
def fade(x, a, b):
    x = x.copy(); na, nb = int(a * SR), int(b * SR)
    if na: x[:na] *= np.linspace(0, 1, na)[:, None]
    if nb and nb < len(x): x[-nb:] *= np.linspace(1, 0, nb)[:, None]
    return x
def tramo(x, dur, ini=None):
    n = int(dur * SR)
    if len(x) <= n: return x
    i = rng.integers(0, len(x) - n) if ini is None else int(ini * SR)
    return fade(x[i:i + n], 0.04, 0.12)

fx = np.zeros((N + 2 * SR, 2))
def poner(x, t, db, pan=0.0):
    x = fade(x, 0.005, 0.0) * 10 ** (db / 20)
    if pan: x = x * np.array([1 - max(0, pan), 1 + min(0, pan)])
    i = max(0, int(t * SR)); n = min(len(x), len(fx) - i); fx[i:i + n] += x[:n]

# ---- capa de manipulación: crujido de bolsitas en cada búsqueda (cámara rápida) y bolsa negra al principio
bol = sfx("bolsa-asmr")
a, b = T["rompe"]; poner(tramo(sfx("bolsa-negra-rasga"), b - a + 0.05, 0.0), a - 0.05, -4)
# crujido solo mientras el producto está en la bolsita (fin en segundos del video, medido en la toma)
FIN_BOLSA = {"collar_saca": 17.4}
for nm in ["mono_saca", "pb_saca", "collar_saca", "correa_saca", "arnes_saca"]:
    a, b = T[nm]; b = FIN_BOLSA.get(nm, b); poner(tramo(bol, b - a), a, -5, pan=rng.uniform(-0.25, 0.25))
a, b = T["bandana_saca"]; poner(tramo(bol, 23.0 - a), a, -6)
for nm, s_ in [("mono_saca", 0.1), ("bandana_saca", 0.05)]:
    poner(tono(sfx("ziploc-abre"), rng.uniform(0.95, 1.06)), T[nm][0] + s_, -4)

# ---- caja y tarjeta
poner(sfx("caja-apoya"), T["caja"][0] + 0.06, -1)
poner(tono(sfx("caja-apoya"), 0.88), 3.93, -6)
poner(sfx("caja-gira"), T["caja"][0] + 0.55, -6)
poner(sfx("tapa-abre", True), S["tapa"] - 0.32, -2)
poner(sfx("tarjeta-madera-saca"), T["tarjeta"][0] + 0.05, -6)
poner(sfx("tarjeta-madera-gira"), S["tarjeta_gira"] - 0.05, -3)

# ---- productos (cada uno con su textura) + pop suave muy bajo al tildar
pops = [1.0, 1.06, 0.95, 1.1, 1.03]
poner(sfx("clic-hebilla"), S["collar_cierra1"] - 0.42, -1)
poner(tono(sfx("hebilla-suelta"), 1.0), S["collar_abre"] - 0.05, -2)
poner(tono(sfx("clic-hebilla"), 1.05), S["collar_cierra2"] + 0.11, -2)
poner(tono(sfx("tela"), 0.92), S["bandana_estira"] + 0.15, -3)
_corr = os.environ.get("CORREA", "correa-a")  # sonido al agarrar la manija y estirar la correa
if _corr != "ninguno": poner(sfx(_corr), S["correa_estira"] - 0.05, -4)
poner(sfx("arnes-acolchado"), 34.9, -5)
poner(sfx("arnes-hebillas"), S["arnes_gira"] - 0.1, -3)
poner(tono(sfx("chapita"), 1.05), S["chapa1"] - 0.1, -4)
poner(sfx("chapita"), S["chapa"] - 0.2, -3)
poner(tono(sfx("chapita"), 0.94), S["chapa3"] - 0.1, -4)
poner(sfx("tapa-cierra", True), S["tapa_cierra"] - 0.1, -1)
poner(sfx("cierre-woosh", True), E["cierre"] - 0.25, -12)
poner(sfx("brillo-logo"), E["cierre"] + 0.15, -12)
# tecleo de la portada (cada tecla con tono algo distinto)
tec, bor = sfx("tecla"), sfx("tecla-borra")
for t_, tipo in E["teclas"]:
    poner(tono(tec if tipo == "tecla" else bor, rng.uniform(0.92, 1.1)), t_, -9 if tipo == "tecla" else -11)
fx = fx[:N]
L_fx = lufs(fx)

# ---- ambiente de casa (bucle) y lofi muy bajo; los dos empalman en el loop
def bucle(x, n):
    reps = int(np.ceil(n / len(x))) + 1; return np.vstack([x] * reps)[:n]
amb = leer(os.path.join(KIT, "ambiente-casa.mp3")); amb = bucle(amb, N + int(0.6 * SR))
X = 0.6; nx = int(X * SR)
def empalme(m_full):  # m_full: N+nx muestras; el final se funde con las nx muestras previas al comienzo
    pre, m = m_full[:nx], m_full[nx:nx + N].copy()
    w = np.linspace(0, np.pi / 2, nx)[:, None]; m[-nx:] = m[-nx:] * np.cos(w) + pre * np.sin(w); return m
amb = np.zeros((N, 2))  # ambiente sacado: tenía un pitido fijo en 2,2/4,4 kHz
mus = leer(MUS, M0 - X, DUR + X + 0.1, "acompressor=threshold=-22dB:ratio=3:attack=8:release=150:makeup=1")
if len(mus) < N + nx: mus = np.vstack([mus, np.zeros((N + nx - len(mus), 2))])
mus = empalme(mus); mus *= 10 ** ((L_fx - 12 - lufs(mus)) / 20)  # lofi ~12 LU debajo de los efectos

mix = fx + amb + mus
def limitar(x):
    r = subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ac", "2", "-ar", str(SR), "-i", "-", "-af",
                        "alimiter=limit=0.52:attack=2:release=60:level=disabled:latency=1", "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
                       input=x.astype(np.float32).tobytes(), capture_output=True).stdout
    return np.frombuffer(r, np.float32).reshape(-1, 2).astype(np.float64)[: len(x)]
mix *= 10 ** ((-16 - lufs(mix)) / 20)
for _ in range(3): mix = limitar(mix); mix *= 10 ** ((-16 - lufs(mix)) / 20)
mix = limitar(mix)
w = wave.open(OUT, "w"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes()); w.close()
print("ok", OUT, "LUFS", round(lufs(mix), 1), "pico", round(20 * np.log10(np.abs(mix).max()), 1), "| efectos", round(L_fx, 1),
      "| inicio/fin", mix[:2, 0].round(3), mix[-2:, 0].round(3))
