import { Composition } from "remotion";
import { Presentacion } from "./compositions/Presentacion";
import { Promo } from "./compositions/Promo";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="Presentacion"
        component={Presentacion}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ titulo: "SANZO" }}
      />
      <Composition
        id="Promo"
        component={Promo}
        durationInFrames={340}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
