
import { useCallback, useEffect, useRef, useState } from "react";

import { crearSonidoEstrellado } from "../audio/crearSonido";
import { crearSonidoGrito } from "../audio/crearSonidoGrito";
import { crearSonidoDanza } from "../audio/crearSonidoDanza";
import { crearSonidoBeso } from "../audio/crearSonidoBeso";
import { crearSonidoLibertad } from "../audio/crearSonidoLibertad";
import { crearSonidoVida } from "../audio/crearSonidoVida";
import { crearSonidoPensador } from "../audio/crearSonidoPensador";
import { crearSonidoVulnerabilidad } from "../audio/crearSonidoVulnerabilidad";
import { crearSonidoEsperanza } from "../audio/crearSonidoEsperanza";

// Registro centralizado de las composiciones.
// Las próximas estaciones se agregarán aquí.
const sonidosExperimentales = {
  vida: crearSonidoVida,
  estrellado: crearSonidoEstrellado,
  grito: crearSonidoGrito,
  danza: crearSonidoDanza,
  beso: crearSonidoBeso,
  libertad: crearSonidoLibertad,
  pensador: crearSonidoPensador,
  vulnerabilidad: crearSonidoVulnerabilidad,
  esperanza: crearSonidoEsperanza,
};

const DURACION_FUNDIDO = 1500;

function Reproductor({ audio, transicionando = false }) {
  const [opcion, setOpcion] = useState("archivo");
  const [reproduciendo, setReproduciendo] = useState(false);

  const sonidoRef = useRef(null);
  const archivoRef = useRef(null);

  const intervaloRef = useRef(null);
  const tiempoRef = useRef(null);
  const resolverFundidoRef = useRef(null);

  const sesionRef = useRef(0);
  const transicionRef = useRef(false);
  const reproduciendoRef = useRef(false);

  const actualizarReproduccion = useCallback((valor) => {
    reproduciendoRef.current = valor;
    setReproduciendo(valor);
  }, []);

  // Cancela los temporizadores y libera cualquier
  // promesa de fundido que haya quedado esperando.
  const limpiarTemporizadores = useCallback(() => {
    if (intervaloRef.current !== null) {
      clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }

    if (tiempoRef.current !== null) {
      clearTimeout(tiempoRef.current);
      tiempoRef.current = null;
    }

    if (resolverFundidoRef.current) {
      const resolver = resolverFundidoRef.current;
      resolverFundidoRef.current = null;
      resolver();
    }
  }, []);

  // Detención inmediata, por ejemplo al presionar
  // "Detener música" o cambiar de opción.
  const detener = useCallback(async () => {
    sesionRef.current += 1;

    limpiarTemporizadores();

    const sonido = sonidoRef.current;
    sonidoRef.current = null;

    const archivo = archivoRef.current;
    archivoRef.current = null;

    if (archivo) {
      archivo.onended = null;
      archivo.pause();
      archivo.currentTime = 0;
      archivo.removeAttribute("src");
      archivo.load();
    }

    actualizarReproduccion(false);

    if (sonido) {
      await sonido.detener();
    }
  }, [limpiarTemporizadores, actualizarReproduccion]);

  // Fundido progresivo de los archivos MP3.
  const desvanecerArchivo = useCallback(
    (archivo, duracion) => {
      const volumenInicial = archivo.volume;
      const inicio = performance.now();

      return new Promise((resolver) => {
        let finalizado = false;

        const finalizar = () => {
          if (finalizado) return;

          finalizado = true;

          if (intervaloRef.current !== null) {
            clearInterval(intervaloRef.current);
            intervaloRef.current = null;
          }

          if (tiempoRef.current !== null) {
            clearTimeout(tiempoRef.current);
            tiempoRef.current = null;
          }

          resolverFundidoRef.current = null;
          resolver();
        };

        resolverFundidoRef.current = finalizar;

        intervaloRef.current = setInterval(() => {
          const transcurrido =
            performance.now() - inicio;

          const progreso = Math.min(
            transcurrido / duracion,
            1
          );

          archivo.volume = Math.max(
            0,
            volumenInicial * (1 - progreso)
          );

          if (progreso >= 1) {
            finalizar();
          }
        }, 30);

        // Respaldo por si el navegador retrasa
        // los intervalos de actualización.
        tiempoRef.current = setTimeout(() => {
          archivo.volume = 0;
          finalizar();
        }, duracion + 100);
      });
    },
    []
  );

  // Despedida musical sincronizada con la galería.
  const desvanecer = useCallback(async () => {
    if (!reproduciendoRef.current) return;

    const sesion = sesionRef.current;

    const archivo = archivoRef.current;
    const sonido = sonidoRef.current;

    try {
      if (archivo) {
        await desvanecerArchivo(
          archivo,
          DURACION_FUNDIDO
        );
      } else if (sonido?.desvanecer) {
        await sonido.desvanecer(DURACION_FUNDIDO);
      } else if (sonido) {
        await new Promise((resolver) => {
          resolverFundidoRef.current = resolver;

          tiempoRef.current = setTimeout(() => {
            tiempoRef.current = null;
            resolverFundidoRef.current = null;
            resolver();
          }, DURACION_FUNDIDO);
        });
      }

      // Solo detenemos si sigue siendo
      // la misma sesión de reproducción.
      if (sesion === sesionRef.current) {
        await detener();
      }
    } catch (error) {
      console.error(
        "Error durante el fundido:",
        error
      );

      if (sesion === sesionRef.current) {
        await detener();
      }
    }
  }, [desvanecerArchivo, detener]);

  // Inicia el fundido cuando comienza
  // la transición visual.
  useEffect(() => {
    if (transicionando && !transicionRef.current) {
      transicionRef.current = true;
      void desvanecer();
    }

    if (!transicionando) {
      transicionRef.current = false;
    }
  }, [transicionando, desvanecer]);

  // Limpieza al desmontar el reproductor.
  useEffect(() => {
    return () => {
      sesionRef.current += 1;

      limpiarTemporizadores();

      const sonido = sonidoRef.current;
      sonidoRef.current = null;

      if (sonido) {
        void sonido.detener();
      }

      const archivo = archivoRef.current;
      archivoRef.current = null;

      if (archivo) {
        archivo.onended = null;
        archivo.pause();
        archivo.removeAttribute("src");
        archivo.load();
      }
    };
  }, [limpiarTemporizadores]);

  const cambiarOpcion = async (nuevaOpcion) => {
    if (transicionando) return;

    try {
      await detener();
      setOpcion(nuevaOpcion);
    } catch (error) {
      console.error(
        "Error al cambiar música:",
        error
      );
    }
  };

  const alternar = async () => {
    if (transicionando) return;

    if (reproduciendoRef.current) {
      try {
        await detener();
      } catch (error) {
        console.error(
          "Error al detener:",
          error
        );
      }
      return;
    }

    const sesion = ++sesionRef.current;

    try {
      if (opcion === "archivo") {
        if (!audio?.archivo) {
          alert(
            "Sofía todavía no seleccionó su canción."
          );
          return;
        }

        const archivo = new Audio(audio.archivo);
        archivo.volume = 1;

        archivoRef.current = archivo;

        archivo.onended = () => {
          if (sesion === sesionRef.current) {
            actualizarReproduccion(false);
          }
        };

        await archivo.play();

        if (sesion !== sesionRef.current) {
          archivo.pause();
          return;
        }
      } else {
        const crearSonido =
          sonidosExperimentales[audio?.sonidoId];

        if (!crearSonido) {
          alert(
            "Esta obra todavía no tiene composición experimental."
          );
          return;
        }

        const sonido = crearSonido();

        if (sesion !== sesionRef.current) {
          await sonido.detener();
          return;
        }

        sonidoRef.current = sonido;
      }

      actualizarReproduccion(true);
    } catch (error) {
      console.error(
        "Error al reproducir:",
        error
      );

      if (sesion === sesionRef.current) {
        await detener();
        alert("No se pudo reproducir esta música.");
      }
    }
  };

  const tituloArchivo =
    audio?.tituloCancion || "";

  const artistaArchivo =
    audio?.artistaCancion || "";

  return (
    <div className="reproductor">
      <div className="selector-musica">
        <button
          type="button"
          className={
            opcion === "experimental" ? "activo" : ""
          }
          disabled={transicionando}
          onClick={() =>
            cambiarOpcion("experimental")
          }
        >
          🎹 Composición experimental
        </button>

        <button
          type="button"
          className={
            opcion === "archivo" ? "activo" : ""
          }
          disabled={transicionando}
          onClick={() =>
            cambiarOpcion("archivo")
          }
        >
          🎵 La Música que elegí
        </button>
      </div>

      <button
        type="button"
        className="reproductor-boton"
        disabled={transicionando}
        onClick={alternar}
      >
        {reproduciendo
          ? "⏹ Detener música"
          : "▶ Escuchar la obra"}
      </button>

      <p className="reproductor-info">
        {opcion === "experimental"
          ? "🎶 "
          : audio?.archivo
            ? `🎵 ${tituloArchivo} · ${artistaArchivo}`
            : "🎵 Sofía todavía no eligió su canción"}
      </p>
    </div>
  );
}

export default Reproductor;

