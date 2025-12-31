'use client';

import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      {(['system', 'light', 'dark'] as const).map((t) => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            theme === t 
              ? 'bg-white dark:bg-gray-700 shadow-sm' 
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {t === 'system' ? '🖥️' : t === 'light' ? '☀️' : '🌙'}
        </button>
      ))}
    </div>
  );
}