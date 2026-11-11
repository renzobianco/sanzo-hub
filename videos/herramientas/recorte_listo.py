"""Reemplaza sprites por versiones nuevas con fondo transparente (ej. redibujadas por ChatGPT).

Uso: python recorte_listo.py CARPETA_NUEVOS CARPETA_SPRITES [CARPETA_BACKUP]

Para cada PNG de CARPETA_NUEVOS: recorta al contenido (bbox del alfa), limpia el alfa casi
transparente que deja el generador y lo guarda con el mismo nombre en CARPETA_SPRITES,
guardando antes el viejo en CARPETA_BACKUP (por defecto <sprites>-viejo).
"""
import shutil
import sys
from pathlib import Path

from PIL import Image


def main():
    nuevos, sprites = Path(sys.argv[1]), Path(sys.argv[2])
    backup = Path(sys.argv[3]) if len(sys.argv) > 3 else sprites.with_name(sprites.name + "-viejo")
    backup.mkdir(exist_ok=True)
    for f in sorted(nuevos.glob("*.png")):
        im = Image.open(f).convert("RGBA")
        a = im.getchannel("A").point(lambda v: 0 if v < 12 else v)  # basura semitransparente fuera del dibujo
        im.putalpha(a)
        bbox = a.getbbox()
        if bbox:
            im = im.crop(bbox)
        destino = sprites / f.name
        if destino.exists() and not (backup / f.name).exists():
            shutil.copy2(destino, backup / f.name)
        im.save(destino)
        print(f"{f.name}: {im.size[0]}x{im.size[1]}")


if __name__ == "__main__":
    main()
