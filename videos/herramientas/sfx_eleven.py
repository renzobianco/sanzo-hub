"""Efectos de sonido con ElevenLabs (text-to-sound-effects) a partir de una lista.

Uso:
  python sfx_eleven.py LISTA.json CARPETA_SALIDA        genera los que falten
  python sfx_eleven.py --credito                         muestra el crédito que queda

LISTA.json: [{"nombre": "silbato", "texto": "...", "duracion": 1.0, "influencia": 0.5, "loop": false}, ...]
Deja CARPETA_SALIDA/<nombre>.mp3. No regenera los que ya existen (para no gastar crédito).
La clave sale de ELEVENLABS_API_KEY o de herramientas/.elevenlabs-key. Una sola cuenta: no rotar cuentas gratis.
"""
import json
import os
import sys
import urllib.request
from pathlib import Path


def clave():
    k = os.environ.get("ELEVENLABS_API_KEY")
    f = Path(__file__).with_name(".elevenlabs-key")
    if not k and f.exists():
        k = f.read_text(encoding="utf-8").strip()
    if not k:
        raise SystemExit("Falta la clave de ElevenLabs")
    return k


def credito():
    req = urllib.request.Request("https://api.elevenlabs.io/v1/user/subscription", headers={"xi-api-key": clave()})
    d = json.load(urllib.request.urlopen(req, timeout=30))
    usado, total = d.get("character_count"), d.get("character_limit")
    print(f"plan: {d.get('tier')} · usado {usado} de {total} · quedan {total - usado if total and usado is not None else '?'}")


def generar(item, salida):
    destino = Path(salida) / f"{item['nombre']}.mp3"
    if destino.exists():
        print(f"ya está: {destino.name}")
        return
    cuerpo = {"text": item["texto"], "model_id": "eleven_text_to_sound_v2",
              "prompt_influence": item.get("influencia", 0.5), "loop": bool(item.get("loop", False))}
    if item.get("duracion"):
        cuerpo["duration_seconds"] = item["duracion"]
    req = urllib.request.Request("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128",
                                 data=json.dumps(cuerpo).encode(), headers={"xi-api-key": clave(), "Content-Type": "application/json"})
    try:
        datos = urllib.request.urlopen(req, timeout=120).read()
    except urllib.error.HTTPError as e:
        print(f"ERROR {e.code} en {item['nombre']}: {e.read()[:300]}")
        return
    destino.write_bytes(datos)
    print(f"listo: {destino.name} ({len(datos) // 1024} KB)")


if __name__ == "__main__":
    if sys.argv[1:2] == ["--credito"]:
        credito()
        sys.exit()
    lista = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    Path(sys.argv[2]).mkdir(parents=True, exist_ok=True)
    for it in lista:
        generar(it, sys.argv[2])
