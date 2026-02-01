import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function Shell({ title, onBack, children, bgColor = "bg-gray-900", textColor = "text-white" }) {
  return (
    <div className={`min-h-screen ${bgColor} ${textColor}`}>
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="hover:scale-110 transition">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        {children}
      </div>
    </div>
  );
}