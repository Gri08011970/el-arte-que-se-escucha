
export function crearSonidoPensador() {
  const AudioContext =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) {
    throw new Error("Este navegador no admite Web Audio.");
  }

  const contexto = new AudioContext();

  // Volumen general de la composición.
  const salida = contexto.createGain();
  salida.gain.value = 0.50;
  salida.connect(contexto.destination);

  let activo = true;
  let detenido = false;
  let fundiendo = false;
  let paso = 0;

  let temporizadorFundido = null;
  let resolverFundido = null;
  let promesaDetencion = null;

  // Notas graves y ligeramente inquietantes.
  // Los intervalos no siempre resuelven,
  // como ocurre con una pregunta abierta.
  const notas = [
    130.81,
    155.56,
    146.83,
    196.0,
    174.61,
    155.56,
    138.59,
    130.81,
  ];

  // Un sonido breve que aparece
  // como un pensamiento inesperado.
  function tocarNota(frecuencia, intensidad = 0.20) {
    if (!activo || contexto.state === "closed") return;

    const ahora = contexto.currentTime;

    const oscilador = contexto.createOscillator();
    const ganancia = contexto.createGain();

    oscilador.type = "triangle";
    oscilador.frequency.value = frecuencia;

    ganancia.gain.setValueAtTime(0.0001, ahora);

    ganancia.gain.exponentialRampToValueAtTime(
      intensidad,
      ahora + 0.12
    );

    ganancia.gain.exponentialRampToValueAtTime(
      0.0001,
      ahora + 1.4
    );

    oscilador.connect(ganancia);
    ganancia.connect(salida);

    oscilador.start(ahora);
    oscilador.stop(ahora + 1.45);
  }

  // Un eco más agudo que sugiere
  // una posible respuesta.
  function tocarEco(frecuencia) {
    if (!activo || contexto.state === "closed") return;

    const ahora = contexto.currentTime;

    const oscilador = contexto.createOscillator();
    const ganancia = contexto.createGain();

    oscilador.type = "sine";
    oscilador.frequency.value = frecuencia;

    ganancia.gain.setValueAtTime(0.0001, ahora);

    ganancia.gain.exponentialRampToValueAtTime(
      0.10,
      ahora + 0.25
    );

    ganancia.gain.exponentialRampToValueAtTime(
      0.0001,
      ahora + 1.8
    );

    oscilador.connect(ganancia);
    ganancia.connect(salida);

    oscilador.start(ahora);
    oscilador.stop(ahora + 1.85);
  }

  // Cada paso representa un pensamiento.
  function reproducirPaso() {
    if (!activo) return;

    const frecuencia = notas[paso % notas.length];

    // Cada cierto tiempo dejamos un silencio
    // para representar la duda.
    if (paso % 5 !== 3) {
      tocarNota(frecuencia);

      // Algunas preguntas reciben un eco;
      // otras quedan sin respuesta.
      if (paso % 3 === 1) {
        tocarEco(frecuencia * 1.5);
      }
    }

    paso++;
  }

  reproducirPaso();

  // Ritmo lento, con pausas perceptibles.
  const intervalo = setInterval(
    reproducirPaso,
    1700
  );

  // Detiene la música y libera recursos.
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

  // Fundido sincronizado con la galería.
  async function desvanecer(duracion = 1500) {
    if (detenido || fundiendo) return;

    fundiendo = true;

    const ahora = contexto.currentTime;
    const segundos = Math.max(0, duracion / 1000);

    salida.gain.cancelScheduledValues(ahora);

    salida.gain.setValueAtTime(
      salida.gain.value,
      ahora
    );

    salida.gain.linearRampToValueAtTime(
      0,
      ahora + segundos
    );

    await new Promise((resolver) => {
      resolverFundido = resolver;

      temporizadorFundido = setTimeout(() => {
        temporizadorFundido = null;
        resolverFundido = null;
        resolver();
      }, duracion);
    });

    if (!detenido) {
      await detener();
    }
  }

  return {
    detener,
    desvanecer,
  };
}
