
export function crearSonidoLibertad() {
  const AudioContext =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) {
    throw new Error("Este navegador no admite Web Audio.");
  }

  const contexto = new AudioContext();

  const salida = contexto.createGain();
  salida.gain.value = 0.12;
  salida.connect(contexto.destination);

  let activo = true;
  let detenido = false;
  let fundiendo = false;
  let paso = 0;

  let temporizadorFundido = null;
  let resolverFundido = null;
  let promesaDetencion = null;

  // Melodía ascendente: representa el vuelo.
  const notas = [
    196.0,
    261.63,
    329.63,
    392.0,
    440.0,
    523.25,
    587.33,
    659.25,
    783.99,
    659.25,
    587.33,
    523.25,
  ];

  // Fondo grave: la quietud de la ciudad.
  const fondo = contexto.createOscillator();
  const fondoGanancia = contexto.createGain();

  fondo.type = "sine";
  fondo.frequency.value = 98;

  fondoGanancia.gain.value = 0.10;

  fondo.connect(fondoGanancia);
  fondoGanancia.connect(salida);

  fondo.start();

  // Una nota que aparece suavemente
  // y desaparece como un movimiento de alas.
  function tocarNota(frecuencia, intensidad) {
    if (!activo || contexto.state === "closed") return;

    const ahora = contexto.currentTime;

    const oscilador = contexto.createOscillator();
    const ganancia = contexto.createGain();

    oscilador.type = "sine";
    oscilador.frequency.value = frecuencia;

    ganancia.gain.setValueAtTime(0.0001, ahora);

    ganancia.gain.exponentialRampToValueAtTime(
      intensidad,
      ahora + 0.25
    );

    ganancia.gain.exponentialRampToValueAtTime(
      0.0001,
      ahora + 2.2
    );

    oscilador.connect(ganancia);
    ganancia.connect(salida);

    oscilador.start(ahora);
    oscilador.stop(ahora + 2.25);
  }

  // Un pequeño destello sonoro que evoca
  // el aire y la amplitud del cielo.
  function crearDestello() {
    if (!activo || contexto.state === "closed") return;

    const ahora = contexto.currentTime;

    const oscilador = contexto.createOscillator();
    const ganancia = contexto.createGain();

    const frecuencias = [
      783.99,
      880.0,
      987.77,
      1046.5,
    ];

    const frecuencia =
      frecuencias[
        Math.floor(Math.random() * frecuencias.length)
      ];

    oscilador.type = "sine";
    oscilador.frequency.value = frecuencia;

    ganancia.gain.setValueAtTime(0.0001, ahora);

    ganancia.gain.exponentialRampToValueAtTime(
      0.12,
      ahora + 0.15
    );

    ganancia.gain.exponentialRampToValueAtTime(
      0.0001,
      ahora + 1.5
    );

    oscilador.connect(ganancia);
    ganancia.connect(salida);

    oscilador.start(ahora);
    oscilador.stop(ahora + 1.55);
  }

  // La composición comienza contenida
  // y gradualmente se vuelve más luminosa.
  function reproducirPaso() {
    if (!activo) return;

    const frecuencia = notas[paso % notas.length];

    // La intensidad aumenta suavemente
    // durante los primeros pasos.
    const crecimiento = Math.min(paso / 8, 1);

    const intensidad = 0.10 + crecimiento * 0.13;

    tocarNota(frecuencia, intensidad);

    // Al avanzar la melodía, aparecen
    // notas adicionales que sugieren amplitud.
    if (paso >= 4 && paso % 3 === 0) {
      tocarNota(frecuencia / 2, 0.10);
    }

    if (paso >= 6 && paso % 4 === 0) {
      crearDestello();
    }

    paso++;
  }

  reproducirPaso();

  const intervalo = setInterval(
    reproducirPaso,
    750
  );

  // Detención inmediata y limpieza de recursos.
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

  // Fundido de 1,5 segundos, igual que
  // las otras estaciones de la galería.
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
