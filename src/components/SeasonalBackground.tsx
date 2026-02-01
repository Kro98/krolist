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

    // Particle system for both themes
    interface Particle {
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;
      rotation: number;
      rotationSpeed: number;
      type: string;
    }

    const particles: Particle[] = [];
    const particleCount = activeTheme === 'ramadan' ? 30 : 50;

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 15 + 5,
        speedY: activeTheme === 'ramadan' 
          ? -(Math.random() * 0.3 + 0.1) // Stars rise slowly
          : Math.random() * 0.5 + 0.2, // Confetti falls
        speedX: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.3,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        type: activeTheme === 'ramadan' 
          ? ['star', 'crescent', 'lantern'][Math.floor(Math.random() * 3)]
          : ['confetti', 'star', 'circle'][Math.floor(Math.random() * 3)]
      });
    }

    const drawStar = (x: number, y: number, size: number, opacity: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const px = Math.cos(angle) * size;
        const py = Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = activeTheme === 'ramadan' 
        ? `rgba(255, 215, 0, ${opacity})` // Gold for Ramadan
        : `rgba(255, 200, 100, ${opacity})`; // Warm gold for Eid
      ctx.fill();
      ctx.restore();
    };

    const drawCrescent = (x: number, y: number, size: number, opacity: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 215, 0, ${opacity})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(size * 0.3, -size * 0.1, size * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = activeTheme === 'ramadan' 
        ? 'rgba(15, 23, 42, 1)' // Dark background color
        : 'rgba(30, 41, 59, 1)';
      ctx.fill();
      ctx.restore();
    };

    const drawLantern = (x: number, y: number, size: number, opacity: number) => {
      ctx.save();
      ctx.translate(x, y);
      
      // Lantern body
      ctx.beginPath();
      ctx.moveTo(-size * 0.3, -size * 0.5);
      ctx.quadraticCurveTo(-size * 0.5, 0, -size * 0.3, size * 0.5);
      ctx.lineTo(size * 0.3, size * 0.5);
      ctx.quadraticCurveTo(size * 0.5, 0, size * 0.3, -size * 0.5);
      ctx.closePath();
      ctx.fillStyle = `rgba(255, 140, 0, ${opacity})`;
      ctx.fill();
      
      // Glow effect
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
      gradient.addColorStop(0, `rgba(255, 200, 100, ${opacity * 0.5})`);
      gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    };

    const drawConfetti = (x: number, y: number, size: number, opacity: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.fillStyle = [
        `rgba(255, 99, 132, ${opacity})`,
        `rgba(54, 162, 235, ${opacity})`,
        `rgba(255, 206, 86, ${opacity})`,
        `rgba(75, 192, 192, ${opacity})`,
        `rgba(153, 102, 255, ${opacity})`,
        `rgba(255, 159, 64, ${opacity})`,
      ][Math.floor(Math.random() * 6)];
      ctx.fillRect(-size / 2, -size / 4, size, size / 2);
      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        // Update position
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;

        // Wrap around screen
        if (activeTheme === 'ramadan') {
          if (p.y < -20) {
            p.y = canvas.height + 20;
            p.x = Math.random() * canvas.width;
          }
        } else {
          if (p.y > canvas.height + 20) {
            p.y = -20;
            p.x = Math.random() * canvas.width;
          }
        }

        if (p.x < -20) p.x = canvas.width + 20;
        if (p.x > canvas.width + 20) p.x = -20;

        // Draw based on type
        switch (p.type) {
          case 'star':
            drawStar(p.x, p.y, p.size, p.opacity, p.rotation);
            break;
          case 'crescent':
            drawCrescent(p.x, p.y, p.size, p.opacity, p.rotation);
            break;
          case 'lantern':
            drawLantern(p.x, p.y, p.size, p.opacity);
            break;
          case 'confetti':
            drawConfetti(p.x, p.y, p.size, p.opacity, p.rotation);
            break;
          case 'circle':
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 215, 0, ${p.opacity})`;
            ctx.fill();
            break;
        }
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
      style={{ opacity: 0.6 }}
    />
  );
});

export default SeasonalBackground;
