import React from "react";
import PropTypes from 'prop-types';

export default function PolicyPopup({ onAccept }) {
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

        <button style={styles.button} onClick={onAccept}>
          I Agree & Continue
        </button>
      </div>
    </div>
  );
}

PolicyPopup.propTypes = {
  onAccept: PropTypes.func.isRequired,
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
