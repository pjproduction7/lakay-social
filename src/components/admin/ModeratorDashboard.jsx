import React from "react";

const ModeratorDashboard = () => {
  return (
    <div style={{ padding: 32 }}>
      <h1>Moderator Dashboard</h1>
      <p>Welcome, moderator! Here you will see reported content and users, and can take moderation actions.</p>
      <div style={{ marginTop: 32 }}>
        <h2>Reported Content</h2>
        <div style={{ background: '#222', color: '#fff', padding: 16, borderRadius: 8, minHeight: 80 }}>
          <em>No reported posts or messages yet.</em>
        </div>
      </div>
      <div style={{ marginTop: 32 }}>
        <h2>Reported Users</h2>
        <div style={{ background: '#222', color: '#fff', padding: 16, borderRadius: 8, minHeight: 80 }}>
          <em>No reported users yet.</em>
        </div>
      </div>
    </div>
  );
};

export default ModeratorDashboard;
