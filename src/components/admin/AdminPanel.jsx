import React, { useState } from 'react';
import { Shield, Trash2, X, UserPlus, KeyRound } from 'lucide-react';
import { deleteUser } from '../../services/auth';

export default function AdminPanel({ 
  currentUser, 
  isAdmin, 
  allUsers,
  bannedUsers,
  setBannedUsers,
  shadowBannedUsers,
  setShadowBannedUsers,
  moderators,
  setModerators,
  setMessages,
  refreshUsers,
  onClose,
  pushNotif
}) {
  if (!isAdmin) {
    return <div className="text-red-500">⛔ Access Denied</div>;
  }

  const [newUserForm, setNewUserForm] = useState({ username: '', email: '', password: '' });
  const [deleteTarget, setDeleteTarget] = useState('');
  const [passwordTarget, setPasswordTarget] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleToggleBan = (user) => {
    if (bannedUsers.includes(user)) {
      setBannedUsers(prev => prev.filter(u => u !== user));
      pushNotif(`✅ Unbanned ${user}`);
    } else {
      setBannedUsers(prev => [...prev, user]);
      pushNotif(`🚫 Banned ${user}`);
    }
  };

  const handleShadowBan = (user) => {
    if (shadowBannedUsers.includes(user)) {
      setShadowBannedUsers(prev => prev.filter(u => u !== user));
      pushNotif(`✅ ${user} unshadow banned`);
    } else {
      setShadowBannedUsers(prev => [...prev, user]);
      pushNotif(`👻 ${user} shadow banned`);
    }
  };

  const handleToggleModerator = (user) => {
    if (moderators.includes(user)) {
      setModerators(prev => prev.filter(u => u !== user));
      pushNotif(`✅ ${user} is no longer a moderator`);
    } else {
      setModerators(prev => [...prev, user]);
      pushNotif(`✅ ${user} is now a moderator`);
    }
  };

  const handleClearAllMessages = () => {
    if (window.confirm("🚨 DELETE ALL MESSAGES? This cannot be undone!")) {
      setMessages([]);
      pushNotif("✅ All messages cleared");
    }
  };

  const handleCreateUser = () => {
    pushNotif('❌ User creation is unavailable in this static version.');
  };

  const handleDeleteUser = async () => {
    const target = deleteTarget.trim();
    if (!target) {
      pushNotif('⚠️ Select a user to delete');
      return;
    }

    if (target === currentUser) {
      pushNotif('⚠️ You cannot delete the account you are using');
      return;
    }

    if (!window.confirm(`Delete ${target}? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteUser(target);
      setBannedUsers(prev => prev.filter(u => u !== target));
      setShadowBannedUsers(prev => prev.filter(u => u !== target));
      setModerators(prev => prev.filter(u => u !== target));
      await refreshUsers?.();
      setDeleteTarget('');
      pushNotif(`🗑️ Deleted user ${target}`);
    } catch (err) {
      pushNotif(`❌ ${err.message}`);
    }
  };

  const handleForcePasswordReset = () => {
    pushNotif('❌ Password reset is unavailable in this static version.');
  };

  const manageableUsers = allUsers.filter(u => u !== currentUser);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={32} className="text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">🛡️ ADMIN COMMAND CENTER</h2>
              <p className="text-white/80 text-sm">Logged in as: {currentUser}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg text-2xl">
            <X size={28} />
          </button>
        </div>

        {/* Stats */}
        <div className="p-6 grid grid-cols-3 gap-4">
          <div className="bg-blue-600 rounded-xl p-4">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-white text-2xl font-bold">{allUsers.length}</div>
            <div className="text-white/80 text-sm">Total Users</div>
          </div>
          <div className="bg-red-600 rounded-xl p-4">
            <div className="text-3xl mb-2">🚫</div>
            <div className="text-white text-2xl font-bold">{bannedUsers.length}</div>
            <div className="text-white/80 text-sm">Banned</div>
          </div>
          <div className="bg-yellow-600 rounded-xl p-4">
            <div className="text-3xl mb-2">👻</div>
            <div className="text-white text-2xl font-bold">{shadowBannedUsers.length}</div>
            <div className="text-white/80 text-sm">Shadow Banned</div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Danger Zone */}
          <div className="bg-red-600/20 border-2 border-red-500 rounded-xl p-6 mb-6">
            <h4 className="text-xl font-bold text-white mb-4">⚠️ DANGER ZONE</h4>
            <button
              onClick={handleClearAllMessages}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
            >
              <Trash2 size={20} />
              Clear All Messages
            </button>
            <p className="text-white/60 text-sm mt-2">⚠️ This will permanently delete all chat messages</p>
          </div>

          {/* Account Utilities */}
          <div className="grid lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
                <UserPlus size={20} /> Quick Create User
              </div>
              <input
                value={newUserForm.username}
                onChange={(e) => setNewUserForm(prev => ({ ...prev, username: e.target.value }))}
                className="w-full mb-2 p-2 rounded-lg bg-gray-900/50 border border-white/10 text-white"
                placeholder="Username"
              />
              <input
                value={newUserForm.email}
                onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full mb-2 p-2 rounded-lg bg-gray-900/50 border border-white/10 text-white"
                placeholder="Email (optional)"
                type="email"
              />
              <input
                value={newUserForm.password}
                onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full mb-3 p-2 rounded-lg bg-gray-900/50 border border-white/10 text-white"
                placeholder="Temporary Password"
                type="text"
              />
              <button
                onClick={handleCreateUser}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg"
              >
                Create User
              </button>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
                <Trash2 size={20} /> Remove User
              </div>
              <select
                value={deleteTarget}
                onChange={(e) => setDeleteTarget(e.target.value)}
                className="w-full mb-3 p-2 rounded-lg bg-gray-900/50 border border-white/10 text-white"
              >
                <option value="">Select user</option>
                {manageableUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
              <button
                onClick={handleDeleteUser}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg"
              >
                Delete User
              </button>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
                <KeyRound size={20} /> Force Password Reset
              </div>
              <select
                value={passwordTarget}
                onChange={(e) => setPasswordTarget(e.target.value)}
                className="w-full mb-2 p-2 rounded-lg bg-gray-900/50 border border-white/10 text-white"
              >
                <option value="">Select user</option>
                {manageableUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full mb-3 p-2 rounded-lg bg-gray-900/50 border border-white/10 text-white"
                placeholder="New password"
                type="text"
              />
              <button
                onClick={handleForcePasswordReset}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg"
              >
                Update Password
              </button>
            </div>
          </div>

          {/* User Management */}
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <h3 className="text-white font-bold text-xl mb-4">👥 User Management</h3>
            <div className="space-y-3">
              {allUsers.map(user => {
                const isBanned = bannedUsers.includes(user);
                const isShadowBanned = shadowBannedUsers.includes(user);
                const isModerator = moderators.includes(user);
                const isCurrentAdmin = user === currentUser;

                return (
                  <div 
                    key={user} 
                    className={`bg-gray-800 border-2 rounded-xl p-4 ${
                      isBanned ? 'border-red-500' : 
                      isShadowBanned ? 'border-yellow-500' : 
                      'border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          {user[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-bold">{user}</div>
                          <div className="flex gap-2 text-xs mt-1">
                            {isBanned && <span className="text-red-400">🚫 BANNED</span>}
                            {isShadowBanned && <span className="text-yellow-400">👻 SHADOW BANNED</span>}
                            {isModerator && <span className="text-blue-400">🛡️ MODERATOR</span>}
                            {!isBanned && !isShadowBanned && <span className="text-green-400">✅ ACTIVE</span>}
                          </div>
                        </div>
                      </div>

                      {!isCurrentAdmin && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleModerator(user)}
                            className={`px-3 py-2 rounded-lg font-bold text-sm ${
                              isModerator 
                                ? 'bg-blue-600 hover:bg-blue-700' 
                                : 'bg-gray-600 hover:bg-gray-700'
                            } text-white`}
                          >
                            {isModerator ? '🛡️ Mod' : 'Make Mod'}
                          </button>

                          <button
                            onClick={() => handleShadowBan(user)}
                            className={`px-3 py-2 rounded-lg font-bold text-sm ${
                              isShadowBanned 
                                ? 'bg-yellow-600 hover:bg-yellow-700' 
                                : 'bg-gray-600 hover:bg-gray-700'
                            } text-white`}
                          >
                            👻
                          </button>

                          <button
                            onClick={() => handleToggleBan(user)}
                            className={`px-3 py-2 rounded-lg font-bold text-sm ${
                              isBanned 
                                ? 'bg-green-600 hover:bg-green-700' 
                                : 'bg-red-600 hover:bg-red-700'
                            } text-white`}
                          >
                            {isBanned ? '✅ Unban' : '🚫 Ban'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import PropTypes from 'prop-types';

AdminPanel.propTypes = {
  currentUser: PropTypes.string.isRequired,
  isAdmin: PropTypes.bool.isRequired,
  allUsers: PropTypes.array.isRequired,
  bannedUsers: PropTypes.array.isRequired,
  setBannedUsers: PropTypes.func.isRequired,
  shadowBannedUsers: PropTypes.array.isRequired,
  setShadowBannedUsers: PropTypes.func.isRequired,
  moderators: PropTypes.array.isRequired,
  setModerators: PropTypes.func.isRequired,
  setMessages: PropTypes.func,
  refreshUsers: PropTypes.func,
  onClose: PropTypes.func.isRequired,
  pushNotif: PropTypes.func.isRequired,
};