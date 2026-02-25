import React from 'react';
import PropTypes from 'prop-types';
import { ArrowLeft } from 'lucide-react';

export default function Shell({ title, onBack, children, bgColor = "bg-gray-900", textColor = "text-white", fontFamily, userTextColor }) {
  const renderedTitle = (typeof title === "string" || typeof title === "number")
    ? <span className="glow-title">{title}</span>
    : title;
  return (
    <div
      className={`min-h-screen ${bgColor} ${textColor}`}
      style={{
        fontFamily: fontFamily || "var(--user-font, inherit)",
        color: userTextColor || "var(--user-text-color, inherit)",
      }}
    >
      <style>{`
        .glow-title {
          font-weight: 800;
          background: linear-gradient(90deg, #ef4444, #3b82f6, #ef4444);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: glowTitleFlow 3.5s ease-in-out infinite;
          text-shadow:
            0 0 10px rgba(239, 68, 68, 0.6),
            0 0 16px rgba(59, 130, 246, 0.55);
        }

        .glow-subtitle {
          color: #dbeafe;
          animation: glowSubPulse 2.6s ease-in-out infinite;
          text-shadow:
            0 0 8px rgba(59, 130, 246, 0.5),
            0 0 12px rgba(239, 68, 68, 0.35);
        }

        @keyframes glowTitleFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes glowSubPulse {
          0%, 100% { color: #dbeafe; }
          50% { color: #fecaca; }
        }
      `}</style>
      <div className="max-w-2xl mx-auto p-4 overflow-y-auto min-h-screen">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="hover:scale-110 transition">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold">{renderedTitle}</h2>
        </div>
        {children}
      </div>
    </div>
  );
}

Shell.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  onBack: PropTypes.func,
  children: PropTypes.node,
  bgColor: PropTypes.string,
  textColor: PropTypes.string,
  fontFamily: PropTypes.string,
  userTextColor: PropTypes.string,
};
