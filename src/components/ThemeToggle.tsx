import { useTheme } from "@/contexts/ThemeContext";
export function ThemeToggle() {
  const {
    actualTheme,
    setTheme
  } = useTheme();
  const isDark = actualTheme === 'dark';
  const handleToggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };
  return <div onClick={handleToggle} className={`
        relative w-40 h-20 rounded-full cursor-pointer overflow-hidden
        transition-all duration-1000 ease-in-out
        ${isDark ? 'bg-gradient-to-b from-[#0d1b2a] to-[#1b263b]' : 'bg-gradient-to-b from-[#87ceeb] to-[#4682b4]'}
      `}>
      {/* Sun */}
      <div className={`
          absolute top-[20%] left-[20%] w-10 h-10 
          bg-[#ffd700] rounded-full
          shadow-[0_0_20px_#ffd700]
          transition-all duration-1000 ease-in-out
          ${isDark ? 'opacity-0 -translate-y-8' : 'opacity-100 translate-y-0'}
        `} />

      {/* Moon */}
      <div className={`
          absolute top-[20%] left-[20%] w-10 h-10 
          bg-[#f0f0f0] rounded-full
          shadow-[inset_-10px_-10px_0px_#c0c0c0]
          transition-all duration-1000 ease-in-out
          ${isDark ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        `} />

      {/* Stars */}
      <div className={`
          absolute top-[10%] left-[60%] w-1 h-1 
          bg-white rounded-full
          shadow-[0_0_3px_white]
          transition-opacity duration-1000 ease-in-out
          ${isDark ? 'opacity-100' : 'opacity-0'}
        `} />

      {/* Star Cluster */}
      <div className={`
          absolute top-[40%] left-[70%] w-1 h-1 
          bg-white rounded-full
          shadow-[1em_1em_white,_-1em_-1em_white,_1.5em_-0.5em_white]
          transition-opacity duration-1000 ease-in-out
          ${isDark ? 'opacity-100' : 'opacity-0'}
        `} />

      {/* Shooting Star */}
      

      {/* Comet */}
      <div className={`
          absolute top-[70%] left-[30%] w-1.5 h-1.5 
          bg-white rounded-full
          shadow-[-1em_0.2em_10px_rgba(255,255,255,0.7)]
          transition-opacity duration-1000 ease-in-out
          ${isDark ? 'opacity-100' : 'opacity-0'}
        `} />

      {/* Meteor */}
      <div className={`
          absolute top-[20%] right-[20%] w-1 h-1 
          bg-white rounded-full
          shadow-[-1em_0.5em_8px_rgba(255,255,255,0.6)]
          transition-opacity duration-1000 ease-in-out
          ${isDark ? 'opacity-100' : 'opacity-0'}
        `} />

      {/* Aurora */}
      <div className={`
          absolute bottom-0 w-full h-8 
          bg-gradient-to-t from-[rgba(0,255,150,0.4)] to-transparent
          transition-opacity duration-1000 ease-in-out
          ${isDark ? 'opacity-100' : 'opacity-0'}
        `} />

      {/* Clouds */}
      
    </div>;
}