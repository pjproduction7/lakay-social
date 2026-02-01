import React from 'react';

export default function SpinningLogo() {
  return (
    <div className="flex justify-center items-center mb-6">
      <div className="logo-spin" style={{ width: '100px', height: '100px', position: 'relative' }}>
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 25%, #dc2626 50%, #991b1b 75%, #1e40af 100%)',
          boxShadow: '0 0 30px rgba(220, 38, 38, 0.5), 0 0 60px rgba(30, 64, 175, 0.5), inset 0 0 20px rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div className="logo-pulse" style={{
            position: 'absolute',
            width: '70px',
            height: '70px',
            background: 'linear-gradient(45deg, #dc2626, #1e40af)',
            borderRadius: '50%'
          }} />
          
          <div className="logo-glow" style={{
            position: 'relative',
            zIndex: 1,
            fontSize: '48px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, rgb(15, 33, 197), rgb(208, 230, 12), rgb(231, 10, 183))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}>
            L
          </div>
        </div>
      </div>
    </div>
  );
}