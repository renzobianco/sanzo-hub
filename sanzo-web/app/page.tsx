import { Hero } from "@/components/Hero";
import { Cinta } from "@/components/Cinta";
import { SeccionKit } from "@/components/SeccionKit";
import { FranjaValor } from "@/components/FranjaValor";
import { SeccionClientes } from "@/components/SeccionClientes";
import { SeccionPorQue } from "@/components/SeccionPorQue";
import { SeccionCombos } from "@/components/SeccionCombos";
import { SeccionProductos } from "@/components/SeccionProductos";
import { SeccionGaleria } from "@/components/SeccionGaleria";
import { SeccionResenas } from "@/components/SeccionResenas";
import { SeccionPreguntas } from "@/components/SeccionPreguntas";

export default function Inicio() {
  return (
    <>
      <Hero />
      <Cinta />
      <SeccionKit />
      {/* Seguridad cerca de la compra: garantía, cambios, envíos y clientes. */}
      <FranjaValor />
      <SeccionClientes />
      <SeccionPorQue />
      <SeccionCombos />
      <SeccionProductos />
      <SeccionGaleria />
      <SeccionResenas />
      <SeccionPreguntas />
    </>
  );
}
