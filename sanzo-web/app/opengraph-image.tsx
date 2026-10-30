import { ImageResponse } from "next/og";

// Imagen Open Graph placeholder. Para usar una foto: borrá este archivo y poné
// app/opengraph-image.jpg (1200x630).
export const alt = "sanzo — accesorios para mascotas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #A39282, #946037)",
          color: "#F4EDE3",
        }}
      >
        <div style={{ fontSize: 150, fontWeight: 300, letterSpacing: 18 }}>sanzo</div>
        <div style={{ marginTop: 24, fontSize: 34, letterSpacing: 12 }}>SACALO COMO SE MERECE</div>
      </div>
    ),
    size,
  );
}
