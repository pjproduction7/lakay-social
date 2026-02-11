import React from "react";
import PropTypes from 'prop-types';

export default function PolicyPopup({ onAccept, onGuestFeed, onGuestMemorials }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.box}>
        <h2>Welcome to LakaySocial</h2>

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
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  box: {
    background: "white",
    padding: "25px",
    borderRadius: "15px",
    maxWidth: "450px",
    textAlign: "center",
  },
  text: {
    marginTop: "10px",
    fontSize: "15px",
  },
  rules: {
    marginTop: "15px",
    fontWeight: "bold",
    color: "darkred",
  },
  ladder: {
    marginTop: "15px",
    fontSize: "14px",
  },
  links: {
    marginTop: "10px",
    fontSize: "13px",
  },
  button: {
    marginTop: "20px",
    padding: "10px 20px",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    cursor: "pointer",
  },
};
