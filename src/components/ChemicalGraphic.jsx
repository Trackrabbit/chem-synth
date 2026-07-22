import React from 'react';

// ---------------------------------------------------------
// COMPONENT: ChemicalGraphic
// ---------------------------------------------------------
const ChemicalGraphic = ({ color, type, size = "md" }) => {
  const sizeClasses = size === "lg" ? "w-32 h-32" : "w-16 h-16";
  
  return (
    <div className={`relative flex items-center justify-center ${sizeClasses}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full transition-all duration-300" style={{ filter: `drop-shadow(0 0 12px ${color}90)` }}>
        <path d="M 35 10 L 65 10 L 65 30 L 85 85 L 15 85 L 35 30 Z" fill="rgba(255,255,255,0.05)" stroke="#94a3b8" strokeWidth="4" strokeLinejoin="round" />
        <path d="M 23 60 L 77 60 L 82 82 L 18 82 Z" fill={color} opacity="0.8" />
        {type === 'gas' && (
          <>
            <circle cx="40" cy="45" r="3" fill="#ffffff" opacity="0.6" className="animate-bounce" />
            <circle cx="60" cy="50" r="4" fill="#ffffff" opacity="0.6" className="animate-bounce" style={{animationDelay: '0.2s'}} />
            <circle cx="50" cy="35" r="2" fill="#ffffff" opacity="0.6" className="animate-bounce" style={{animationDelay: '0.4s'}} />
          </>
        )}
        {type === 'liquid' && <path d="M 23 60 Q 50 55 77 60" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.5" />}
        {type === 'solid' && <path d="M 30 75 L 70 75 L 60 82 L 40 82 Z" fill="rgba(0,0,0,0.3)" />}
        <path d="M 35 15 L 40 15 L 40 28 L 25 70" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.4" strokeLinecap="round" />
      </svg>
    </div>
  );
};