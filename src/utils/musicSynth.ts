export interface ChordEvent {
  bassNote?: number;
  notes?: number[];
}

export interface MelodyNote {
  step: number;
  midi: number;
  lengthSteps?: number;
  velocity?: number;
}

export interface MusicScore {
  title?: string;
  scaleName?: string;
  bpm?: number;
  instrument?: string;
  drumStyle?: string;
  durationSeconds?: number;
  lyrics?: string;
  chords?: ChordEvent[];
  melody?: MelodyNote[];
}

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function encodeWavFromBuffer(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(buffer.getChannelData(ch));
  }

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(
        offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true
      );
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function triggerMelodyVoice(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  freq: number,
  startTime: number,
  duration: number,
  velocity: number,
  instrument: string
) {
  const safeDur = Math.max(0.12, duration);
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();

  if (instrument === "krar" || instrument === "guitar") {
    // Plucked string (warm triangle + 2nd harmonic with fast brightness decay)
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(freq, startTime);
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(freq * 2, startTime);

    filter.frequency.setValueAtTime(3200, startTime);
    filter.frequency.exponentialRampToValueAtTime(
      450,
      startTime + Math.min(safeDur, 0.55)
    );

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.28, startTime);
    osc2Gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(velocity * 0.32, startTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + safeDur + 0.25);

    osc1.connect(filter);
    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);
  } else if (instrument === "pad") {
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(freq, startTime);
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(freq * 1.004, startTime);
    filter.frequency.setValueAtTime(1100, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(velocity * 0.16, startTime + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + safeDur + 0.45);

    osc1.connect(filter);
    osc2.connect(filter);
  } else if (instrument === "marimba") {
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(freq, startTime);
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(freq * 4, startTime);
    filter.frequency.setValueAtTime(3600, startTime);

    const hGain = ctx.createGain();
    hGain.gain.setValueAtTime(0.22, startTime);
    hGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.06);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(velocity * 0.34, startTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.45);

    osc1.connect(filter);
    osc2.connect(hGain);
    hGain.connect(filter);
  } else if (instrument === "brass") {
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(freq, startTime);
    osc2.type = "sawtooth";
    osc2.frequency.setValueAtTime(freq * 0.997, startTime);
    filter.frequency.setValueAtTime(600, startTime);
    filter.frequency.linearRampToValueAtTime(2100, startTime + 0.09);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(velocity * 0.2, startTime + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + safeDur + 0.2);

    osc1.connect(filter);
    osc2.connect(filter);
  } else {
    // Warm electric piano default
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(freq, startTime);
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(freq * 2, startTime);
    filter.frequency.setValueAtTime(2400, startTime);

    const overtoneGain = ctx.createGain();
    overtoneGain.gain.setValueAtTime(0.18, startTime);
    overtoneGain.gain.exponentialRampToValueAtTime(0.02, startTime + 0.3);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(velocity * 0.3, startTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + safeDur + 0.35);

    osc1.connect(filter);
    osc2.connect(overtoneGain);
    overtoneGain.connect(filter);
  }

  filter.connect(gain);
  gain.connect(dest);

  osc1.start(startTime);
  osc2.start(startTime);
  osc1.stop(startTime + safeDur + 0.55);
  osc2.stop(startTime + safeDur + 0.55);
}

function triggerChordPad(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  midiNotes: number[],
  startTime: number,
  duration: number
) {
  for (const midi of midiNotes.slice(0, 4)) {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(midiToFreq(midi), startTime);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(850, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(0.075, startTime + 0.15);
    gain.gain.setValueAtTime(0.065, startTime + Math.max(0.2, duration - 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.2);
  }
}

function triggerBass(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  midi: number,
  startTime: number,
  duration: number
) {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(midiToFreq(midi), startTime);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(280, startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(0.24, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

function triggerDrum(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  noiseBuffer: AudioBuffer,
  type: "kick" | "snare" | "hihat",
  startTime: number
) {
  if (type === "kick") {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(135, startTime);
    osc.frequency.exponentialRampToValueAtTime(42, startTime + 0.15);
    gain.gain.setValueAtTime(0.38, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.22);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(startTime);
    osc.stop(startTime + 0.24);
  } else if (type === "snare") {
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1400, startTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.14, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.14);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(startTime);
    noise.stop(startTime + 0.16);
  } else {
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.setValueAtTime(6500, startTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.06, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.05);
    noise.connect(hp);
    hp.connect(gain);
    gain.connect(dest);
    noise.start(startTime);
    noise.stop(startTime + 0.06);
  }
}

export async function synthesizeMusicToWavUrl(
  score: MusicScore
): Promise<string> {
  const sampleRate = 44100;
  const bpm = Math.max(60, Math.min(150, score.bpm ?? 96));
  const stepDuration = 60 / bpm / 2; // 8th-note grid (32 steps = 4 bars)
  const loopDuration = 32 * stepDuration;
  const targetDuration = Math.max(12, Math.min(32, score.durationSeconds ?? 16));
  const numLoops = Math.max(1, Math.round(targetDuration / loopDuration));
  const totalDuration = numLoops * loopDuration + 1.0;

  const ctx = new OfflineAudioContext(
    2,
    Math.ceil(totalDuration * sampleRate),
    sampleRate
  );

  // Master compressor + light stereo echo
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -14;
  compressor.ratio.value = 4;
  compressor.connect(ctx.destination);

  const delay = ctx.createDelay(1.0);
  delay.delayTime.value = stepDuration * 1.5;
  const delayFeedback = ctx.createGain();
  delayFeedback.gain.value = 0.2;
  const delayWet = ctx.createGain();
  delayWet.gain.value = 0.22;

  delay.connect(delayFeedback);
  delayFeedback.connect(delay);
  delay.connect(delayWet);
  delayWet.connect(compressor);

  const masterBus = ctx.createGain();
  masterBus.gain.value = 0.9;
  masterBus.connect(compressor);
  masterBus.connect(delay);

  // Pre-build noise buffer for drums
  const noiseBuffer = ctx.createBuffer(1, sampleRate * 0.3, sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) {
    noiseData[i] = Math.random() * 2 - 1;
  }

  const chords =
    score.chords && score.chords.length > 0
      ? score.chords
      : [
          { bassNote: 45, notes: [57, 60, 64] },
          { bassNote: 41, notes: [53, 57, 60] },
          { bassNote: 48, notes: [60, 64, 67] },
          { bassNote: 43, notes: [55, 59, 62] },
        ];

  const melody =
    score.melody && score.melody.length > 0
      ? score.melody
      : [
          { step: 0, midi: 69, lengthSteps: 3, velocity: 0.8 },
          { step: 4, midi: 72, lengthSteps: 2, velocity: 0.75 },
          { step: 8, midi: 74, lengthSteps: 4, velocity: 0.85 },
          { step: 14, midi: 72, lengthSteps: 2, velocity: 0.7 },
          { step: 16, midi: 69, lengthSteps: 3, velocity: 0.8 },
          { step: 20, midi: 67, lengthSteps: 3, velocity: 0.75 },
          { step: 24, midi: 64, lengthSteps: 4, velocity: 0.8 },
        ];

  const instrument = score.instrument ?? "piano";
  const drumStyle = score.drumStyle ?? "soft";

  for (let loopIdx = 0; loopIdx < numLoops; loopIdx++) {
    const loopStart = loopIdx * loopDuration;
    const stepsPerChord = Math.max(4, Math.floor(32 / chords.length));

    chords.forEach((chord, cIdx) => {
      const chordStart = loopStart + cIdx * stepsPerChord * stepDuration;
      const chordDur = stepsPerChord * stepDuration;
      if (chord.notes && chord.notes.length > 0) {
        triggerChordPad(ctx, masterBus, chord.notes, chordStart, chordDur);
      }
      if (chord.bassNote) {
        triggerBass(ctx, masterBus, chord.bassNote, chordStart, chordDur * 0.85);
        if (stepsPerChord >= 8) {
          triggerBass(
            ctx,
            masterBus,
            chord.bassNote,
            chordStart + chordDur * 0.5,
            chordDur * 0.45
          );
        }
      }
    });

    for (const note of melody) {
      const step = Math.max(0, Math.min(31, note.step));
      const start = loopStart + step * stepDuration;
      const dur = Math.max(1, note.lengthSteps ?? 2) * stepDuration;
      triggerMelodyVoice(
        ctx,
        masterBus,
        midiToFreq(note.midi),
        start,
        dur,
        note.velocity ?? 0.78,
        instrument
      );
    }

    if (drumStyle !== "none") {
      for (let s = 0; s < 32; s++) {
        const t = loopStart + s * stepDuration;
        if (drumStyle === "afro") {
          if (s % 8 === 0 || s % 8 === 3 || s % 8 === 6) {
            triggerDrum(ctx, masterBus, noiseBuffer, "kick", t);
          }
          if (s % 8 === 2 || s % 8 === 5) {
            triggerDrum(ctx, masterBus, noiseBuffer, "snare", t);
          }
          if (s % 2 === 0) {
            triggerDrum(ctx, masterBus, noiseBuffer, "hihat", t);
          }
        } else if (drumStyle === "groove") {
          if (s % 8 === 0 || s % 8 === 3) {
            triggerDrum(ctx, masterBus, noiseBuffer, "kick", t);
          }
          if (s % 8 === 4) {
            triggerDrum(ctx, masterBus, noiseBuffer, "snare", t);
          }
          if (s % 2 === 1) {
            triggerDrum(ctx, masterBus, noiseBuffer, "hihat", t);
          }
        } else {
          if (s % 8 === 0) {
            triggerDrum(ctx, masterBus, noiseBuffer, "kick", t);
          }
          if (s % 8 === 4) {
            triggerDrum(ctx, masterBus, noiseBuffer, "snare", t);
          }
          if (s % 4 === 2) {
            triggerDrum(ctx, masterBus, noiseBuffer, "hihat", t);
          }
        }
      }
    }
  }

  const renderedBuffer = await ctx.startRendering();
  const wavBlob = encodeWavFromBuffer(renderedBuffer);
  return URL.createObjectURL(wavBlob);
}
