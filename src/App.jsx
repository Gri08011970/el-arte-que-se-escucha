
import { useState } from "react";
import Inicio from "./pages/Inicio";
import Galeria from "./pages/Galeria";

function App() {
  const [pantalla, setPantalla] = useState("inicio");

  return pantalla === "inicio" ? (
    <Inicio comenzar={() => setPantalla("galeria")} />
  ) : (
    <Galeria volver={() => setPantalla("inicio")} />
  );
}

export default App;

