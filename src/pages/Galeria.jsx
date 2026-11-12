import { useState } from "react";
import { obras } from "../data/obras";
import "./Galeria.css";
import Reproductor from "../components/Reproductor";

function Galeria({ volver }) {
  const [indice, setIndice] = useState(0);
  const [transicionando, setTransicionando] = useState(false);

  const obra = obras[indice];

  const siguiente = () => {
    if (transicionando || indice >= obras.length - 1) return;

    setTransicionando(true);

    setTimeout(() => {
      setIndice((actual) => actual + 1);
      setTransicionando(false);
    }, 1500);
  };

  const anterior = () => {
    if (transicionando || indice <= 0) return;

    setTransicionando(true);

    setTimeout(() => {
      setIndice((actual) => actual - 1);
      setTransicionando(false);
    }, 1500);
  };

  return (
    <main className="galeria">
      <header className="galeria-header">
        <button onClick={volver} className="volver">
          ← Volver al inicio
        </button>

        <span>
          {obra.id === 0
            ? "ESTACIÓN 00 · PRÓLOGO"
            : `ESTACIÓN ${String(obra.id).padStart(2, "0")}`}
        </span>
      </header>

      <section
        className={`galeria-contenido ${transicionando ? "desvaneciendo" : ""}`}
        key={obra.id}
      >
        <div className="obra-imagen">
          <img src={obra.imagen} alt={obra.titulo} />
        </div>

        <div className="obra-informacion">
          <span className="obra-emocion">{obra.emocion}</span>

          <h1>{obra.titulo}</h1>

          <p className="obra-autor">
            {obra.autor} · {obra.anio}
          </p>

          <p className="obra-descripcion">{obra.descripcion}</p>

          <div className="obra-musica">
            <h3>🎧 Experiencia sonora</h3>
            <p>{obra.musica}</p>

            <Reproductor
              key={obra.id}
              audio={obra.audio}
              transicionando={transicionando}
            />

            <h3>💜 ¿Por qué esta música?</h3>
            <p>{obra.justificacion}</p>

            <h3>✨ Transición artística</h3>
            <p>{obra.transicion}</p>
          </div>
        </div>
      </section>

      <nav className="galeria-navegacion">
        <button onClick={anterior} disabled={transicionando || indice === 0}>
          ← Anterior
        </button>

        <span>
          {String(obra.id).padStart(2, "0")}
          {" / "}
          {String(obras.length - 1).padStart(2, "0")}
        </span>

        <button
          onClick={siguiente}
          disabled={transicionando || indice === obras.length - 1}
        >
          Siguiente →
        </button>
      </nav>
    </main>
  );
}

export default Galeria;
