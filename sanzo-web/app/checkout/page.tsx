import type { Metadata } from "next";
import { FormularioCheckout } from "@/components/checkout/FormularioCheckout";
import { pagoOnlineActivo } from "@/lib/mercadopago";

export const metadata: Metadata = {
  title: "Checkout — sanzo",
  robots: { index: false },
};

export default function Checkout() {
  return (
    <section className="bg-crema py-14 md:py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <h1 className="titulo-seccion mb-10 md:mb-14">Finalizar compra</h1>
        <FormularioCheckout pagoOnline={pagoOnlineActivo()} />
      </div>
    </section>
  );
}
