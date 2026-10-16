import { Hero } from "@/components/Hero";
import { SeccionKit } from "@/components/SeccionKit";
import { SeccionCombos } from "@/components/SeccionCombos";
import { SeccionProductos } from "@/components/SeccionProductos";
import { FranjaValor } from "@/components/FranjaValor";
import { SeccionPreguntas } from "@/components/SeccionPreguntas";

export default function Inicio() {
  return (
    <>
      <Hero />
      <SeccionKit />
      <SeccionCombos />
      <SeccionProductos />
      <FranjaValor />
      <SeccionPreguntas />
    </>
  );
}
