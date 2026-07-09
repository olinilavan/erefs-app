import { useState } from 'react';

export default function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
          w-56 px-3 py-2 text-xs text-white bg-gray-800 rounded-lg shadow-lg
          pointer-events-none leading-relaxed">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4
            border-transparent border-t-gray-800" />
        </span>
      )}
    </span>
  );
}
