import React from "react";

export default function LegalPolicies() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>LakaySocial Policies</h1>

      <p style={styles.updated}>
        Effective Date: <b>January 2026</b>
      </p>

      {/* Community Guidelines */}
      <section style={styles.section}>
        <h2>Community Guidelines</h2>
        <p>
          LakaySocial is built on respect, dignity, and inclusion. Harassment,
          bullying, hate speech, discrimination, pornography, or abusive behavior
          is strictly prohibited.
        </p>
      </section>

      {/* Enforcement */}
      <section style={styles.section}>
        <h2>Enforcement Policy</h2>
        <ul>
          <li><b>Warning:</b> First-time minor violations</li>
          <li><b>Suspension:</b> Repeated or serious misconduct</li>
          <li><b>Permanent Ban:</b> Severe abuse or continued violations</li>
        </ul>
      </section>

      {/* Terms of Service */}
      <section style={styles.section}>
        <h2>Terms of Service</h2>
        <p>
          By using LakaySocial, you agree to follow our rules and behave
          respectfully. You may not post illegal, hateful, violent, or sexually
          explicit content.
        </p>
        <p>
          LakaySocial may remove content, suspend accounts, or permanently ban
          users who violate these terms.
        </p>
      </section>

      {/* Privacy Policy */}
      <section style={styles.section}>
        <h2>Privacy Policy</h2>
        <p>
          We value your privacy. We collect only necessary information such as
          usernames, emails, and user-generated content to provide and improve
          the service.
        </p>
        <p>
          We do not sell your personal data. Information may only be shared if
          required by law or for safety enforcement.
        </p>
      </section>

      {/* Reporting */}
      <section style={styles.section}>
        <h2>Reporting & Safety</h2>
        <p>
          Users can report abusive behavior. Harmful content may be removed
          immediately, and offenders may be banned.
        </p>
        <p>
          Support Contact: <b>support@lakaysocial.com</b>
        </p>
      </section>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "900px",
    margin: "auto",
    padding: "30px",
    fontFamily: "Arial, sans-serif",
    lineHeight: "1.6",
  },
  title: {
    fontSize: "32px",
    marginBottom: "10px",
  },
  updated: {
    color: "#444",
    marginBottom: "25px",
  },
  section: {
    marginBottom: "30px",
    padding: "15px",
    borderRadius: "10px",
    background: "#f8f8f8",
  },
};
