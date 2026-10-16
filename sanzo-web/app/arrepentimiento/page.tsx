import type { Metadata } from "next";
import { legal } from "@/data/products";
import { FormularioArrepentimiento } from "@/components/FormularioArrepentimiento";

export const metadata: Metadata = {
  title: "Botón de arrepentimiento — sanzo",
  description: legal.arrepentimiento.texto,
};

export default function Arrepentimiento() {
  const { titulo, texto } = legal.arrepentimiento;
  return (
    <section className="bg-crema px-4 py-16 md:py-24">
      <div className="mx-auto max-w-lg">
        <h1 className="titulo-seccion">{titulo}</h1>
        <p className="mt-5 text-[16px] font-light leading-relaxed text-tinta/85">{texto}</p>
        <FormularioArrepentimiento />
      </div>
    </section>
  );
}
