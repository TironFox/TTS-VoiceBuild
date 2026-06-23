/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  isPlaying: boolean;
  visualData?: Uint8Array;
  color?: string;
  height?: number;
}

export function AudioWaveform({
  isPlaying,
  visualData,
  color = '#06b6d4', // cyan-500
  height = 80,
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let fallbackOffset = 0;

    const render = () => {
      const width = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, width, h);

      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = color;

      const barCount = 44;
      const barWidth = width / barCount - 2;

      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + 2);
        let barHeight = 6; // idle default

        if (isPlaying) {
          if (visualData && visualData.length > 0) {
            // Map real-time frequency data
            const index = Math.floor((i / barCount) * visualData.length);
            const value = visualData[index] || 0;
            barHeight = (value / 255) * (h - 10) + 6;
          } else {
            // Smooth animated fallback wave using sine wave
            const wave = Math.sin((i * 0.2) + fallbackOffset);
            const noise = Math.cos((i * 0.4) - fallbackOffset * 0.5) * 0.3;
            barHeight = Math.abs(wave + noise) * (h - 20) + 6;
          }
        }

        // Clip barHeight limits
        barHeight = Math.min(h - 4, Math.max(6, barHeight));

        const y = (h - barHeight) / 2;

        ctx.strokeStyle = color;
        // Create an attractive color gradient for active peaks
        if (isPlaying) {
          const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          gradient.addColorStop(0, color);
          gradient.addColorStop(1, '#3b82f6'); // blue-500 blend
          ctx.strokeStyle = gradient;
        }

        ctx.beginPath();
        ctx.moveTo(x + barWidth / 2, y);
        ctx.lineTo(x + barWidth / 2, y + barHeight);
        ctx.stroke();
      }

      fallbackOffset += 0.15;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, visualData, color]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-slate-950/20 p-2 border border-slate-800/40">
      <canvas
        ref={canvasRef}
        width={360}
        height={height}
        className="w-full h-full block"
      />
    </div>
  );
}
