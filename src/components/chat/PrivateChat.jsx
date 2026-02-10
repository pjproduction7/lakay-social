import React, { useState, useEffect, useRef } from 'react';
import { Send, Edit2, Trash2 } from 'lucide-react';
import PropTypes from 'prop-types';

export default function PrivateChat({ currentUser, otherUser, privateMessages, bannedWords, onSendMessage, onEditMessage, onDeleteMessage, isLoading }) {
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const messagesEndRef = useRef(null);
  const sendingRef = useRef(false);

  const conversation = privateMessages.filter(
    msg => 
      (msg.from === currentUser && msg.to === otherUser) ||
      (msg.from === otherUser && msg.to === currentUser)
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleEditMessage = async (messageId, newContent) => {
    if (!onEditMessage) return;

    try {
      await onEditMessage(messageId, newContent);
      setEditingMessageId(null);
      setEditingText('');
    } catch (err) {
      alert(err?.message || '❌ Failed to edit message');
    }
  };

  const startEditing = (message) => {
    setEditingMessageId(message.id);
    setEditingText(message.message);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || isSending || !onSendMessage) return;

    setIsSending(true);
    try {
      await onSendMessage(messageText.trim());
      setMessageText('');
    } catch (err) {
      alert(err?.message || '❌ Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!onDeleteMessage) return;

    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      return;
    }

    try {
      await onDeleteMessage(messageId);
    } catch (err) {
      alert(err?.message || '❌ Failed to delete message');
    }
  };

  return (
    <div className="bg-gradient-to-br from-teal-600 to-cyan-600 rounded-2xl p-6 shadow-2xl">
      <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-4">
        <h3 className="text-white font-bold text-xl">💬 Chat with {otherUser}</h3>
      </div>

      {isLoading && (
        <div className="text-center text-white/80 text-sm mb-2">Refreshing conversation…</div>
      )}

      <div className="h-96 overflow-y-auto bg-white/95 rounded-xl p-4 mb-4 shadow-inner">
        {conversation.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p>No messages yet. Start the conversation! 👋</p>
          </div>
        ) : (
          conversation.map((msg, index) => {
            const isMe = msg.from === currentUser;
            const isEditing = editingMessageId === msg.id;
            return (
              <div key={`${msg.id}-${msg.createdAt}-${index}`} className={`mb-3 flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${isMe ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'} rounded-2xl px-4 py-2 shadow relative group`}>
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleEditMessage(msg.id, editingText.trim());
                          } else if (e.key === 'Escape') {
                            cancelEditing();
                          }
                        }}
                        className="w-full bg-white/20 border border-white/30 rounded px-2 py-1 text-sm"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditMessage(msg.id, editingText.trim())}
                          className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-semibold mb-1">{msg.from}</p>
                      <p className="text-sm">{msg.message}</p>
                      {msg.edited_at && (
                        <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-500'}`}>
                          (edited)
                        </p>
                      )}
                      <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-500'}`}>{msg.time}</p>
                      {isMe && !isEditing && (
                        <div className="absolute -right-16 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEditing(msg)}
                            className="text-gray-400 hover:text-white p-1 rounded"
                            title="Edit message"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="text-gray-400 hover:text-red-400 p-1 rounded"
                            title="Delete message"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isSending && handleSendMessage()}
          className="flex-1 bg-white border-2 border-white/50 rounded-xl px-4 py-3 text-gray-900 font-semibold focus:outline-none shadow-lg placeholder:text-gray-400"
          placeholder="Type your message..."
          disabled={isSending}
        />
        <button
          onClick={handleSendMessage}
          disabled={isSending}
          className={`bg-white text-teal-600 font-black px-6 py-3 rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-2 ${isSending ? 'opacity-70 cursor-not-allowed' : 'hover:bg-teal-50'}`}
        >
          {isSending ? 'Sending…' : <Send size={20} />}
        </button>
      </div>
    </div>
  );
}

PrivateChat.propTypes = {
  currentUser: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  otherUser: PropTypes.string.isRequired,
  privateMessages: PropTypes.array.isRequired,
  bannedWords: PropTypes.array,
  onSendMessage: PropTypes.func.isRequired,
  onEditMessage: PropTypes.func,
  onDeleteMessage: PropTypes.func,
  isLoading: PropTypes.bool,
};