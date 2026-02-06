import React from 'react';

export default function BroScreen() {
  return (
    <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1220', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif'}}>
      <div style={{textAlign: 'center'}}>
        <h1 style={{fontSize: '6rem', margin: 0, letterSpacing: '0.04em'}}>BRO</h1>
        <p style={{opacity: 0.85, marginTop: '12px'}}>Plain bro screen — development placeholder</p>
        <div style={{marginTop: 18}}>
          <a href="/" style={{color: '#7dd3fc', textDecoration: 'underline'}}>Back to app</a>
        </div>
      </div>
    </div>
  );
}
