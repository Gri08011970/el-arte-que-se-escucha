
export function crearSonidoVulnerabilidad() {
  const AudioContext =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) {
    throw new Error("Este navegador no admite Web Audio.");
  }

  const contexto = new AudioContext();
  const salida = contexto.createGain();

  salida.gain.value = 0.35;
  salida.connect(contexto.destination);

  let activo = true;
  let detenido = false;
  let fundiendo = false;
  let paso = 0;

  let temporizadorFundido = null;
  let resolverFundido = null;
  let promesaDetencion = null;

  // Dos líneas melódicas que parecen buscarse.
  const notas = [
    220.0,
    261.63,
    246.94,
    293.66,
    261.63,
    220.0,
    196.0,
    246.94,
  ];

  function tocarNota(
    frecuencia,
    intensidad = 0.17,
    duracion = 2.2
  ) {
    if (!activo || contexto.state === "closed") return;

    const ahora = contexto.currentTime;
    const oscilador = contexto.createOscillator();
    const ganancia = contexto.createGain();

    oscilador.type = "sine";
    oscilador.frequency.value = frecuencia;

    ganancia.gain.setValueAtTime(0.0001, ahora);

    ganancia.gain.exponentialRampToValueAtTime(
      intensidad,
      ahora + 0.35
    );

    ganancia.gain.exponentialRampToValueAtTime(
      0.0001,
      ahora + duracion
    );

    oscilador.connect(ganancia);
    ganancia.connect(salida);

    oscilador.start(ahora);
    oscilador.stop(ahora + duracion + 0.05);
  }

  // Una segunda voz responde un poco más tarde.
  function crearRespuesta(frecuencia) {
    if (!activo || contexto.state === "closed") return;

    const ahora = contexto.currentTime;
    const oscilador = contexto.createOscillator();
    const ganancia = contexto.createGain();

    oscilador.type = "triangle";
    oscilador.frequency.value = frecuencia;

    ganancia.gain.setValueAtTime(0.0001, ahora);

    ganancia.gain.exponentialRampToValueAtTime(
      0.07,
      ahora + 0.45
    );

    ganancia.gain.exponentialRampToValueAtTime(
      0.0001,
      ahora + 2.5
    );

    oscilador.connect(ganancia);
    ganancia.connect(salida);

    oscilador.start(ahora);
    oscilador.stop(ahora + 2.55);
  }

  function reproducirPaso() {
    if (!activo) return;

    const frecuencia = notas[paso % notas.length];

    // Algunos pasos quedan en silencio:
    // no siempre encontramos una respuesta.
    if (paso % 6 !== 4) {
      tocarNota(frecuencia);

      // A veces aparece otra voz.
      if (paso % 3 === 1) {
        crearRespuesta(frecuencia * 1.25);
      }
    }

    paso++;
  }

  reproducirPaso();

  const intervalo = setInterval(
    reproducirPaso,
    1450
  );

  async function detener() {
    if (promesaDetencion) {
      return promesaDetencion;
    }

    detenido = true;
    activo = false;
    clearInterval(intervalo);

    if (temporizadorFundido !== null) {
      clearTimeout(temporizadorFundido);
      temporizadorFundido = null;
    }

    if (resolverFundido) {
      resolverFundido();
      resolverFundido = null;
    }

    promesaDetencion = (async () => {
      if (contexto.state !== "closed") {
        await contexto.close();
      }
    })();

    return promesaDetencion;
  }

  async function desvanecer(duracion = 1500) {
    if (detenido || fundiendo) return;

    fundiendo = true;

    const ahora = contexto.currentTime;
    const milisegundos = Math.max(0, duracion);

    salida.gain.cancelScheduledValues(ahora);
    salida.gain.setValueAtTime(
      salida.gain.value,
      ahora
    );

    salida.gain.linearRampToValueAtTime(
      0,
      ahora + milisegundos / 1000
    );

    await new Promise((resolver) => {
      resolverFundido = resolver;

      temporizadorFundido = setTimeout(() => {
        temporizadorFundido = null;
        resolverFundido = null;
        resolver();
      }, milisegundos);
    });

    if (!detenido) {
      await detener();
    }
  }

  return { detener, desvanecer };
}
