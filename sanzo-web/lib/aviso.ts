// Aviso al celular de Renzo y Santi cuando entra un pedido o se aprueba un pago, con la app ntfy
// (gratis, Android e iPhone, sin cuenta). Cada uno se suscribe en la app al tema que está en
// NTFY_TOPIC (Vercel, proyecto sanzo-web). El nombre del tema es la clave: largo y al azar.
// Sin NTFY_TOPIC no se hace nada. Si ntfy falla, solo queda en los logs: el pedido ya está guardado.

const HUB = "https://sanzo-hub.vercel.app";

export async function avisarAlCelular(titulo: string, mensaje: string, etiqueta: "pedido" | "pago" = "pedido") {
  const tema = process.env.NTFY_TOPIC?.trim();
  if (!tema) return;
  try {
    const res = await fetch("https://ntfy.sh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: tema,
        title: titulo,
        message: mensaje,
        tags: [etiqueta === "pago" ? "moneybag" : "dog"],
        priority: 4,
        // Tocar la notificación abre Pedidos web en el Hub.
        click: HUB,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`ntfy ${res.status}: ${await res.text()}`);
  } catch (err) {
    console.error("[aviso] No se pudo mandar el aviso al celular", err);
  }
}
