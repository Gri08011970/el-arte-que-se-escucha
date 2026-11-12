
export function crearSonidoBeso() {
  const AudioContext =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) {
    throw new Error("Este navegador no admite Web Audio.");
  }

  const contexto = new AudioContext();

  const salida = contexto.createGain();
  const VOLUMEN_INICIAL = 0.12;

  salida.gain.value = VOLUMEN_INICIAL;
  salida.connect(contexto.destination);

  let activo = true;
  let detenido = false;
  let fundiendo = false;
  let paso = 0;

  let temporizadorFundido = null;
  let resolverFundido = null;
  let promesaDetencion = null;

  // Notas suaves y armoniosas
  const notas = [
    261.63,
    329.63,
    392.0,
    523.25,
    440.0,
    392.0,
    329.63,
    293.66,
  ];

  function tocarNota(frecuencia) {
    if (!activo || contexto.state === "closed") return;

    const ahora = contexto.currentTime;
    const oscilador = contexto.createOscillator();
    const ganancia = contexto.createGain();

    oscilador.type = "sine";
    oscilador.frequency.value = frecuencia;

    // Entrada y salida suaves
    ganancia.gain.setValueAtTime(0.0001, ahora);

    ganancia.gain.exponentialRampToValueAtTime(
      0.25,
      ahora + 0.7
    );

    ganancia.gain.exponentialRampToValueAtTime(
      0.0001,
      ahora + 3.5
    );

    oscilador.connect(ganancia);
    ganancia.connect(salida);

    oscilador.start(ahora);
    oscilador.stop(ahora + 3.6);
  }

  function reproducir() {
    if (!activo) return;

    tocarNota(notas[paso % notas.length]);

    // Una segunda nota crea una armonía delicada
    if (paso % 2 === 0) {
      tocarNota(notas[(paso + 2) % notas.length] / 2);
    }

    paso++;
  }

  reproducir();

  const intervalo = setInterval(reproducir, 2100);

  // Detiene el sonido y libera sus recursos.
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

    // Evita dejar una espera pendiente
    // si se interrumpe el fundido.
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

  // Despedida gradual de la composición.
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

