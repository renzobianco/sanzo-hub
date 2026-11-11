# Genera efectos de sonido propios (sintetizados con ffmpeg, sin derechos) en animaciones/public/sfx/
# Uso: powershell -File sfx.ps1
$env:Path += ";$env:LOCALAPPDATA\Microsoft\WinGet\Links"
$o = Join-Path $PSScriptRoot "..\animaciones\public\sfx"
New-Item -ItemType Directory -Force $o | Out-Null
$sr = "44100"
function Gen($nombre, $expr, $dur, $filtro = "anull") {
  ffmpeg -v error -y -f lavfi -i "aevalsrc='$expr':s=${sr}:d=$dur" -af "$filtro" -ac 2 "$o\$nombre.wav"
}
# whoosh: ruido filtrado que sube y baja
Gen "whoosh" "(random(0)*2-1)*sin(PI*t/0.45)" 0.45 "bandpass=f=900:width_type=h:w=1400,volume=0.9"
# pop: burbuja corta que sube
Gen "pop" "sin(2*PI*(500+2600*t)*t)*exp(-28*t)" 0.14 "volume=0.8"
# clic de la hebilla: golpe seco + click agudo
Gen "clic" "0.6*(random(0)*2-1)*exp(-260*t)+0.7*sin(2*PI*2600*t)*exp(-90*t)" 0.08 "volume=1.2"
# cartel de problema: "bonk" grave que baja
Gen "bonk" "sin(2*PI*(260-180*t)*t)*exp(-7*t)+0.3*sin(2*PI*(130-90*t)*t)*exp(-7*t)" 0.4 "volume=0.9"
# láser: zumbido que vibra
Gen "laser" "0.35*sin(2*PI*1900*t+4*sin(2*PI*55*t))+0.15*(random(0)*2-1)" 1.0 "highpass=f=600,volume=0.5"
# brillito cuando entra una pieza nueva
Gen "ding" "0.5*sin(2*PI*1568*t)*exp(-4*t)+0.35*sin(2*PI*2093*t)*exp(-5*t)+0.2*sin(2*PI*3136*t)*exp(-7*t)" 0.9 "volume=0.6"
# rasquido: ráfagas de ruido rápidas
Gen "rasca" "(random(0)*2-1)*(0.5+0.5*sin(2*PI*11*t))" 1.4 "bandpass=f=3200:width_type=h:w=2500,volume=0.7"
# ahorcado: "glup" que cae
Gen "glup" "sin(2*PI*(700*exp(-3*t))*t)*exp(-2.5*t)" 0.7 "volume=0.8"
# festejo: arpegio do-mi-sol-do
Gen "tada" "0.5*sin(2*PI*523*t)*lt(t,0.12)+0.5*sin(2*PI*659*t)*gte(t,0.12)*lt(t,0.24)+0.5*sin(2*PI*784*t)*gte(t,0.24)*lt(t,0.36)+0.6*sin(2*PI*1047*t)*gte(t,0.36)*exp(-3*(t-0.36))" 1.3 "volume=0.7"
# miedo: tic-tac nervioso
Gen "nervios" "sin(2*PI*1200*t)*exp(-60*mod(t,0.25))" 1.0 "volume=0.35"
# tos: tres golpes ásperos (ruido + tono grave) con forma de tos de perro que tira
Gen "tos" "(exp(-14*t)*lt(t,0.2)+0.85*gte(t,0.24)*exp(-14*(t-0.24))*lt(t,0.44)+0.7*gte(t,0.48)*exp(-12*(t-0.48)))*(0.55*(random(0)*2-1)+0.5*sin(2*PI*210*t)+0.35*sin(2*PI*420*t)+0.2*sin(2*PI*630*t))" 0.8 "highpass=f=150,lowpass=f=2600,equalizer=f=700:t=h:w=600:g=6,volume=0.9"
Get-ChildItem $o | Select-Object Name, Length
