import type { Metadata } from "next";
import { Suspense } from "react";
import { ContenidoGracias } from "@/components/gracias/ContenidoGracias";

export const metadata: Metadata = {
  title: "Gracias — sanzo",
  robots: { index: false },
};

export default function Gracias() {
  return (
    <section className="flex min-h-[70vh] items-center bg-crema px-4 py-20">
      <Suspense fallback={null}>
        <ContenidoGracias />
      </Suspense>
    </section>
  );
}
