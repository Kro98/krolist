import { useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';

interface GeminiGradientBackgroundProps {
  className?: string;
}

const GeminiGradientBackground = memo(function GeminiGradientBackground({
  className = ''
}: GeminiGradientBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width;
    let height = canvas.height;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      width = rect.width;
      height = rect.height;
    };

    resize();
    window.addEventListener('resize', resize);

    // Blob configuration for organic movement
    const blobs = [
      { x: 0.3, y: 0.3, vx: 0.0003, vy: 0.0004, radius: 0.4, hue: 25 },   // Orange/Primary
      { x: 0.7, y: 0.6, vx: -0.0004, vy: 0.0003, radius: 0.35, hue: 330 }, // Pink
      { x: 0.5, y: 0.8, vx: 0.0002, vy: -0.0003, radius: 0.3, hue: 45 },  // Gold
      { x: 0.2, y: 0.7, vx: 0.0003, vy: -0.0002, radius: 0.25, hue: 280 }, // Purple
    ];

    let time = 0;

    const render = () => {
      time += 0.5;

      // Update blob positions with smooth oscillation
      blobs.forEach((blob, i) => {
        blob.x += Math.sin(time * 0.001 + i) * blob.vx;
        blob.y += Math.cos(time * 0.001 + i * 0.5) * blob.vy;
        
        // Keep blobs in bounds with smooth bounce
        if (blob.x < 0.1 || blob.x > 0.9) blob.vx *= -1;
        if (blob.y < 0.1 || blob.y > 0.9) blob.vy *= -1;
      });

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, 'hsl(222, 84%, 5%)');
      gradient.addColorStop(1, 'hsl(217, 33%, 10%)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw illuminated blobs
      blobs.forEach((blob) => {
        const x = blob.x * width;
        const y = blob.y * height;
        const radius = blob.radius * Math.min(width, height);
        
        // Create radial gradient for each blob
        const blobGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        
        // Animated hue shift for dynamic color
        const animatedHue = blob.hue + Math.sin(time * 0.002) * 10;
        
        blobGradient.addColorStop(0, `hsla(${animatedHue}, 85%, 55%, 0.4)`);
        blobGradient.addColorStop(0.4, `hsla(${animatedHue}, 75%, 45%, 0.2)`);
        blobGradient.addColorStop(0.7, `hsla(${animatedHue}, 65%, 35%, 0.1)`);
        blobGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = blobGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Add subtle noise/grain overlay
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 8;
        data[i] = Math.max(0, Math.min(255, data[i] + noise));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
      }
      ctx.putImageData(imageData, 0, 0);

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className={`fixed inset-0 pointer-events-none ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      {/* Soft vignette overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, hsl(222 84% 5% / 0.3) 70%, hsl(222 84% 5% / 0.6) 100%)'
        }}
      />
      {/* Animated glow spots */}
      <motion.div
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(31, 98%, 51%, 0.15) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <motion.div
        animate={{
          opacity: [0.2, 0.5, 0.2],
          scale: [1.1, 0.9, 1.1],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(330, 85%, 55%, 0.12) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />
    </div>
  );
});

export default GeminiGradientBackground;
