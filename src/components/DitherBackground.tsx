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

      const t = disableAnimation ? 0 : (timestamp - startTime) * waveSpeed * 0.001;

      ctx.fillStyle = 'rgba(0, 0, 0, 0)';
      ctx.clearRect(0, 0, w, h);

      // Hexagon grid parameters
      const hexSize = 20 + waveFrequency * 5;
      const hexHeight = hexSize * Math.sqrt(3);
      const hexWidth = hexSize * 2;
      
      const cols = Math.ceil(w / (hexWidth * 0.75)) + 2;
      const rows = Math.ceil(h / hexHeight) + 2;

      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          const offsetX = (row % 2) * (hexWidth * 0.375);
          const cx = col * hexWidth * 0.75 + offsetX;
          const cy = row * hexHeight * 0.5;

          // Distance from center for radial effect
          const dx = cx - w / 2;
          const dy = cy - h / 2;
          const distFromCenter = Math.sqrt(dx * dx + dy * dy);
          
          // Animated pulse based on distance and time
          const pulse = Math.sin(distFromCenter * 0.015 - t * 2) * waveAmplitude;
          
          // Wave traveling diagonally
          const diagonalWave = Math.sin((cx + cy) * 0.01 * waveFrequency + t * 1.5) * waveAmplitude;
          
          // Combined brightness
          let brightness = 0.3 + pulse * 0.4 + diagonalWave * 0.3;

          // Mouse interaction
          if (enableMouseInteraction) {
            const mx = mouseRef.current.x * w;
            const my = mouseRef.current.y * h;
            const mouseDist = Math.sqrt((cx - mx) ** 2 + (cy - my) ** 2);
            const mouseEffect = Math.max(0, 1 - mouseDist / (mouseRadius * w));
            brightness += mouseEffect * 0.5;
          }

          brightness = Math.max(0.05, Math.min(0.8, brightness));
          
          // Quantize for dither effect
          brightness = Math.floor(brightness * colorNum) / colorNum;

          // Draw hexagon
          const scale = 0.85 + pulse * 0.1;
          const size = hexSize * scale * 0.5;
          
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const hx = cx + size * Math.cos(angle);
            const hy = cy + size * Math.sin(angle);
            if (i === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();

          // Fill with color
          const r = Math.floor(255 * waveColor[0] * brightness);
          const g = Math.floor(255 * waveColor[1] * brightness);
          const b = Math.floor(255 * waveColor[2] * brightness);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.15)`;
          ctx.fill();
          
          // Stroke for structure
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.25)`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      
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
