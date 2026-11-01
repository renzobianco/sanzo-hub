// Paleta oficial de Sanzo. Copiada de sanzo-web/app/globals.css — si cambia ahí, actualizar acá.
export const colores = {
  marron: "#946037", // Pantone 4635 C
  topo: "#A39282", // Pantone 4745 C
  crema: "#F4EDE3",
  lino: "#E8DCCB",
  tinta: "#251D16",
} as const;

export const fuente = "'Jost', ui-sans-serif, system-ui, sans-serif";

export const suave = "cubic-bezier(0.16, 1, 0.3, 1)";

// Grading uniforme para que fotos distintas se sientan de la misma pieza.
export const grade = "contrast(1.1) saturate(0.88) brightness(0.96) sepia(0.08)";
