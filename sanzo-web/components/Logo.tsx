import Image from "next/image";

/** Logo: imagen /logo-sanzo.png si existe; si no, el texto "sanzo" en Jost. Nunca se dibuja. */
export function Logo({ hayLogo, className = "" }: { hayLogo: boolean; className?: string }) {
  if (hayLogo) {
    return (
      <Image
        src="/logo-sanzo.png"
        alt="sanzo"
        width={929}
        height={230}
        priority
        className={`h-7 w-auto md:h-8 ${className}`}
      />
    );
  }
  return <span className={`text-[26px] font-light lowercase leading-none tracking-[0.12em] ${className}`}>sanzo</span>;
}
