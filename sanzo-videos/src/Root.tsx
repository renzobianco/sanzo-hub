import { Composition } from "remotion";
import { Presentacion } from "./compositions/Presentacion";

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
    </>
  );
};
