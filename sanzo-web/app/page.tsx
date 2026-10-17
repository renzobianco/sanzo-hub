import { Hero } from "@/components/Hero";
import { Cinta } from "@/components/Cinta";
import { NavTienda } from "@/components/NavTienda";
import { SeccionKit } from "@/components/SeccionKit";
import { SeccionCombos } from "@/components/SeccionCombos";
import { SeccionProductos } from "@/components/SeccionProductos";
import { SeccionClientes } from "@/components/SeccionClientes";
import { SeccionPorQue } from "@/components/SeccionPorQue";
import { SeccionResenas } from "@/components/SeccionResenas";
import { SeccionPreguntas } from "@/components/SeccionPreguntas";

export default function Inicio() {
  return (
    <>
      <Hero />
      <Cinta />
      {/* La tienda primero: kit, combos e individuales, con chips fijos para saltar entre ellos. */}
      <div>
        <NavTienda />
        <SeccionKit />
        <SeccionCombos />
        <SeccionProductos />
      </div>
      <SeccionClientes />
      <SeccionPorQue />
      <SeccionResenas />
      <SeccionPreguntas />
    </>
  );
}
