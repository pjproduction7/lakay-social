import React from 'react';

export default function BigButton({ icon, label, onClick, color }) {
  return (
    <button 
      onClick={onClick} 
      className={`${color} text-white rounded-xl p-6 shadow-lg hover:scale-105 transition flex flex-col items-center gap-2`}
    >
      {icon}
      <span className="font-bold">{label}</span>
    </button>
  );
}