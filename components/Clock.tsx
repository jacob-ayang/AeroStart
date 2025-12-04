import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';

interface ClockProps {
  showSeconds?: boolean;
  use24HourFormat?: boolean;
}

const Clock: React.FC<ClockProps> = ({ showSeconds = true, use24HourFormat = true }) => {
  const [time, setTime] = useState(new Date());
  const { language } = useTranslation();

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const rawHours = time.getHours();
  const rawMinutes = time.getMinutes();
  const rawSeconds = time.getSeconds();

  let displayHours = rawHours;
  let ampm = '';

  if (!use24HourFormat) {
    displayHours = rawHours % 12 || 12; // Convert 0 to 12
    ampm = rawHours >= 12 ? 'PM' : 'AM';
  }

  const hoursStr = displayHours.toString().padStart(2, '0');
  const minutesStr = rawMinutes.toString().padStart(2, '0');
  const secondsStr = rawSeconds.toString().padStart(2, '0');

  return (
    <div className="flex flex-col items-center select-none text-white drop-shadow-2xl">
      <div className="flex items-baseline font-light tracking-tight">
        {/* Hours */}
        <span className="text-5xl md:text-6xl lg:text-7xl font-sans font-extralight tracking-tighter tabular-nums text-white/95">
          {hoursStr}
        </span>

        {/* Separator */}
        <span className="text-4xl md:text-5xl lg:text-6xl px-2 md:px-4 text-white/60 animate-pulse -translate-y-1 md:-translate-y-2">
          :
        </span>

        {/* Minutes */}
        <span className="text-5xl md:text-6xl lg:text-7xl font-sans font-extralight tracking-tighter tabular-nums text-white/95">
          {minutesStr}
        </span>

        {/* Seconds (Optional small display) */}
        {showSeconds && (
          <span className="ml-2 md:ml-3 text-xl md:text-2xl lg:text-3xl font-mono text-white/60 font-light w-12 tabular-nums">
            {secondsStr}
          </span>
        )}

        {/* AM/PM Indicator */}
        {!use24HourFormat && (
           <span className="ml-2 md:ml-3 text-lg md:text-xl font-light text-white/60 self-end mb-2 md:mb-3">
             {ampm}
           </span>
        )}
      </div>

      {/* Date Display */}
      <div className="mt-4 text-lg md:text-xl font-light text-white/70 tracking-widest uppercase">
        {time.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </div>
    </div>
  );
};

export default Clock;