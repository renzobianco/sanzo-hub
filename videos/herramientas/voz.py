"""Voz provisoria (edge-tts, voz argentina) + tiempos para animar en Remotion.

Uso:
  python voz.py GUION.json CARPETA_SALIDA [--voz es-AR-TomasNeural] [--velocidad +8%]
  python voz.py GUION.json CARPETA_SALIDA --motor elevenlabs [--voz-id ID] [--modelo eleven_multilingual_v2]

ElevenLabs: la clave se lee de la variable ELEVENLABS_API_KEY o del archivo herramientas/.elevenlabs-key
(una sola línea; no se sube a git). Plan gratis = uso no comercial y con crédito a ElevenLabs.

GUION.json es una lista de bloques: [{"texto": "...", "etapa": 0, "etiqueta": "COLLAR PLANO"}, ...]
Genera en CARPETA_SALIDA:
  voz.mp3      — toda la narración junta
  tiempos.json — {"fps":30, "total": frames, "bloques":[{...bloque, "desde":f, "hasta":f}], "palabras":[{"t":texto,"desde":f,"hasta":f}]}
"""
import argparse
import asyncio
import json
import subprocess
import tempfile
from pathlib import Path

import edge_tts

FPS = 30
PAUSA = 0.12  # segundos de aire entre bloques


async def sintetizar(texto, voz, velocidad, destino):
    palabras = []
    com = edge_tts.Communicate(texto, voz, rate=velocidad, boundary="WordBoundary")
    with open(destino, "wb") as f:
        async for ch in com.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                palabras.append((ch["text"], ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7))
    return palabras


def clave_eleven():
    import os
    k = os.environ.get("ELEVENLABS_API_KEY")
    f = Path(__file__).with_name(".elevenlabs-key")
    if not k and f.exists():
        k = f.read_text(encoding="utf-8-sig").strip()
    if not k:
        raise SystemExit("Falta la clave de ElevenLabs: guardala en herramientas/.elevenlabs-key o en ELEVENLABS_API_KEY")
    return k


def sintetizar_eleven(texto, voz_id, modelo, destino, ajustes):
    """ElevenLabs con tiempos por letra: los junto en palabras (texto, inicio, fin) en segundos."""
    import base64
    import urllib.request
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voz_id}/with-timestamps?output_format=mp3_44100_128"
    cuerpo = json.dumps({"text": texto, "model_id": modelo, "language_code": "es", "voice_settings": ajustes}).encode()
    req = urllib.request.Request(url, data=cuerpo, headers={"xi-api-key": clave_eleven(), "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        res = json.loads(r.read())
    Path(destino).write_bytes(base64.b64decode(res["audio_base64"]))
    al = res.get("normalized_alignment") or res["alignment"]
    palabras, actual, ini, fin = [], "", None, None
    for ch, a, b in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if actual:
                palabras.append((actual, ini, fin))
            actual, ini = "", None
            continue
        if ini is None:
            ini = a
        actual += ch
        fin = b
    if actual:
        palabras.append((actual, ini, fin))
    return palabras


def duracion(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                       capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


async def main():
    p = argparse.ArgumentParser()
    p.add_argument("guion"); p.add_argument("salida")
    p.add_argument("--voz", default="es-AR-TomasNeural")
    p.add_argument("--velocidad", default="+8%")
    p.add_argument("--motor", default="edge", choices=["edge", "elevenlabs"])
    p.add_argument("--voz-id", default="pNInz6obpgDQGcFmaJgB", help="voz de ElevenLabs (por defecto Adam)")
    p.add_argument("--modelo", default="eleven_multilingual_v2")
    p.add_argument("--estabilidad", type=float, default=0.45)
    a = p.parse_args()

    bloques = json.loads(Path(a.guion).read_text(encoding="utf-8-sig"))
    out = Path(a.salida); out.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp())
    t, lista, palabras = 0.0, [], []
    silencio = tmp / "silencio.mp3"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"anullsrc=r=24000:cl=mono", "-t", str(PAUSA),
                    "-c:a", "libmp3lame", "-b:a", "48k", str(silencio)], check=True)
    for i, b in enumerate(bloques):
        # pausa antes de la frase (campo "pausaAntes" del guion, en segundos): da ritmo, ej. suspenso antes de una solución
        if i > 0 and "pausaAntes" in b:
            extra = max(0.0, b["pausaAntes"] - PAUSA)
            if extra:
                pausa = tmp / f"p{i:02d}.mp3"
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", str(extra),
                                "-c:a", "libmp3lame", "-b:a", "48k", str(pausa)], check=True)
                lista.append(pausa)
                t += duracion(pausa)
        mp3 = tmp / f"b{i:02d}.mp3"
        if a.motor == "elevenlabs":
            ws = sintetizar_eleven(b["texto"], a.voz_id, a.modelo, mp3,
                                   {"stability": a.estabilidad, "similarity_boost": 0.8, "style": 0.3, "use_speaker_boost": True})
        else:
            ws = await sintetizar(b["texto"], a.voz, a.velocidad, mp3)
        d = duracion(mp3)
        b["desde"], b["hasta"] = round(t * FPS), round((t + d) * FPS)
        # la voz devuelve las palabras sin puntuación: las reemplazo por las del guion (con ¿? ¡! , .) para los subtítulos
        tokens = b["texto"].split()
        k = 0
        limpiar = lambda x: "".join(ch for ch in x.lower() if ch.isalnum())
        for j, (w, s, e) in enumerate(ws):
            while k < len(tokens) and not limpiar(tokens[k]).startswith(limpiar(w)[:3] or "\0"):
                k += 1
            if k < len(tokens):
                ws[j] = (tokens[k], s, e)
                k += 1
        palabras += [{"t": w, "desde": round((t + s) * FPS), "hasta": round((t + e) * FPS)} for w, s, e in ws]
        lista += [mp3, silencio]
        t += d + PAUSA
    concat = tmp / "lista.txt"
    concat.write_text("".join(f"file '{x.as_posix()}'\n" for x in lista), encoding="utf-8")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(concat),
                    "-c:a", "libmp3lame", "-b:a", "128k", str(out / "voz.mp3")], check=True)
    (out / "tiempos.json").write_text(json.dumps({"fps": FPS, "total": round(t * FPS), "bloques": bloques,
                                                  "palabras": palabras}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Listo: {out / 'voz.mp3'} ({t:.1f} s, {len(palabras)} palabras)")


if __name__ == "__main__":
    asyncio.run(main())
