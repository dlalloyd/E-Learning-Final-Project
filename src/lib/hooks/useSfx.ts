'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Synthesised sound effects using Web Audio API.
 * No external audio files needed. Each effect is a short tonal sequence
 * designed to feel satisfying without being intrusive.
 */

type SfxName = 'correct' | 'incorrect' | 'levelup' | 'complete' | 'click';

const STORAGE_KEY = 'gm_sfx_muted';

function playTone(
  ctx: AudioContext,
  freq: number,
  duration: number,
  startTime: number,
  type: OscillatorType = 'sine',
  volume = 0.15
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

const SFX_PLAYERS: Record<SfxName, (ctx: AudioContext) => void> = {
  correct: (ctx) => {
    const t = ctx.currentTime;
    playTone(ctx, 523.25, 0.12, t, 'sine', 0.12);       // C5
    playTone(ctx, 659.25, 0.12, t + 0.08, 'sine', 0.12); // E5
    playTone(ctx, 783.99, 0.18, t + 0.16, 'sine', 0.1);  // G5
  },
  incorrect: (ctx) => {
    const t = ctx.currentTime;
    playTone(ctx, 311.13, 0.15, t, 'triangle', 0.1);     // Eb4
    playTone(ctx, 277.18, 0.2, t + 0.1, 'triangle', 0.08); // Db4
  },
  levelup: (ctx) => {
    const t = ctx.currentTime;
    playTone(ctx, 523.25, 0.1, t, 'sine', 0.1);
    playTone(ctx, 659.25, 0.1, t + 0.1, 'sine', 0.1);
    playTone(ctx, 783.99, 0.1, t + 0.2, 'sine', 0.1);
    playTone(ctx, 1046.5, 0.25, t + 0.3, 'sine', 0.12);  // C6
  },
  complete: (ctx) => {
    const t = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      playTone(ctx, freq, 0.15, t + i * 0.12, 'sine', 0.1);
    });
  },
  click: (ctx) => {
    const t = ctx.currentTime;
    playTone(ctx, 800, 0.04, t, 'square', 0.05);
  },
};

export function useSfx() {
  const [muted, setMuted] = useState(true); // default muted until loaded from storage
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setMuted(stored === '1');
  }, []);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return ctxRef.current;
  }, []);

  const play = useCallback((name: SfxName) => {
    if (muted) return;
    try {
      const ctx = getCtx();
      if (ctx.state === 'suspended') ctx.resume();
      SFX_PLAYERS[name]?.(ctx);
    } catch {
      // Audio not available
    }
  }, [muted, getCtx]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  }, []);

  return { play, muted, toggleMute };
}
