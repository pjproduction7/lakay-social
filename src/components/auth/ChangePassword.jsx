import React from "react";
import { ArrowLeft, Lock } from "lucide-react";
import PropTypes from 'prop-types';



export default function ChangePassword({ onCancel }) {
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
        <p className="text-white/70 text-center text-lg">Password change is unavailable in this static version of the site.</p>
      </div>
    </div>
  );
}

ChangePassword.propTypes = {
  onCancel: PropTypes.func.isRequired,
};
