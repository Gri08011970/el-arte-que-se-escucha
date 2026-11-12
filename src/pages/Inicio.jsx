import "./Inicio.css";

function Inicio({ comenzar }) {
  return (
    <main className="inicio">
      <div className="inicio-contenido">
        <span className="inicio-etiqueta">
          UNA EXPERIENCIA ARTÍSTICA Y MUSICAL
        </span>

        <div className="inicio-icono">🎨 🎶</div>

        <h1>
          EL ARTE QUE SE
          <span> ESCUCHA</span>
        </h1>

        <p className="inicio-subtitulo">
          Cuando las imágenes se convierten en emociones y las emociones en
          sonidos.
        </p>

        <div className="inicio-linea"></div>

        <p className="inicio-descripcion">
          Nueve obras. Nueve emociones. Un recorrido donde la pintura, la música y
          la imaginación se encuentran.
        </p>

        <button className="inicio-boton" onClick={comenzar}>
          COMENZAR EL RECORRIDO ✨
        </button>

        <div className="inicio-creditos">
          <strong>Sofía Jimenez</strong>
          <span>5.º A · Escuela Secundaria N.º 50 · Morón</span>
          <span>Profesora Daniela Certo · Música · 2026</span>
        </div>
      </div>
    </main>
  );
}

export default Inicio;
