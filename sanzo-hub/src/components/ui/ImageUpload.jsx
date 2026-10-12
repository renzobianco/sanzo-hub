import { useRef } from 'react'
import { IconPaw, IconCamera, IconTrash } from './Icons.jsx'

// Lee la imagen, la reduce (máx. 900px) y devuelve base64 para guardar en localStorage.
function fileToDataUrl(file, maxSize = 900) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.86))
      }
      img.onerror = reject
      img.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Placeholder elegante (beige + huellita + "Subí tu foto"). Click para subir.
 * shape: 'round' | 'rounded' — size: número (px) o { width, height }
 */
export function ImageUpload({ value, onChange, shape = 'rounded', size = 120, text = 'Subí tu foto', showText = true, style = {}, className = '', maxSize = 900 }) {
  const inputRef = useRef(null)
  const dims = typeof size === 'number' ? { width: size, height: size } : size

  const pick = (e) => {
    e.stopPropagation()
    inputRef.current?.click()
  }

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const data = await fileToDataUrl(file, maxSize)
      onChange?.(data)
    } catch {
      alert('No pudimos leer esa imagen. Probá con otra.')
    }
  }

  const clear = (e) => {
    e.stopPropagation()
    onChange?.(null)
  }

  return (
    <div className={`img-upload ${shape} ${className}`} style={{ ...dims, ...style }} onClick={pick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && pick(e)}>
      {value ? (
        <>
          <img src={value} alt="" />
          <div className="img-actions">
            <button type="button" onClick={pick} aria-label="Cambiar foto">
              <IconCamera />
            </button>
            <button type="button" onClick={clear} aria-label="Quitar foto">
              <IconTrash />
            </button>
          </div>
        </>
      ) : (
        <>
          <IconPaw className="ph-icon" />
          {showText && <span className="ph-text">{text}</span>}
        </>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden-input" onChange={onFile} />
    </div>
  )
}

export function Avatar({ src, name, size = 38, onClick }) {
  const ini = (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('')
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.34, cursor: onClick ? 'pointer' : 'default' }} onClick={onClick} title={name}>
      {src ? <img src={src} alt={name} /> : ini}
    </div>
  )
}
