# Cambiar la voz provisoria por la de ElevenLabs

Cada video Blender tiene su guion en `animaciones/guiones/<nombre>.json` y el texto plano para pegar en ElevenLabs en `2-material/voz/<nombre>.txt`.
Hoy hay: `correa`.

Cuando Santino deja `2-material/voz/<nombre>.mp3` (desde `D:\CLAUDIO\sanzo-hub\videos`):

1. **Tiempos nuevos** (Whisper, alinea con el guion):
   `python herramientas/tiempos_audio.py animaciones/guiones/<nombre>.json 2-material/voz/<nombre>.mp3 animaciones/public/<nombre>`
2. **Rearmar la escena 3D** con esos tiempos (los cortes y acciones siguen a la voz):
   `blender -b --factory-startup --python blender/<nombre>.py -- 3-listos/_tmp/<nombre> armar`
3. **Render 3D** (retomable por tramos; calidad final 1080x1920, 16 muestras ≈ 16 s/cuadro):
   `blender -b 3-listos/_tmp/<nombre>/<nombre>.blend -o //frames/f_#### -s 0 -e <total-1> -a`
4. **Fondo para Remotion**:
   `ffmpeg -framerate 30 -i 3-listos/_tmp/<nombre>/frames/f_%04d.png -vf scale=1080:1920 -c:v libx264 -crf 16 -pix_fmt yuv420p animaciones/public/<nombre>/fondo.mp4`
5. **Video final** (desde `animaciones/`):
   - con voz: `npx remotion render src/index.jsx <Composicion> ../3-listos/<fecha>_<nombre>_blender_vN.mp4`
   - sin voz (solo efectos): agregar `--props='{"voz":false}'`
   - liviano: `ffmpeg -i ...vN.mp4 -c:v libx264 -crf 27 -c:a aac -b:a 128k -movflags +faststart ..._liviano.mp4`

Python: `C:\Users\santi\AppData\Local\Programs\Python\Python312\python.exe` · Blender: `C:\Program Files\Blender Foundation\Blender 4.5\blender.exe`
