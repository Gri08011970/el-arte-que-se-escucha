
export function crearSonidoGrito() {
  const AudioContext =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) {
    throw new Error("Este navegador no admite Web Audio.");
  }

  const contexto = new AudioContext();
  const salida = contexto.createGain();

  const VOLUMEN_INICIAL = 0.10;

  salida.gain.value = VOLUMEN_INICIAL;
  salida.connect(contexto.destination);

  const osciladores = [];
  const frecuencias = [110, 116.5, 164.81];

  let activo = true;
  let detenido = false;
  let fundiendo = false;
  let temporizadorFundido = null;
  let resolverFundido = null;
  let promesaDetencion = null;

  // Frecuencias cercanas generan tensión y disonancia.
  frecuencias.forEach((frecuencia, indice) => {
    const oscilador = contexto.createOscillator();
    const ganancia = contexto.createGain();

    oscilador.type = indice === 2 ? "triangle" : "sine";
    oscilador.frequency.value = frecuencia;

    ganancia.gain.value = 0.18;

    oscilador.connect(ganancia);
    ganancia.connect(salida);

    oscilador.start();
    osciladores.push(oscilador);
  });

  // Pulsaciones irregulares que evocan inquietud.
  function crearPulso() {
    if (!activo || contexto.state === "closed") return;

    const oscilador = contexto.createOscillator();
    const ganancia = contexto.createGain();
    const ahora = contexto.currentTime;

    oscilador.type = "triangle";

    oscilador.frequency.setValueAtTime(180, ahora);
    oscilador.frequency.exponentialRampToValueAtTime(
      75,
      ahora + 0.7
    );

    ganancia.gain.setValueAtTime(0.0001, ahora);

    ganancia.gain.exponentialRampToValueAtTime(
      0.22,
      ahora + 0.08
    );

    ganancia.gain.exponentialRampToValueAtTime(
      0.0001,
      ahora + 0.8
    );

    oscilador.connect(ganancia);
    ganancia.connect(salida);

    oscilador.start(ahora);
    oscilador.stop(ahora + 0.85);
  }

  crearPulso();

  const intervalo = setInterval(
    crearPulso,
    1200 + Math.random() * 500
  );

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

    // Si se interrumpe el fundido, liberamos
    // también la espera de quien lo inició.
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

  // Reduce el volumen progresivamente.
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
