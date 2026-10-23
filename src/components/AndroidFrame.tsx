import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Volume2, Maximize2, RotateCcw } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  onResetApp?: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({ children, onResetApp }) => {
  const [time, setTime] = useState<string>('9:41');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTime(
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative mx-auto flex flex-col items-center">
      {/* Outer Phone Shell */}
      <div className="relative w-[380px] sm:w-[410px] h-[820px] bg-slate-900 rounded-[52px] p-[10px] shadow-2xl ring-1 ring-slate-800 shadow-slate-950/40">
        
        {/* Hardware side buttons */}
        <div className="absolute -left-[14px] top-28 w-[4px] h-12 bg-slate-700 rounded-l-md" />
        <div className="absolute -left-[14px] top-44 w-[4px] h-12 bg-slate-700 rounded-l-md" />
        <div className="absolute -right-[14px] top-36 w-[4px] h-16 bg-slate-700 rounded-r-md" />

        {/* Screen Bezel */}
        <div className="relative w-full h-full bg-slate-950 rounded-[44px] overflow-hidden flex flex-col border border-slate-800/80">
          
          {/* Status Bar */}
          <div className="relative z-30 h-11 w-full flex items-center justify-between px-7 pt-2 select-none text-white text-xs font-medium">
            <span className="font-semibold tracking-tight">{time}</span>

            {/* Front Camera Punch-hole */}
            <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-4 h-4 bg-black rounded-full ring-2 ring-slate-800/70 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
            </div>

            {/* Status Icons */}
            <div className="flex items-center gap-2 text-slate-200">
              <Wifi className="w-3.5 h-3.5" />
              <div className="text-[10px] font-bold">5G</div>
              <Battery className="w-4 h-4" />
            </div>
          </div>

          {/* Android App Content Canvas */}
          <div className="relative flex-1 w-full overflow-hidden bg-slate-50 dark:bg-slate-950 flex flex-col">
            {children}
          </div>

          {/* Android Gesture Bar */}
          <div className="relative z-30 h-5 w-full flex items-center justify-center bg-slate-900/40 backdrop-blur-xs select-none">
            <div className="w-32 h-1 bg-slate-400/60 rounded-full" />
          </div>
        </div>
      </div>

      {/* Frame Quick Helper Controls */}
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
        <span>Google Pixel 9 Pro Emulation</span>
        <span aria-hidden="true">·</span>
        <span>Material You 3.0</span>
        {onResetApp && (
          <>
            <span aria-hidden="true">·</span>
            <button
              onClick={onResetApp}
              className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium cursor-pointer"
            >
              Reset Session
            </button>
          </>
        )}
      </div>
    </div>
  );
};
