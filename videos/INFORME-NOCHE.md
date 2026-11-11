# Informe de la noche (2026-11-01 → 02)

## Videos
- **1. "De la soga a la correa"**: v1 lista (43,6 s) en `3-listos/2026-11-02_correa_blender_v1.mp4` + `_sin-audio` (solo efectos) + `_liviano` (7 MB). 3D a 720p escalado; revisado con hoja y tiras (sin titileo ni cuadros blancos). Voz provisoria edge-tts.
- **2. Chapita**: guion final y voz provisoria listos (`animaciones/guiones/chapita.json`, `2-material/voz/chapita.txt`). Falta la escena 3D.
- **3. Bolsitas**: pendiente.

## Recursos bajados (`2-material/assets/`, créditos en `CREDITOS.md`)
- CC0 (Poly Haven): jacarandá (lo pasamos a lila), banco, farol, tacho, bolsa, silla monobloc, cielos HDRI (atardecer y nublado).
- CC-BY (poly.pizza): 2 palomas, colectivo, auto, manos low-poly. Si aparecen en el video, van en la descripción.
- No conseguí sin cuenta: persona con rig. Las manos/brazos del dueño las modelé yo (puño + manga).
- Sketchfab: no pude usar la sesión de Chrome desde la terminal.

## Cambios al guion 1 por datos sin confirmar
- "Manija acolchada" → "una manija, para agarrarla firme sin que se resbale".
- "Mosquetón giratorio / destorcedor" → cambié el problema: "atarla y desatarla del collar es un lío" → "un mosquetón: clic, y listo".
- "no se enrosca" → "se agarra bien".

## Para confirmar (Santino)
- Medida de la correa (en la web figura 152 cm): ¿la decimos en algún video?
- Microchip: lo saqué del guion 2 hasta confirmar.

## Problemas técnicos encontrados
- Biselado en el collar → NaN que, con desenfoque, deja el cuadro blanco. Sacado.
- Render lento (2 min/cuadro) por 7 jacarandás importados por separado y 1400 flores sueltas → copias enlazadas + una sola malla: 16 s/cuadro a 1080p.
- La v1 se renderizó a 720p escalado para llegar rápido; la final en 1080p se puede dejar de noche (~5 h).
- Pepe está sentado (el modelo viene así): caminar/correr de verdad necesita otro modelo parado o remodelar las patas. En el video 1 lo resolví con planos donde no camina (salta hacia la paloma, tira, gira la cabeza).
