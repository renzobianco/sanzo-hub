"""Tiempos para animar a partir de una voz ya grabada (ej. la que genera Santino en ElevenLabs).

Uso:
  python tiempos_audio.py GUION.json AUDIO.mp3 CARPETA_SALIDA [--modelo small]

Transcribe el audio con Whisper (tiempos por palabra), lo alinea con el texto del guion y deja en CARPETA_SALIDA:
  voz.mp3      — copia del audio
  tiempos.json — mismo formato que voz.py: {"fps":30, "total", "bloques":[{...bloque, "desde","hasta"}], "palabras":[{"t","desde","hasta"}]}
Las palabras de los subtítulos salen del guion (con su puntuación); de Whisper solo se usan los tiempos.
"""
import argparse
import difflib
import json
import shutil
import subprocess
import unicodedata
from pathlib import Path

FPS = 30


def limpiar(w):
    w = unicodedata.normalize("NFD", w.lower())
    return "".join(c for c in w if c.isalnum())


def palabras_whisper(audio, modelo):
    import numpy as np
    from faster_whisper import WhisperModel
    # el audio lo saca ffmpeg (16 kHz mono) para no depender de la versión de PyAV
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(audio), "-vn", "-ac", "1", "-ar", "16000",
                          "-f", "s16le", "-"], capture_output=True, check=True).stdout
    datos = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768.0
    m = WhisperModel(modelo, device="cpu", compute_type="int8")
    segs, _ = m.transcribe(datos, language="es", word_timestamps=True,
                           initial_prompt="Sanzo, perros, arnés, collar, tráquea, bulldogs, reguladores.")
    return [(w.word.strip(), w.start, w.end) for s in segs for w in (s.words or [])]


def main():
    p = argparse.ArgumentParser()
    p.add_argument("guion"); p.add_argument("audio"); p.add_argument("salida")
    p.add_argument("--modelo", default="small")
    a = p.parse_args()

    bloques = json.loads(Path(a.guion).read_text(encoding="utf-8-sig"))
    # palabras del guion, recordando a qué bloque pertenece cada una
    guion = [(t, i) for i, b in enumerate(bloques) for t in b["texto"].split()]
    oidas = palabras_whisper(a.audio, a.modelo)

    # alineo guion ↔ Whisper por palabra; las que no coinciden se interpolan entre vecinas
    sm = difflib.SequenceMatcher(None, [limpiar(t) for t, _ in guion], [limpiar(w) for w, _, _ in oidas], autojunk=False)
    tiempos = [None] * len(guion)
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal":
            for k in range(i2 - i1):
                tiempos[i1 + k] = oidas[j1 + k][1:]
        elif op == "replace" and j2 > j1:
            # mismo tramo con distinta escritura: repartir el tramo de audio entre las palabras del guion
            ini, fin = oidas[j1][1], oidas[j2 - 1][2]
            n = i2 - i1
            for k in range(n):
                tiempos[i1 + k] = (ini + (fin - ini) * k / n, ini + (fin - ini) * (k + 1) / n)
    conocidos = [k for k, t in enumerate(tiempos) if t]
    for k, t in enumerate(tiempos):
        if t is None:
            antes = max([c for c in conocidos if c < k], default=None)
            despues = min([c for c in conocidos if c > k], default=None)
            ini = tiempos[antes][1] if antes is not None else 0.0
            fin = tiempos[despues][0] if despues is not None else ini + 0.3
            tiempos[k] = (ini, max(ini + 0.05, fin))
    sin_match = len(guion) - sum(1 for op in sm.get_opcodes() if op[0] == "equal" for _ in range(op[2] - op[1]))

    f = lambda s: round(s * FPS)
    palabras = [{"t": t, "desde": f(tiempos[k][0]), "hasta": f(tiempos[k][1])} for k, (t, _) in enumerate(guion)]
    for i, b in enumerate(bloques):
        ks = [k for k, (_, bi) in enumerate(guion) if bi == i]
        b["desde"], b["hasta"] = f(tiempos[ks[0]][0]), f(tiempos[ks[-1]][1])
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(a.audio)],
                               capture_output=True, text=True, check=True).stdout.strip())
    out = Path(a.salida); out.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(a.audio, out / "voz.mp3")
    (out / "tiempos.json").write_text(json.dumps({"fps": FPS, "total": f(dur), "bloques": bloques, "palabras": palabras},
                                                 ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Listo: {out / 'tiempos.json'} ({dur:.1f} s, {len(palabras)} palabras, {sin_match} sin coincidencia exacta)")


if __name__ == "__main__":
    main()
