import { Hero } from "@/components/Hero";
import { Cinta } from "@/components/Cinta";
import { SeccionKit } from "@/components/SeccionKit";
import { FranjaValor } from "@/components/FranjaValor";
import { SeccionClientes } from "@/components/SeccionClientes";
import { SeccionEtiqueta } from "@/components/SeccionEtiqueta";
import { SeccionPorQue } from "@/components/SeccionPorQue";
import { SeccionCombos } from "@/components/SeccionCombos";
import { SeccionProductos } from "@/components/SeccionProductos";
import { SeccionGaleria } from "@/components/SeccionGaleria";
import { SeccionResenas } from "@/components/SeccionResenas";
import { SeccionEnvios } from "@/components/SeccionEnvios";
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
      <SeccionEtiqueta />
      <SeccionPorQue />
      <SeccionCombos />
      <SeccionProductos />
      <SeccionGaleria />
      <SeccionResenas />
      <SeccionEnvios />
      <SeccionPreguntas />
    </>
  );
}
