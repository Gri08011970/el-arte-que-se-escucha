
export function crearSonidoEstrellado() {
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

  const osciladores = [];
  const notas = [130.81, 196, 261.63, 392];

  let activo = true;
  let detenido = false;
  let fundiendo = false;
  let temporizadorFundido = null;
  let promesaDetencion = null;

  // Fondo sonoro: notas suaves y envolventes
  notas.forEach((frecuencia) => {
    const oscilador = contexto.createOscillator();
    const ganancia = contexto.createGain();

    oscilador.type = "sine";
    oscilador.frequency.value = frecuencia;

    ganancia.gain.value = 0.12;

    oscilador.connect(ganancia);
    ganancia.connect(volumen);

    oscilador.start();

    osciladores.push(oscilador);
  });

  // Destellos que representan las estrellas
  function crearDestello() {
    if (!activo || contexto.state === "closed") return;

    const oscilador = contexto.createOscillator();
    const ganancia = contexto.createGain();

    const frecuencias = [
      523.25,
      659.25,
      783.99,
      1046.5,
    ];

    const frecuencia =
      frecuencias[
        Math.floor(Math.random() * frecuencias.length)
      ];

    const ahora = contexto.currentTime;

    oscilador.type = "sine";
    oscilador.frequency.value = frecuencia;

    ganancia.gain.setValueAtTime(0.0001, ahora);

    ganancia.gain.exponentialRampToValueAtTime(
      0.18,
      ahora + 0.15
    );

    ganancia.gain.exponentialRampToValueAtTime(
      0.0001,
      ahora + 2
    );

    oscilador.connect(ganancia);
    ganancia.connect(volumen);

    oscilador.start(ahora);
    oscilador.stop(ahora + 2.1);
  }

  crearDestello();

  const intervalo = setInterval(crearDestello, 1700);

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
    const segundos = Math.max(0, duracion / 1000);

    // Conservamos el sonido mientras su volumen
    // disminuye progresivamente hasta el silencio.
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
      temporizadorFundido = setTimeout(() => {
        temporizadorFundido = null;
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

