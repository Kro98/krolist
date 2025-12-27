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

// Simplex noise implementation for organic patterns
const simplex = (() => {
  const grad3 = [
    [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
    [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
    [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
  ];
  
  const perm = new Array(512);
  const p = [151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
    140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148,
    247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32,
    57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
    74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122,
    60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54,
    65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169,
    200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64,
    52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212,
    207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213,
    119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
    129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104,
    218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241,
    81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
    184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93,
    222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];
  
  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255];
  }
  
  const dot = (g: number[], x: number, y: number) => g[0] * x + g[1] * y;
  
  return (xin: number, yin: number): number => {
    const F2 = 0.5 * (Math.sqrt(3) - 1);
    const G2 = (3 - Math.sqrt(3)) / 6;
    
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = xin - X0;
    const y0 = yin - Y0;
    
    let i1, j1;
    if (x0 > y0) { i1 = 1; j1 = 0; }
    else { i1 = 0; j1 = 1; }
    
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    
    const ii = i & 255;
    const jj = j & 255;
    const gi0 = perm[ii + perm[jj]] % 12;
    const gi1 = perm[ii + i1 + perm[jj + j1]] % 12;
    const gi2 = perm[ii + 1 + perm[jj + 1]] % 12;
    
    let n0 = 0, n1 = 0, n2 = 0;
    
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      t0 *= t0;
      n0 = t0 * t0 * dot(grad3[gi0], x0, y0);
    }
    
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      t1 *= t1;
      n1 = t1 * t1 * dot(grad3[gi1], x1, y1);
    }
    
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      t2 *= t2;
      n2 = t2 * t2 * dot(grad3[gi2], x2, y2);
    }
    
    return 70 * (n0 + n1 + n2);
  };
})();

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

    // Enhanced blue noise-like dither matrix (16x16 for smoother gradients)
    const ditherMatrix = [
      [0, 128, 32, 160, 8, 136, 40, 168, 2, 130, 34, 162, 10, 138, 42, 170],
      [192, 64, 224, 96, 200, 72, 232, 104, 194, 66, 226, 98, 202, 74, 234, 106],
      [48, 176, 16, 144, 56, 184, 24, 152, 50, 178, 18, 146, 58, 186, 26, 154],
      [240, 112, 208, 80, 248, 120, 216, 88, 242, 114, 210, 82, 250, 122, 218, 90],
      [12, 140, 44, 172, 4, 132, 36, 164, 14, 142, 46, 174, 6, 134, 38, 166],
      [204, 76, 236, 108, 196, 68, 228, 100, 206, 78, 238, 110, 198, 70, 230, 102],
      [60, 188, 28, 156, 52, 180, 20, 148, 62, 190, 30, 158, 54, 182, 22, 150],
      [252, 124, 220, 92, 244, 116, 212, 84, 254, 126, 222, 94, 246, 118, 214, 86],
      [3, 131, 35, 163, 11, 139, 43, 171, 1, 129, 33, 161, 9, 137, 41, 169],
      [195, 67, 227, 99, 203, 75, 235, 107, 193, 65, 225, 97, 201, 73, 233, 105],
      [51, 179, 19, 147, 59, 187, 27, 155, 49, 177, 17, 145, 57, 185, 25, 153],
      [243, 115, 211, 83, 251, 123, 219, 91, 241, 113, 209, 81, 249, 121, 217, 89],
      [15, 143, 47, 175, 7, 135, 39, 167, 13, 141, 45, 173, 5, 133, 37, 165],
      [207, 79, 239, 111, 199, 71, 231, 103, 205, 77, 237, 109, 197, 69, 229, 101],
      [63, 191, 31, 159, 55, 183, 23, 151, 61, 189, 29, 157, 53, 181, 21, 149],
      [255, 127, 223, 95, 247, 119, 215, 87, 253, 125, 221, 93, 245, 117, 213, 85]
    ];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      // Use lower resolution for performance
      const scale = 0.5;
      canvas.width = Math.floor(rect.width * scale);
      canvas.height = Math.floor(rect.height * scale);
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

      const t = disableAnimation ? 0 : (timestamp - startTime) * waveSpeed * 0.001;

      let k = 0;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const nx = x / w;
          const ny = y / h;
          
          // Multi-layered organic pattern using simplex noise
          const noise1 = simplex(nx * 4 * waveFrequency + t * 0.3, ny * 4 * waveFrequency + t * 0.2);
          const noise2 = simplex(nx * 8 * waveFrequency - t * 0.15, ny * 8 * waveFrequency + t * 0.1) * 0.5;
          const noise3 = simplex(nx * 16 * waveFrequency + t * 0.08, ny * 16 * waveFrequency - t * 0.05) * 0.25;
          
          // Flowing wave pattern
          const wave1 = Math.sin(nx * Math.PI * 3 + ny * Math.PI * 2 + t * 0.5) * waveAmplitude;
          const wave2 = Math.cos(nx * Math.PI * 2 - ny * Math.PI * 4 + t * 0.3) * waveAmplitude * 0.5;
          
          // Radial gradient from center
          const cx = nx - 0.5;
          const cy = ny - 0.5;
          const radial = 1 - Math.sqrt(cx * cx + cy * cy) * 1.2;
          
          // Combine all patterns
          let brightness = (noise1 + noise2 + noise3 + wave1 + wave2) * 0.3 + radial * 0.4 + 0.5;

          // Mouse interaction - creates a glowing ripple effect
          if (enableMouseInteraction) {
            const dx = nx - mouseRef.current.x;
            const dy = ny - mouseRef.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < mouseRadius) {
              const ripple = Math.sin((mouseRadius - dist) * 20 - t * 3) * 0.15;
              brightness += (1 - dist / mouseRadius) * 0.4 + ripple;
            }
          }

          // Clamp and quantize brightness
          brightness = Math.max(0, Math.min(1, brightness));
          brightness = Math.floor(brightness * colorNum) / colorNum;

          // Enhanced dithering with the 16x16 matrix
          const threshold = ditherMatrix[y % 16][x % 16] / 256;
          const dithered = brightness + (threshold - 0.5) * (1 / colorNum);
          const v = dithered > 0.5 ? 255 : 0;

          // Apply wave color with slight color variation
          const colorShift = (noise1 * 0.1 + 1);
          data[k++] = Math.floor(v * waveColor[0] * colorShift); // R
          data[k++] = Math.floor(v * waveColor[1] * colorShift); // G
          data[k++] = Math.floor(v * waveColor[2] * colorShift); // B
          data[k++] = 50; // Alpha (semi-transparent)
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
        imageRendering: 'pixelated',
      }}
    />
  );
});

export default DitherBackground;
