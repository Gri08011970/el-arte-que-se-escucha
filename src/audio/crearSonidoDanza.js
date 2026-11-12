
export function crearSonidoDanza() {
  const AudioContext =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) {
    throw new Error("Este navegador no admite Web Audio.");
  }

  const contexto = new AudioContext();

  const volumen = contexto.createGain();
  const VOLUMEN_INICIAL = 0.12;

  volumen.gain.value = VOLUMEN_INICIAL;
  volumen.connect(contexto.destination);

  let activo = true;
  let detenido = false;
  let fundiendo = false;
  let paso = 0;

  let temporizadorFundido = null;
  let resolverFundido = null;
  let promesaDetencion = null;

  // Notas luminosas de una escala pentatónica
  const notas = [
    261.63,
    329.63,
    392.0,
    440.0,
    523.25,
    440.0,
    392.0,
    329.63,
  ];

  function tocarNota(frecuencia, duracion, intensidad) {
    if (!activo || contexto.state === "closed") return;

    const ahora = contexto.currentTime;

    const oscilador = contexto.createOscillator();
    const ganancia = contexto.createGain();

    oscilador.type = "triangle";
    oscilador.frequency.value = frecuencia;

    ganancia.gain.setValueAtTime(0.0001, ahora);

    ganancia.gain.exponentialRampToValueAtTime(
      intensidad,
      ahora + 0.03
    );

    ganancia.gain.exponentialRampToValueAtTime(
      0.0001,
      ahora + duracion
    );

    oscilador.connect(ganancia);
    ganancia.connect(volumen);

    oscilador.start(ahora);
    oscilador.stop(ahora + duracion + 0.02);
  }

  // Pulso suave que representa los pasos de baile
  function tocarPulso() {
    if (!activo || contexto.state === "closed") return;

    const ahora = contexto.currentTime;

    const oscilador = contexto.createOscillator();
    const ganancia = contexto.createGain();

    oscilador.type = "sine";

    oscilador.frequency.setValueAtTime(140, ahora);
    oscilador.frequency.exponentialRampToValueAtTime(
      70,
      ahora + 0.15
    );

    ganancia.gain.setValueAtTime(0.0001, ahora);
    ganancia.gain.exponentialRampToValueAtTime(
      0.18,
      ahora + 0.02
    );
    ganancia.gain.exponentialRampToValueAtTime(
      0.0001,
      ahora + 0.25
    );

    oscilador.connect(ganancia);
    ganancia.connect(volumen);

    oscilador.start(ahora);
    oscilador.stop(ahora + 0.27);
  }

  function reproducirPaso() {
    if (!activo) return;

    const frecuencia = notas[paso % notas.length];

    tocarNota(frecuencia, 0.45, 0.22);

    if (paso % 2 === 0) {
      tocarPulso();
    }

    paso++;
  }

  reproducirPaso();

  const intervalo = setInterval(reproducirPaso, 430);

  // Detiene la composición y libera sus recursos.
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

    // Si el fundido fue interrumpido,
    // liberamos la promesa que estaba esperando.
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

  // Reduce el volumen durante la transición.
  async function desvanecer(duracion = 1500) {
    if (detenido || fundiendo) return;

    fundiendo = true;

    const ahora = contexto.currentTime;
    const segundos = Math.max(0, duracion / 1000);

    volumen.gain.cancelScheduledValues(ahora);

    volumen.gain.setValueAtTime(
      volumen.gain.value,
      ahora
    );

    volumen.gain.linearRampToValueAtTime(
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

