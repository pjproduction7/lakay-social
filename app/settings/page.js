'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    // Check for strong password
    const hasUpperCase = /[A-Z]/.test(formData.newPassword);
    const hasLowerCase = /[a-z]/.test(formData.newPassword);
    const hasNumber = /[0-9]/.test(formData.newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecial) {
      setError('Password must contain uppercase, lowercase, number, and special character');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Password changed successfully! 🎉');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setError(data.error || 'Failed to change password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>⚙️ Settings</h1>
        <p>Manage your account settings and preferences</p>
      </div>

      <div className="settings-section">
        <h2>🔒 Change Password</h2>
        <p className="section-description">Update your password to keep your account secure</p>
        
        {message && <div className="success-message">✓ {message}</div>}
        {error && <div className="error-message">✗ {error}</div>}

        <form onSubmit={handleSubmit} className="password-form">
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              value={formData.currentPassword}
              onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
              required
              disabled={loading}
              placeholder="Enter your current password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={formData.newPassword}
              onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
              required
              disabled={loading}
              minLength={8}
              placeholder="Enter your new password"
            />
            <small className="help-text">
              Must be at least 8 characters with uppercase, lowercase, number, and special character
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              required
              disabled={loading}
              placeholder="Confirm your new password"
            />
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? '⏳ Changing Password...' : '🔐 Change Password'}
          </button>
        </form>
      </div>

      <style jsx>{`
        .settings-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .settings-header {
          margin-bottom: 40px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 20px;
        }

        .settings-header h1 {
          font-size: 32px;
          font-weight: bold;
          color: #111827;
          margin-bottom: 8px;
        }

        .settings-header p {
          color: #6b7280;
          font-size: 16px;
        }

        .settings-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .settings-section h2 {
          font-size: 24px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 8px;
        }

        .section-description {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 24px;
        }

        .password-form {
          max-width: 500px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }

        input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
          background: white;
        }

        input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        input:disabled {
          background-color: #f3f4f6;
          cursor: not-allowed;
        }

        .help-text {
          display: block;
          margin-top: 6px;
          color: #6b7280;
          font-size: 12px;
          line-height: 1.4;
        }

        .submit-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 10px;
          transition: all 0.2s;
        }

        .submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .submit-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
        }

        .success-message {
          padding: 14px 16px;
          background-color: #d1fae5;
          color: #065f46;
          border: 1px solid #6ee7b7;
          border-radius: 8px;
          margin-bottom: 20px;
          font-weight: 500;
        }

        .error-message {
          padding: 14px 16px;
          background-color: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
          border-radius: 8px;
          margin-bottom: 20px;
          font-weight: 500;
        }

        @media (max-width: 640px) {
          .settings-container {
            padding: 20px 16px;
          }

          .settings-header h1 {
            font-size: 24px;
          }

          .settings-section {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}
