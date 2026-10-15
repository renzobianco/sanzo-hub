import { sitio } from "@/data/products";

export function BarraSuperior() {
  return (
    <div className="bg-tinta px-4 py-2 text-center text-[10px] font-normal uppercase tracking-[0.12em] text-crema md:text-[11px] md:tracking-amplio">
      {sitio.barraSuperior}
    </div>
  );
}
