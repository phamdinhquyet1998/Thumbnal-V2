
import React from 'react';

interface StyleButtonProps {
  label: string;
  onClick: () => void;
  colorClass: string; // Tailwind class for button background color
}

const StyleButton: React.FC<StyleButtonProps> = ({ label, onClick, colorClass }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-6 py-3 text-white font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${colorClass}`}
    >
      {label}
    </button>
  );
};

export default StyleButton;
