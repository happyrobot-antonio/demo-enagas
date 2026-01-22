import React, { useState, useEffect } from 'react';

export default function LiveIndicator({ interval = 3000, lastUpdate }) {
  const [timeAgo, setTimeAgo] = useState('justo ahora');

  useEffect(() => {
    if (!lastUpdate) return;

    const updateTimeAgo = () => {
      const seconds = Math.floor((Date.now() - new Date(lastUpdate).getTime()) / 1000);
      
      if (seconds < 5) setTimeAgo('justo ahora');
      else if (seconds < 60) setTimeAgo(`hace ${seconds}s`);
      else setTimeAgo(`hace ${Math.floor(seconds / 60)}m`);
    };

    updateTimeAgo();
    const timer = setInterval(updateTimeAgo, 1000);

    return () => clearInterval(timer);
  }, [lastUpdate]);

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="relative">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping" />
      </div>
      <span className="text-gray-600 dark:text-gray-400">
        En vivo • Actualizado {timeAgo}
      </span>
      <span className="text-xs text-gray-500">
        (cada {interval / 1000}s)
      </span>
    </div>
  );
}
