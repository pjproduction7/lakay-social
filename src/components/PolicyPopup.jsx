import React from "react";
import PropTypes from 'prop-types';

export default function PolicyPopup({ onAccept, onGuestFeed, onGuestMemorials }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.box}>
        <h2 style={styles.title}>Welcome to LakaySocial</h2>

        <p style={styles.text}>
          By continuing, you agree to treat others with respect.
        </p>

        <p style={styles.rules}>
          ❌ No hate speech, bullying, discrimination, harassment, or explicit
          content.
        </p>

        <p style={styles.ladder}>
          Violations lead to: <b>Warning → Suspension → Permanent Ban</b>
        </p>

        <p style={styles.links}>
          View full rules:{" "}
          <a href="/policies" target="_blank" rel="noreferrer">
            Terms & Privacy
          </a>
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
          <button style={styles.button} onClick={onAccept}>
            I Agree & Continue
          </button>
          <button style={{ ...styles.button, background: '#6b46c1', color: 'white' }} onClick={() => (onGuestFeed ? onGuestFeed() : onAccept())}>
            Browse Feed
          </button>
          <button style={{ ...styles.button, background: '#805ad5', color: 'white' }} onClick={() => (onGuestMemorials ? onGuestMemorials() : onAccept())}>
            View Memorials
          </button>
        </div>
      </div>
    </div>
  );
}

PolicyPopup.propTypes = {
  onAccept: PropTypes.func.isRequired,
  onGuestFeed: PropTypes.func,
  onGuestMemorials: PropTypes.func,
};

PolicyPopup.defaultProps = {
  onGuestFeed: null,
  onGuestMemorials: null,
};

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    height: "100%",
    width: "100%",
    background: "linear-gradient(135deg, rgba(2,6,23,0.85), rgba(12,6,35,0.85))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    backdropFilter: "blur(6px)",
  },
  box: {
    background: "linear-gradient(135deg, #0f172a, #0b1220)",
    padding: "28px",
    borderRadius: "16px",
    maxWidth: "520px",
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(2,6,23,0.6)",
    border: "1px solid rgba(255,255,255,0.04)",
    color: '#e6eef8'
  },
  title: {
    margin: 0,
    fontSize: "26px",
    fontWeight: 800,
    letterSpacing: '0.6px',
    background: 'linear-gradient(90deg, #ff4d4d, #3b82f6)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent'
  },
  text: {
    marginTop: "10px",
    fontSize: "15px",
    color: '#cbd5e1'
  },
  rules: {
    marginTop: "15px",
    fontWeight: "bold",
    color: "#ff6b6b",
  },
  ladder: {
    marginTop: "15px",
    fontSize: "14px",
    color: '#94a3b8'
  },
  links: {
    marginTop: "10px",
    fontSize: "13px",
    color: '#9fb0ff'
  },
  button: {
    marginTop: "20px",
    padding: "10px 22px",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    cursor: "pointer",
    background: "linear-gradient(90deg,#ef4444,#3b82f6)",
    color: "white",
    fontWeight: 700,
    boxShadow: "0 6px 18px rgba(59,130,246,0.25)",
    transition: 'transform 120ms ease, box-shadow 120ms ease'
  },
};
