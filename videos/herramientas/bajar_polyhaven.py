"""Baja assets CC0 de Poly Haven (modelos en glTF 1k, HDRIs en .hdr 2k) y anota créditos.
Uso: python bajar_polyhaven.py CARPETA_ASSETS id1 id2 ...   (prefijo hdri: para cielos, ej hdri:belfast_sunset_puresky; tex: para texturas 2k, ej tex:yellow_plaster)"""
import json, sys, urllib.request
from pathlib import Path
base = Path(sys.argv[1])
UA = {"User-Agent": "sanzo-videos/1.0"}
def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120).read()
def bajar(url, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists(): dest.write_bytes(get(url))
cred = base / "CREDITOS.md"
if not cred.exists(): cred.write_text("# Créditos de assets\n\n| Archivo | Autor | Link | Licencia |\n|---|---|---|---|\n", encoding="utf-8")
for a in sys.argv[2:]:
    hdri = a.startswith("hdri:"); aid = a.split(":")[-1]
    info = json.loads(get(f"https://api.polyhaven.com/info/{aid}"))
    files = json.loads(get(f"https://api.polyhaven.com/files/{aid}"))
    autores = ", ".join(info.get("authors", {}).keys())
    if a.startswith("tex:"):
        dest = base / "texturas" / aid
        for mapa in ("Diffuse", "nor_gl", "Rough", "AO"):
            if mapa in files:
                f = files[mapa]["2k"]["jpg"]; bajar(f["url"], dest / f"{aid}_{mapa}_2k.jpg")
    elif hdri:
        f = files["hdri"]["2k"]["hdr"]; dest = base / "hdri" / f"{aid}_2k.hdr"; bajar(f["url"], dest)
    else:
        g = files["gltf"]["1k"]["gltf"]
        tipo = "props"
        d = base / tipo / aid
        bajar(g["url"], d / Path(g["url"]).name)
        for rel, inc in g.get("include", {}).items(): bajar(inc["url"], d / rel)
        dest = d
    linea = f"| `{dest.relative_to(base).as_posix()}` | {autores} | https://polyhaven.com/a/{aid} | CC0 |\n"
    if linea not in cred.read_text(encoding="utf-8"):
        with open(cred, "a", encoding="utf-8") as fh: fh.write(linea)
    print("OK", aid)
