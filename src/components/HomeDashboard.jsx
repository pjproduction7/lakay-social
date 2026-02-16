import React from 'react';
import SpinningLogo from './shared/SpinningLogo';
import HomeButton from './shared/HomeButton';
import BigButton from './shared/BigButton';
import { Bell, Moon, Sun, MessageSquare, Users, Newspaper, Calendar } from 'lucide-react';

export default function HomeDashboard({
  darkMode,
  setDarkMode,
  language,
  setLanguage,
  showPhoneModal,
  notifications,
  getTotalUnreadCount,
  setScreen,
  openProfile,
  currentUser,
  isAdmin,
  ADMIN_PANEL_ENABLED,
  pushNotif,
  handleLogout,
  setShowAdminPanel,
}) {
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-600 via-red-600 to-blue-800'} ${darkMode ? 'text-white' : 'text-white'} overflow-y-auto`}>
      <div className="max-w-2xl mx-auto p-4">
        {showPhoneModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">{/* phone modal is rendered by parent content */}</div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <SpinningLogo />
            <h1 className="text-3xl font-bold logo-glow">Lakay Social</h1>
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            <div
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 cursor-pointer"
              role="button"
              tabIndex={0}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </div>

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-2 py-1 rounded bg-white text-black"
            >
              <option value="en">EN</option>
              <option value="ht">HT</option>
              <option value="fr">FR</option>
              <option value="es">ES</option>
            </select>

            <button onClick={() => setScreen('notifications')} className="relative hover:scale-110 transition">
              <Bell size={24} />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{Math.min(notifications.length, 9)}</span>
              )}
            </button>

            <div className="relative inline-block group" tabIndex={0} aria-hidden={false}>
              <button
                onClick={() => openProfile(currentUser)}
                disabled={!currentUser}
                aria-disabled={!currentUser}
                className={`text-sm px-3 py-2 rounded-lg font-semibold ${currentUser ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer' : 'bg-blue-400 text-white opacity-60 cursor-not-allowed'}`}
              >
                My Profile
              </button>

              {!currentUser && (
                <span
                  className="absolute -top-9 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-focus:opacity-100 z-10 whitespace-nowrap"
                  role="tooltip"
                  aria-hidden="true"
                >
                  Please log in to view your profile
                </span>
              )}
            </div>

            <button onClick={handleLogout} className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 font-semibold text-sm">Logout</button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          <HomeButton icon={<Newspaper size={28} />} label="Haiti News" onClick={() => setScreen('haitiNews')} color="bg-blue-600" />
          <HomeButton icon={<Calendar size={28} />} label="Events" onClick={() => setScreen('events')} color="bg-purple-600" />
          <div className="relative">
            <HomeButton icon={<MessageSquare size={28} />} label="Private Messages" onClick={() => setScreen('privateMessages')} color="bg-teal-600" />
            {getTotalUnreadCount() > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">{getTotalUnreadCount()}</span>}
          </div>
          <HomeButton icon={<Users size={28} />} label="Friends" onClick={() => setScreen('friends')} color="bg-green-600" />
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          <HomeButton icon={<MessageSquare size={28} />} label="Feed" onClick={() => setScreen('feed')} color="bg-indigo-600" />
          <HomeButton icon={<MessageSquare size={28} />} label="Chat" onClick={() => setScreen('chat')} color="bg-pink-600" />
          <HomeButton icon={<Users size={28} />} label="All Users" onClick={() => setScreen('allUsers')} color="bg-cyan-600" />
          <HomeButton icon={<Users size={28} />} label="Classmates" onClick={() => setScreen('classmates')} color="bg-blue-500" />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <BigButton icon={<span className="text-4xl">🗳️</span>} label="Haiti Politics" onClick={() => setScreen('politics')} color="bg-blue-700" />
          <BigButton icon={<span className="text-4xl">💐</span>} label="Memorials" onClick={() => setScreen('memorials')} color="bg-purple-700" />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <BigButton icon={<span className="text-4xl">🎵</span>} label="Music" onClick={() => setScreen('music')} color="bg-pink-500" />
          <BigButton icon={<span className="text-4xl">🎮</span>} label="Games" onClick={() => setScreen('games')} color="bg-green-500" />
        </div>

        <div className="grid grid-cols-1 gap-4 mb-6">
          <BigButton icon={<span className="text-4xl">🤝</span>} label="Partner Hub" onClick={() => setScreen('partnerHub')} color="bg-orange-600" />
        </div>

        {isAdmin && (
          <button onClick={() => {
            if (ADMIN_PANEL_ENABLED) {
              pushNotif('⏳ Loading admin panel...');
              setTimeout(() => setShowAdminPanel(true), 100);
            } else {
              pushNotif('⚠️ Admin dashboard will be available once the backend endpoints are live.');
            }
          }} disabled={!ADMIN_PANEL_ENABLED} className={`w-full bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 ${ADMIN_PANEL_ENABLED ? 'hover:scale-105 transition' : 'opacity-60 cursor-not-allowed'}`}>
            🛡️ ADMIN PANEL
          </button>
        )}
      </div>
    </div>
  );
}