export type AmbienceId = "cafe_rain" | "lofi" | "library" | "silence";

function noiseBuffer(ctx: AudioContext, seconds = 2) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

export function createAmbienceEngine() {
  let ctx: AudioContext | null = null;
  let playing: AudioNode[] = [];
  let source: AudioBufferSourceNode | null = null;

  function disconnect() {
    source?.stop();
    source = null;
    playing.forEach((node) => {
      try {
        node.disconnect();
      } catch {
        /* already disconnected */
      }
    });
    playing = [];
  }

  async function play(id: AmbienceId) {
    if (typeof window === "undefined") return;
    if (id === "silence") {
      disconnect();
      return;
    }
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") await ctx.resume();
    disconnect();

    const master = ctx.createGain();
    master.gain.value = 0.08;
    master.connect(ctx.destination);
    playing.push(master);

    if (id === "lofi") {
      const oscA = ctx.createOscillator();
      const oscB = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.18;
      oscA.type = "triangle";
      oscB.type = "sine";
      oscA.frequency.value = 196;
      oscB.frequency.value = 246.9;
      oscA.connect(gain);
      oscB.connect(gain);
      gain.connect(master);
      oscA.start();
      oscB.start();
      playing.push(oscA, oscB, gain);
      return;
    }

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = id === "library" ? 500 : 1200;
    const bufferSource = ctx.createBufferSource();
    bufferSource.buffer = noiseBuffer(ctx);
    bufferSource.loop = true;
    bufferSource.connect(filter);
    filter.connect(master);
    bufferSource.start();
    source = bufferSource;
    playing.push(filter, bufferSource);
  }

  function stop() {
    disconnect();
  }

  return { play, stop };
}
