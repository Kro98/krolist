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
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Bayer 8x8 dither matrix for classic dither look
    const bayer8x8 = [
      [0, 32, 8, 40, 2, 34, 10, 42],
      [48, 16, 56, 24, 50, 18, 58, 26],
      [12, 44, 4, 36, 14, 46, 6, 38],
      [60, 28, 52, 20, 62, 30, 54, 22],
      [3, 35, 11, 43, 1, 33, 9, 41],
      [51, 19, 59, 27, 49, 17, 57, 25],
      [15, 47, 7, 39, 13, 45, 5, 37],
      [63, 31, 55, 23, 61, 29, 53, 21]
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
          // Layered wave pattern - creates flowing diagonal stripes
          const wave1 = Math.sin((x + y) * 0.02 * waveFrequency + t * 0.003) * waveAmplitude;
          const wave2 = Math.sin((x - y) * 0.015 * waveFrequency + t * 0.002) * waveAmplitude * 0.7;
          const wave3 = Math.sin(x * 0.025 * waveFrequency + t * 0.004) * waveAmplitude * 0.5;
          const wave4 = Math.cos(y * 0.02 * waveFrequency - t * 0.0025) * waveAmplitude * 0.4;
          
          // Circular ripple from center
          const cx = x - w / 2;
          const cy = y - h / 2;
          const dist = Math.sqrt(cx * cx + cy * cy);
          const ripple = Math.sin(dist * 0.03 * waveFrequency - t * 0.002) * waveAmplitude * 0.6;

          let brightness = (wave1 + wave2 + wave3 + wave4 + ripple + 1) * 0.5;

          // Mouse interaction - creates expanding glow
          if (enableMouseInteraction) {
            const dx = x / w - mouseRef.current.x;
            const dy = y / h - mouseRef.current.y;
            const mouseDist = Math.sqrt(dx * dx + dy * dy);
            if (mouseDist < mouseRadius) {
              brightness += (1 - mouseDist / mouseRadius) * 0.4;
            }
          }

          // Clamp and quantize
          brightness = Math.max(0, Math.min(1, brightness));
          brightness = Math.floor(brightness * colorNum) / colorNum;

          // Classic Bayer dithering
          const threshold = bayer8x8[y % 8][x % 8] / 64;
          const v = brightness > threshold ? 255 : 0;

          // Apply color
          data[k++] = Math.floor(v * waveColor[0]);
          data[k++] = Math.floor(v * waveColor[1]);
          data[k++] = Math.floor(v * waveColor[2]);
          data[k++] = 45; // Alpha
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
