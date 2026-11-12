
export function crearSonidoVida() {
  const AudioContext =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) {
    throw new Error("Este navegador no admite Web Audio.");
  }

  const contexto = new AudioContext();

  // Control general del volumen.
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

  // Notas delicadas, con un carácter contemplativo.
  const notas = [
    261.63,
    329.63,
    392.0,
    440.0,
    392.0,
    329.63,
    293.66,
    261.63,
  ];

  // Una nota suave que aparece y se desvanece.
  function tocarNota(frecuencia, intensidad = 0.18) {
    if (!activo || contexto.state === "closed") return;

    const ahora = contexto.currentTime;

    const oscilador = contexto.createOscillator();
    const ganancia = contexto.createGain();

    oscilador.type = "sine";
    oscilador.frequency.value = frecuencia;

    // Entrada gradual.
    ganancia.gain.setValueAtTime(0.0001, ahora);
    ganancia.gain.exponentialRampToValueAtTime(
      intensidad,
      ahora + 0.55
    );

    // Salida lenta y delicada.
    ganancia.gain.exponentialRampToValueAtTime(
      0.0001,
      ahora + 3.8
    );

    oscilador.connect(ganancia);
    ganancia.connect(salida);

    oscilador.start(ahora);
    oscilador.stop(ahora + 3.9);
  }

  // Destellos suaves que simbolizan
  // pequeños momentos de belleza.
  function crearDestello() {
    if (!activo || contexto.state === "closed") return;

    const ahora = contexto.currentTime;

    const oscilador = contexto.createOscillator();
    const ganancia = contexto.createGain();

    const frecuencias = [
      523.25,
      659.25,
      783.99,
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
      ahora + 0.2
    );

    ganancia.gain.exponentialRampToValueAtTime(
      0.0001,
      ahora + 1.8
    );

    oscilador.connect(ganancia);
    ganancia.connect(salida);

    oscilador.start(ahora);
    oscilador.stop(ahora + 1.9);
  }

  // Cada paso representa un instante distinto.
  function reproducirPaso() {
    if (!activo) return;

    const frecuencia = notas[paso % notas.length];

    tocarNota(frecuencia);

    // Algunas notas se acompañan con una
    // segunda voz, como flores que conviven.
    if (paso % 3 === 0) {
      tocarNota(frecuencia / 2, 0.08);
    }

    // Los destellos no aparecen siempre:
    // dejamos espacio para respirar.
    if (paso > 0 && paso % 4 === 0) {
      crearDestello();
    }

    paso++;
  }

  reproducirPaso();

  // Ritmo pausado y contemplativo.
  const intervalo = setInterval(
    reproducirPaso,
    1800
  );

  // Detiene la música y libera los recursos.
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

  // Despedida gradual de 1,5 segundos.
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
