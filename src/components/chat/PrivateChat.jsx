import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';

export default function PrivateChat({ currentUser, otherUser, privateMessages, bannedWords, onSendMessage, isLoading }) {
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  const conversation = privateMessages.filter(
    msg => 
      (msg.from === currentUser && msg.to === otherUser) ||
      (msg.from === otherUser && msg.to === currentUser)
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleSendMessage = async () => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || !otherUser) {
      return;
    }

    // Check for profanity
    const containsProfanity = bannedWords?.some(word => 
      trimmedMessage.toLowerCase().includes(word.toLowerCase())
    );

    if (containsProfanity) {
      alert('🚫 Message contains inappropriate language');
      return;
    }

    if (!onSendMessage) {
      return;
    }

    try {
      setIsSending(true);
      await onSendMessage(trimmedMessage);
      setMessageText('');
    } catch (err) {
      alert(err?.message || '❌ Failed to send message');
    } finally {
      setIsSending(false);
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
          conversation.map((msg) => {
            const isMe = msg.from === currentUser;
            return (
              <div key={msg.id} className={`mb-3 flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${isMe ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'} rounded-2xl px-4 py-2 shadow`}>
                  <p className="text-sm font-semibold mb-1">{msg.from}</p>
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-500'}`}>{msg.time}</p>
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