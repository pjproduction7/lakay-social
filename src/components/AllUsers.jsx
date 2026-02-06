import React from 'react';
import PropTypes from 'prop-types';

export default function AllUsers({ allUsers, posts, currentUser, following, setFollowing, openProfile, setCurrentChatUser, setScreen, cardBg }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {allUsers.length === 0 ? (
        <div className={`${cardBg} rounded-xl p-6 text-center text-gray-200`}>
          No accounts found yet. Use the admin panel to seed demo users or share the signup link.
        </div>
      ) : (
        allUsers.map((user) => (
          <div key={user} className={`${cardBg} rounded-xl p-4 shadow-lg flex items-center gap-4`}>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {user[0].toUpperCase()}
            </div>

            <div className="flex-1">
              <div className="font-bold text-lg text-gray-900">{user}</div>
              <div className="text-xs text-gray-600">
                {posts.filter((p) => p.user === user).length} posts
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => openProfile(user)}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold"
              >
                View Profile
              </button>
              {user !== currentUser && (
                <button
                  onClick={() => setFollowing((prev) => ({ ...prev, [user]: !prev[user] }))}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    following[user]
                      ? "bg-gray-300 text-gray-900"
                      : "bg-green-500 text-white hover:bg-green-600"
                  }`}
                >
                  {following[user] ? "✓ Following" : "Follow"}
                </button>
              )}
              {user !== currentUser && (
                <button
                  onClick={() => {
                    setCurrentChatUser(user);
                    setScreen("privateMessages");
                  }}
                  className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 text-sm font-semibold"
                >
                  Message
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

AllUsers.propTypes = {
  allUsers: PropTypes.array.isRequired,
  posts: PropTypes.array.isRequired,
  currentUser: PropTypes.string,
  following: PropTypes.object.isRequired,
  setFollowing: PropTypes.func.isRequired,
  openProfile: PropTypes.func.isRequired,
  setCurrentChatUser: PropTypes.func.isRequired,
  setScreen: PropTypes.func.isRequired,
  cardBg: PropTypes.string,
};