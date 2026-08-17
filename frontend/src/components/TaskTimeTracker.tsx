import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Calendar } from 'lucide-react';
import { TaskItem } from '../types';

interface TaskTimeTrackerProps {
  task: TaskItem;
}

export default function TaskTimeTracker({ task }: TaskTimeTrackerProps) {
  // Determine start timestamp
  const getStartTimestamp = (): number => {
    if (task.startDate) {
      const d = new Date(task.startDate);
      if (!isNaN(d.getTime())) return d.getTime();
    }
    if (task.taskDate) {
      const d = new Date(task.taskDate);
      if (!isNaN(d.getTime())) return d.getTime();
    }
    if (task.createdAt) {
      const d = new Date(task.createdAt);
      if (!isNaN(d.getTime())) return d.getTime();
    }
    return Date.now();
  };

  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    // Update every minute for live counter
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const startMs = getStartTimestamp();
  const elapsedMs = Math.max(0, now - startMs);
  const totalElapsedHours = elapsedMs / (1000 * 60 * 60);

  // Format Elapsed Label
  const formatElapsedTime = (): { text: string; isOver24: boolean } => {
    const isOver24 = totalElapsedHours >= 24;
    const days = Math.floor(totalElapsedHours / 24);
    const hours = Math.floor(totalElapsedHours % 24);
    const minutes = Math.floor((totalElapsedHours * 60) % 60);

    if (days > 0) {
      return {
        text: `${days}g ${hours}s ${minutes}d (${Math.floor(totalElapsedHours)} saat)`,
        isOver24: true,
      };
    }
    if (hours > 0) {
      return {
        text: `${hours} saat ${minutes} dk`,
        isOver24: isOver24,
      };
    }
    return {
      text: `${Math.max(1, minutes)} dakika`,
      isOver24: false,
    };
  };

  const { text: elapsedText, isOver24 } = formatElapsedTime();

  // Calculate Progress percentage based on 24h cycle
  let progressPercent = Math.min(100, Math.max(4, (totalElapsedHours / 24) * 100));

  // Format Dates with Date and Time
  const formatDateShort = (dStr?: string): string => {
    if (!dStr) return '';
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const startFormatted = formatDateShort(task.startDate || task.taskDate || task.createdAt);
  const dueFormatted = formatDateShort(task.dueDate);

  return (
    <div className="space-y-2 py-1">
      {/* Top Header of Tracker: Elapsed time on left, Date on right */}
      <div className="flex items-center justify-between text-xs">
        <div
          className={`flex items-center space-x-1.5 font-bold ${
            isOver24 ? 'text-rose-600' : 'text-slate-700'
          }`}
          title={isOver24 ? 'Bu görev 24 saati aşkın süredir işlemde!' : 'Görevin başlangıcından beri geçen süre'}
        >
          {isOver24 ? (
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse shrink-0" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          )}
          <span>Geçen Süre: {elapsedText}</span>
        </div>

        {/* Date Info */}
        {(startFormatted || dueFormatted) && (
          <div className="flex items-center space-x-1 text-[11px] text-slate-500 font-medium">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>
              {startFormatted}
              {dueFormatted ? ` ➔ ${dueFormatted}` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Ultra Thin Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isOver24
              ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
              : 'bg-gradient-to-r from-blue-500 to-indigo-600'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
