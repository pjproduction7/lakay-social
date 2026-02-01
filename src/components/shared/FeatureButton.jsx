import React from 'react';

export default function FeatureButton({ icon, label, onClick, color = "bg-blue-600", badge = null }) {
  return (
    <button
      onClick={onClick}
      className={`${color} text-white rounded-xl p-6 shadow-lg hover:scale-105 transition flex flex-col items-center gap-2 relative`}
    >
      {badge && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
          {badge}
        </span>
      )}
      <div className="text-4xl">{icon}</div>
      <span className="font-bold text-sm">{label}</span>
    </button>
  );
}