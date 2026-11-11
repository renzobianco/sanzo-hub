"""Subtítulos automáticos estilo reel para videos de Sanzo.

Uso:
  python subtitular.py ENTRADA.mp4 SALIDA.mp4 [--modelo small] [--palabras 3] [--solo-srt]

Transcribe el audio con faster-whisper (en español, en la CPU), arma un .ass con
pocas palabras por pantalla (grandes, blancas con borde negro, a media altura) y
lo quema en el video con ffmpeg. También deja el .srt al lado de la salida por si
hay que corregir alguna palabra a mano y volver a quemarlo con --desde-srt.
"""
import argparse
import os
import re
import subprocess
import sys
from pathlib import Path


def ts_ass(s):
    h = int(s // 3600); m = int(s % 3600 // 60); sec = s % 60
    return f"{h}:{m:02d}:{sec:05.2f}"


def ts_srt(s):
    ms = int(round(s * 1000))
    h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); sec, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{sec:02d},{ms:03d}"


def transcribir(video, modelo, palabras_por_bloque):
    import numpy as np
    from faster_whisper import WhisperModel
    # el audio lo saca ffmpeg (16 kHz mono) para no depender de la versión de PyAV
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(video), "-vn", "-ac", "1", "-ar", "16000",
                          "-f", "s16le", "-"], capture_output=True, check=True).stdout
    audio = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768.0
    m = WhisperModel(modelo, device="cpu", compute_type="int8")
    segs, _ = m.transcribe(audio, language="es", word_timestamps=True, vad_filter=True,
                           initial_prompt="Sanzo, accesorios para perros: collares, correas, chapitas, cuerina.")
    palabras = [w for s in segs for w in (s.words or [])]
    bloques, actual = [], []
    for w in palabras:
        actual.append(w)
        corta = re.search(r"[.,!?¿¡]$", w.word.strip())
        if len(actual) >= palabras_por_bloque or corta:
            bloques.append(actual); actual = []
    if actual:
        bloques.append(actual)
    marca = lambda t: re.sub(r"\b(San[sz]ou?|Sanso|Sanzzo)\b", "Sanzo", t, flags=re.I)
    return [(b[0].start, b[-1].end, marca(" ".join(x.word.strip() for x in b))) for b in bloques]


def leer_srt(path):
    txt = Path(path).read_text(encoding="utf-8")
    out = []
    for bloque in re.split(r"\n\s*\n", txt.strip()):
        lineas = bloque.strip().splitlines()
        if len(lineas) < 3:
            continue
        a, b = lineas[1].split(" --> ")
        conv = lambda t: (lambda h, m, r: int(h) * 3600 + int(m) * 60 + float(r.replace(",", ".")))(*t.strip().split(":"))
        out.append((conv(a), conv(b), " ".join(lineas[2:])))
    return out


def escribir(bloques, srt_path, ass_path, ancho, alto):
    with open(srt_path, "w", encoding="utf-8") as f:
        for i, (a, b, t) in enumerate(bloques, 1):
            f.write(f"{i}\n{ts_srt(a)} --> {ts_srt(b)}\n{t}\n\n")
    tam = int(alto * 0.055)
    cab = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {ancho}
PlayResY: {alto}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sanzo,Arial,{tam},&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,-1,0,0,0,100,100,0,0,1,{max(3, tam // 10)},2,2,60,60,{int(alto * 0.30)},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    with open(ass_path, "w", encoding="utf-8") as f:
        f.write(cab)
        for a, b, t in bloques:
            f.write(f"Dialogue: 0,{ts_ass(a)},{ts_ass(b)},Sanzo,,0,0,0,,{{\\fad(60,0)}}{t.upper()}\n")


def medidas(video):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                        "stream=width,height:stream_side_data=rotation", "-of", "csv=p=0:nk=1", str(video)],
                       capture_output=True, text=True, check=True)
    nums = [int(float(x)) for x in re.findall(r"-?\d+(?:\.\d+)?", r.stdout)]
    w, h = nums[0], nums[1]
    if len(nums) > 2 and abs(nums[2]) in (90, 270):
        w, h = h, w
    return w, h


def main():
    p = argparse.ArgumentParser()
    p.add_argument("entrada"); p.add_argument("salida")
    p.add_argument("--modelo", default="small", help="tiny/base/small/medium (más grande = más preciso y más lento)")
    p.add_argument("--palabras", type=int, default=3)
    p.add_argument("--solo-srt", action="store_true", help="solo transcribe, no quema")
    p.add_argument("--desde-srt", help="usar un .srt ya corregido en vez de transcribir")
    a = p.parse_args()

    entrada, salida = Path(a.entrada).resolve(), Path(a.salida).resolve()
    salida.parent.mkdir(parents=True, exist_ok=True)
    srt, ass = salida.with_suffix(".srt"), salida.with_suffix(".ass")
    bloques = leer_srt(a.desde_srt) if a.desde_srt else transcribir(entrada, a.modelo, a.palabras)
    w, h = medidas(entrada)
    escribir(bloques, srt, ass, w, h)
    print(f"Subtítulos: {srt}")
    if a.solo_srt:
        return
    # ffmpeg en Windows se marea con 'C:' dentro del filtro: corremos desde la carpeta del .ass
    subprocess.run(["ffmpeg", "-y", "-i", str(entrada), "-vf", f"ass={ass.name}",
                    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-c:a", "aac", "-b:a", "160k",
                    "-movflags", "+faststart", str(salida)], cwd=ass.parent, check=True)
    print(f"Listo: {salida}")


if __name__ == "__main__":
    sys.exit(main())
