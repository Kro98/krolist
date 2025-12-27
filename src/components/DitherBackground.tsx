import { useEffect, useRef, memo } from 'react';

interface DitherBackgroundProps {
  waveColor?: [number, number, number];
  disableAnimation?: boolean;
  enableMouseInteraction?: boolean;
  mouseRadius?: number;
  colorNum?: number;
  waveAmplitude?: number;
  waveFrequency?: number;
  waveSpeed?: number;
}

const DitherBackground = memo(function DitherBackground({
  waveColor = [0.5, 0.5, 0.5],
  disableAnimation = false,
  enableMouseInteraction = false,
  mouseRadius = 0.3,
  colorNum = 4,
  waveAmplitude = 0.3,
  waveFrequency = 3,
  waveSpeed = 0.05
}: DitherBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Bayer matrix for dithering
    const bayer = [
      [0, 48, 12, 60, 3, 51, 15, 63],
      [32, 16, 44, 28, 35, 19, 47, 31],
      [8, 56, 4, 52, 11, 59, 7, 55],
      [40, 24, 36, 20, 43, 27, 39, 23],
      [2, 50, 14, 62, 1, 49, 13, 61],
      [34, 18, 46, 30, 33, 17, 45, 29],
      [10, 58, 6, 54, 9, 57, 5, 53],
      [42, 26, 38, 22, 41, 25, 37, 21],
    ];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      if (!enableMouseInteraction) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height
      };
    };

    if (enableMouseInteraction) {
      canvas.addEventListener('mousemove', handleMouseMove);
    }

    let startTime = performance.now();

    const render = (timestamp: number) => {
      const w = canvas.width;
      const h = canvas.height;
      
      if (w === 0 || h === 0) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      const img = ctx.createImageData(w, h);
      const data = img.data;

      const t = disableAnimation ? 0 : (timestamp - startTime) * waveSpeed;

      let k = 0;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          // Wave pattern
          const wave = Math.sin(x * 0.01 * waveFrequency + t * 0.002) * waveAmplitude + 
                       Math.sin(y * 0.01 * waveFrequency + t * 0.0015) * waveAmplitude;

          let brightness = (wave + 1) * 0.5;

          // Mouse interaction
          if (enableMouseInteraction) {
            const dx = x / w - mouseRef.current.x;
            const dy = y / h - mouseRef.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < mouseRadius) {
              brightness += (1 - dist / mouseRadius) * 0.3;
            }
          }

          // Quantize brightness based on colorNum
          brightness = Math.floor(brightness * colorNum) / colorNum;

          // Dither threshold
          const threshold = bayer[y % 8][x % 8] / 64;
          const v = brightness > threshold ? 255 : 0;

          // Apply wave color
          data[k++] = Math.floor(v * waveColor[0]); // R
          data[k++] = Math.floor(v * waveColor[1]); // G
          data[k++] = Math.floor(v * waveColor[2]); // B
          data[k++] = 40; // Alpha (semi-transparent)
        }
      }

      ctx.putImageData(img, 0, 0);
      
      if (!disableAnimation) {
        animationRef.current = requestAnimationFrame(render);
      }
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      if (enableMouseInteraction) {
        canvas.removeEventListener('mousemove', handleMouseMove);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [waveColor, disableAnimation, enableMouseInteraction, mouseRadius, colorNum, waveAmplitude, waveFrequency, waveSpeed]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
});

export default DitherBackground;
