import { useEffect, useRef, memo } from 'react';
import { useSeasonalTheme } from '@/contexts/SeasonalThemeContext';

const SeasonalBackground = memo(function SeasonalBackground() {
  const { activeTheme } = useSeasonalTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (activeTheme === 'none') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Minimalist particle system - soft ambient orbs
    interface Particle {
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;
      pulsePhase: number;
      pulseSpeed: number;
    }

    const particles: Particle[] = [];
    // Much fewer particles for a cleaner look
    const particleCount = activeTheme === 'ramadan' ? 12 : 15;

    // Initialize particles spread across the screen
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 4 + 2, // Smaller, subtle sizes
        speedY: activeTheme === 'ramadan' 
          ? -(Math.random() * 0.15 + 0.05) // Very slow rise
          : Math.random() * 0.12 + 0.03, // Very slow fall
        speedX: (Math.random() - 0.5) * 0.1, // Minimal horizontal drift
        opacity: Math.random() * 0.15 + 0.08, // Very subtle opacity
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.01 + 0.005,
      });
    }

    // Ramadan: Warm amber/gold gradient dots
    // Eid: Soft rose/champagne gradient dots
    const getParticleColor = (opacity: number): string => {
      if (activeTheme === 'ramadan') {
        // Soft warm gold - subtle and elegant
        return `rgba(245, 200, 120, ${opacity})`;
      } else {
        // Soft champagne/rose - celebratory but muted
        return `rgba(255, 200, 180, ${opacity})`;
      }
    };

    const drawSoftOrb = (x: number, y: number, size: number, opacity: number) => {
      // Create soft radial gradient for each orb
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
      gradient.addColorStop(0, getParticleColor(opacity));
      gradient.addColorStop(0.4, getParticleColor(opacity * 0.5));
      gradient.addColorStop(1, getParticleColor(0));
      
      ctx.beginPath();
      ctx.arc(x, y, size * 3, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        // Update position - very slow movement
        p.y += p.speedY;
        p.x += p.speedX;
        p.pulsePhase += p.pulseSpeed;

        // Gentle pulsing opacity
        const pulseOpacity = p.opacity * (0.7 + Math.sin(p.pulsePhase) * 0.3);

        // Wrap around screen smoothly
        if (activeTheme === 'ramadan') {
          if (p.y < -30) {
            p.y = canvas.height + 30;
            p.x = Math.random() * canvas.width;
          }
        } else {
          if (p.y > canvas.height + 30) {
            p.y = -30;
            p.x = Math.random() * canvas.width;
          }
        }

        if (p.x < -30) p.x = canvas.width + 30;
        if (p.x > canvas.width + 30) p.x = -30;

        // Draw soft ambient orb
        drawSoftOrb(p.x, p.y, p.size, pulseOpacity);
      });

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [activeTheme]);

  if (activeTheme === 'none') return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.8 }}
    />
  );
});

export default SeasonalBackground;
