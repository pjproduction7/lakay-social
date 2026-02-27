import React, { useState } from "react";
import { ArrowLeft, Lock, MessageSquare } from "lucide-react";
import PropTypes from 'prop-types';
import { changePassword } from "../../services/auth";



export default function ChangePassword({
  currentUser,
  onCancel,
  onRequestReset,
  onSuccess,
  pushNotif,
  adminUsername = "admin",
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      pushNotif?.("⚠️ Please log in to change your password");
      return;
    }
    if (!currentPassword || !newPassword) {
      pushNotif?.("⚠️ Please fill in all fields");
      return;
    }
    if (newPassword.length < 8) {
      pushNotif?.("⚠️ New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      pushNotif?.("⚠️ New passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      pushNotif?.("✅ Password updated");
      onSuccess?.();
    } catch (err) {
      pushNotif?.(`❌ Failed to change password: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-white/80">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white"
        >
          <ArrowLeft size={18} />
          Back to profile
        </button>
      </div>
      <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl shadow-2xl p-6 text-white flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center mb-4">
          <Lock size={32} />
        </div>
        <h2 className="text-3xl font-black mb-2">Change Password</h2>
        <p className="text-white/70 text-center text-lg">
          Update your password to keep your account secure.
        </p>
        <form onSubmit={handleSubmit} className="w-full mt-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="Re-enter new password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-white/20 px-6 py-3 text-base font-bold text-white hover:bg-white/30 transition disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm">
            Need help? You can request a reset by messaging the admin.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onRequestReset(adminUsername)}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20"
        >
          <MessageSquare size={18} />
          Message {adminUsername}
        </button>
        <p className="mt-3 text-xs text-white/60 text-center">
          We will open your private messages with {adminUsername} so you can request a reset.
        </p>
      </div>
    </div>
  );
}

ChangePassword.propTypes = {
  currentUser: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  onRequestReset: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  pushNotif: PropTypes.func,
  adminUsername: PropTypes.string,
};
