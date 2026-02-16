import React, { useState } from 'react';
import { Shield, Trash2, X, UserPlus, KeyRound, MessageSquare, FileText, Settings, Megaphone } from 'lucide-react';
import { deleteUser } from '../../services/auth';

export default function AdminPanel({ 
  currentUser, 
  isAdmin, 
  allUsers,
  adminUsers,
  userRoles,
  adminStats,
  adminLogs,
  bannedUsers,
  setBannedUsers,
  shadowBannedUsers,
  setShadowBannedUsers,
  moderators,
  setModerators,
  setMessages,
  refreshUsers,
  refreshAdminData,
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
  const [allPosts, setAllPosts] = useState([]);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const [systemSettings, setSystemSettings] = useState({});
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementType, setAnnouncementType] = useState('info');
  const [editProfileTarget, setEditProfileTarget] = useState('');
  const [editProfileData, setEditProfileData] = useState({ displayName: '', bio: '', location: '' });

  const handleToggleBan = async (user) => {
    try {
      const { assignUserRole, removeUserRole } = await import('../../services/auth');
      if (bannedUsers.includes(user)) {
        await removeUserRole(user, 'banned');
        setBannedUsers(prev => prev.filter(u => u !== user));
        pushNotif(`✅ Unbanned ${user}`);
      } else {
        await assignUserRole(user, 'banned');
        setBannedUsers(prev => [...prev, user]);
        pushNotif(`🚫 Banned ${user}`);
      }
    } catch (err) {
      pushNotif(`❌ Failed to toggle ban: ${err.message}`);
    }
  };

  const handleShadowBan = async (user) => {
    try {
      const { assignUserRole, removeUserRole } = await import('../../services/auth');
      if (shadowBannedUsers.includes(user)) {
        await removeUserRole(user, 'shadow_banned');
        setShadowBannedUsers(prev => prev.filter(u => u !== user));
        pushNotif(`✅ ${user} unshadow banned`);
      } else {
        await assignUserRole(user, 'shadow_banned');
        setShadowBannedUsers(prev => [...prev, user]);
        pushNotif(`👻 ${user} shadow banned`);
      }
    } catch (err) {
      pushNotif(`❌ Failed to toggle shadow ban: ${err.message}`);
    }
  };

  const handleToggleModerator = async (user) => {
    try {
      const { assignUserRole, removeUserRole } = await import('../../services/auth');
      if (moderators.includes(user)) {
        await removeUserRole(user, 'moderator');
        setModerators(prev => prev.filter(u => u !== user));
        pushNotif(`✅ ${user} is no longer a moderator`);
      } else {
        await assignUserRole(user, 'moderator');
        setModerators(prev => [...prev, user]);
        pushNotif(`✅ ${user} is now a moderator`);
      }
    } catch (err) {
      pushNotif(`❌ Failed to toggle moderator: ${err.message}`);
    }
  };

  const handleClearAllMessages = () => {
    if (window.confirm("🚨 DELETE ALL MESSAGES? This cannot be undone!")) {
      setMessages([]);
      pushNotif("✅ All messages cleared");
    }
  };

  const handleCreateUser = async () => {
    const username = newUserForm.username?.trim();
    const password = newUserForm.password?.trim() || `pw_${Date.now()}`;
    const email = newUserForm.email?.trim() || undefined;

    if (!username) {
      pushNotif('⚠️ Please provide a username');
      return;
    }

    try {
      pushNotif('⏳ Creating user...');
      // import live function dynamically so tests can mock it
      const { adminCreateUser } = await import('../../services/auth');
      await adminCreateUser({ username, password, email });
      setNewUserForm({ username: '', email: '', password: '' });
      pushNotif(`✅ Created user ${username}. Temporary password set.`);
      await refreshUsers?.();
    } catch (err) {
      pushNotif(`❌ Failed to create user: ${err.message || err}`);
    }
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

  const handleForcePasswordReset = async () => {
    const target = passwordTarget.trim();
    const password = newPassword.trim();

    if (!target) {
      pushNotif('⚠️ Select a user');
      return;
    }

    if (!password || password.length < 8) {
      pushNotif('⚠️ Password must be at least 8 characters');
      return;
    }

    try {
      const { adminResetPassword } = await import('../../services/auth');
      await adminResetPassword(target, password);
      setPasswordTarget('');
      setNewPassword('');
      pushNotif(`✅ Password reset for ${target}`);
    } catch (err) {
      pushNotif(`❌ Failed to reset password: ${err.message}`);
    }
  };

  const handleLoadPosts = async () => {
    try {
      const { getAllPosts } = await import('../../services/auth');
      const posts = await getAllPosts();
      setAllPosts(posts);
      pushNotif(`✅ Loaded ${posts.length} posts`);
    } catch (err) {
      pushNotif(`❌ Failed to load posts: ${err.message}`);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    try {
      const { deletePost } = await import('../../services/auth');
      await deletePost(postId);
      setAllPosts(prev => prev.filter(p => p.id !== postId));
      pushNotif('✅ Post deleted');
    } catch (err) {
      pushNotif(`❌ Failed to delete post: ${err.message}`);
    }
  };

  const handleLoadPendingPosts = async () => {
    try {
      const { getPendingPosts } = await import('../../services/auth');
      const posts = await getPendingPosts();
      setPendingPosts(posts);
      pushNotif(`✅ Loaded ${posts.length} pending posts`);
    } catch (err) {
      pushNotif(`❌ Failed to load pending posts: ${err.message}`);
    }
  };

  const handleApprovePost = async (postId) => {
    try {
      const { approvePost } = await import('../../services/auth');
      await approvePost(postId);
      setPendingPosts(prev => prev.filter(p => p.id !== postId));
      pushNotif('✅ Post approved');
    } catch (err) {
      pushNotif(`❌ Failed to approve post: ${err.message}`);
    }
  };

  const handleRejectPost = async (postId) => {
    if (!window.confirm('Reject this post? It will be deleted permanently.')) return;
    try {
      const { rejectPost } = await import('../../services/auth');
      await rejectPost(postId);
      setPendingPosts(prev => prev.filter(p => p.id !== postId));
      pushNotif('✅ Post rejected');
    } catch (err) {
      pushNotif(`❌ Failed to reject post: ${err.message}`);
    }
  };

  const handleLoadMessages = async () => {
    try {
      const { getAllMessages } = await import('../../services/auth');
      const messages = await getAllMessages();
      setAllMessages(messages);
      pushNotif(`✅ Loaded ${messages.length} messages`);
    } catch (err) {
      pushNotif(`❌ Failed to load messages: ${err.message}`);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message? This cannot be undone.')) return;
    try {
      const { deleteMessage } = await import('../../services/auth');
      await deleteMessage(messageId);
      setAllMessages(prev => prev.filter(m => m.id !== messageId));
      pushNotif('✅ Message deleted');
    } catch (err) {
      pushNotif(`❌ Failed to delete message: ${err.message}`);
    }
  };

  const handleLoadSettings = async () => {
    try {
      const { getSystemSettings } = await import('../../services/auth');
      const settings = await getSystemSettings();
      setSystemSettings(settings);
      pushNotif('✅ Settings loaded');
    } catch (err) {
      pushNotif(`❌ Failed to load settings: ${err.message}`);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      const { updateSystemSettings } = await import('../../services/auth');
      await updateSystemSettings(systemSettings);
      pushNotif('✅ Settings updated');
    } catch (err) {
      pushNotif(`❌ Failed to update settings: ${err.message}`);
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcementMessage.trim()) {
      pushNotif('⚠️ Please enter an announcement message');
      return;
    }
    try {
      const { sendSystemAnnouncement } = await import('../../services/auth');
      await sendSystemAnnouncement({ message: announcementMessage, type: announcementType });
      setAnnouncementMessage('');
      pushNotif('✅ Announcement sent');
    } catch (err) {
      pushNotif(`❌ Failed to send announcement: ${err.message}`);
    }
  };

  const handleEditUserProfile = async () => {
    if (!editProfileTarget) {
      pushNotif('⚠️ Select a user to edit');
      return;
    }
    try {
      const { adminUpdateUserProfile } = await import('../../services/auth');
      await adminUpdateUserProfile(editProfileTarget, {
        displayName: editProfileData.displayName,
        bio: editProfileData.bio,
        location: editProfileData.location
      });
      setEditProfileTarget('');
      setEditProfileData({ displayName: '', bio: '', location: '' });
      pushNotif('✅ Profile updated');
    } catch (err) {
      pushNotif(`❌ Failed to update profile: ${err.message}`);
    }
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
        <div className="p-6 grid grid-cols-4 gap-4">
          <div className="bg-blue-600 rounded-xl p-4">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-white text-2xl font-bold">{adminStats.totalUsers || allUsers.length}</div>
            <div className="text-white/80 text-sm">Total Users</div>
          </div>
          <div className="bg-green-600 rounded-xl p-4">
            <div className="text-3xl mb-2">📝</div>
            <div className="text-white text-2xl font-bold">{adminStats.totalPosts || 0}</div>
            <div className="text-white/80 text-sm">Total Posts</div>
          </div>
          <div className="bg-purple-600 rounded-xl p-4">
            <div className="text-3xl mb-2">💬</div>
            <div className="text-white text-2xl font-bold">{adminStats.totalMessages || 0}</div>
            <div className="text-white/80 text-sm">Total Messages</div>
          </div>
          <div className="bg-red-600 rounded-xl p-4">
            <div className="text-3xl mb-2">🚫</div>
            <div className="text-white text-2xl font-bold">{bannedUsers.length}</div>
            <div className="text-white/80 text-sm">Banned</div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 overflow-y-auto" style={{ scrollbarWidth: 'thin', maxHeight: 'calc(85vh - 200px)' }}>
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
                <UserPlus size={20} /> Create User
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
                placeholder="Email"
                type="email"
              />
              <input
                value={newUserForm.password}
                onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full mb-3 p-2 rounded-lg bg-gray-900/50 border border-white/10 text-white"
                placeholder="Password"
                type="password"
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
                <Trash2 size={20} /> Delete User
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
                <KeyRound size={20} /> Reset Password
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
                type="password"
              />
              <button
                onClick={handleForcePasswordReset}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg"
              >
                Reset Password
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

          {/* Content Moderation */}
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-6">
            <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
              <FileText size={24} /> Content Moderation
            </h3>

            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <button
                  onClick={handleLoadPendingPosts}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 rounded-lg mb-2"
                >
                  Pending Posts ({pendingPosts.length})
                </button>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {pendingPosts.map(post => (
                    <div key={post.id} className="bg-gray-800 p-3 rounded-lg">
                      <div className="text-white font-semibold">{post.username} ({post.post_type})</div>
                      <div className="text-white/80 text-sm mb-2">{post.content}</div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/60 text-xs">{new Date(post.created_at).toLocaleString()}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleApprovePost(post.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectPost(post.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <button
                  onClick={handleLoadPosts}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg mb-2"
                >
                  Load All Posts ({allPosts.length})
                </button>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {allPosts.map(post => (
                    <div key={post.id} className="bg-gray-800 p-3 rounded-lg">
                      <div className="text-white font-semibold">{post.username}</div>
                      <div className="text-white/80 text-sm mb-2">{post.content}</div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/60 text-xs">{new Date(post.created_at).toLocaleString()}</span>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <button
                  onClick={handleLoadMessages}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg mb-2"
                >
                  Load All Messages ({allMessages.length})
                </button>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {allMessages.map(message => (
                    <div key={message.id} className="bg-gray-800 p-3 rounded-lg">
                      <div className="text-white font-semibold">{message.sender} {message.recipient && `→ ${message.recipient}`}</div>
                      <div className="text-white/80 text-sm mb-2">{message.content}</div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/60 text-xs">{new Date(message.created_at).toLocaleString()}</span>
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* System Settings - Temporarily disabled */}
          {/* <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-6">
            <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
              <Settings size={24} /> System Settings
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <button
                onClick={handleLoadSettings}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg"
              >
                Load Current Settings
              </button>
              
              <button
                onClick={handleUpdateSettings}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded-lg"
              >
                Update Settings
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-semibold mb-2">Maintenance Mode</label>
                <input
                  type="checkbox"
                  checked={systemSettings.maintenanceMode || false}
                  onChange={(e) => setSystemSettings(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                  className="w-6 h-6"
                />
              </div>
              
              <div>
                <label className="block text-white font-semibold mb-2">Registration Enabled</label>
                <input
                  type="checkbox"
                  checked={systemSettings.registrationEnabled !== false}
                  onChange={(e) => setSystemSettings(prev => ({ ...prev, registrationEnabled: e.target.checked }))}
                  className="w-6 h-6"
                />
              </div>
              
              <div>
                <label className="block text-white font-semibold mb-2">Max File Size</label>
                <input
                  type="text"
                  value={systemSettings.maxFileSize || ''}
                  onChange={(e) => setSystemSettings(prev => ({ ...prev, maxFileSize: e.target.value }))}
                  className="w-full p-2 rounded bg-gray-800 border border-white/20 text-white"
                  placeholder="10MB"
                />
              </div>
              
              <div>
                <label className="block text-white font-semibold mb-2">Rate Limit (requests/15min)</label>
                <input
                  type="number"
                  value={systemSettings.rateLimitMax || ''}
                  onChange={(e) => setSystemSettings(prev => ({ ...prev, rateLimitMax: parseInt(e.target.value) }))}
                  className="w-full p-2 rounded bg-gray-800 border border-white/20 text-white"
                  placeholder="100"
                />
              </div>
            </div>
          </div> */}

          {/* System Announcements */}
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-6">
            <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
              <Megaphone size={24} /> System Announcements
            </h3>
            
            <div className="mb-4">
              <textarea
                value={announcementMessage}
                onChange={(e) => setAnnouncementMessage(e.target.value)}
                className="w-full p-3 rounded bg-gray-800 border border-white/20 text-white"
                rows="3"
                placeholder="Enter announcement message..."
              />
              
              <div className="flex gap-4 mt-3">
                <select
                  value={announcementType}
                  onChange={(e) => setAnnouncementType(e.target.value)}
                  className="p-2 rounded bg-gray-800 border border-white/20 text-white"
                >
                  <option value="info">ℹ️ Info</option>
                  <option value="warning">⚠️ Warning</option>
                  <option value="success">✅ Success</option>
                  <option value="error">❌ Error</option>
                </select>
                
                <button
                  onClick={handleSendAnnouncement}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold px-6 py-2 rounded-lg"
                >
                  Send Announcement
                </button>
              </div>
            </div>
          </div>

          {/* Profile Editor - Temporarily disabled */}
          {/* <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-6">
            <h3 className="text-white font-bold text-xl mb-4">👤 Edit User Profiles</h3>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <select
                value={editProfileTarget}
                onChange={(e) => setEditProfileTarget(e.target.value)}
                className="p-2 rounded bg-gray-800 border border-white/20 text-white"
              >
                <option value="">Select user</option>
                {manageableUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
              
              <button
                onClick={handleEditUserProfile}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg"
              >
                Update Profile
              </button>
            </div>
            
            <div className="space-y-3">
              <input
                type="text"
                value={editProfileData.displayName}
                onChange={(e) => setEditProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                className="w-full p-2 rounded bg-gray-800 border border-white/20 text-white"
                placeholder="Display Name"
              />
              
              <textarea
                value={editProfileData.bio}
                onChange={(e) => setEditProfileData(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full p-2 rounded bg-gray-800 border border-white/20 text-white"
                rows="2"
                placeholder="Bio"
              />
              
              <input
                type="text"
                value={editProfileData.location}
                onChange={(e) => setEditProfileData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full p-2 rounded bg-gray-800 border border-white/20 text-white"
                placeholder="Location"
              />
            </div>
          </div> */}

          {/* Recent Activity */}
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-6">
            <h4 className="text-xl font-bold text-white mb-4">📋 Recent Activity</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <div className="text-white/60 text-sm">No recent activity</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}