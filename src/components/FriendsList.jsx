import React from 'react';

export default function FriendsList({ otherUsers, currentUser, following, setFollowing, openProfile, setScreen, setCurrentChatUser, cardBg }) {
  return (
    <div>
      {otherUsers.length === 0 ? (
        <div className={`${cardBg} rounded-xl p-6 text-center text-gray-200`}>No friends to show yet. Invite new users or create them from the admin panel to build your community.</div>
      ) : (
        otherUsers.map((user) => (
          <div key={user} className={`${cardBg} rounded-xl p-4 mb-3 shadow flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">{user[0].toUpperCase()}</div>
              <div className="font-bold text-gray-900 text-lg">{user}</div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => openProfile(user)} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold">View</button>
              {user !== currentUser && (
                <button onClick={() => setFollowing((prev) => ({ ...prev, [user]: !prev[user] }))} className={`px-6 py-2 rounded-lg font-bold transition ${following[user] ? 'bg-gray-300 text-gray-900' : 'bg-blue-500 text-white hover:bg-blue-600'}`}>{following[user] ? '✓ Following' : 'Follow'}</button>
              )}
              {user !== currentUser && (
                <button onClick={() => { setCurrentChatUser(user); setScreen('privateMessages'); }} className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 text-sm font-semibold">Message</button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
