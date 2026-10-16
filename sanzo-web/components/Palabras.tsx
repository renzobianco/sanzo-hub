/**
 * Parte un título en palabras que suben una por una desde atrás de una máscara.
 * Dentro de un <Reveal> arrancan al entrar en pantalla; con `alCargar`, apenas carga la página.
 */
export function Palabras({ texto, alCargar = false, retraso = 0 }: { texto: string; alCargar?: boolean; retraso?: number }) {
  const palabras = texto.split(" ");
  return (
    <span aria-label={texto} role="text">
      {palabras.map((p, i) => (
        <span key={i} aria-hidden="true">
          <span className="palabra">
            <span
              className={alCargar ? "animate-subir" : undefined}
              style={alCargar ? { animationDelay: `${retraso + i * 90}ms` } : { transitionDelay: `${retraso + i * 70}ms` }}
            >
              {p}
            </span>
          </span>
          {i < palabras.length - 1 && " "}
        </span>
      ))}
    </span>
  );
}
