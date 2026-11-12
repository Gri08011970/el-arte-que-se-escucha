
export function crearSonidoEsperanza() {
  const AudioContext =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) {
    throw new Error("Este navegador no admite Web Audio.");
  }

  const contexto = new AudioContext();
  const salida = contexto.createGain();

  salida.gain.value = 0.20;
  salida.connect(contexto.destination);

  let activo = true;
  let detenido = false;
  let fundiendo = false;
  let paso = 0;

  let temporizadorFundido = null;
  let resolverFundido = null;
  let promesaDetencion = null;

  // Melodía luminosa y ascendente.
  const notas = [
    261.63,
    293.66,
    329.63,
    392.0,
    440.0,
    523.25,
    587.33,
    659.25,
    523.25,
    659.25,
    783.99,
    659.25,
  ];

  function tocarNota(
    frecuencia,
    intensidad = 0.18,
    duracion = 2
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
      ahora + 0.25
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

  // Un pequeño brillo musical.
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
      0.10,
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

  function reproducirPaso() {
    if (!activo) return;

    const frecuencia = notas[paso % notas.length];

    // La melodía gana intensidad poco a poco.
    const crecimiento = Math.min(paso / 10, 1);
    const intensidad = 0.08 + crecimiento * 0.15;

    tocarNota(frecuencia, intensidad);

    // La armonía aparece cuando la música
    // comienza a abrirse.
    if (paso >= 4 && paso % 3 === 0) {
      tocarNota(frecuencia / 2, 0.10, 2.5);
    }

    // Los destellos llegan progresivamente.
    if (paso >= 6 && paso % 4 === 0) {
      crearDestello();
    }

    paso++;
  }

  reproducirPaso();

  const intervalo = setInterval(
    reproducirPaso,
    850
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
