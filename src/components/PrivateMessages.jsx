import React from 'react';
import PropTypes from 'prop-types';
import PrivateChat from '../components/chat/PrivateChat';
import { ArrowLeft, MessageSquare } from 'lucide-react';

export default function PrivateMessages({
  currentUser,
  currentChatUser,
  setCurrentChatUser,
  otherUsers,
  privateMessages,
  loadingPrivateMessages,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onlineUsersSet,
  getUnreadCount,
  markMessagesAsRead,
}) {
  return (
    <div>
      {!currentChatUser ? (
        <div>
          <h3 className="text-lg font-bold mb-4 text-white">Select user to message:</h3>
          {otherUsers.length === 0 ? (
            <div className="bg-white/10 rounded-xl p-4 shadow text-center text-gray-200">No other users are online yet. Create accounts from the admin panel or invite friends to start chatting.</div>
          ) : (
            otherUsers.map((user) => {
              const unreadCount = getUnreadCount(user);
              const isOnline = onlineUsersSet.has(user.toLowerCase());
              return (
                <button
                  key={user}
                  onClick={() => { setCurrentChatUser(user); markMessagesAsRead(user); }}
                  className={`w-full bg-white/5 p-4 rounded-xl mb-3 shadow flex items-center gap-3 hover:scale-105 transition relative`}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">{user[0]}</div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-gray-900">{user}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <span>Send private message</span>
                      {isOnline && <span className="inline-flex items-center text-green-600 text-xs font-semibold">● Online</span>}
                    </div>
                  </div>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">{unreadCount}</span>
                  )}
                  <MessageSquare className="text-gray-400" />
                </button>
              );
            })
          )}
        </div>
      ) : (
        <div>
          <button onClick={() => setCurrentChatUser(null)} className="mb-4 text-white flex items-center gap-2 hover:underline">
            <ArrowLeft size={16} /> Back to contacts
          </button>

          <PrivateChat
            currentUser={currentUser}
            otherUser={currentChatUser}
            privateMessages={privateMessages}
            bannedWords={[]}
            isLoading={loadingPrivateMessages}
            onSendMessage={(message) => onSendMessage(currentChatUser, message)}
            onEditMessage={onEditMessage ? (messageId, content) => onEditMessage(messageId, content) : undefined}
            onDeleteMessage={onDeleteMessage}
          />
        </div>
      )}
    </div>
  );
}

PrivateMessages.propTypes = {
  currentUser: PropTypes.string,
  currentChatUser: PropTypes.string,
  setCurrentChatUser: PropTypes.func.isRequired,
  otherUsers: PropTypes.array.isRequired,
  privateMessages: PropTypes.array.isRequired,
  loadingPrivateMessages: PropTypes.bool,
  onSendMessage: PropTypes.func.isRequired,
  onEditMessage: PropTypes.func,
  onDeleteMessage: PropTypes.func,
  onlineUsersSet: PropTypes.object,
  getUnreadCount: PropTypes.func.isRequired,
  markMessagesAsRead: PropTypes.func.isRequired,
};