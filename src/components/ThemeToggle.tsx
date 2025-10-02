import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  const { actualTheme, setTheme } = useTheme();
  const isDark = actualTheme === 'dark';

  const handleToggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <div 
      onClick={handleToggle}
      className={`
        relative w-40 h-20 rounded-full cursor-pointer overflow-hidden
        transition-all duration-1000 ease-in-out
        ${isDark 
          ? 'bg-gradient-to-b from-[#0d1b2a] to-[#1b263b]' 
          : 'bg-gradient-to-b from-[#87ceeb] to-[#4682b4]'
        }
      `}
    >
      {/* Stars */}
      <div 
        className={`
          absolute top-[10%] left-[60%] w-1 h-1 
          bg-white rounded-full
          shadow-[0_0_3px_white]
          transition-opacity duration-1000 ease-in-out
          ${isDark ? 'opacity-100' : 'opacity-0'}
        `}
      />

      {/* Star Cluster */}
      <div 
        className={`
          absolute top-[40%] left-[70%] w-1 h-1 
          bg-white rounded-full
          shadow-[1em_1em_white,_-1em_-1em_white,_1.5em_-0.5em_white]
          transition-opacity duration-1000 ease-in-out
          ${isDark ? 'opacity-100' : 'opacity-0'}
        `}
      />

      {/* Shooting Star */}
      <div 
        className={`
          absolute top-[30%] left-[10%] w-0.5 h-0.5 
          bg-transparent
          border-l-[1.5em] border-l-white
          -rotate-20
          transition-opacity duration-1000 ease-in-out
          ${isDark ? 'opacity-100' : 'opacity-0'}
        `}
      />

      {/* Comet */}
      <div 
        className={`
          absolute top-[70%] left-[30%] w-1.5 h-1.5 
          bg-white rounded-full
          shadow-[-1em_0.2em_10px_rgba(255,255,255,0.7)]
          transition-opacity duration-1000 ease-in-out
          ${isDark ? 'opacity-100' : 'opacity-0'}
        `}
      />

      {/* Meteor */}
      <div 
        className={`
          absolute top-[20%] right-[20%] w-1 h-1 
          bg-white rounded-full
          shadow-[-1em_0.5em_8px_rgba(255,255,255,0.6)]
          transition-opacity duration-1000 ease-in-out
          ${isDark ? 'opacity-100' : 'opacity-0'}
        `}
      />

      {/* Aurora */}
      <div 
        className={`
          absolute bottom-0 w-full h-8 
          bg-gradient-to-t from-[rgba(0,255,150,0.4)] to-transparent
          transition-opacity duration-1000 ease-in-out
          ${isDark ? 'opacity-100' : 'opacity-0'}
        `}
      />

      {/* Clouds */}
      <div 
        className={`
          absolute bottom-[10%] left-[10%] w-16 h-8 
          bg-white rounded-full
          shadow-[2em_0_#fff,_-2em_0_#fff]
          transition-opacity duration-1000 ease-in-out
          ${isDark ? 'opacity-0' : 'opacity-90'}
        `}
      />
    </div>
  );
}
